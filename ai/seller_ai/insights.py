from typing import Any


class SellerAIAdvisor:
    """Provides product listing optimization, keyword recommendations, and inventory insights for sellers."""

    def optimize_listing(
        self,
        title: str,
        category: str,
        description: str,
        brand: str,
    ) -> dict[str, Any]:
        suggested_keywords = ["Genuine", "Verified", "High Quality", "Warranty"]
        if "audio" in category.lower() or "headphone" in title.lower():
            suggested_keywords.extend(["Deep Bass", "Active Noise Cancellation", "Bluetooth 5.3"])
        elif "saree" in category.lower() or "silk" in title.lower():
            suggested_keywords.extend(["Handloom", "Pure Silk", "Zari Border", "Festive Wear"])

        improved_title = title.strip()
        if brand.lower() not in improved_title.lower():
            improved_title = f"{brand} {improved_title}"

        return {
            "originalTitle": title,
            "recommendedTitle": improved_title,
            "seoKeywords": suggested_keywords,
            "completenessScore": 88,
            "suggestions": [
                "Include key dimensions/specifications in the first two lines of description.",
                "Ensure at least 3 high-resolution images showing multiple angles.",
                "Add clear warranty details to boost customer conversion by up to 14%.",
            ],
            "requiresSellerReview": True,
        }
