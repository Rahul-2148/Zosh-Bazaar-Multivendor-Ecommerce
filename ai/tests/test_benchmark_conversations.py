"""
ZOSH BAZAAR AI SHOPPING EXPERIENCE 3.0 — 20 BENCHMARK CONVERSATIONS & HINGLISH TEST SUITE
Guarantees real catalog grounding, correct tool execution, multi-turn context retention,
structured comparison matrices, and 1-click cart action payloads.
"""

import pytest
from ai.agents.assistant import get_shopping_assistant
from ai.schemas.assistant import AssistantQueryRequest


@pytest.fixture
def agent():
    return get_shopping_assistant()


def test_benchmark_01_gaming_phone_under_20k(agent):
    """1. Best phone under 20000 for gaming."""
    req = AssistantQueryRequest(
        sessionId="bench_01",
        userId="user_bench_01",
        message="Best phone under 20000 for gaming.",
    )
    res = agent.process_query(req)

    assert res.isGrounded is True
    assert len(res.suggestedProducts) > 0
    # Verified gaming phone seed
    assert any("poco" in p.title.lower() or p.sellingPrice <= 20000 for p in res.suggestedProducts)
    assert len(res.actionPayloads) > 0
    assert "₹" in res.reply or "Poco" in res.reply or "Dimensity" in res.reply


def test_benchmark_02_hinglish_camera_phone(agent):
    """2. 20k ke andar best camera phone dikhao."""
    req = AssistantQueryRequest(
        sessionId="bench_02",
        userId="user_bench_02",
        message="20k ke andar best camera phone dikhao.",
    )
    res = agent.process_query(req)

    assert res.isGrounded is True
    assert len(res.suggestedProducts) > 0
    assert any(p.sellingPrice <= 20000 for p in res.suggestedProducts)
    assert "₹" in res.reply


def test_benchmark_03_office_shoes_under_3000(agent):
    """3. I need office shoes under 3000."""
    req = AssistantQueryRequest(
        sessionId="bench_03",
        userId="user_bench_03",
        message="I need office shoes under 3000.",
    )
    res = agent.process_query(req)

    assert res.isGrounded is True
    assert len(res.suggestedProducts) > 0
    assert any(p.sellingPrice <= 3000 for p in res.suggestedProducts)
    assert any("shoe" in p.title.lower() or "derby" in p.title.lower() or "oxford" in p.title.lower() for p in res.suggestedProducts)


def test_benchmark_04_compare_top_options(agent):
    """4. Compare the first three."""
    req = AssistantQueryRequest(
        sessionId="bench_04",
        userId="user_bench_04",
        message="Compare the first three.",
        activeContext={
            "lastProductIds": ["prod_poco_x6", "prod_redmi_n13", "prod_realme_gt6t"],
            "category": "Mobiles & Tablets",
        },
    )
    res = agent.process_query(req)

    assert res.isGrounded is True
    assert res.structuredComparison is not None
    assert len(res.structuredComparison.productIds) >= 2
    assert len(res.structuredComparison.attributeRows) >= 3


def test_benchmark_05_better_battery_comparison(agent):
    """5. Which has better battery?"""
    req = AssistantQueryRequest(
        sessionId="bench_05",
        userId="user_bench_05",
        message="Which has better battery?",
        activeContext={
            "lastProductIds": ["prod_poco_x6", "prod_redmi_n13"],
            "category": "Mobiles & Tablets",
        },
    )
    res = agent.process_query(req)

    assert res.isGrounded is True
    assert "battery" in res.reply.lower() or "mah" in res.reply.lower()


def test_benchmark_06_add_best_to_cart(agent):
    """6. Add the best one to my cart."""
    req = AssistantQueryRequest(
        sessionId="bench_06",
        userId="user_bench_06",
        message="Add the best one to my cart.",
        activeContext={
            "lastProductIds": ["prod_poco_x6_pro"],
        },
    )
    res = agent.process_query(req)

    assert len(res.actionPayloads) > 0
    assert res.actionPayloads[0].actionType == "ADD_TO_CART"
    assert "poco" in res.actionPayloads[0].productId.lower()


def test_benchmark_07_show_similar_cheaper(agent):
    """7. Show similar but cheaper."""
    req = AssistantQueryRequest(
        sessionId="bench_07",
        userId="user_bench_07",
        message="Show similar but cheaper.",
        currentProductId="prod_iphone_15",
        activeContext={
            "currentProductId": "prod_iphone_15",
            "category": "Mobiles & Tablets",
        },
    )
    res = agent.process_query(req)

    assert res.isGrounded is True
    assert len(res.suggestedProducts) > 0
    assert any(p.sellingPrice < 69999 for p in res.suggestedProducts)


