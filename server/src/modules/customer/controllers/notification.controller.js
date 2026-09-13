import notificationService from "../services/notification.service.js";

class NotificationController {
  async getUserNotifications(req, res, next) {
    try {
      const user = req.user;
      const { page, size, unreadOnly } = req.query;

      const result = await notificationService.getUserNotifications(user._id, {
        page,
        size,
        unreadOnly: unreadOnly === "true",
      });

      return res.status(200).json({
        success: true,
        error: false,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const user = req.user;
      const { id } = req.params;

      const notification = await notificationService.markAsRead(user._id, id);

      return res.status(200).json({
        success: true,
        error: false,
        message: "Notification marked as read",
        notification,
      });
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const user = req.user;
      const result = await notificationService.markAllAsRead(user._id);

      return res.status(200).json({
        success: true,
        error: false,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteNotification(req, res, next) {
    try {
      const user = req.user;
      const { id } = req.params;

      const result = await notificationService.deleteNotification(user._id, id);

      return res.status(200).json({
        success: true,
        error: false,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new NotificationController();
