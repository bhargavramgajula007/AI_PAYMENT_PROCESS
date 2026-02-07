# AI-Powered Payments Approval & Fraud Intelligence — System Design (Hackathon)

Date: 2026-02-07

## 1) Executive Summary
This system turns payout approvals and fraud detection into a real-time, explainable, human-supervised decision loop. It combines:

- **Deterministic risk decisioning** (fast, auditable) for approve/escalate/block
- **Real-time pattern + ring detection** (graph) for coordinated fraud
- **GenAI as a core operator layer** that produces:
  - explainable decisions (structured rationales + counterfactuals)
  - investigator-ready case summaries
  - natural-language fraud queries → **safe, auditable query plans**
  - incident packs (bulk actions + comms drafts + exposure summary)

The key to “wow” is that GenAI doesn’t replace scoring; it **replaces hours of human triage and incident work** while staying verifiable.

---

## 2) Scope
### 2.1 In-scope
- Withdrawal (payout) requests decisioning in seconds
- Continuous monitoring for behavioral + technical fraud signals
- Ring detection via shared identifiers (device/IP/payment token)
- Explainable decisions for every approve/block
- Human oversight: queues, evidence, overrides, audit logs
- Learning loop from outcomes (feedback → calibration + retrieval memory)
- Natural-language investigator queries with guardrails

### 2.2 Out-of-scope (for hackathon)
- Full KYC/AML adjudication
- Chargeback lifecycle tooling
- Bank rails integration details (ACH/SEPA/SWIFT) beyond abstract payment methods
- Production-grade model governance (we include design hooks)

---

## 3) Actors & Workflows
### 3.1 Actors
- **End user**: requests withdrawal
- **Payments Officer**: reviews escalations; confirms/overrides decisions
- **Fraud Investigator**: investigates alerts/rings; executes bulk containment
- **System**: monitors events, scores risk, generates GenAI artifacts

### 3.2 Primary workflows
1) **Payout request** → risk scoring → decision → (auto-approve OR escalate OR block)
2) **Continuous fraud detection** → alert → ring expansion → actions (lock/block/monitor)
3) **Investigator NL query** → query plan → executed results → optional action
4) **Feedback** (confirmed fraud / false positive / legit) → updates calibration + retrieval memory

---

## 4) High-Level Architecture

```mermaid
flowchart LR
  subgraph Sources
    A[Trading Platform
Core DB + Services]
    B[Auth Service]
    C[Payments/PSP Events]
  end

  subgraph Stream
    D[Event Bus
Kafka/Redpanda]
  end

  subgraph RealTime
    E[Feature Compute
(Stream Processor)]
    F[Online Feature Store
Redis]
    G[Risk Engine
Policy + Score]
    H[Graph Service
Ring Detection]
  end

  subgraph AI
    I[Retrieval Memory
Vector DB]
    J[LLM Explainer
Schema-locked JSON]
    K[NL Query Copilot
Plan + Guardrails]
    L[Incident Commander
Report + Comms]
  end

  subgraph Storage
    M[(Postgres
Events/Cases/Audit)]
  end

  subgraph UI
    N[Ops Console
Queue + Case View]
    O[Graph View]
    P[Investigator Chat]
  end

  A --> D
  B --> D
  C --> D

  D --> E
  E --> F
  E --> M

  F --> G
  G --> M
  G --> J

  D --> H
  H --> M
  H --> O

  M --> I
  I --> J

  M --> K
  K --> M

  G --> N
  J --> N
  H --> N
  K --> P
  L --> N
```

**Core latency path** for payouts:
- withdrawal_requested event → feature lookup/compute → risk engine decision → LLM explanation → UI/API result

---

## 5) Required Inputs (Data Contracts)
To make this actually work live (not “mocked”), you need real computed signals. You can generate synthetic events, but the system must compute features from them.

### 5.1 Minimum event types
- `withdrawal_requested`
- `deposit_created`
- `trade_executed`
- `login_succeeded` / `login_failed`
- `payment_method_added` / `payment_method_verified`
- `payment_error`
- `device_seen`
- `account_locked` / `account_unlocked`
- `officer_decision` (feedback)