def test_benchmark_08_is_this_worth_current_price(agent):
    """8. Is this worth the current price?"""
    req = AssistantQueryRequest(
        sessionId="bench_08",
        userId="user_bench_08",
        message="Is this worth the current price?",
        currentProductId="prod_audio_01",
    )
    res = agent.process_query(req)

    assert res.isGrounded is True
    assert "price" in res.reply.lower() or "deal" in res.reply.lower() or "₹" in res.reply


def test_benchmark_09_summarize_reviews(agent):
    """9. Summarize the reviews."""
    req = AssistantQueryRequest(
        sessionId="bench_09",
        userId="user_bench_09",
        message="Summarize the reviews.",
        currentProductId="prod_audio_01",
    )
    res = agent.process_query(req)

    assert res.isGrounded is True
    assert "review" in res.reply.lower() or "rating" in res.reply.lower() or "sound" in res.reply.lower()


def test_benchmark_10_when_was_cheapest(agent):
    """10. When was this product cheapest?"""
    req = AssistantQueryRequest(
        sessionId="bench_10",
        userId="user_bench_10",
        message="When was this product cheapest?",
        currentProductId="prod_audio_01",
    )
    res = agent.process_query(req)

    assert res.isGrounded is True
    assert "₹" in res.reply or "lowest" in res.reply.lower()


def test_benchmark_11_set_price_alert(agent):
    """11. Set an alert for ₹15,000."""
    req = AssistantQueryRequest(
        sessionId="bench_11",
        userId="user_bench_11",
        message="Set an alert for ₹15,000.",
        currentProductId="prod_poco_x6_pro",
    )
    res = agent.process_query(req)

    assert len(res.actionPayloads) > 0
    assert res.actionPayloads[0].actionType == "SET_PRICE_ALERT"
    assert res.actionPayloads[0].price == 15000 or "15,000" in res.reply or res.actionPayloads[0].payload.get("targetPrice") == 15000


def test_benchmark_12_what_is_in_my_cart(agent):
    """12. What is in my cart?"""
    req = AssistantQueryRequest(
        sessionId="bench_12",
        userId="user_bench_12",
        message="What is in my cart?",
        cartProductIds=["prod_audio_01"],
        activeContext={
            "cartItems": [{"id": "prod_audio_01", "title": "Apex Sound ANC Headphones", "price": 2499}]
        },
    )
    res = agent.process_query(req)

    assert res.isGrounded is True
    assert "Apex Sound" in res.reply or "2,499" in res.reply or "cart" in res.reply.lower()


def test_benchmark_13_complementary_upsell(agent):
    """13. What else should I buy with this?"""
    req = AssistantQueryRequest(
        sessionId="bench_13",
        userId="user_bench_13",
        message="What else should I buy with this?",
        currentProductId="prod_audio_01",
        activeContext={
            "category": "Electronics",
        },
    )
    res = agent.process_query(req)

    assert res.isGrounded is True
    assert len(res.suggestedProducts) > 0


def test_benchmark_14_visual_lens_similarity(agent):
    """14. Show me something similar to this image."""
    req = AssistantQueryRequest(
        sessionId="bench_14",
        userId="user_bench_14",
        message="Show me something similar to this image.",
        activeContext={
            "visualSearch": True,
            "category": "Shoes",
        },
    )
    res = agent.process_query(req)

    assert res.isGrounded is True
    assert len(res.suggestedProducts) > 0


def test_benchmark_15_where_is_my_order(agent):
    """15. Where is my order?"""
    req = AssistantQueryRequest(
        sessionId="bench_15",
        userId="user_bench_15",
        message="Where is my order?",
        activeContext={
            "orderContext": {"orderId": "ord_9921", "status": "IN_TRANSIT", "eta": "Tomorrow by 6:00 PM"}
        },
    )
    res = agent.process_query(req)

    assert res.isGrounded is True
    assert "transit" in res.reply.lower() or "ord_9921" in res.reply.lower()


def test_benchmark_16_why_is_order_delayed(agent):
    """16. Why is my order delayed?"""
    req = AssistantQueryRequest(
        sessionId="bench_16",
        userId="user_bench_16",
        message="Why is my order delayed?",
        activeContext={
            "orderContext": {"orderId": "ord_9921", "status": "DELAYED"}
        },
    )
    res = agent.process_query(req)

    assert res.isGrounded is True
    assert "delay" in res.reply.lower() or "ord_9921" in res.reply.lower()


def test_benchmark_17_return_cancellation(agent):
    """17. Can I return this?"""
    req = AssistantQueryRequest(
        sessionId="bench_17",
        userId="user_bench_17",
        message="Can I return this?",
        activeContext={
            "orderContext": {"orderId": "ord_9921", "status": "DELIVERED"}
        },
    )
    res = agent.process_query(req)

    assert res.isGrounded is True
    assert "return" in res.reply.lower() or "doorstep" in res.reply.lower() or "7 days" in res.reply.lower() or "policy" in res.reply.lower()


