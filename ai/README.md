# Zosh Bazaar AI/ML Platform

Production-grade Python AI/ML platform for **Zosh Bazaar** multi-vendor marketplace.
Provides real-time recommendations, grounded conversational shopping assistance, semantic search, behavioral event telemetry, and multi-surface commerce intelligence.

## Platform Architecture

```
                 ZOSH BAZAAR
                      │
      ┌───────────────┼────────────────┐
      │               │                │
   CLIENT          SELLER            ADMIN
      │               │                │
      └───────────────┼────────────────┘
                      │
                  SERVER/API
                      │
              EVENT / DATA LAYER
                      │
             ┌────────┴─────────┐
             │                  │
          ONLINE AI          OFFLINE ML
             │                  │
       ┌─────┼─────┐       ┌────┼─────────┐
       │     │     │       │    │         │
      REC   SEARCH VISION TRAIN EVAL    FEATURES
       │     │     │       │    │         │
       └─────┴─────┴───────┴────┴─────────┘
                      │
                MODEL REGISTRY
                      │
                EXPERIMENTATION
                      │
                 OBSERVABILITY
```

## Getting Started

### Local Development
```bash
# Using uv (fastest)
cd ai
uv venv .venv --python 3.12
uv pip install -r requirements/base.txt -r requirements/ml.txt -r requirements/dev.txt

# Run the AI server
uv run uvicorn ai.apps.main:app --reload --port 8000

# Run automated test suite
uv run pytest tests/ -v
```
