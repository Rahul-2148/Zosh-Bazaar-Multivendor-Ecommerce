import { Deal } from "../models/deal.model.js";
import { HomeCategory } from "../models/homeCategory.model.js";

class DealService {
  async getDeals() {
    try {
      const deals = await Deal.find().populate({ path: "category" });

      if (!deals || deals.length === 0) {
        return {
          success: true,
          deals: [],
          message: "No deals found",
        };
      }

      return {
        success: true,
        deals,
        message: "Deals fetched successfully",
      };
    } catch (error) {
      console.error("Deal fetch error:", error);
      return {
        success: false,
        deals: [],
        message: "Something went wrong while fetching deals",
      };
    }
  }

  async createDeal(deal) {
    try {
      const category = await HomeCategory.findById(deal.category._id);
      if (!category) {
        throw new Error("Category not found");
      }

      const newDeal = new Deal({
        ...deal,
        category: category,
      });
      const savedDeal = await newDeal.save();
      return await Deal.findById(savedDeal._id).populate({ path: "category" });
    } catch (error) {
      throw new Error(error.message || "Error creating deal");
    }
  }

  async updateDeal(deal, id) {
    try {
      const existingDeal = await Deal.findById(id).populate({
        path: "category",
      });
      if (existingDeal) {
        return await Deal.findByIdAndUpdate(
          existingDeal._id,
          { discount: deal.discount },
          { new: true }
        ).populate({ path: "category" });
      }
    } catch (error) {
      throw new Error(error.message || "Error updating deal");
    }
  }

  async deleteDeal(id) {
    try {
      const deal = await Deal.findById(id);
      if (!deal) {
        throw new Error("Deal not found");
      }
      await Deal.findByIdAndDelete({ _id: id });
      return { message: "Deal deleted successfully" };
    } catch (error) {
      throw new Error(error.message || "Error deleting deal");
    }
  }
}

export default new DealService();
