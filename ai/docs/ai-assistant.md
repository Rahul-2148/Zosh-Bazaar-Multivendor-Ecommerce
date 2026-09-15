# AI Shopping Assistant Architecture

## 1. Grounded Conversational Architecture
```
User Query ("Need running shoes under 3000")
        ↓
Intent Detection & Entity Extraction (Max Price = 3000, Category = Running Shoes)
        ↓
Context Retrieval (Current active session + conversation history)
        ↓
Tool Execution (Grounded lookup in verified catalog)
        ↓
Strict Grounding & Answer Synthesis (No hallucinated prices or specs)
        ↓
Server-Side Authorization Check
        ↓
Response with Action Buttons & Suggested Product Cards
```

## 2. Server-Side Safety & Authority
The AI shopping assistant never executes unauthorized state mutations or hallucinates catalog details.
All actions (add to cart, check order, view reviews) are routed through authenticated server endpoints. If a requested product or specification is not found in the database, the assistant truthfully reports its unavailability.
