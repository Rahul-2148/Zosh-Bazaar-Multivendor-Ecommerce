import { Category } from "../../../models/category.model.js";
import { redisClient } from "../../../config/redis.service.js";

const CACHE_KEY_CATEGORY_TREE = "cache:category_tree";

class CategoryService {
  async getAllCategories(query = {}) {
    const filter = {};
    if (query.level) filter.level = Number(query.level);
    if (query.parentCategory) filter.parentCategory = query.parentCategory;
    if (query.isActive !== undefined) filter.isActive = query.isActive === "true";

    return await Category.find(filter)
      .populate("parentCategory", "name categoryId level")
      .sort({ level: 1, name: 1 });
  }

  async getCategoryTree() {
    // Check Redis/Memory cache first
    const cached = await redisClient.get(CACHE_KEY_CATEGORY_TREE);
    if (cached) {
      return cached;
    }

    // Fetch all active categories
    const categories = await Category.find({ isActive: true })
      .sort({ level: 1, name: 1 })
      .lean();

    const l1 = categories.filter((c) => c.level === 1);
    const l2 = categories.filter((c) => c.level === 2);
    const l3 = categories.filter((c) => c.level === 3);

    // Build hierarchy
    const tree = l1.map((top) => {
      const children = l2
        .filter(
          (mid) =>
            mid.parentCategory &&
            mid.parentCategory.toString() === top._id.toString()
        )
        .map((mid) => {
          const leaves = l3.filter(
            (leaf) =>
              leaf.parentCategory &&
              leaf.parentCategory.toString() === mid._id.toString()
          );
          return { ...mid, children: leaves };
        });
      return { ...top, children };
    });

    // Save to Redis/Memory with 1 hour TTL
    await redisClient.set(CACHE_KEY_CATEGORY_TREE, tree, 3600);

    return tree;
  }

  async getCategoryById(idOrSlug) {
    let category = null;
    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      category = await Category.findById(idOrSlug).populate(
        "parentCategory",
        "name categoryId level attributes"
      );
    }
    if (!category) {
      category = await Category.findOne({ categoryId: idOrSlug }).populate(
        "parentCategory",
        "name categoryId level attributes"
      );
    }
    if (!category) throw new Error("Category not found");
    return category;
  }

  async createCategory(data) {
    const existing = await Category.findOne({ categoryId: data.categoryId });
    if (existing) {
      throw new Error(`Category ID "${data.categoryId}" already exists`);
    }

    let level = 1;
    if (data.parentCategory) {
      const parent = await Category.findById(data.parentCategory);
      if (!parent) throw new Error("Parent category not found");
      level = parent.level + 1;
      if (level > 3) throw new Error("Maximum category depth is 3 levels");
    }

    const category = new Category({
      name: data.name,
      categoryId: data.categoryId,
      description: data.description || "",
      image: data.image || "",
      parentCategory: data.parentCategory || null,
      level,
      attributes: data.attributes || [],
      isActive: data.isActive !== undefined ? data.isActive : true,
    });

    const saved = await category.save();
    await redisClient.del(CACHE_KEY_CATEGORY_TREE);
    return saved;
  }

  async updateCategory(id, data) {
    const category = await Category.findById(id);
    if (!category) throw new Error("Category not found");

    if (data.name) category.name = data.name;
    if (data.description !== undefined) category.description = data.description;
    if (data.image !== undefined) category.image = data.image;
    if (data.isActive !== undefined) category.isActive = data.isActive;
    if (data.attributes) category.attributes = data.attributes;

    if (data.parentCategory !== undefined) {
      if (data.parentCategory) {
        if (data.parentCategory.toString() === id.toString()) {
          throw new Error("A category cannot be its own parent");
        }
        const parent = await Category.findById(data.parentCategory);
        if (!parent) throw new Error("Parent category not found");
        category.parentCategory = parent._id;
        category.level = parent.level + 1;
      } else {
        category.parentCategory = null;
        category.level = 1;
      }
    }

    const updated = await category.save();
    await redisClient.del(CACHE_KEY_CATEGORY_TREE);
    return updated;
  }

  async deleteCategory(id) {
    // Check if subcategories exist
    const hasChildren = await Category.exists({ parentCategory: id });
    if (hasChildren) {
      throw new Error("Cannot delete category with active subcategories. Delete children first.");
    }

    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) throw new Error("Category not found");
    await redisClient.del(CACHE_KEY_CATEGORY_TREE);
    return deleted;
  }
}

export default new CategoryService();
