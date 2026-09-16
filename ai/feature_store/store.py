import logging
import os
import threading
from datetime import UTC, datetime, timedelta

import redis
from pymongo import MongoClient

from ai.configs.settings import get_settings
from ai.schemas.features import ItemFeatures, SessionFeatures, UserFeatures

logger = logging.getLogger(__name__)


class FeatureStore:
    """Production-grade dual-tier feature store with Redis and fast in-memory fallback."""

    def __init__(self):
        self.settings = get_settings()
        self._lock = threading.Lock()

        # In-memory tier (Guaranteed zero-downtime fallback)
        self._memory_users: dict[str, dict] = {}
        self._memory_sessions: dict[str, dict] = {}
        self._memory_items: dict[str, ItemFeatures] = {}

        # Check if testing mode is active
        self.is_test = self.settings.ENVIRONMENT == "test" or os.getenv("TESTING") == "1"

        # Redis connection
        self.redis_client: redis.Redis | None = None
        if not self.is_test:
            self._init_redis()

        # MongoDB connection
        self.mongo_client: MongoClient | None = None
        if not self.is_test:
            self._init_mongo()

        # Populate catalog features (MongoDB or built-in seed catalog)
        self.sync_item_catalog()

    def _init_redis(self):
        try:
            r = redis.from_url(
                self.settings.REDIS_URL,
                socket_connect_timeout=1.0,
                socket_timeout=1.0,
                decode_responses=True,
            )
            r.ping()
            self.redis_client = r
            logger.info("FeatureStore connected to Redis successfully.")
        except Exception as e:
            logger.warning(f"Redis unavailable ({e}); utilizing high-speed in-memory feature cache.")
            self.redis_client = None

    def _init_mongo(self):
        try:
            client = MongoClient(
                self.settings.MONGODB_URI,
                serverSelectionTimeoutMS=2000,
                connectTimeoutMS=2000,
            )
            client.admin.command("ping")
            self.mongo_client = client
            logger.info("FeatureStore connected to MongoDB Atlas successfully.")
        except Exception as e:
            logger.warning(f"MongoDB unavailable ({e}); running with localized feature registry.")
            self.mongo_client = None

    # ──────────────────────────────────────────────────────────────────────────
    # User Feature Operations
    # ──────────────────────────────────────────────────────────────────────────

    def get_user_features(self, user_id: str) -> UserFeatures | None:
        if not user_id:
            return None

        # Try Redis
        if self.redis_client:
            try:
                raw = self.redis_client.get(f"feat:user:{user_id}")
                if raw:
                    return UserFeatures.model_validate_json(raw)
            except Exception as e:
                logger.error(f"Error reading user features from Redis: {e}")

        # Fallback to Memory
        with self._lock:
            cached = self._memory_users.get(user_id)
            if cached:
                expires_at = cached.get("expiresAt")
                if expires_at is None or expires_at > datetime.now(UTC):
                    return UserFeatures.model_validate(cached["data"])
                else:
                    del self._memory_users[user_id]
        return None

    def set_user_features(self, features: UserFeatures, ttl_sec: int | None = None):
        ttl = ttl_sec or self.settings.CACHE_TTL_USER_AFFINITIES_SEC
        json_str = features.model_dump_json()

        # Redis write
        if self.redis_client:
            try:
                self.redis_client.setex(f"feat:user:{features.userId}", ttl, json_str)
            except Exception as e:
                logger.error(f"Error writing user features to Redis: {e}")

        # Memory write
        with self._lock:
            self._memory_users[features.userId] = {
                "data": features.model_dump(),
                "expiresAt": datetime.now(UTC) + timedelta(seconds=ttl),
            }

    # ──────────────────────────────────────────────────────────────────────────
    # Session Feature Operations (Real-time Ephemeral State)
    # ──────────────────────────────────────────────────────────────────────────

    def get_session_features(self, session_id: str) -> SessionFeatures:
        if not session_id:
            return SessionFeatures(sessionId="anon_session")

        if self.redis_client:
            try:
                raw = self.redis_client.get(f"feat:session:{session_id}")
                if raw:
                    return SessionFeatures.model_validate_json(raw)
            except Exception as e:
                logger.error(f"Error reading session features from Redis: {e}")

        with self._lock:
            cached = self._memory_sessions.get(session_id)
            if cached:
                return SessionFeatures.model_validate(cached)

        # Initialize new session features
        new_session = SessionFeatures(sessionId=session_id)
        self.set_session_features(new_session)
        return new_session

    def set_session_features(self, session: SessionFeatures, ttl_sec: int = 3600):
        json_str = session.model_dump_json()

        if self.redis_client:
            try:
                self.redis_client.setex(f"feat:session:{session.sessionId}", ttl_sec, json_str)
            except Exception as e:
                logger.error(f"Error writing session features to Redis: {e}")

        with self._lock:
            self._memory_sessions[session.sessionId] = session.model_dump()

    def update_session(
        self,
        session_id: str,
        user_id: str | None = None,
        product_id: str | None = None,
        category_id: str | None = None,
        search_query: str | None = None,
        is_cart: bool = False,
    ) -> SessionFeatures:
        session = self.get_session_features(session_id)
        if user_id:
            session.userId = user_id

        if product_id:
            if is_cart:
                if product_id not in session.cartProductIds:
                    session.cartProductIds.append(product_id)
            else:
                if product_id not in session.viewedProductIds:
                    session.viewedProductIds.insert(0, product_id)
                    session.viewedProductIds = session.viewedProductIds[:20]

        if category_id:
            session.activeCategory = category_id
        if search_query:
            session.lastSearchQuery = search_query

        session.lastInteractionAt = datetime.now(UTC)
        self.set_session_features(session)
        return session

    # ──────────────────────────────────────────────────────────────────────────
    # Item Feature Operations
    # ──────────────────────────────────────────────────────────────────────────

    def get_item_features(self, product_id: str) -> ItemFeatures | None:
        with self._lock:
            return self._memory_items.get(product_id)

    def get_all_items(self) -> list[ItemFeatures]:
        with self._lock:
            return list(self._memory_items.values())

    def set_item_features(self, item: ItemFeatures):
        with self._lock:
            self._memory_items[item.productId] = item

    def sync_item_catalog(self):
        """Loads items from MongoDB, or boots with rich realistic seed items."""
        loaded_count = 0
        if self.mongo_client:
            try:
                db = self.mongo_client.get_database()
                products = list(db["products"].find({"status": "PUBLISHED"}).limit(500))
                categories = {str(c["_id"]): c.get("name", "General") for c in db["categories"].find()}

                for p in products:
                    pid = str(p["_id"])
                    cid = str(p.get("category", ""))
                    cname = categories.get(cid, "Marketplace")

                    images = []
                    for img in p.get("images", []):
                        if isinstance(img, str):
                            images.append(img)
                        elif isinstance(img, dict) and "url" in img:
                            images.append(img["url"])

                    item = ItemFeatures(
                        productId=pid,
                        title=p.get("title", ""),
                        brand=p.get("brand", "Zosh Certified"),
                        categoryId=cid,
                        categoryName=cname,
                        sellingPrice=float(p.get("sellingPrice") or p.get("mrpPrice") or 999),
                        mrpPrice=float(p.get("mrpPrice") or p.get("sellingPrice") or 999),
                        discountPercent=int(p.get("discountPercent") or 0),
                        ratingAverage=float(p.get("ratings", {}).get("average") or 4.5),
                        ratingCount=int(p.get("ratings", {}).get("count") or 10),
                        countInStock=int(p.get("countInStock") or 10),
                        inStock=bool(p.get("inStock", True) and (p.get("countInStock", 1) > 0)),
                        status=p.get("status", "PUBLISHED"),
                        sellerId=str(p.get("seller", "")),
                        highlights=p.get("highlights", []),
                        tags=p.get("tags", []),
                        images=images,
                        salesVelocity30d=int(p.get("ratings", {}).get("count", 5) * 3),
                        viewCount30d=int(p.get("ratings", {}).get("count", 5) * 20),
                        conversionRate=0.08,
                    )
                    self.set_item_features(item)
                    loaded_count += 1
                logger.info(f"Loaded {loaded_count} published products from MongoDB into FeatureStore.")
            except Exception as e:
                logger.error(f"Error syncing items from MongoDB: {e}")

        # If database has very few products, bootstrap with realistic multi-vendor seed catalog
        if loaded_count < 5:
            self._seed_default_marketplace_catalog()

    def _seed_default_marketplace_catalog(self):
        """Deterministic seed catalog mirroring real Zosh Bazaar marketplace products."""
        seeds = [
            ItemFeatures(
                productId="prod_apple_watch_ultra_2",
                title="Apple Watch Ultra 2 GPS + Cellular 49mm Titanium",
                brand="Apple",
                categoryId="cat_smartwatches",
                categoryName="Wearable Tech & Smartwatches",
                sellingPrice=79900.0,
                mrpPrice=89900.0,
                discountPercent=11,
                ratingAverage=4.9,
                ratingCount=128,
                countInStock=25,
                inStock=True,
                status="PUBLISHED",
                sellerId="seller_techgear_blr",
                highlights=["49mm aerospace-grade titanium", "Dual-frequency GPS", "36h battery life"],
                tags=["apple", "smartwatch", "fitness", "outdoor", "titanium"],
                images=["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"],
                salesVelocity30d=120,
                viewCount30d=1450,
                conversionRate=0.082,
            ),
            ItemFeatures(
                productId="prod_sony_wh1000xm5",
                title="Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones",
                brand="Sony",
                categoryId="cat_audio",
                categoryName="Smart Audio & Headphones",
                sellingPrice=26990.0,
                mrpPrice=34990.0,
                discountPercent=23,
                ratingAverage=4.8,
                ratingCount=310,
                countInStock=40,
                inStock=True,
                status="PUBLISHED",
                sellerId="seller_techgear_blr",
                highlights=["Auto NC Optimizer", "30-hour battery", "Crystal clear hands-free calling"],
                tags=["sony", "headphones", "anc", "audio", "wireless"],
                images=["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"],
                salesVelocity30d=210,
                viewCount30d=2200,
                conversionRate=0.095,
            ),
            ItemFeatures(
                productId="prod_nike_air_jordan_1",
                title="Nike Air Jordan 1 Retro High OG Chicago Lost and Found",
                brand="Nike",
                categoryId="cat_sneakers",
                categoryName="Sneakers & Kicks",
                sellingPrice=16995.0,
                mrpPrice=18995.0,
                discountPercent=10,
                ratingAverage=4.9,
                ratingCount=450,
                countInStock=15,
                inStock=True,
                status="PUBLISHED",
                sellerId="seller_techgear_blr",
                highlights=["Classic 1985 Chicago colorway", "Premium full-grain leather", "Air cushioning"],
                tags=["nike", "jordan", "sneakers", "streetwear", "chicago"],
                images=["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"],
                salesVelocity30d=320,
                viewCount30d=3900,
                conversionRate=0.11,
            ),
            ItemFeatures(
                productId="prod_virasat_banarasi_saree",
                title="Virasat Royal Banarasi Katan Silk Handloom Saree with Zari Pallu",
                brand="Virasat Weaves",
                categoryId="cat_sarees",
                categoryName="Ethnic Wear & Royal Sarees",
                sellingPrice=8499.0,
                mrpPrice=15999.0,
                discountPercent=47,
                ratingAverage=4.7,
                ratingCount=89,
                countInStock=30,
                inStock=True,
                status="PUBLISHED",
                sellerId="seller_virasat_varanasi",
                highlights=["Pure Katan silk handloom", "Intricate gold zari kadhwa motifs", "6.4m with blouse"],
                tags=["saree", "silk", "banarasi", "wedding", "ethnic", "virasat"],
                images=["https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800"],
                salesVelocity30d=95,
                viewCount30d=980,
                conversionRate=0.097,
            ),
            ItemFeatures(
                productId="prod_zosh_linen_blazer",
                title="Zosh Atelier Bespoke Italian Linen Slim-Fit Casual Blazer",
                brand="Zosh Atelier",
                categoryId="cat_mens_clothing",
                categoryName="Men's Blazers & Formal Wear",
                sellingPrice=4999.0,
                mrpPrice=9999.0,
                discountPercent=50,
                ratingAverage=4.6,
                ratingCount=74,
                countInStock=18,
                inStock=True,
                status="PUBLISHED",
                sellerId="seller_virasat_varanasi",
                highlights=["100% Breathable Italian Flax Linen", "Double back vent", "Horn buttons"],
                tags=["blazer", "linen", "formal", "menswear", "fashion"],
                images=["https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800"],
                salesVelocity30d=80,
                viewCount30d=850,
                conversionRate=0.094,
            ),
            ItemFeatures(
                productId="prod_apple_airpods_pro_2",
                title="Apple AirPods Pro 2nd Gen with USB-C MagSafe Case",
                brand="Apple",
                categoryId="cat_audio",
                categoryName="Smart Audio & Headphones",
                sellingPrice=22900.0,
                mrpPrice=24900.0,
                discountPercent=8,
                ratingAverage=4.9,
                ratingCount=560,
                countInStock=50,
                inStock=True,
                status="PUBLISHED",
                sellerId="seller_techgear_blr",
                highlights=["Active Noise Cancellation", "Adaptive Audio", "Conversation Awareness"],
                tags=["apple", "airpods", "earbuds", "audio", "wireless"],
                images=["https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800"],
                salesVelocity30d=410,
                viewCount30d=4200,
                conversionRate=0.12,
            ),
            ItemFeatures(
                productId="prod_nike_pegasus_40",
                title="Nike Air Zoom Pegasus 40 Men's Road Running Shoes",
                brand="Nike",
                categoryId="cat_sneakers",
                categoryName="Sneakers & Kicks",
                sellingPrice=8495.0,
                mrpPrice=10495.0,
                discountPercent=19,
                ratingAverage=4.7,
                ratingCount=220,
                countInStock=28,
                inStock=True,
                status="PUBLISHED",
                sellerId="seller_techgear_blr",
                highlights=["Responsive Zoom Air units", "Engineered mesh upper", "Waffle-inspired outsole"],
                tags=["nike", "running", "shoes", "fitness", "pegasus"],
                images=["https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800"],
                salesVelocity30d=180,
                viewCount30d=1900,
                conversionRate=0.095,
            ),
            ItemFeatures(
                productId="prod_virasat_chanderi_saree",
                title="Virasat Handcrafted Chanderi Cotton Silk Floral Saree",
                brand="Virasat Weaves",
                categoryId="cat_sarees",
                categoryName="Ethnic Wear & Royal Sarees",
                sellingPrice=3799.0,
                mrpPrice=6999.0,
                discountPercent=45,
                ratingAverage=4.5,
                ratingCount=48,
                countInStock=22,
                inStock=True,
                status="PUBLISHED",
                sellerId="seller_virasat_varanasi",
                highlights=["Lightweight Chanderi weave", "Subtle metallic sheen", "Handblock prints"],
                tags=["chanderi", "saree", "cotton", "ethnic", "handcraft"],
                images=["https://images.unsplash.com/photo-1610030469888-98e550d6193c?w=800"],
                salesVelocity30d=60,
                viewCount30d=650,
                conversionRate=0.092,
            ),
            ItemFeatures(
                productId="prod_poco_x6_pro",
                title="POCO X6 Pro 5G (Spectre Black, 256GB, 8GB RAM)",
                brand="POCO",
                categoryId="cat_smartphones",
                categoryName="Smartphones & Mobile Tech",
                sellingPrice=19999.0,
                mrpPrice=26999.0,
                discountPercent=26,
                ratingAverage=4.8,
                ratingCount=1420,
                countInStock=35,
                inStock=True,
                status="PUBLISHED",
                sellerId="seller_techgear_blr",
                highlights=["Dimensity 8300-Ultra flagship gaming processor", "1.5K 120Hz Flow AMOLED display", "67W Turbo Charge with 5000mAh battery"],
                tags=["phone", "smartphone", "gaming", "poco", "android", "5g", "black"],
                images=["https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800"],
                salesVelocity30d=480,
                viewCount30d=5200,
                conversionRate=0.11,
            ),
            ItemFeatures(
                productId="prod_redmi_note_13_pro",
                title="Redmi Note 13 Pro 5G (Midnight Black, 128GB, 8GB RAM)",
                brand="Redmi",
                categoryId="cat_smartphones",
                categoryName="Smartphones & Mobile Tech",
                sellingPrice=18999.0,
                mrpPrice=24999.0,
                discountPercent=24,
                ratingAverage=4.7,
                ratingCount=1850,
                countInStock=40,
                inStock=True,
                status="PUBLISHED",
                sellerId="seller_techgear_blr",
                highlights=["200MP OIS ultra-clear main camera with 4X lossless zoom", "Snapdragon 7s Gen 2 5G processor", "67W fast charging & 5100mAh battery"],
                tags=["phone", "smartphone", "camera", "redmi", "xiaomi", "android", "5g", "black"],
                images=["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800"],
                salesVelocity30d=510,
                viewCount30d=6100,
                conversionRate=0.12,
            ),
            ItemFeatures(
                productId="prod_realme_gt_6t",
                title="Realme GT 6T 5G (Fluid Silver, 256GB, 8GB RAM)",
                brand="Realme",
                categoryId="cat_smartphones",
                categoryName="Smartphones & Mobile Tech",
                sellingPrice=24999.0,
                mrpPrice=31999.0,
                discountPercent=22,
                ratingAverage=4.6,
                ratingCount=920,
                countInStock=20,
                inStock=True,
                status="PUBLISHED",
                sellerId="seller_techgear_blr",
                highlights=["Snapdragon 7+ Gen 3 high performance", "6000 nits Ultra Bright curved AMOLED", "120W SuperVOOC charge with 5500mAh battery"],
                tags=["phone", "smartphone", "gaming", "realme", "android", "5g", "silver"],
                images=["https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800"],
                salesVelocity30d=240,
                viewCount30d=2800,
                conversionRate=0.09,
            ),
            ItemFeatures(
                productId="prod_apple_iphone_15",
                title="Apple iPhone 15 (Black, 128GB)",
                brand="Apple",
                categoryId="cat_smartphones",
                categoryName="Smartphones & Mobile Tech",
                sellingPrice=65999.0,
                mrpPrice=79900.0,
                discountPercent=17,
                ratingAverage=4.9,
                ratingCount=3200,
                countInStock=15,
                inStock=True,
                status="PUBLISHED",
                sellerId="seller_techgear_blr",
                highlights=["Dynamic Island & 48MP main camera with 2x Telephoto", "A16 Bionic powerhouse", "USB-C with all-day battery"],
                tags=["apple", "iphone", "camera", "smartphone", "ios", "black"],
                images=["https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800"],
                salesVelocity30d=390,
                viewCount30d=7500,
                conversionRate=0.09,
            ),
            ItemFeatures(
                productId="prod_redtape_oxford_formal",
                title="Red Tape Men's Classic Leather Formal Oxford Shoes",
                brand="Red Tape",
                categoryId="cat_footwear",
                categoryName="Formal & Office Shoes",
                sellingPrice=1899.0,
                mrpPrice=4899.0,
                discountPercent=61,
                ratingAverage=4.6,
                ratingCount=640,
                countInStock=45,
                inStock=True,
                status="PUBLISHED",
                sellerId="seller_techgear_blr",
                highlights=["Genuine soft leather upper", "Cushioned memory foam footbed", "Slip-resistant TPR formal sole"],
                tags=["shoes", "office", "formal", "red tape", "leather", "black", "footwear"],
                images=["https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=800"],
                salesVelocity30d=310,
                viewCount30d=2400,
                conversionRate=0.10,
            ),
            ItemFeatures(
                productId="prod_woodland_derby_formal",
                title="Woodland Men's Handcrafted Leather Office Derby Shoes",
                brand="Woodland",
                categoryId="cat_footwear",
                categoryName="Formal & Office Shoes",
                sellingPrice=2895.0,
                mrpPrice=4295.0,
                discountPercent=33,
                ratingAverage=4.7,
                ratingCount=510,
                countInStock=30,
                inStock=True,
                status="PUBLISHED",
                sellerId="seller_techgear_blr",
                highlights=["Premium oiled milled leather", "Breathable leather lining", "All-day comfort desk-to-field"],
                tags=["shoes", "office", "formal", "woodland", "leather", "derby", "brown"],
                images=["https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800"],
                salesVelocity30d=220,
                viewCount30d=1800,
                conversionRate=0.09,
            ),
            ItemFeatures(
                productId="prod_ergonomic_mesh_chair",
                title="Zosh Pro Ergonomic High-Back Mesh Office Chair with Lumbar Support",
                brand="Zosh Ergonomics",
                categoryId="cat_furniture",
                categoryName="Office & Home Furniture",
                sellingPrice=6999.0,
                mrpPrice=14999.0,
                discountPercent=53,
                ratingAverage=4.8,
                ratingCount=380,
                countInStock=20,
                inStock=True,
                status="PUBLISHED",
                sellerId="seller_techgear_blr",
                highlights=["Dynamic 2D lumbar support for 8+ hour sitting", "Breathable Korean mesh back", "Heavy-duty chrome wheelbase & 3-stage gas lift"],
                tags=["chair", "office", "ergonomic", "furniture", "comfort", "mesh"],
                images=["https://images.unsplash.com/photo-1580481077195-738b13884b2c?w=800"],
                salesVelocity30d=140,
                viewCount30d=1600,
                conversionRate=0.088,
            ),
            ItemFeatures(
                productId="prod_complete_cotton_outfit",
                title="Zosh Handcrafted Festive Cotton Kurta & Chino Set (Complete Outfit under 5k)",
                brand="Zosh Atelier",
                categoryId="cat_mens_clothing",
                categoryName="Men's Apparel & Outfits",
                sellingPrice=3499.0,
                mrpPrice=6999.0,
                discountPercent=50,
                ratingAverage=4.8,
                ratingCount=190,
                countInStock=25,
                inStock=True,
                status="PUBLISHED",
                sellerId="seller_virasat_varanasi",
                highlights=["100% Breathable cotton mandarin kurta", "Tailored stretch chinos included", "Bespoke handcrafted wooden buttons"],
                tags=["outfit", "menswear", "kurta", "chinos", "cotton", "apparel", "festive"],
                images=["https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800"],
                salesVelocity30d=110,
                viewCount30d=1300,
                conversionRate=0.085,
            ),
            ItemFeatures(
                productId="prod_braided_aux_cable",
                title="Zosh Audio Gold-Plated Braided 3.5mm Aux Audio Cable (1.5m)",
                brand="Zosh Audio",
                categoryId="cat_audio",
                categoryName="Smart Audio & Accessories",
                sellingPrice=399.0,
                mrpPrice=999.0,
                discountPercent=60,
                ratingAverage=4.7,
                ratingCount=840,
                countInStock=100,
                inStock=True,
                status="PUBLISHED",
                sellerId="seller_techgear_blr",
                highlights=["24K gold-plated connectors", "Nylon braided tangle-free jacket", "Universal 3.5mm Hi-Fi audio"],
                tags=["audio", "cable", "aux", "accessory"],
                images=["https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800"],
                salesVelocity30d=450,
                viewCount30d=2600,
                conversionRate=0.15,
            ),
        ]

        for s in seeds:
            self.set_item_features(s)
        logger.info(f"Initialized FeatureStore with {len(seeds)} default marketplace seed items.")


_feature_store_instance: FeatureStore | None = None


def get_feature_store() -> FeatureStore:
    global _feature_store_instance
    if _feature_store_instance is None:
        _feature_store_instance = FeatureStore()
    return _feature_store_instance
