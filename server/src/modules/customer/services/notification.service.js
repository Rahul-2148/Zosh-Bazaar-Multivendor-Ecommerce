import { Notification } from "../../../models/notification.model.js";

class NotificationService {
  async createNotification({ recipient, type, title, message, data = {}, link = "" }) {
    if (!recipient || !title || !message) {
      throw new Error("Recipient, title, and message are required for a notification");
    }

    const notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      data,
      link,
    });

    return notification;
  }

  async getUserNotifications(userId, { page = 0, size = 20, unreadOnly = false } = {}) {
    const filter = { recipient: userId };
    if (unreadOnly) {
      filter.isRead = false;
    }

    const pageNum = Math.max(0, Number(page) || 0);
    const pageSize = Math.max(1, Math.min(100, Number(size) || 20));

    const [notifications, totalElements, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(pageNum * pageSize)
        .limit(pageSize)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: userId, isRead: false }),
    ]);

    return {
      content: notifications,
      totalPages: Math.ceil(totalElements / pageSize),
      totalElements,
      unreadCount,
      page: pageNum,
      size: pageSize,
    };
  }

  async markAsRead(userId, notificationId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    if (!notification) throw new Error("Notification not found or unauthorized");
    return notification;
  }

  async markAllAsRead(userId) {
    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    return { success: true, message: "All notifications marked as read" };
  }

  async deleteNotification(userId, notificationId) {
    const deleted = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId,
    });
    if (!deleted) throw new Error("Notification not found or unauthorized");
    return { success: true, message: "Notification deleted successfully" };
  }
}

export default new NotificationService();
