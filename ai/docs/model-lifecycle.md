# Machine Learning Model Lifecycle & Evaluation

## 1. Lifecycle Stages
1. **Offline Training & Embedding Generation**:
   - Time-aware temporal splitting (no data leakage from future transactions).
   - Embedding generation over normalized catalog items.
2. **Offline Evaluation Benchmark**:
   - Candidate Recall@K, Precision@K, MAP@K, NDCG@K, MRR, Catalog Coverage, Intra-List Diversity.
3. **Model Registry Promotion**:
   - Models are registered with version, framework, and offline metrics in `ai/models/registry.json`.
   - Never overwrite production artifacts silently.
4. **Online A/B Experimentation**:
   - Hash-based user routing (e.g. 50% Control vs 50% Variant B).
5. **Real-Time Monitoring & Drift Detection**:
   - Latency tracking (P50/P95/P99), cache hit rate, fallback frequency, and CTR drift monitoring.