### 5.2 Core identifiers (must be consistent across all events)
- `account_id` (internal)
- `user_id` (if separate from account)
- `payment_method_id` (tokenized)
- `device_id` (fingerprint hash)
- `ip` (or hashed), `asn`, `country`, `city`
- `session_id`

### 5.3 Tokenization / hashing guidance
- Store sensitive payment details as **tokens** only (PSP token, network token, last4+bin hash)
- Hash IP if needed, but keep a stable representation for linking (e.g., /24 prefix + ASN)

---

## 6) Canonical Data Model (Entities)
### 6.1 Entities
- **Account**: risk state, KYC state, age, segments
- **PaymentMethod**: type, verification status, age, prior success/failure
- **Device**: fingerprint id, first seen, last seen, device risk
- **Session/Login**: geo, VPN/proxy, impossible travel checks
- **Transaction**: deposits, trades, withdrawals
- **Case**: an escalated payout or fraud alert
- **Incident**: grouping of related cases/rings (bulk actions)

---

## 7) Event Schemas (JSON)
These schemas are designed for streaming + auditability. All events share the same envelope.

### 7.1 Event envelope
```json
{
  "event_id": "uuid",
  "event_type": "withdrawal_requested",
  "event_time": "2026-02-07T12:34:56.789Z",
  "producer": "payments-service",
  "schema_version": 1,
  "account_id": "acct_123",
  "payload": {}
}
```

### 7.2 withdrawal_requested
```json
{
  "withdrawal_id": "wd_456",
  "amount": 2500.00,
  "currency": "USD",
  "payment_method_id": "pm_789",
  "destination_type": "card|bank|crypto",
  "requested_at": "2026-02-07T12:34:56.789Z"
}
```

### 7.3 deposit_created
```json
{
  "deposit_id": "dep_001",
  "amount": 2600.00,
  "currency": "USD",
  "payment_method_id": "pm_789",
  "status": "succeeded|pending|failed",
  "created_at": "2026-02-07T11:40:12.100Z"
}
```

### 7.4 trade_executed
```json
{
  "trade_id": "tr_555",
  "instrument": "EURUSD",
  "notional": 100.00,
  "pnl": -0.25,
  "opened_at": "2026-02-07T12:01:00.000Z",
  "closed_at": "2026-02-07T12:01:10.000Z"
}
```

### 7.5 login_succeeded
```json
{
  "session_id": "sess_abc",
  "ip": "203.0.113.10",
  "asn": 64512,
  "country": "GB",
  "city": "London",
  "vpn_proxy": true,
  "device_id": "dev_hash_999",
  "occurred_at": "2026-02-07T12:20:00.000Z"
}
```

### 7.6 payment_error
```json
{
  "payment_method_id": "pm_789",
  "error_code": "RESTRICTED_CARD|DO_NOT_HONOR|INSUFFICIENT_FUNDS|...",
  "psp": "stripe|adyen|...",
  "occurred_at": "2026-02-07T10:10:00.000Z"
}
```

### 7.7 officer_decision (feedback)
```json
{
  "case_id": "case_777",
  "decision": "confirm_fraud|confirm_legit|override_approve|override_block",
  "reason": "free text",
  "decided_by": "officer_12",
  "decided_at": "2026-02-07T13:00:00.000Z"
}
```

---

## 8) Feature Store Design
### 8.1 Online feature store (Redis) keys
Keys are namespaced and versioned.

- `acct:{account_id}:f:v1` → hash
- `pm:{payment_method_id}:f:v1` → hash
- `dev:{device_id}:f:v1` → hash
- `acct:{account_id}:window:5m:v1` → hash

### 8.2 Example feature set (minimum viable but strong)
#### Account features
- `acct_age_days`
- `kyc_status` (enum)
- `withdrawal_count_30d`
- `withdrawal_amount_p95_180d`
- `deposit_to_withdrawal_min_minutes` (most recent)
- `trading_volume_since_last_deposit`
- `trades_count_since_last_deposit`

#### Payment method features
- `pm_age_days`
- `pm_verified` (bool)
- `pm_first_time_withdrawal` (bool)
- `pm_recent_error_count_7d`

#### Device / login features
- `device_first_seen_days`
- `new_device_last_7d` (bool)
- `vpn_proxy_last_login` (bool)
- `geo_distance_from_usual_km`
- `impossible_travel_flag`