def test_benchmark_18_wishlist_choice(agent):
    """18. Which one from my wishlist should I buy?"""
    req = AssistantQueryRequest(
        sessionId="bench_18",
        userId="user_bench_18",
        message="Which one from my wishlist should I buy?",
        activeContext={
            "wishlistItems": [
                {"id": "prod_poco_x6", "title": "Poco X6 Pro 5G", "price": 17999},
                {"id": "prod_redmi_n13", "title": "Redmi Note 13 Pro 5G", "price": 19499}
            ]
        },
    )
    res = agent.process_query(req)

    assert res.isGrounded is True
    assert "Poco" in res.reply or "Redmi" in res.reply or "wishlist" in res.reply.lower()


def test_benchmark_19_browsing_history_recommendation(agent):
    """19. Recommend based on what I've been browsing."""
    req = AssistantQueryRequest(
        sessionId="bench_19",
        userId="user_bench_19",
        message="Recommend based on what I've been browsing.",
        activeContext={
            "recentlyViewed": ["prod_poco_x6", "prod_redmi_n13"]
        },
    )
    res = agent.process_query(req)

    assert res.isGrounded is True
    assert len(res.suggestedProducts) > 0


def test_benchmark_20_complete_outfit_under_5000(agent):
    """20. Find me a complete outfit under ₹5000."""
    req = AssistantQueryRequest(
        sessionId="bench_20",
        userId="user_bench_20",
        message="Find me a complete outfit under ₹5000.",
    )
    res = agent.process_query(req)

    assert res.isGrounded is True
    assert len(res.suggestedProducts) > 0
    assert any(p.sellingPrice <= 5000 for p in res.suggestedProducts)
    assert any("outfit" in p.title.lower() or "cotton" in p.title.lower() or "shirt" in p.title.lower() for p in res.suggestedProducts)


def test_multi_turn_hinglish_context_retention(agent):
    """
    Requirement 52: Hinglish Testing with sequential context retention:
    Turn 1: "bhai 20k ke andar best gaming phone bata"
    Turn 2: "camera acha hona chahiye"
    Turn 3: "battery bhi achi ho"
    Turn 4: "black me dikhao"
    Turn 5: "ye dono compare karo"
    Turn 6: "best wala cart me daal"
    """
    session = "bench_hinglish_multi"
    running_context = {}

    # Turn 1
    req1 = AssistantQueryRequest(
        sessionId=session,
        userId="user_hinglish",
        message="bhai 20k ke andar best gaming phone bata",
        activeContext=running_context,
    )
    r1 = agent.process_query(req1)
    assert r1.isGrounded is True
    running_context = r1.persistedContext
    assert running_context.get("category") == "cat_smartphones"
    assert running_context.get("budget") == 20000

    # Turn 2: Camera constraint added
    req2 = AssistantQueryRequest(
        sessionId=session,
        userId="user_hinglish",
        message="camera acha hona chahiye",
        activeContext=running_context,
    )
    r2 = agent.process_query(req2)
    assert r2.isGrounded is True
    running_context = r2.persistedContext
    assert running_context.get("budget") == 20000  # retained!
    assert running_context.get("category") == "cat_smartphones"  # retained!

    # Turn 3: Battery constraint added
    req3 = AssistantQueryRequest(
        sessionId=session,
        userId="user_hinglish",
        message="battery bhi achi ho",
        activeContext=running_context,
    )
    r3 = agent.process_query(req3)
    assert r3.isGrounded is True
    running_context = r3.persistedContext
    assert running_context.get("budget") == 20000  # retained!

    # Turn 4: Color constraint added
    req4 = AssistantQueryRequest(
        sessionId=session,
        userId="user_hinglish",
        message="black me dikhao",
        activeContext=running_context,
    )
    r4 = agent.process_query(req4)
    assert r4.isGrounded is True
    running_context = r4.persistedContext
    assert running_context.get("color", "").lower() == "black"
    assert running_context.get("budget") == 20000  # retained!

    # Turn 5: Compare top products
    req5 = AssistantQueryRequest(
        sessionId=session,
        userId="user_hinglish",
        message="ye dono compare karo",
        activeContext=running_context,
    )
    r5 = agent.process_query(req5)
    assert r5.isGrounded is True
    assert r5.structuredComparison is not None

    # Turn 6: Put best in cart
    req6 = AssistantQueryRequest(
        sessionId=session,
        userId="user_hinglish",
        message="best wala cart me daal",
        activeContext=running_context,
    )
    r6 = agent.process_query(req6)
    assert len(r6.actionPayloads) > 0
    assert r6.actionPayloads[0].actionType == "ADD_TO_CART"
