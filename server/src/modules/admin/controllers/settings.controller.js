import settingsService from "../services/settings.service.js";

class SettingsController {
  async getSettings(req, res, next) {
    try {
      const settings = await settingsService.getSettings();
      return res.status(200).json({
        message: "Settings fetched successfully",
        settings,
        success: true,
        error: false,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req, res, next) {
    try {
      const settings = await settingsService.updateSettings(req.body);
      return res.status(200).json({
        message: "Settings updated successfully",
        settings,
        success: true,
        error: false,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SettingsController();
