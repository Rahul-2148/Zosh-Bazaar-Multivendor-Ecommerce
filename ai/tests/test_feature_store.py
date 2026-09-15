from ai.feature_store.store import FeatureStore
from ai.schemas.features import UserFeatures


def test_feature_store_in_memory_crud():
    store = FeatureStore()

    # User features
    u_feat = UserFeatures(userId="user_xyz", categoryAffinities={"cat_shoes": 0.8})
    store.set_user_features(u_feat)
    retrieved_u = store.get_user_features("user_xyz")
    assert retrieved_u is not None
    assert retrieved_u.categoryAffinities["cat_shoes"] == 0.8

    # Session features
    session = store.update_session(
        session_id="sess_abc",
        product_id="prod_nike_air_jordan_1",
        category_id="cat_sneakers",
    )
    assert session.sessionId == "sess_abc"
    assert "prod_nike_air_jordan_1" in session.viewedProductIds
    assert session.activeCategory == "cat_sneakers"

    # Item features
    item = store.get_item_features("prod_nike_air_jordan_1")
    assert item is not None
    assert item.brand == "Nike"
