import HomeService from "../service/Home.service.js";
import HomeCategoryService from "../service/homeCategory.service.js";

class HomeCategoryController {
  async createHomeCategories(req, res) {
    try {
      const homeCategories = req.body;

      // CALL the service that actually implements createCategories
      const categories = await HomeCategoryService.createCategories(
        homeCategories
      );

      // build the grouped home data
      const home = await HomeService.createHomePageData(categories);

      return res.status(201).json({
        homeCategories: home,
        message: "Home categories created successfully",
        error: false,
        success: true,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getAllHomeCategories(req, res) {
    try {
      const homeCategories = await HomeCategoryService.getAllHomeCategories();
      return res.status(200).json({
        homeCategories: homeCategories,
        error: false,
        success: true,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async updateHomeCategory(req, res) {
    try {
      const { id } = req.params;
      const homeCategory = req.body;
      const updatedCategory = await HomeCategoryService.updateHomeCategory(
        homeCategory,
        id
      );
      return res.status(200).json({
        homeCategory: updatedCategory,
        message: "Home category updated successfully",
        error: false,
        success: true,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

export default new HomeCategoryController();

// faltu aese hi banaya tha baad ke liye
// async fetchHomePageData(req, res) {
//   try {
//     const categories = await HomeCategoryService.getAllHomeCategories();
//     const banners = await BannerService.getAllBanners();
//     const products = await ProductService.getFeaturedProducts();

//     return res.status(200).json({
//       categories,
//       banners,
//       products,
//       error: false,
//       success: true,
//     });
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
// }
