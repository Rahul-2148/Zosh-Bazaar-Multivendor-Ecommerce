from ai.feature_store.store import FeatureStore
from ai.vector_store.index import VectorIndex


def test_vector_index_similarity():
    store = FeatureStore()
    items = store.get_all_items()

    v_index = VectorIndex()
    v_index.build_index(items)

    assert v_index._is_fitted is True

    # Check similar to Apple Watch
    sims = v_index.find_similar("prod_apple_watch_ultra_2", top_k=5)
    assert len(sims) > 0

    # Check query search for saree
    q_results = v_index.search_by_query("handloom banarasi saree", top_k=3)
    assert len(q_results) > 0
    top_pid, _score = q_results[0]
    top_item = store.get_item_features(top_pid)
    assert "saree" in top_item.categoryName.lower() or "saree" in top_item.title.lower()
