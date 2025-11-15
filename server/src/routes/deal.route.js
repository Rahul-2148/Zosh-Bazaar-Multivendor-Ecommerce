import express from "express";
import DealController from "../controllers/deal.controller.js";

const dealRouter = express.Router();

// Get all deals
dealRouter.get("/", DealController.getAllDeals);

// Create a new deal (admin only)
dealRouter.post("/create", DealController.createDeal);

// Update an existing deal (admin only)
dealRouter.put("/:id", DealController.updateDeal);

// Delete a deal (admin only)
dealRouter.delete("/:id", DealController.deleteDeal);

export default dealRouter;
