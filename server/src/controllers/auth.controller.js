import UserRoles from "../domain/UserRole.js";
import AuthService from "../service/auth.service.js";

class AuthController {
  async sendLoginOtp(req, res) {
    try {
      const { email, mode } = req.body;

      if (!["signup", "login"].includes(mode)) {
        throw new Error("Invalid mode. Must be 'signup' or 'login'.");
      }

      await AuthService.sendLoginOTP(email, mode);

      res.status(200).json({
        message: "OTP sent successfully",
        error: false,
        success: true,
        otpSent: true,
      });
    } catch (error) {
      res
        .status(error instanceof Error ? 404 : 500)
        .json({ message: error.message });
    }
  }

  async createUser(req, res) {
    try {
      const jwt = await AuthService.createUser(req.body);

      const authResponse = {
        message: "User created successfully",
        jwt: jwt,
        role: UserRoles.CUSTOMER,
        error: false,
        success: true,
      };

      res.status(200).json(authResponse);
    } catch (error) {
      res
        .status(error instanceof Error ? 404 : 500)
        .json({ message: error.message });
    }
  }

  async signin(req, res) {
    try {
      const response = await AuthService.signin(req.body);

      const authResponse = {
        message: "Login successful",
        jwt: response.jwt,
        role: response.role,
        error: false,
        success: true,
      };

      return res.status(200).json(authResponse);
    } catch (error) {
      res
        .status(error instanceof Error ? 404 : 500)
        .json({ message: error.message });
    }
  }
}

export default new AuthController();

// async sendLoginOtp(req, res) {
//   try {
//     const email = req.body.email;
//     await AuthService.sendLoginOTP(email);
//     res.status(200).json({
//       message: "OTP sent successfully",
//       error: false,
//       success: true,
//     });
//   } catch (error) {
//     res
//       .status(error instanceof Error ? 404 : 500)
//       .json({ message: error.message });
//   }
// }
