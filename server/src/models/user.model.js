import mongoose from "mongoose";
import UserRoles from "../domain/UserRole.js";

const userSchema = mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    // required: true,
    select: false,
  },
  mobile: {
    type: Number,
    required: true,
    // unique: true,
  },
  addresses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
    },
  ],
  role: {
    type: String,
    enum: [UserRoles.CUSTOMER, UserRoles.ADMIN],
    default: UserRoles.CUSTOMER,
  },
});

export const User = mongoose.model("User", userSchema);
