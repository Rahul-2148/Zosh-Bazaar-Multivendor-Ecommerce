import { PlatformSettings } from "../../../models/settings.model.js";

class SettingsService {
  async getSettings() {
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = new PlatformSettings();
      await settings.save();
    }
    return settings;
  }

  async updateSettings(data) {
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = new PlatformSettings(data);
    } else {
      Object.assign(settings, data);
    }
    return await settings.save();
  }
}

export default new SettingsService();
