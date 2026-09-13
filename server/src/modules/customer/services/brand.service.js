import { Brand } from "../../../models/brand.model.js";

class BrandService {
  async getAllBrands(includeInactive = false) {
    const filter = includeInactive ? {} : { isActive: true };
    return await Brand.find(filter).sort({ name: 1 });
  }

  async createBrand(data) {
    const slug = (data.slug || data.name).toLowerCase().replace(/\s+/g, "-");
    const existing = await Brand.findOne({ slug });
    if (existing) throw new Error(`Brand "${data.name}" already exists`);

    const brand = new Brand({
      name: data.name,
      slug,
      logo: data.logo || "",
      description: data.description || "",
      website: data.website || "",
      isActive: data.isActive !== undefined ? data.isActive : true,
    });

    return await brand.save();
  }

  async updateBrand(id, data) {
    const brand = await Brand.findById(id);
    if (!brand) throw new Error("Brand not found");

    if (data.name) {
      brand.name = data.name;
      brand.slug = (data.slug || data.name).toLowerCase().replace(/\s+/g, "-");
    }
    if (data.logo !== undefined) brand.logo = data.logo;
    if (data.description !== undefined) brand.description = data.description;
    if (data.website !== undefined) brand.website = data.website;
    if (data.isActive !== undefined) brand.isActive = data.isActive;

    return await brand.save();
  }

  async deleteBrand(id) {
    const deleted = await Brand.findByIdAndDelete(id);
    if (!deleted) throw new Error("Brand not found");
    return deleted;
  }
}

export default new BrandService();
