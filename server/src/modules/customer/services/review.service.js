import { Review } from "../../../models/review.model.js";
import { Product } from "../../../models/product.model.js";
import { Order } from "../../../models/order.model.js";

class ReviewService {
  async addReview(userId, productId, data) {
    const product = await Product.findById(productId);
    if (!product) throw new Error("Product not found");

    // Check if verified purchase
    const userOrder = await Order.findOne({
      user: userId,
      orderStatus: "DELIVERED",
    }).populate({
      path: "orderItems",
      match: { product: productId },
    });

    const isVerified = Boolean(
      userOrder && userOrder.orderItems && userOrder.orderItems.length > 0
    );

    const review = new Review({
      user: userId,
      product: productId,
      rating: Number(data.rating),
      title: data.title || "",
      comment: data.comment,
      images: data.images || [],
      verifiedPurchase: isVerified,
      status: "APPROVED", // Default auto-approved
    });

    await review.save();
    await this.updateProductRating(productId);

    return await Review.findById(review._id).populate("user", "fullName email");
  }

  async getProductReviews(productId, query = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { product: productId, status: "APPROVED" };

    const [reviews, totalReviews] = await Promise.all([
      Review.find(filter)
        .populate("user", "fullName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(filter),
    ]);

    return {
      reviews,
      totalReviews,
      totalPages: Math.ceil(totalReviews / limit),
      currentPage: page,
    };
  }

  async getAllReviewsForAdmin(query = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.status && query.status !== "ALL") {
      filter.status = query.status;
    }

    const [reviews, totalReviews] = await Promise.all([
      Review.find(filter)
        .populate("user", "fullName email")
        .populate("product", "title images brand")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(filter),
    ]);

    return {
      reviews,
      totalReviews,
      totalPages: Math.ceil(totalReviews / limit),
      currentPage: page,
    };
  }

  async updateReviewStatus(id, status) {
    const review = await Review.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!review) throw new Error("Review not found");
    await this.updateProductRating(review.product);
    return review;
  }

  async deleteReview(id) {
    const review = await Review.findByIdAndDelete(id);
    if (!review) throw new Error("Review not found");
    await this.updateProductRating(review.product);
    return review;
  }

  async updateProductRating(productId) {
    const approvedReviews = await Review.find({
      product: productId,
      status: "APPROVED",
    });

    const count = approvedReviews.length;
    const average =
      count > 0
        ? Number(
            (
              approvedReviews.reduce((sum, r) => sum + r.rating, 0) / count
            ).toFixed(1)
          )
        : 0;

    await Product.findByIdAndUpdate(productId, {
      ratings: { average, count },
    });
  }
}

export default new ReviewService();
