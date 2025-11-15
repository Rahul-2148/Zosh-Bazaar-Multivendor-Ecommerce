import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";

class DataInitializationService {
  async initializeAdminUser() {
    const adminEmail = "rahulraj21480@gmail.com";
    const adminPassword = "zoshilaRahul@1234";

    try {
      const adminExists = await User.findOne({ email: adminEmail });

      if (!adminExists) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const adminUser = new User({
          email: adminEmail,
          fullName: "Admin (Rahul Raj)",
          mobile: "9973162148",
          role: "ROLE_ADMIN",
          password: hashedPassword,
        });

        await adminUser.save();
        console.log("Admin user created successfully.");
      } else {
        console.log("Admin user already exists.");
      }
    } catch (error) {
      console.error("Error initializing admin user:", error);
    }
  }
}

export default new DataInitializationService();
