import UserRoles from "../../../domain/UserRole.js";
import AuthService from "../services/auth.service.js";

class AuthController {
  async sendLoginOtp(req, res) {
    try {
      const { email } = req.body;
      const mode = req.body.mode || "auto";

      if (!["signup", "login", "auto"].includes(mode)) {
        return res.status(400).json({
          message: "Invalid mode. Must be 'signup', 'login', or 'auto'.",
          error: true,
          success: false,
        });
      }

      const result = await AuthService.sendLoginOTP(email, mode);

      return res.status(200).json({
        message: result.message || "OTP sent successfully",
        cooldownSeconds: result.cooldownSeconds || 60,
        isNewUser: result.isNewUser ?? false,
        exists: result.exists ?? true,
        error: false,
        success: true,
        otpSent: true,
      });
    } catch (error) {
      const status = error.statusCode || 400;
      return res.status(status).json({
        message: error.message || "Failed to send OTP",
        cooldownRemaining: error.cooldownRemaining || 0,
        error: true,
        success: false,
      });
    }
  }

  async getOtpCooldown(req, res) {
    try {
      const { email } = req.query;
      const cooldown = await AuthService.getOtpCooldown(email);
      return res.status(200).json({
        success: true,
        ...cooldown,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
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

      return res.status(200).json(authResponse);
    } catch (error) {
      return res.status(400).json({
        message: error.message || "User creation failed",
        error: true,
        success: false,
      });
    }
  }

  async signin(req, res) {
    try {
      const response = await AuthService.signin(req.body);

      const authResponse = {
        message: response.message || "Login successful",
        jwt: response.jwt,
        role: response.role,
        isNewUser: response.isNewUser || false,
        error: false,
        success: true,
      };

      return res.status(200).json(authResponse);
    } catch (error) {
      return res.status(401).json({
        message: error.message || "Invalid credentials",
        error: true,
        success: false,
      });
    }
  }
}

export default new AuthController();
