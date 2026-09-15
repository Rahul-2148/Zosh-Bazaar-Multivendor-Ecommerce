from typing import Any, ClassVar

from pydantic import BaseModel, Field


class BuyingGuideSection(BaseModel):
    title: str
    content: str
    tips: list[str] = Field(default_factory=list)


class CategoryBuyingGuide(BaseModel):
    categoryId: str
    categoryName: str
    headline: str
    title: str | None = None
    summary: str
    keySpecsToConsider: list[dict[str, str]] = Field(default_factory=list)
    sections: list[BuyingGuideSection] = Field(default_factory=list)
    commonMistakes: list[str] = Field(default_factory=list)
    suggestedQueries: list[str] = Field(default_factory=list)

    def model_post_init(self, context: Any) -> None:
        if not self.title:
            self.title = self.headline


class BuyingGuideService:
    """Provides grounded educational guides for complex ecommerce categories."""

    GUIDES: ClassVar[dict[str, CategoryBuyingGuide]] = {
        "audio": CategoryBuyingGuide(
            categoryId="cat_audio",
            categoryName="Smart Audio & Headphones",
            headline="The Complete Audio Buyer's Guide: From Commutes to Hi-Fi Sound",
            summary="Whether you need silence on daily flights or deep bass for workouts, choosing the right audio gear comes down to driver size, ANC depth, codec support, and battery endurance.",
            keySpecsToConsider=[
                {
                    "spec": "Active Noise Cancellation (ANC)",
                    "guidance": "Look for hybrid ANC with at least 30dB ambient dampening for flights and trains.",
                },
                {
                    "spec": "Audio Codecs",
                    "guidance": "AAC for Apple devices, LDAC/aptX for high-res Android streaming without compression artifacts.",
                },
                {
                    "spec": "Battery Longevity",
                    "guidance": "Aim for at least 24h total playback (with case) and fast charging (10m charge = 2h playback).",
                },
            ],
            sections=[
                BuyingGuideSection(
                    title="1. Form Factor: Over-Ear vs In-Ear (TWS)",
                    content="Over-ear headphones (like Sony WH-1000XM5) deliver larger acoustic chambers, fuller bass response, and all-day ear cup comfort. True wireless earbuds (like AirPods Pro) maximize pocket portability and gym resistance.",
                    tips=["Choose In-Ear with IPX4+ for workouts", "Choose Over-Ear for 8+ hour work sessions"],
                ),
                BuyingGuideSection(
                    title="2. Microphone Clarity for Work & Calls",
                    content="Multi-beamforming mics with wind filters and voice pickup sensors dramatically isolate your speech in crowded cafes and city traffic.",
                    tips=["Check for dedicated bone-conduction or wind-shielded microphones"],
                ),
            ],
            commonMistakes=[
                "Overlooking water resistance (sweat can corrode non-IPX rated drivers)",
                "Ignoring ear-tip seal (90% of bass loss in earbuds is due to loose silicone tips)",
            ],
            suggestedQueries=[
                "Best noise cancelling headphones",
                "TWS earbuds with LDAC",
                "Gym workout headphones with IPX5",
            ],
        ),
        "smartwatches": CategoryBuyingGuide(
            categoryId="cat_smartwatches",
            categoryName="Wearable Tech & Smartwatches",
            headline="Smartwatch & Fitness Tracker Buying Guide: Find Your Fit",
            summary="From titanium adventure watches to sleek health monitors, modern wearables track HRV, SpO2, sleep stages, and multi-day GPS treks.",
            keySpecsToConsider=[
                {
                    "spec": "Display Technology",
                    "guidance": "AMOLED with Always-On (AOD) and at least 1,000 nits brightness for outdoor sunlight legibility.",
                },
                {
                    "spec": "GPS Precision",
                    "guidance": "Dual-frequency L1+L5 GPS ensures accurate pace tracking between tall city buildings and thick forest trails.",
                },
                {
                    "spec": "Water Resistance",
                    "guidance": "5ATM / 50m minimum for swimming; WR100 / EN13319 for diving and high-velocity water sports.",
                },
            ],
            sections=[
                BuyingGuideSection(
                    title="1. OS & Smartphone Compatibility",
                    content="Apple Watch Ultra delivers the deepest integration for iOS users with cellular handoff. Wear OS and Garmin provide outstanding cross-platform multi-day autonomy.",
                    tips=["Ensure notification action parity with your smartphone OS"],
                ),
            ],
            commonMistakes=[
                "Assuming all watches can answer calls (check for built-in speaker and mic or eSIM support)",
                "Expecting multi-week battery from full smartwatch OS devices without power-saving modes",
            ],
            suggestedQueries=[
                "Titanium GPS sports watch",
                "Smartwatch with 3-day battery",
                "AMOLED watch with calling",
            ],
        ),
        "sneakers": CategoryBuyingGuide(
            categoryId="cat_sneakers",
            categoryName="Sneakers & Athletic Kicks",
            headline="Sneakers & Road Running Guide: Cushioning, Heel Drop & Fit",
            summary="A great pair of sneakers marries midsole responsiveness with breathable upper support to reduce joint impact during daily walks and marathon training.",
            keySpecsToConsider=[
                {
                    "spec": "Midsole Foam",
                    "guidance": "Zoom Air, Boost, or EVA compound depending on whether you want bouncy energy return or firm stability.",
                },
                {
                    "spec": "Heel-to-Toe Drop",
                    "guidance": "8-10mm drop suits most heel strikers; 4-6mm encourages a natural midfoot stride.",
                },
                {
                    "spec": "Upper Breathability",
                    "guidance": "Engineered mesh for summer running, premium leather for heritage streetwear durability.",
                },
            ],
            sections=[
                BuyingGuideSection(
                    title="1. Daily Walking vs Road Running",
                    content="Heritage retro kicks (like Air Jordan 1) prioritize iconic streetwear style and ankle structure, whereas specialized trainers (like Pegasus 40) incorporate curved rocker geometry to propel forward motion.",
                    tips=["Order half a size up for dedicated running shoes to accommodate foot swelling"],
                ),
            ],
            commonMistakes=[
                "Wearing lifestyle streetwear sneakers for high-impact cardio workouts",
                "Not replacing running shoes after 600-800 kilometers of foam compression",
            ],
            suggestedQueries=[
                "Breathable road running shoes",
                "Retro high top sneakers",
                "Cushioned daily walking shoes",
            ],
        ),
    }

    def get_guide_for_category(self, category_key: str) -> CategoryBuyingGuide | None:
        key = category_key.lower().replace("cat_", "")
        for k, guide in self.GUIDES.items():
            if k in key or key in k or k in guide.categoryName.lower():
                return guide
        # Return audio as generic premium tech guide if not directly matched
        return self.GUIDES["audio"]


_guide_service: BuyingGuideService | None = None


def get_buying_guide_service() -> BuyingGuideService:
    global _guide_service
    if _guide_service is None:
        _guide_service = BuyingGuideService()
    return _guide_service


get_buying_guides_catalog = get_buying_guide_service
