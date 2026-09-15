# Zosh Bazaar AI Platform Architecture

## 1. High-Level Topology
The Zosh Bazaar AI platform is an independent Python microservice that provides real-time scoring, ranking, vector similarity, and shopping intelligence to all marketplace portals through clean, versioned APIs.

```
CLIENT / SELLER / ADMIN / LOGISTICS / DELIVERY PARTNER
                    ↓
              SERVER APIs (Node.js)
                    ↓
           EVENT / FEATURE LAYER
                    ↓
             PYTHON AI PLATFORM (FastAPI / PyTorch / Scikit-learn)
                    ↓
       Recommendation / Search / Assistant Inference
                    ↓
             SERVER / CLIENT
```

## 2. Core Design Principles
1. **Decoupled Architecture**: Python AI code is strictly encapsulated within `/ai`. Frontend applications communicate via HTTP/JSON.
2. **Deterministic Commerce Source of Truth**: The Node.js server maintains exclusive authority over transactions, cart updates, inventory mutations, and authorization. The AI platform is an intelligence and inference provider.
3. **Graceful Degradation & Zero Shopping Disruption**: If the AI platform is unreachable or degraded, the Node server automatically falls back to deterministic database-backed popularity or category rails with zero downtime.
4. **Dual-Tier Feature Store**: Combines Redis for distributed sub-millisecond caching with an in-memory thread-safe LRU fallback for offline/local environments.
5. **No Fake AI**: No hardcoded random items or fake model labels. Real candidate generation, content vectors, collaborative signals, and explainability reasoning.
