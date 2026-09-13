import categoryService from "../services/category.service.js";

class CategoryController {
  async getAllCategories(req, res, next) {
    try {
      const categories = await categoryService.getAllCategories(req.query);
      return res.status(200).json({
        message: "Categories fetched successfully",
        categories,
        success: true,
        error: false,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryTree(req, res, next) {
    try {
      const tree = await categoryService.getCategoryTree();
      return res.status(200).json({
        message: "Category tree fetched successfully",
        tree,
        success: true,
        error: false,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryById(req, res, next) {
    try {
      const category = await categoryService.getCategoryById(req.params.id);
      return res.status(200).json({
        message: "Category details fetched successfully",
        category,
        success: true,
        error: false,
      });
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req, res, next) {
    try {
      const category = await categoryService.createCategory(req.body);
      return res.status(201).json({
        message: "Category created successfully",
        category,
        success: true,
        error: false,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const category = await categoryService.updateCategory(
        req.params.id,
        req.body
      );
      return res.status(200).json({
        message: "Category updated successfully",
        category,
        success: true,
        error: false,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      await categoryService.deleteCategory(req.params.id);
      return res.status(200).json({
        message: "Category deleted successfully",
        success: true,
        error: false,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CategoryController();
