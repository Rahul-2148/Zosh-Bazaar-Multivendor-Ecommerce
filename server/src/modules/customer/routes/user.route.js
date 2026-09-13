import express from "express";
import {
  getUserProfileByJwt,
  getUserAddresses,
  addAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
  updateProfile,
  reverseGeocodeLocation,
} from "../controllers/user.controller.js";
import authMiddleware from "../../../middlewares/authMiddleware.js";

const userRouter = express.Router();

userRouter.get("/profile", authMiddleware, getUserProfileByJwt);
userRouter.patch("/profile", authMiddleware, updateProfile);

userRouter.get("/address", authMiddleware, getUserAddresses);
userRouter.post("/address", authMiddleware, addAddress);
userRouter.patch("/address/:addressId/default", authMiddleware, setDefaultAddress);
userRouter.put("/address/:addressId", authMiddleware, updateAddress);
userRouter.delete("/address/:addressId", authMiddleware, deleteAddress);

userRouter.get("/location/reverse-geocode", reverseGeocodeLocation);

export default userRouter;