#### Velocity features (windowed)
- `withdrawals_requested_5m`
- `withdrawals_amount_5m`
- `accounts_per_device_24h`
- `withdrawals_per_ip_asn_1h`

---

## 9) Risk Engine (Fast, Auditable)
### 9.1 Output contract
Risk engine produces deterministic artifacts that the rest of the system depends on.

```json
{
  "decision_id": "dec_001",
  "withdrawal_id": "wd_456",
  "account_id": "acct_123",
  "risk_score": 0.82,
  "risk_band": "LOW|MEDIUM|HIGH",
  "policy_decision": "APPROVE|ESCALATE|BLOCK",
  "reason_codes": ["NEW_PAYMENT_METHOD", "VPN_PROXY", "MINIMAL_TRADING"],
  "feature_snapshot": {"pm_age_days": 0.3, "vpn_proxy_last_login": true},
  "created_at": "2026-02-07T12:34:57.100Z",
  "latency_ms": 180
}
```

### 9.2 Scoring approach options
For hackathon + explainability:
- **Option A (recommended)**: Weighted rules + calibration
  - Pros: transparent, easy to demo, fast
  - Cons: less adaptive
- **Option B**: Lightweight model (e.g., Gradient Boosting) + monotonic constraints
  - Pros: better accuracy if you have labels
  - Cons: harder to justify quickly

A strong hybrid is: rules for hard blocks + model/rules for soft scoring.

### 9.3 Example policy (simple)
- If `restricted_card_error_recent == true` → `BLOCK`
- Else if `no_trade_pattern_confidence >= 0.9` → `BLOCK`
- Else if `risk_score >= 0.75` → `ESCALATE`
- Else `APPROVE`

---

## 10) Real-time Fraud Pattern Engine
### 10.1 Pattern definitions (computed from events + features)
- **No-trade fraud**: deposit → minimal trading → withdrawal for near deposit amount within short time
- **Short-trade abuse**: rapid open/close trades with low notional repeatedly + withdrawal
- **Card testing**: many small deposits, many failures, rotating cards/devices
- **Velocity abuse**: bursts of withdrawals across multiple accounts tied to same device/IP

### 10.2 Output
Produces `fraud_alert` events with confidence and supporting evidence.

```json
{
  "alert_id": "al_100",
  "alert_type": "NO_TRADE_PATTERN|CARD_TESTING|VELOCITY_ABUSE",
  "account_id": "acct_123",
  "confidence": 0.93,
  "evidence": {
    "deposit_id": "dep_001",
    "deposit_amount": 2600,
    "trade_count_since_deposit": 1,
    "trading_volume_since_deposit": 100,
    "withdrawal_amount": 2500,
    "time_minutes_deposit_to_withdrawal": 45
  },
  "recommended_action": "BLOCK_WITHDRAWAL_AND_LOCK",
  "created_at": "2026-02-07T12:34:58.000Z"
}
```

---

## 11) Graph / Ring Detection Service
### 11.1 Graph model
Nodes:
- Account, Device, PaymentMethodToken, IP/ASN, EmailHash (optional)

Edges (examples):
- Account ↔ Device (seen)
- Account ↔ PaymentMethodToken (used)
- Account ↔ IP/ASN (login)

Edge weight heuristics:
- device link: strong
- payment token link: very strong
- ip/asn link: medium (shared WiFi risk)

### 11.2 Ring expansion algorithm (near real-time)
- Seed: a high-confidence alert or blocked withdrawal
- Expand 1–2 hops on strong edges
- Compute ring score:
  - fraction of new accounts
  - shared device count
  - withdrawal velocity
  - shared payment token reuse
- Output:
  - ring id, member accounts, top shared identifiers, ring risk

### 11.3 Ring output schema
```json
{
  "ring_id": "ring_22",
  "seed_account_id": "acct_123",
  "member_accounts": ["acct_123", "acct_124", "acct_200"],
  "shared_identifiers": {
    "device_ids": ["dev_hash_999"],
    "asn": [64512],
    "payment_tokens": ["tok_xxx"]
  },
  "ring_risk": 0.91,
  "exposure_estimate": {
    "pending_withdrawals": 3,
    "pending_amount": 7200.0,
    "currency": "USD"
  },
  "created_at": "2026-02-07T12:35:10.000Z"
}
```

