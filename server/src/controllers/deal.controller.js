// server/controllers/deal.controller.js
import DealService from "../service/deal.service.js";

class DealController {
  // Get all deals
  async getAllDeals(req, res) {
    try {
      const deals = await DealService.getDeals();
      return res.status(200).json({
        deals,
        error: false,
        success: true,
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message,
        error: true,
        success: false,
      });
    }
  }

  // Create a new deal (Admin only)
  async createDeal(req, res) {
    try {
      const dealData = req.body || {};
      const createdDeal = await DealService.createDeal(dealData);

      return res.status(201).json({
        message: "Deal created successfully",
        deal: createdDeal,
        error: false,
        success: true,
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message,
        error: true,
        success: false,
      });
    }
  }

  // Update an existing deal (Admin only)
  async updateDeal(req, res) {
    try {
      const { id } = req.params;
      const dealData = req.body || {};
      const updatedDeal = await DealService.updateDeal(dealData, id);

      return res.status(200).json({
        message: "Deal updated successfully",
        deal: updatedDeal,
        error: false,
        success: true,
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message,
        error: true,
        success: false,
      });
    }
  }

  // Delete a deal (Admin only)
  async deleteDeal(req, res) {
    try {
      const { id } = req.params;
      const deletedDeal = await DealService.deleteDeal(id);

      return res.status(200).json({
        message: "Deal deleted successfully",
        deletedDeal,
        error: false,
        success: true,
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message,
        error: true,
        success: false,
      });
    }
  }
}

export default new DealController();
