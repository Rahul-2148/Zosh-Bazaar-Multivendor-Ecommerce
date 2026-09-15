# Data Privacy & Anonymization Policy

## 1. Minimal Data Collection
The AI behavioral telemetry pipeline collects only commerce interaction signals necessary to deliver relevant recommendations and search results:
- Does NOT collect passwords, full payment credentials, PAN, Aadhaar, or private messages.
- Anonymous clients use ephemeral UUID cookies until authentication.

## 2. Right to Erasure & Account Deletion Compliance
When a customer requests account deletion via the Zosh Bazaar Account Deletion flow:
1. `UserFeatures` associated with the customer's `userId` are purged from Redis and memory feature stores.
2. Historical interaction telemetry events are either anonymized (retaining aggregate statistics while scrubbing `userId`) or permanently dropped in alignment with the platform retention schedule.
3. Personalization vectors and preferences are irreversibly reset.