---

## 12) GenAI Components (Core)
### 12.1 Design principles
- LLM outputs are **schema-locked JSON** (no freeform).
- LLM never “decides” alone; it **explains** and **plans**.
- Every LLM artifact includes:
  - the underlying reason codes/features it used
  - uncertainty flags
  - a refusal path if evidence is insufficient

### 12.2 LLM: Decision Explainer
**Purpose**: Convert `risk_score + reason_codes + feature_snapshot + similar cases` into an explainable narrative.

**Inputs**:
- Risk engine decision object
- Retrieved similar cases: top K fraud + top K legit
- Policy text (what thresholds mean)

**Outputs (schema)**:
```json
{
  "decision_summary": "...",
  "top_reasons": [
    {"reason": "New payment method", "evidence": ["pm_age_days=0.3", "pm_first_time_withdrawal=true"], "impact": "high"}
  ],
  "supporting_evidence": {
    "timeline": ["Deposit at 11:40", "1 small trade at 12:01", "Withdrawal requested at 12:34"],
    "similar_cases": [{"case_id": "case_12", "outcome": "confirmed_fraud", "why_similar": "..."}]
  },
  "counterfactuals": [
    {"change": "Verify payment method", "expected_effect": "Risk down", "notes": "..."}
  ],
  "recommended_next_action": "escalate_to_human|auto_approve|block_and_lock",
  "questions_for_human": ["Is customer traveling?", "Is this a known corporate VPN?"]
}
```

### 12.3 LLM: Investigator NL Query Copilot (Plan-then-Execute)
**Purpose**: Take natural language and produce a **query plan** in a restricted DSL that can be executed.

**Key guardrails**:
- Read-only
- Allowed tables/fields only
- Maximum time window
- Must output plan + explanation before execution

**Query plan schema**:
```json
{
  "intent": "find_accounts_no_trade_withdrawal",
  "time_window": {"start": "-24h", "end": "now"},
  "filters": [
    {"field": "deposit_amount", "op": ">=", "value": 500},
    {"field": "trading_volume_since_deposit", "op": "<=", "value": 150},
    {"field": "withdrawal_requested", "op": "==", "value": true}
  ],
  "group_by": ["account_id"],
  "order_by": [{"field": "risk_score", "dir": "desc"}],
  "limit": 50,
  "explain": "..."
}
```

### 12.4 LLM: Incident Commander
**Purpose**: On ring detection, auto-generate:
- incident report (timeline, hypotheses, evidence)
- action checklist
- customer comms drafts
- internal comms for compliance/ops

**Outputs** (schema):
```json
{
  "incident_title": "Suspected no-trade ring via shared device",
  "executive_summary": "...",
  "timeline": ["..."],
  "blast_radius": {"accounts": 12, "pending_amount_usd": 18400},
  "recommended_actions": [
    {"action": "lock_accounts", "targets": ["acct_123"], "justification": "..."}
  ],
  "customer_messages": [
    {"audience": "locked_accounts", "subject": "Account security review", "body": "..."}
  ],
  "audit_notes": "..."
}
```

---

## 13) API Surface (HTTP)
This is the minimal set to demo end-to-end.

### 13.1 Ingestion
- `POST /events` (bulk) — accepts event envelope list

### 13.2 Payout decisioning
- `POST /withdrawals/{withdrawal_id}/decision`
  - returns risk engine output + explainer output

### 13.3 Cases
- `GET /cases?status=ESCALATED&limit=50`
- `GET /cases/{case_id}` (includes evidence + LLM rationale)

### 13.4 Fraud alerts + rings
- `GET /alerts?type=NO_TRADE_PATTERN&since=-24h`
- `GET /rings/{ring_id}`

### 13.5 Investigator Copilot
- `POST /copilot/query-plan` (NL → plan)
- `POST /copilot/execute-plan` (plan → results)

### 13.6 Actions + audit
- `POST /actions/lock-accounts`
- `POST /actions/block-withdrawals`
- `POST /feedback/officer-decision`

All endpoints write to `audit_log`.

---

