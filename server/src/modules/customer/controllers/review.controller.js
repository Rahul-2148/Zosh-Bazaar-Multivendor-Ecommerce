import reviewService from "../services/review.service.js";

class ReviewController {
  async addReview(req, res, next) {
    try {
      const review = await reviewService.addReview(
        req.user._id,
        req.params.productId,
        req.body
      );
      return res.status(201).json({
        message: "Review submitted successfully",
        review,
        success: true,
        error: false,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductReviews(req, res, next) {
    try {
      const result = await reviewService.getProductReviews(
        req.params.productId,
        req.query
      );
      return res.status(200).json({
        message: "Product reviews fetched successfully",
        ...result,
        success: true,
        error: false,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllReviewsForAdmin(req, res, next) {
    try {
      const result = await reviewService.getAllReviewsForAdmin(req.query);
      return res.status(200).json({
        message: "Admin reviews fetched successfully",
        ...result,
        success: true,
        error: false,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateReviewStatus(req, res, next) {
    try {
      const review = await reviewService.updateReviewStatus(
        req.params.id,
        req.body.status
      );
      return res.status(200).json({
        message: "Review status updated successfully",
        review,
        success: true,
        error: false,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteReview(req, res, next) {
    try {
      await reviewService.deleteReview(req.params.id);
      return res.status(200).json({
        message: "Review deleted successfully",
        success: true,
        error: false,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ReviewController();
