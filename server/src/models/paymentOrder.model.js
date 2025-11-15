import mongoose from "mongoose";
import PaymentStatus from "../domain/PaymentStatus.js";
import PaymentMethod from "../domain/PaymentMethod.js";

const paymentOrderSchema = new mongoose.Schema({
  amount: { 
    type: Number, 
    required: true 
  },
  paymentStatus: { 
    type: String, 
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING
  },
  paymentMethod: { 
    type: String, 
    enum: Object.values(PaymentMethod),
    default: PaymentMethod.RAZORPAY
  },
  paymentLinkId: {
    type: String,
    // required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  }],
  currency: { 
    type: String, 
    // required: true 
  },
});

const PaymentOrder = mongoose.model("PaymentOrder", paymentOrderSchema);

export default PaymentOrder;
