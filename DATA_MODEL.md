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

Stores CRM user profiles and authorization scope. Authentication is handled by Firebase Auth (Google Sign-In).

```json
{
  "_id": "ObjectId",
  "firebaseUid": "string | null (unique partial index)",
  "email": "string",
  "normalizedEmail": "string (unique index, lowercase)",
  "displayName": "string",
  "photoURL": "string | null",
  "role": "enum: super_admin | admin | client | salesperson",
  "clientId": "ObjectId | null",      // mandatory for client/salesperson; null for super_admin/admin
  "clientIds": ["ObjectId"],          // for backward compatibility array
  "status": "enum: active | suspended | invited",
  "permissions": {
    "canExport": true,
    "canDeleteLeads": false,
    "canViewFinancials": true
  },
  "invitedBy": "ObjectId | null",
  "invitedAt": "ISODate | null",
  "activatedAt": "ISODate | null",
  "lastLoginAt": "ISODate | null",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

**Indexes:**
- `{ normalizedEmail: 1 }` — `{ unique: true, name: "uniq_normalizedEmail" }`
- `{ firebaseUid: 1 }` — `{ unique: true, partialFilterExpression: { firebaseUid: { $type: "string" } }, name: "uniq_firebaseUid_when_bound" }`
- `{ role: 1, status: 1 }` — `{ name: "idx_role_status" }`
- `{ clientId: 1 }` — `{ name: "idx_user_clientId" }`

**Rules:**
- `firebaseUid` is `null` upon preauthorization and linked atomically on first Google Sign-In in `api-auth-me`.
- Strict identity mismatch protection: Existing document with different `firebaseUid` or `normalizedEmail` returns `403 IDENTITY_MISMATCH`.
- `admin` cannot create, modify, change role of, suspend, or reactivate another `admin` or `super_admin`.
- No user can modify their own role (`403 CANNOT_MODIFY_OWN_ROLE`) nor self-suspend (`400 CANNOT_SUSPEND_SELF`).
- If `role` is `client` or `salesperson`, `clientId` is strictly forced by the backend on every request.

---

### 2.2 `clients`

Represents a tenant business/company in Anima MKT CRM.

```json
{
  "_id": "ObjectId",
  "name": "string",
  "normalizedName": "string (index)",
  "slug": "string (unique url-safe identifier)",
  "legalName": "string | null",
  "country": "string (default: AR)",
  "timezone": "string (default: America/Argentina/Tucuman)",
  "defaultCurrency": "enum: ARS | USD (default: ARS)",
  "enabledCurrencies": ["enum: ARS | USD"],
  "metaBusinessId": "string | null (identifier only, no tokens)",
  "metaAdAccountIds": ["string (act_XXX identifiers only, no tokens)"],
  "status": "enum: active | inactive",
  "createdBy": "ObjectId",
  "updatedBy": "ObjectId",
  "createdAt": "ISODate",
  "updatedAt": "ISODate",
  "deactivatedAt": "ISODate | null"
}
```

**Indexes:**
- `{ slug: 1 }` — `{ unique: true, name: "uniq_client_slug" }`
- `{ normalizedName: 1 }` — `{ name: "idx_client_normalizedName" }`
- `{ status: 1 }` — `{ name: "idx_client_status" }`
- `{ metaAdAccountIds: 1 }` — `{ name: "idx_client_metaAdAccountIds" }`

**Rules:**
- Deletion is always logical via `status: "inactive"` and `deactivatedAt: ISODate`.
- When a client is deactivated, all users assigned to that client receive `403 CLIENT_INACTIVE` upon API requests and login.
- Meta Ads identifiers never contain secrets, tokens, or access credentials.
- `{ "meta.adAccountIds": 1 }`

**Security Rule:** Access tokens are stored exclusively in server-side environment variables, never inside client documents.

---

### 2.3 `leads`

Individual lead or prospect captured from CSV import, manual entry, or Meta Ads.

```json
{
  "_id": "ObjectId",
  "clientId": "ObjectId (required, indexed)",
  "name": "string (required, trimmed)",
  "email": "string | null (valid format)",
  "normalizedEmail": "string | null (lowercase, trimmed, indexed)",
  "phone": "string | null",
  "normalizedPhone": "string | null (e.g. +5491112345678, indexed)",
  "stage": "enum: new | contacted | qualified | won | lost (default: new)",
  "source": "enum: manual | csv | meta (default: manual)",
  "assignedToUserId": "ObjectId | null (salesperson in same tenant, indexed)",
  "valueEstimateMinor": "integer >= 0 (in minor units / cents, default: 0)",
  "currency": "string (default: client.defaultCurrency e.g. ARS)",
  "customFields": {},
  "notes": "string | null",
  "tags": ["string"],
  "acquiredAt": "ISODate (capture timestamp)",
  "firstContactedAt": "ISODate | null",
  "qualifiedAt": "ISODate | null",
  "wonAt": "ISODate | null",
  "lostAt": "ISODate | null",
  "lostReason": "string | null",
  "status": "enum: active | archived (default: active)",
  "ingestionKey": "string | null (idempotency key, indexed partial unique)",
  "metaLeadId": "string | null",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

**Indexes:**
- `{ clientId: 1, stage: 1 }` — `{ name: "idx_lead_client_stage" }`
- `{ clientId: 1, assignedToUserId: 1 }` — `{ name: "idx_lead_client_assigned" }`
- `{ clientId: 1, normalizedEmail: 1 }` — `{ name: "idx_lead_client_email" }`
- `{ clientId: 1, normalizedPhone: 1 }` — `{ name: "idx_lead_client_phone" }`
- `{ clientId: 1, acquiredAt: -1 }` — `{ name: "idx_lead_client_acquired" }`
- `{ clientId: 1, status: 1 }` — `{ name: "idx_lead_client_status" }`
- `{ ingestionKey: 1 }` — `{ unique: true, partialFilterExpression: { ingestionKey: { $type: "string" } }, name: "uniq_lead_ingestionKey" }`

---

### 2.4 `lead_activities`

Commercial activity log and interaction notes attached to a lead.

```json
{
  "_id": "ObjectId",
  "clientId": "ObjectId (required, indexed)",
  "leadId": "ObjectId (required, indexed)",
  "type": "enum: stage_change | assignment | note | sale_created | sale_updated | payment_collected | status_change | system",
  "title": "string",
  "description": "string | null",
  "performedByUserId": "ObjectId | null",
  "performedByName": "string | null",
  "metadata": {},
  "createdAt": "ISODate"
}
```

**Indexes:**
- `{ clientId: 1, leadId: 1, createdAt: -1 }` — `{ name: "idx_activity_lead_timeline" }`

---

### 2.5 `sales`

Commercial sales and payment collections in minor units (cents).

```json
{
  "_id": "ObjectId",
  "clientId": "ObjectId (required, indexed)",
  "leadId": "ObjectId (required, indexed)",
  "amountMinor": "integer > 0 (sale amount in cents)",
  "currency": "enum: ARS | USD",
  "collectedAmountMinor": "integer >= 0 (collected in transaction currency)",
  "collectedAmountDefaultMinor": "integer >= 0 (converted to client.defaultCurrency in cents)",
  "exchangeRateToDefault": "number (exchange rate at collection time)",
  "status": "enum: pending | partial | collected | cancelled (automatically derived)",
  "soldAt": "ISODate",
  "collectedAt": "ISODate | null",
  "cancelledAt": "ISODate | null",
  "notes": "string | null",
  "createdByUserId": "ObjectId",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

**Indexes:**
- `{ clientId: 1, leadId: 1 }` — `{ name: "idx_sale_client_lead" }`
- `{ clientId: 1, status: 1 }` — `{ name: "idx_sale_client_status" }`
- `{ clientId: 1, soldAt: -1 }` — `{ name: "idx_sale_client_soldAt" }`

---

### 2.6 `campaigns`

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
