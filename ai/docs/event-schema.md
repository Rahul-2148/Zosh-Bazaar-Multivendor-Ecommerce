# AI Behavioral Event Telemetry & Feedback Loop

## 1. Schema Specification
Interaction events are standardized using Pydantic `AIInteractionEvent`:

```json
{
  "eventId": "ev_8f10b2ac40",
  "eventType": "product_view",
  "timestamp": "2026-09-15T02:30:00Z",
  "userId": "usr_7890",
  "anonymousId": "anon_348912",
  "sessionId": "sess_8912",
  "productId": "prod_sony_wh1000xm5",
  "categoryId": "cat_audio",
  "sellerId": "seller_techgear_blr",
  "brand": "Sony",
  "price": 26990.0,
  "recommendationContext": {
    "recommendationId": "rec_3fa85f64",
    "requestId": "req_99812",
    "placement": "home_for_you",
    "modelVersion": "hybrid_recommender_v1",
    "rankPosition": 1
  }
}
```

## 2. Recommendation Feedback Attribution Loop
Every recommendation returned by the AI platform attaches a `recommendationId` and `requestId`.
When a customer interacts with the recommended card:
1. **Impression**: Client emits `recommendation_impression` with `rankPosition`.
2. **Click**: Client emits `recommendation_clicked`.
3. **Cart**: Client emits `recommendation_added_to_cart`.
4. **Order**: Server/Client emits `recommendation_purchased`.

This closes the offline evaluation and model retraining feedback loop, enabling calculation of real CTR, ATC conversion, and attributed revenue by placement.