## 14) Persistent Storage (Postgres)
Tables (minimal):
- `events` (append-only)
- `withdrawals`
- `decisions`
- `alerts`
- `rings`
- `cases`
- `actions`
- `audit_log`
- `labels` (confirmed fraud/legit)

### 14.1 Example: decisions table columns
- `decision_id` (PK)
- `withdrawal_id`
- `account_id`
- `risk_score` (float)
- `risk_band` (text)
- `policy_decision` (text)
- `reason_codes` (jsonb)
- `feature_snapshot` (jsonb)
- `llm_explanation` (jsonb)
- `created_at` (timestamp)

---

## 15) Human Oversight (Case Management)
### 15.1 Case states
- `AUTO_APPROVED`
- `ESCALATED`
- `BLOCKED`
- `UNDER_REVIEW`
- `CONFIRMED_FRAUD`
- `CONFIRMED_LEGIT`

### 15.2 Required UI panels (minimal)
- Queue view: payouts + decision + confidence
- Case view: evidence timeline + reason codes + LLM summary + counterfactuals
- Graph view: ring members + shared identifiers + exposure
- Copilot view: NL query + plan + results

---

## 16) Learning From Outcomes (Real, Practical)
This should be measurable in the demo:

1) **Calibration update**
- Track false positives/negatives per reason code
- Adjust thresholds or weights (bounded changes)

2) **Retrieval memory enrichment**
- When a case is confirmed fraud/legit, create a “case card” document and embed it
- Future explanations cite similar confirmed outcomes

3) **Prompt + template refinement**
- Keep a versioned prompt and schema; log LLM outputs + officer satisfaction

---

## 17) Latency & SLO Targets
- Payout decision total: **< 2 seconds p95**
  - feature lookup/compute: < 200ms
  - risk engine: < 50–200ms
  - LLM explanation: < 1.5s (use smaller model + short context)
- Fraud alert detection: **< 5 seconds** from triggering event
- Ring expansion: **< 10 seconds** from alert

---

## 18) Security, Compliance, and Auditability
- All actions are written to `audit_log` with actor, timestamp, and justification
- Use tokenization for payment identifiers; never store raw PAN
- Role-based access control:
  - Officer: approve/escalate
  - Investigator: lock/bulk actions
  - Admin: config changes
- Model governance hooks:
  - version every policy + prompt + model id
  - store inputs used for every decision

---

## 19) Evaluation & Demo Metrics
To prove “AI adds value”:
- Auto-approval rate (target 85–95% in clean population)
- Fraud catch rate for injected patterns
- Mean time to detect ring (seconds)
- Officer workload reduction (# escalations/day)
- Explanation quality proxy:
  - % decisions with valid schema
  - officer “helpful” rating
  - # of overrides by reason code

---

## 20) Demo Scenario (End-to-End)
1) Start stream: 200 synthetic accounts, 1–2 fraud rings injected
2) Show queue: auto-approvals flying by with clear rationales
3) Trigger no-trade pattern: system blocks + locks + alerts
4) Ring expands: graph view shows connected accounts + exposure
5) Investigator asks: “show me similar accounts in last 24h” → plan → results
6) One-click containment: bulk lock + incident pack + comm drafts
7) Officer confirms outcomes → calibration + retrieval memory updated

---

## 21) Configuration (Policy + Reason Codes)
Define reason codes as a contract between scoring, LLM, and UI.

Examples:
- `NEW_PAYMENT_METHOD`
- `FIRST_TIME_WITHDRAWAL_TO_PM`
- `VPN_PROXY`
- `IMPOSSIBLE_TRAVEL`
- `MINIMAL_TRADING`
- `RAPID_DEPOSIT_TO_WITHDRAWAL`
- `RESTRICTED_CARD_ERROR`
- `DEVICE_SHARED_ACROSS_ACCOUNTS`
- `WITHDRAWAL_VELOCITY`

Each reason code has:
- description
- evidence fields
- severity
- suggested remediation

---

## 22) Implementation Notes (Technology-Agnostic)
You can implement this with:
- Stream: Kafka/Redpanda (or a lightweight in-process bus for demo)
- Online store: Redis
- DB: Postgres
- Vector: pgvector (simple) or dedicated vector DB
- Graph: in-memory + persisted edges; or a graph DB if desired
- LLM: hosted API or local model

The design remains the same.
