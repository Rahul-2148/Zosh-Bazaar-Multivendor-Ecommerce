from ai.models.candidate_generation import CandidateItem
from ai.ranking.ranker import MultiStageRanker
from ai.schemas.features import ItemFeatures, UserFeatures


def create_mock_item(pid: str, brand: str, cat: str, stock: int = 10, price: float = 1000.0) -> ItemFeatures:
    return ItemFeatures(
        productId=pid,
        title=f"{brand} Test Item {pid}",
        brand=brand,
        categoryId=cat,
        categoryName=f"Category {cat}",
        sellingPrice=price,
        mrpPrice=price * 1.2,
        discountPercent=15,
        ratingAverage=4.5,
        ratingCount=50,
        countInStock=stock,
        inStock=stock > 0,
        status="PUBLISHED",
        sellerId="seller_1",
    )


def test_business_constraint_out_of_stock_filtering():
    ranker = MultiStageRanker()
    in_stock_item = create_mock_item("p1", "BrandA", "Cat1", stock=10)
    out_of_stock_item = create_mock_item("p2", "BrandB", "Cat2", stock=0)

    candidates = [
        CandidateItem(in_stock_item, 0.9, "popularity"),
        CandidateItem(out_of_stock_item, 0.99, "popularity"),
    ]

    results = ranker.rank_and_filter(candidates=candidates, limit=5)
    result_ids = [r.productId for r in results]

    assert "p1" in result_ids
    assert "p2" not in result_ids  # Out-of-stock MUST be filtered


def test_exclusion_list():
    ranker = MultiStageRanker()
    i1 = create_mock_item("p1", "BrandA", "Cat1")
    i2 = create_mock_item("p2", "BrandB", "Cat2")

    candidates = [
        CandidateItem(i1, 0.8, "popularity"),
        CandidateItem(i2, 0.7, "popularity"),
    ]

    results = ranker.rank_and_filter(candidates=candidates, exclude_product_ids=["p1"], limit=5)
    result_ids = [r.productId for r in results]
    assert "p1" not in result_ids
    assert "p2" in result_ids


def test_personalization_boost():
    ranker = MultiStageRanker()
    tech_item = create_mock_item("p_tech", "Apple", "cat_tech", price=50000.0)
    saree_item = create_mock_item("p_saree", "Virasat", "cat_fashion", price=5000.0)

    candidates = [
        CandidateItem(tech_item, 0.5, "popularity"),
        CandidateItem(saree_item, 0.5, "popularity"),
    ]

    user_feat = UserFeatures(
        userId="u_tech_lover",
        categoryAffinities={"cat_tech": 0.9},
        brandAffinities={"Apple": 0.9},
    )

    results = ranker.rank_and_filter(candidates=candidates, user_features=user_feat, limit=2)
    assert len(results) == 2
    # Tech item should be ranked first due to personalization affinity boost
    assert results[0].productId == "p_tech"
    assert results[0].explanationReason.value in ["brand_affinity", "category_affinity"]
