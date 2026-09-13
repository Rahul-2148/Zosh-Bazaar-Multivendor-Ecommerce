import mongoose from "mongoose";
import DataInitializeService from "../modules/customer/services/DataInitialize.service.js";

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    // Non-blocking background admin initialization
    DataInitializeService.initializeAdminUser().catch((e) => {
      console.warn("⚠️ Admin check background warning:", e.message);
    });
  } catch (error) {
    console.error(`\n❌ [Database Error] Could not connect to MongoDB: ${error.message}`);
    console.error(`👉 TIP: Please check your internet connection or verify Network Access (IP Whitelist) in MongoDB Atlas.\n`);
    process.exit(1);
  }
};

export default connectDB;
