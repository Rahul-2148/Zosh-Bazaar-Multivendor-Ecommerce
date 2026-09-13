import brandService from "../services/brand.service.js";

class BrandController {
  async getAllBrands(req, res, next) {
    try {
      const includeInactive = req.query.includeInactive === "true";
      const brands = await brandService.getAllBrands(includeInactive);
      return res.status(200).json({
        message: "Brands fetched successfully",
        brands,
        success: true,
        error: false,
      });
    } catch (error) {
      next(error);
    }
  }

  async createBrand(req, res, next) {
    try {
      const brand = await brandService.createBrand(req.body);
      return res.status(201).json({
        message: "Brand created successfully",
        brand,
        success: true,
        error: false,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateBrand(req, res, next) {
    try {
      const brand = await brandService.updateBrand(req.params.id, req.body);
      return res.status(200).json({
        message: "Brand updated successfully",
        brand,
        success: true,
        error: false,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteBrand(req, res, next) {
    try {
      await brandService.deleteBrand(req.params.id);
      return res.status(200).json({
        message: "Brand deleted successfully",
        success: true,
        error: false,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new BrandController();
