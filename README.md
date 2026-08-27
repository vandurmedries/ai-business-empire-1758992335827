# DemandMine Product Decision Passport

DemandMine turns a product sourcing or resale idea into a structured **GO**, **VALIDATE**, or **NO-BUY** decision.

## Live product

- Product page: https://demandmine.onrender.com
- Founding access: https://buy.stripe.com/9B6eVe2lf5GF8LkbSJ5Vu0c
- Price: **€12 one time**, with applicable tax calculated at checkout
- Support: demandmine@agentmail.to

## What the buyer receives

- Landed-cost, profit, margin, and ROI calculations
- Break-even selling price
- Maximum viable landed and source cost at a target margin
- Downside tests for source cost +15%, selling price −10%, returns +5 points, and a combined stress case
- Automatic red flags and a validation plan
- Downloadable JSON and CSV Product Decision Passports
- Printable report and a browser-local decision log
- Immediate access after Stripe checkout; no recurring subscription

## Machine-readable discovery

- `GET /offer.json` — price, checkout, capabilities, delivery, and refund policy
- `GET /.well-known/agent-card.json` — agent-readable capability card
- `GET /schemas/decision-passport-v1.json` — JSON Schema for exported passports
- `POST /api/score` — returns a complete Product Decision Passport as JSON
- `GET /llms.txt` — compact discovery instructions for AI systems

Example:

```bash
curl -X POST https://demandmine.onrender.com/api/score \
  -H "content-type: application/json" \
  -d '{
    "productName": "Leather alphabet stamp set",
    "sourceCost": 13.20,
    "inboundShipping": 2.80,
    "packaging": 1.00,
    "salePrice": 32.95,
    "marketplaceFeePct": 9.5,
    "paymentFeePct": 3,
    "adReservePct": 5,
    "returnReservePct": 4,
    "targetMarginPct": 25,
    "demandScore": 70,
    "competitionScore": 40,
    "supplierConfidence": 80,
    "evidenceCount": 3
  }'
```

## Delivery and privacy

Stripe redirects a successful buyer directly to the paid workspace. Saved passports stay in that buyer's browser local storage unless exported. The current application does not intentionally maintain a product-idea database.

## Important

DemandMine is informational decision support. It does not guarantee demand, marketplace eligibility, supplier performance, sales, or profit. Buyers must validate current costs, marketplace rules, intellectual-property rights, tax, shipping, returns, and supplier terms before committing capital.

This repository is publicly visible for deployment transparency. **No open-source licence or permission to resell, sublicense, or commercially redistribute the software is granted.**
