import accountService from "../services/account.service.js";

class AccountController {
  async getOverview(req, res, next) {
    try {
      const userId = req.user._id;
      const overview = await accountService.getAccountOverview(userId);
      return res.status(200).json({ success: true, error: false, overview });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const userId = req.user._id;
      const user = await accountService.updateProfile(userId, req.body);
      return res.status(200).json({
        success: true,
        error: false,
        message: "Profile updated successfully",
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const userId = req.user._id;
      const { currentPassword, newPassword } = req.body;
      const result = await accountService.changePassword(userId, currentPassword, newPassword);
      return res.status(200).json({ success: true, error: false, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getPreferences(req, res, next) {
    try {
      const userId = req.user._id;
      const preferences = await accountService.getPreferences(userId);
      return res.status(200).json({ success: true, error: false, preferences });
    } catch (error) {
      next(error);
    }
  }

  async updatePreferences(req, res, next) {
    try {
      const userId = req.user._id;
      const preferences = await accountService.updatePreferences(userId, req.body);
      return res.status(200).json({
        success: true,
        error: false,
        message: "Preferences updated",
        preferences,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentMethods(req, res, next) {
    try {
      const userId = req.user._id;
      const paymentMethods = await accountService.getPaymentMethods(userId);
      return res.status(200).json({ success: true, error: false, paymentMethods });
    } catch (error) {
      next(error);
    }
  }

  async addPaymentMethod(req, res, next) {
    try {
      const userId = req.user._id;
      const paymentMethods = await accountService.addPaymentMethod(userId, req.body);
      return res.status(201).json({
        success: true,
        error: false,
        message: "Payment method saved securely",
        paymentMethods,
      });
    } catch (error) {
      next(error);
    }
  }

  async deletePaymentMethod(req, res, next) {
    try {
      const userId = req.user._id;
      const { id } = req.params;
      const paymentMethods = await accountService.deletePaymentMethod(userId, id);
      return res.status(200).json({
        success: true,
        error: false,
        message: "Payment method removed",
        paymentMethods,
      });
    } catch (error) {
      next(error);
    }
  }

  async setDefaultPaymentMethod(req, res, next) {
    try {
      const userId = req.user._id;
      const { id } = req.params;
      const paymentMethods = await accountService.setDefaultPaymentMethod(userId, id);
      return res.status(200).json({
        success: true,
        error: false,
        message: "Default payment method updated",
        paymentMethods,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTransactions(req, res, next) {
    try {
      const userId = req.user._id;
      const transactions = await accountService.getCustomerTransactions(userId);
      return res.status(200).json({ success: true, error: false, transactions });
    } catch (error) {
      next(error);
    }
  }

  async getBuyAgain(req, res, next) {
    try {
      const userId = req.user._id;
      const products = await accountService.getBuyAgainProducts(userId);
      return res.status(200).json({ success: true, error: false, products });
    } catch (error) {
      next(error);
    }
  }

  async getReturns(req, res, next) {
    try {
      const userId = req.user._id;
      const returns = await accountService.getUserReturns(userId);
      return res.status(200).json({ success: true, error: false, returns });
    } catch (error) {
      next(error);
    }
  }

  async exportData(req, res, next) {
    try {
      const userId = req.user._id;
      const data = await accountService.exportUserData(userId);
      return res.status(200).json({ success: true, error: false, data });
    } catch (error) {
      next(error);
    }
  }

  async deleteAccount(req, res, next) {
    // LEGACY: redirect to new flow
    try {
      return res.status(400).json({
        success: false,
        error: true,
        code: "USE_NEW_FLOW",
        message: "Account deletion now requires a multi-step verification process. Please use the new Account Deletion page.",
      });
    } catch (error) {
      next(error);
    }
  }

  // ── Account Deactivation ──────────────────────────────

  async deactivateAccount(req, res, next) {
    try {
      const userId = req.user._id;
      const { reason } = req.body;
      const ctx = {
        ipAddress: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "",
        sessionRef: req.headers["x-session-id"] || "",
      };
      const result = await accountService.deactivateAccount(userId, reason, ctx);
      return res.status(200).json({ success: true, error: false, ...result });
    } catch (error) {
      next(error);
    }
  }

  async reactivateAccount(req, res, next) {
    try {
      const userId = req.user._id;
      const ctx = {
        ipAddress: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "",
        sessionRef: req.headers["x-session-id"] || "",
      };
      const result = await accountService.reactivateAccount(userId, ctx);
      return res.status(200).json({ success: true, error: false, ...result });
    } catch (error) {
      next(error);
    }
  }

  // ── Account Deletion Lifecycle ──────────────────────────────

  async requestDeletion(req, res, next) {
    try {
      const userId = req.user._id;
      const { reason } = req.body;
      const ctx = {
        ipAddress: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "",
        sessionRef: req.headers["x-session-id"] || "",
      };
      const result = await accountService.requestDeletion(userId, reason, ctx);
      return res.status(200).json({ success: true, error: false, ...result });
    } catch (error) {
      next(error);
    }
  }

  async sendDeletionOTP(req, res, next) {
    try {
      const userId = req.user._id;
      const ctx = {
        ipAddress: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "",
        sessionRef: req.headers["x-session-id"] || "",
      };
      const result = await accountService.sendDeletionOTP(userId, ctx);
      return res.status(200).json({ success: true, error: false, ...result });
    } catch (error) {
      if (error.statusCode === 429) {
        return res.status(429).json({
          success: false, error: true,
          message: error.message,
          cooldownRemaining: error.cooldownRemaining,
        });
      }
      next(error);
    }
  }

  async verifyDeletionOTP(req, res, next) {
    try {
      const userId = req.user._id;
      const { otp } = req.body;
      const ctx = {
        ipAddress: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "",
        sessionRef: req.headers["x-session-id"] || "",
      };
      const result = await accountService.verifyDeletionOTP(userId, otp, ctx);
      return res.status(200).json({ success: true, error: false, ...result });
    } catch (error) {
      next(error);
    }
  }

  async confirmDeletion(req, res, next) {
    try {
      const userId = req.user._id;
      const ctx = {
        ipAddress: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "",
        sessionRef: req.headers["x-session-id"] || "",
      };
      const result = await accountService.confirmDeletion(userId, ctx);
      return res.status(200).json({ success: true, error: false, ...result });
    } catch (error) {
      next(error);
    }
  }

  async cancelDeletion(req, res, next) {
    try {
      const userId = req.user._id;
      const ctx = {
        ipAddress: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "",
        sessionRef: req.headers["x-session-id"] || "",
      };
      const result = await accountService.cancelDeletion(userId, ctx);
      return res.status(200).json({ success: true, error: false, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getDeletionStatus(req, res, next) {
    try {
      const userId = req.user._id;
      const result = await accountService.getDeletionStatus(userId);
      return res.status(200).json({ success: true, error: false, ...result });
    } catch (error) {
      next(error);
    }
  }

  async submitSupportDeletionRequest(req, res, next) {
    try {
      const userId = req.user._id;
      const { reason } = req.body;
      const ctx = {
        ipAddress: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "",
        sessionRef: req.headers["x-session-id"] || "",
      };
      const result = await accountService.submitSupportDeletionRequest(userId, reason, ctx);
      return res.status(200).json({ success: true, error: false, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getLifecycleConfig(req, res, next) {
    try {
      const config = accountService.getLifecycleConfig();
      return res.status(200).json({ success: true, error: false, config });
    } catch (error) {
      next(error);
    }
  }

  async getSessions(req, res, next) {
    try {
      const userId = req.user._id;
      const currentSessionId = req.headers["x-session-id"] || req.query.sessionId;
      const sessions = await accountService.getSessions(userId, currentSessionId);
      return res.status(200).json({ success: true, error: false, sessions });
    } catch (error) {
      next(error);
    }
  }

  async registerSession(req, res, next) {
    try {
      const userId = req.user._id;
      const sessionData = {
        ...req.body,
        ipAddress: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "103.15.224.78",
        userAgent: req.headers["user-agent"] || "",
      };
      const session = await accountService.registerOrUpdateSession(userId, sessionData);
      return res.status(200).json({ success: true, error: false, session });
    } catch (error) {
      next(error);
    }
  }

  async revokeSession(req, res, next) {
    try {
      const userId = req.user._id;
      const { id } = req.params;
      const currentSessionId = req.headers["x-session-id"] || req.body?.currentSessionId;
      const result = await accountService.revokeSession(userId, id, currentSessionId);
      return res.status(200).json({ success: true, error: false, ...result });
    } catch (error) {
      next(error);
    }
  }

  async revokeAllOtherSessions(req, res, next) {
    try {
      const userId = req.user._id;
      const currentSessionId = req.headers["x-session-id"] || req.body?.currentSessionId;
      const result = await accountService.revokeAllOtherSessions(userId, currentSessionId);
      return res.status(200).json({ success: true, error: false, ...result });
    } catch (error) {
      next(error);
    }
  }
}

export default new AccountController();

