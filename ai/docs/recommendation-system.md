# Multi-Stage Hybrid Recommendation System

## 1. Multi-Stage Pipeline Overview
```
EVENT COLLECTION
        ↓
EVENT PROCESSING & FEATURE STORE
        ↓
CANDIDATE GENERATION (Multi-source: Content, Collab, Popularity, Session, FBT)
        ↓
BUSINESS CONSTRAINT FILTERING (In-stock, Published, Active Seller)
        ↓
COARSE RANKING & COMPOSITE SCORING
        ↓
FINE RANKING & PERSONALIZATION (Category/Brand Affinity, Discount Elasticity)
        ↓
DIVERSIFICATION (Max Marginal Relevance & Category Caps)
        ↓
EXPLANATION ATTRIBUTION ("Because you viewed...", "Popular in...")
        ↓
FINAL RECOMMENDATIONS SERVED VIA FASTAPI
```

## 2. Hybrid Scoring Equation
The composite candidate score $S_{final}$ combines multiple weighted algorithmic signals:
$$S_{final} = (w_{cont} \cdot S_{cont} + w_{pers} \cdot S_{pers} + w_{sess} \cdot S_{sess} + w_{pop} \cdot S_{pop} + w_{fbt} \cdot S_{fbt}) \times B_{personalization}$$

Where:
- $w_{pers} = 0.30$: User long-term category and brand affinity.
- $w_{cont} = 0.25$: Semantic/visual vector cosine similarity.
- $w_{sess} = 0.15$: Real-time session viewed anchor items.
- $w_{pop} = 0.10$: 30-day velocity and verified customer ratings.
- $w_{fbt} = 0.25$: Complementary basket co-purchase weight.
- $B_{personalization}$: Multiplier boosting preferred brands and discount sensitivity.

## 3. Placement Coverage
- **Homepage**: `HOME_FOR_YOU`, `HOME_BECAUSE_YOU_VIEWED`, `HOME_TRENDING`.
- **Product Details (PDP)**: `PDP_SIMILAR`, `PDP_ALSO_VIEWED`, `PDP_FREQUENTLY_BOUGHT_TOGETHER`.
- **Cart**: `CART_ADDONS` (accessories and complete-the-set items).
- **Category Browsing**: `CATEGORY_PERSONALIZED`.
