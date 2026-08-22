# Anima MKT CRM — Data Model

## 1. Database: MongoDB Atlas

- **Single shared database** (`anima_mkt_crm`)
- **Multi-tenant isolation** enforced by `clientId` field on all tenant-scoped collections
- All timestamps in UTC (ISO 8601)
- All `_id` fields are MongoDB ObjectId unless noted
- Non-additive metrics (`reach`) and calculated ratios (CTR, CPC, CPM, CPL, CPA, ROAS) are calculated dynamically at query time

---

## 2. Collections

### 2.1 `users`

Stores CRM user profiles. Authentication credentials are managed exclusively by Firebase Auth.

```json
{
  "_id": "ObjectId",
  "firebaseUid": "string (unique, indexed)",
  "email": "string (unique, indexed)",
  "name": "string",
  "role": "enum: super_admin | admin | client | salesperson",
  "clientIds": ["ObjectId"],          // clients this user can access (empty for super_admin = all)
  "status": "enum: pending_invite | active | suspended",
  "permissions": {
    "canExport": true,
    "canDeleteLeads": false,
    "canViewFinancials": true
  },
  "invitedBy": "ObjectId | null",     // user who created the invitation
  "lastLoginAt": "ISODate | null",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

**Indexes:**
- `{ firebaseUid: 1 }` — unique
- `{ email: 1 }` — unique
- `{ clientIds: 1 }` — for multi-tenant access queries
- `{ role: 1, status: 1 }` — for user listing and filtering

**Rules:**
- `firebaseUid` is linked during first login or invitation confirmation.
- `super_admin` role is bootstrapped only if the verified email strictly matches server-side `SUPER_ADMIN_EMAIL` and `email_verified: true`.
- Passwords and tokens are NEVER stored in MongoDB.

---

### 2.2 `clients`

Represents a business/company that is a client of the agency.

```json
{
  "_id": "ObjectId",
  "name": "string",
  "slug": "string (unique, url-safe)",
  "industry": "string | null",
  "website": "string | null",
  "phone": "string | null",
  "contactEmail": "string | null",
  "contactName": "string | null",
  "address": {
    "street": "string | null",
    "city": "string | null",
    "state": "string | null",
    "country": "string | null",
    "postalCode": "string | null"
  },
  "meta": {
    "adAccountIds": ["string"],       // Linked Meta Ad Account IDs
    "pageId": "string | null",
    "connectionStatus": "enum: verified | pending | error | not_connected",
    "lastVerifiedAt": "ISODate | null",
    "connectionRef": "string | null"  // Internal reference (NEVER access tokens)
  },
  "google": {
    "placeId": "string | null",
    "searchConsoleProperty": "string | null",
    "analyticsPropertyId": "string | null"
  },
  "status": "enum: active | suspended | archived",
  "notes": "string | null",
  "createdBy": "ObjectId",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

**Indexes:**
- `{ slug: 1 }` — unique
- `{ status: 1 }`
- `{ "meta.adAccountIds": 1 }`

**Security Rule:** Access tokens are stored exclusively in server-side environment variables, never inside client documents.

---

### 2.3 `leads`

Individual lead or prospect captured from ads, webhooks, CSV import, or manual entry.

```json
{
  "_id": "ObjectId",
  "clientId": "ObjectId (required, indexed)",
  "source": "enum: meta_ads | manual | csv_import | website | referral | other",
  "campaignId": "ObjectId | null",
  "adId": "string | null",
  "formId": "string | null",
  "externalSourceId": "string | null",  // e.g. 'meta', 'typeform', 'csv'
  "externalLeadId": "string | null",    // ID in the external source
  "name": "string",
  "email": "string | null",
  "phone": "string | null",
  "whatsapp": "string | null",
  "message": "string | null",
  "customFields": {},                   // Dynamic form fields
  "status": "enum: new | contacted | qualified | proposal | negotiation | won | lost | discarded",
  "assignedTo": "ObjectId | null",      // Salesperson userId
  "pipelineStage": "string",

  // Commercial Agreement (Sale closed / commitment)
  "saleAmount": "number | null",        // Total agreed sale value
  "saleCurrency": "string",             // e.g. "ARS", "USD"

  // Realized / Collected Revenue (Actual cash collected)
  "collectedAmount": "number | null",   // Amount actually collected/paid
  "collectedCurrency": "string | null",
  "collectedAt": "ISODate | null",      // Date of cash collection

  "lostReason": "string | null",
  "notes": "string | null",
  "tags": ["string"],
  "contactedAt": "ISODate | null",
  "qualifiedAt": "ISODate | null",
  "wonAt": "ISODate | null",
  "lostAt": "ISODate | null",
  "metaLeadId": "string | null",        // Meta leadgen ID (if applicable)
  "metaReceivedAt": "ISODate | null",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

**Indexes:**
- `{ clientId: 1, status: 1 }` — primary tenant filtering
- `{ clientId: 1, assignedTo: 1 }` — salesperson view
- `{ clientId: 1, createdAt: -1 }` — chronological ordering
- `{ clientId: 1, campaignId: 1 }` — campaign attribution
- **Partial Unique Index on `metaLeadId`:**
  `{ metaLeadId: 1 }` with options `{ unique: true, partialFilterExpression: { metaLeadId: { $type: "string" } } }`
- **Compound Deduplication Index:**
  `{ clientId: 1, externalSourceId: 1, externalLeadId: 1 }` with options `{ unique: true, partialFilterExpression: { externalLeadId: { $type: "string" } } }`

---

### 2.4 `campaigns`

Synced from Meta Marketing API.

```json
{
  "_id": "ObjectId",
  "clientId": "ObjectId (required, indexed)",
  "metaCampaignId": "string (indexed)",
  "metaAdAccountId": "string",
  "name": "string",
  "status": "enum: ACTIVE | PAUSED | DELETED | ARCHIVED",
  "objective": "string",
  "dailyBudget": "number | null",
  "lifetimeBudget": "number | null",
  "currency": "string",
  "primaryResultActionType": "string",  // e.g., 'onsite_conversion.lead_grouped', 'lead', 'purchase', 'link_click'
  "startDate": "ISODate | null",
  "endDate": "ISODate | null",
  "insights": {
    "lastSyncedAt": "ISODate | null",
    "dateRange": {
      "start": "ISODate",
      "end": "ISODate"
    }
  },
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

**Indexes:**
- `{ clientId: 1, metaCampaignId: 1 }` — unique compound
- `{ clientId: 1, status: 1 }`

---

### 2.5 `campaign_insights`

Daily raw performance metrics ingested from Meta API.

```json
{
  "_id": "ObjectId",
  "clientId": "ObjectId (required, indexed)",
  "campaignId": "ObjectId (required, indexed)",
  "metaCampaignId": "string",
  "date": "ISODate",                    // Day of the insight (UTC midnight)

  // Additive Metrics (Safe to sum across date ranges and campaigns)
  "spend": "number",
  "impressions": "number",
  "clicks": "number",
  "linkClicks": "number",
  "landingPageViews": "number",

  // Normalized Action Arrays (Additive counts/amounts per action_type)
  "actions": [
    {
      "action_type": "string",          // e.g., 'lead', 'link_click', 'offsite_conversion.fb_pixel_purchase'
      "value": "number"
    }
  ],
  "action_values": [
    {
      "action_type": "string",
      "value": "number"
    }
  ],

  // Non-Additive Metrics & Meta-Reported Snapshots (DO NOT SUM ACROSS DATES)
  "reach": "number",                    // Unique users reached on this day only (NON-ADDITIVE)
  "metaReported": {
    "costPerActionType": [              // Derived value from Meta for this single day (SNAPSHOT ONLY)
      {
        "action_type": "string",
        "value": "number"
      }
    ]
  },

  "currency": "string",
  "createdAt": "ISODate"
}
```

**Indexes:**
- `{ clientId: 1, campaignId: 1, date: 1 }` — unique compound
- `{ clientId: 1, date: -1 }` — dashboard date range queries

**Important Aggregation & Reporting Rules:**
- **Additive Metrics:** `spend`, `impressions`, `clicks`, `linkClicks`, `landingPageViews`, `actions` y `action_values` pueden sumarse directamente a lo largo de días o entre campañas del mismo cliente.
- **`cost_per_action_type` NO es aditivo:** Es un valor derivado informado por Meta para el período específico. Nunca debe sumarse entre días. Se almacena bajo `metaReported.costPerActionType` únicamente como snapshot de auditoría/trazabilidad diaria.
- **Cálculo de CPA en rangos acumulados:** Para cualquier rango de fechas (semanal, mensual o personalizado), el CPA o CPL se calcula dinámicamente como:
  $$\text{CPA} = \frac{\sum \text{spend}}{\sum \text{actions}(\text{action\_type})}$$
- **Métricas NO Aditivas:**
  - `reach`: No se puede sumar entre días (generaría doble conteo de usuarios). Para períodos acumulados se debe tomar el snapshot del período informado por Meta o reportar el alcance diario promedio/máximo.
  - Ratios y métricas derivadas: CTR, CPC, CPM, CPL, CPA y ROAS **NUNCA** se suman ni se promedian directamente. Se calculan en tiempo de consulta:
    - $\text{CTR} = \frac{\sum \text{clicks}}{\sum \text{impressions}} \times 100$
    - $\text{CPC} = \frac{\sum \text{spend}}{\sum \text{clicks}}$
    - $\text{CPM} = \frac{\sum \text{spend}}{\sum \text{impressions}} \times 1000$
    - $\text{CPL} = \frac{\sum \text{spend}}{\sum \text{leads}}$
    - $\text{ROAS} = \frac{\sum \text{collectedAmount}}{\sum \text{spend}}$

---

### 2.6 `exchange_rates`

Multi-currency exchange rate tables to normalize revenue and ad spend across different currencies (e.g., USD, ARS).

```json
{
  "_id": "ObjectId",
  "baseCurrency": "string",             // e.g., "USD"
  "quoteCurrency": "string",            // e.g., "ARS"
  "quotePerBase": "number",             // e.g., 1250.50 (meaning 1 USD = 1250.50 ARS)
  "rateType": "enum: official | commercial | custom",
  "validFrom": "ISODate",
  "validTo": "ISODate | null",          // null = currently active rate
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

**Indexes:**
- `{ baseCurrency: 1, quoteCurrency: 1, validFrom: -1 }`

---

### 2.7 `audit_logs`

Immutable security and operational log.

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "userEmail": "string",
  "action": "string",                   // e.g., "lead.status_changed", "user.role_assigned"
  "resource": "string",                 // e.g., "leads", "users", "clients"
  "resourceId": "ObjectId | string",
  "clientId": "ObjectId | null",
  "changes": {
    "before": {},
    "after": {}
  },
  "metadata": {},
  "ip": "string | null",
  "createdAt": "ISODate"
}
```

**Indexes:**
- `{ clientId: 1, createdAt: -1 }`
- `{ userId: 1, createdAt: -1 }`
- `{ resource: 1, resourceId: 1 }`

**Sanitization Rules:**
- Audit logs MUST NOT contain passwords, API tokens, sensitive authentication payloads, or full plain-text PII copies.

---

### 2.8 `sync_checkpoints`

Tracks Meta sync progress to enable idempotent, incremental syncing.

```json
{
  "_id": "ObjectId",
  "clientId": "ObjectId",
  "type": "enum: campaigns | insights | leads",
  "metaAdAccountId": "string",
  "lastSyncedAt": "ISODate",
  "lastSyncStatus": "enum: success | partial | failed",
  "lastError": "string | null",
  "cursor": "string | null",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

**Indexes:**
- `{ clientId: 1, type: 1, metaAdAccountId: 1 }` — unique compound

---

## 3. Relationship Diagram

```
users ──────────── M:N ──────────── clients
  │                                    │
  │ assignedTo                         │ clientId
  │                                    │
  ▼                                    ▼
leads ────────── belongs to ───────── campaigns
  │                                    │
  │ campaignId                         │ metaCampaignId
  │                                    │
  └──────────────────────────────── campaign_insights

exchange_rates ── applied to ─────── revenue & spend analytics
audit_logs     ── tracks operations
sync_checkpoints ── tracks sync state
```
