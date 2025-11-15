import mongoose from "mongoose";
import DataInitializeService from "../service/DataInitialize.service.js";

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        const conn = await mongoose.connect(uri);
        DataInitializeService.initializeAdminUser();
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
