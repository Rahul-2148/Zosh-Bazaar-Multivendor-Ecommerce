import { SavedItem } from "../../../models/savedItem.model.js";
import { Notification } from "../../../models/notification.model.js";
import { emitCustomerNotification } from "../../../realtime/socket.js";

class WishlistWatcherService {
  /**
   * Evaluates product changes and dispatches price-drop / back-in-stock alerts.
   * Runs asynchronously without blocking the product save transaction.
   */
  async checkProductUpdates(productId, oldProductData, updatedProduct) {
    try {
      if (!productId || !updatedProduct) return;

      const oldSellingPrice = Number(oldProductData?.sellingPrice);
      const newSellingPrice = Number(updatedProduct.sellingPrice);
      const oldCountInStock = Number(oldProductData?.countInStock ?? 0);
      const newCountInStock = Number(updatedProduct.countInStock ?? 0);

      // 1. Check for Price Drop
      if (
        !isNaN(oldSellingPrice) &&
        !isNaN(newSellingPrice) &&
        newSellingPrice < oldSellingPrice
      ) {
        const priceDrop = oldSellingPrice - newSellingPrice;
        const affectedItems = await SavedItem.find({
          product: productId,
          savedPrice: { $gt: newSellingPrice },
        }).populate("product", "title images category");

        // Unique users map
        const userItemMap = new Map();
        for (const item of affectedItems) {
          const uId = item.user.toString();
          if (!userItemMap.has(uId)) {
            userItemMap.set(uId, item);
          }
        }

        for (const [userId, item] of userItemMap.entries()) {
          try {
            const notif = await Notification.create({
              recipient: userId,
              type: "PRICE_DROP",
              title: "Price Drop Alert! 📉",
              message: `Good news! "${updatedProduct.title}" has dropped by ₹${priceDrop.toLocaleString(
                "en-IN"
              )} (now ₹${newSellingPrice.toLocaleString("en-IN")}).`,
              data: {
                productId: String(productId),
                savedPrice: item.savedPrice,
                currentPrice: newSellingPrice,
                priceDrop,
              },
              link: `/product-details/${
                updatedProduct.category?.categoryId ||
                updatedProduct.category ||
                "all"
              }/${encodeURIComponent(updatedProduct.title)}/${productId}`,
            });

            emitCustomerNotification(userId, notif);
          } catch (notifErr) {
            console.error(
              "[WishlistWatcher] Failed to send price drop notification:",
              notifErr.message
            );
          }
        }
      }

      // 2. Check for Back in Stock
      if (oldCountInStock <= 0 && newCountInStock > 0) {
        const savedItems = await SavedItem.find({
          product: productId,
        }).populate("product", "title images category");

        const notifiedUsers = new Set();
        for (const item of savedItems) {
          const uId = item.user.toString();
          if (notifiedUsers.has(uId)) continue;
          notifiedUsers.add(uId);

          try {
            const notif = await Notification.create({
              recipient: uId,
              type: "BACK_IN_STOCK",
              title: "Back in Stock! 🎉",
              message: `An item in your saved shopping list, "${updatedProduct.title}", is back in stock with ${newCountInStock} available.`,
              data: {
                productId: String(productId),
                countInStock: newCountInStock,
              },
              link: `/product-details/${
                updatedProduct.category?.categoryId ||
                updatedProduct.category ||
                "all"
              }/${encodeURIComponent(updatedProduct.title)}/${productId}`,
            });

            emitCustomerNotification(uId, notif);
          } catch (notifErr) {
            console.error(
              "[WishlistWatcher] Failed to send restock notification:",
              notifErr.message
            );
          }
        }
      }
    } catch (err) {
      console.error("[WishlistWatcher Error]:", err.message);
    }
  }
}

export default new WishlistWatcherService();
