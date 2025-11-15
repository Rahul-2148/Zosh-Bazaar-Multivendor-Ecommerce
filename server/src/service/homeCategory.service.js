import { HomeCategory } from "../models/homeCategory.model.js";

class HomeCategoryService {
  async getAllHomeCategories() {
    return await HomeCategory.find();
  }

  async createHomeCategory(HomeCategory) {
    return await HomeCategory.create(HomeCategory);
  }

  async createCategories(categories) {
    // Sab existing categories le aao
    const existingCategories = await HomeCategory.find();

    // Existing names ka set bana lo (ya slug ka unique field jo tum use karte ho)
    const existingNames = new Set(existingCategories.map((cat) => cat.name));

    // Filter only those which are NOT already in DB
    const newCategories = categories.filter(
      (cat) => !existingNames.has(cat.name)
    );

    // Agar newCategories empty hai to sirf existing wapas bhej do
    if (newCategories.length === 0) {
      return existingCategories;
    }

    // Jo naye hain unhe insert kar do
    const inserted = await HomeCategory.insertMany(newCategories);

    // Old + New ko mila ke return karo
    return [...existingCategories, ...inserted];
  }

  // async createCategories(categories) {
  //   const existingCategories = await HomeCategory.find();

  //   if (existingCategories.length == 0) {
  //     return await HomeCategory.insertMany(categories);
  //   }

  //   return existingCategories;
  // }

  async updateHomeCategory(category, id) {
    const existingCategory = await HomeCategory.findById(id);
    if (!existingCategory) {
      throw new Error("Category not found");
    }
    return await HomeCategory.findByIdAndUpdate(
      existingCategory._id,
      category,
      { new: true }
    );
  }

  async deleteHomeCategory(id) {
    const existingCategory = await HomeCategory.findById(id);
    if (!existingCategory) {
      throw new Error("Category not found");
    }
    return await HomeCategory.findByIdAndDelete(existingCategory._id);
  }
}

export default new HomeCategoryService();
