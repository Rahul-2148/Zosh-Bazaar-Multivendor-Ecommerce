import mongoose from "mongoose";

const verificationCodeSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
});

export const VerificationCode = mongoose.model("VerificationCode", verificationCodeSchema);