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

---

### 2.6 `meta_ad_accounts`

Catálogo de cuentas publicitarias vinculadas al Portfolio de Meta.

```json
{
  "_id": "ObjectId",
  "adAccountId": "string (required, unique, e.g. 'act_1234567890')",
  "name": "string",
  "currency": "string (e.g. 'ARS', 'USD')",
  "timezone": "string",
  "accountStatus": "number (1=ACTIVE, 2=DISABLED, etc.)",
  "assignedClientId": "ObjectId | null",
  "isSharedAccount": "boolean",
  "ownershipType": "enum: owned | client | manual",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

**Indexes:**
- `{ adAccountId: 1 }` — `{ unique: true, name: "uniq_meta_ad_account_id" }`
- `{ assignedClientId: 1 }`

---

### 2.7 `meta_data_sources`

Catálogo de Datasets y Píxeles de Meta vinculados a las empresas cliente.

```json
{
  "_id": "ObjectId",
  "metaDatasetId": "string (required, unique, e.g. '9876543210')",
  "name": "string",
  "type": "enum: dataset | pixel",
  "assignedClientId": "ObjectId | null",
  "ownershipType": "enum: owned | shared | manual",
  "isExclusive": "boolean",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

**Indexes:**
- `{ metaDatasetId: 1 }` — `{ unique: true, name: "uniq_meta_dataset_id" }`
- `{ assignedClientId: 1 }`

---

### 2.8 `client_meta_scopes`

Asignaciones temporales auditables de cuentas y datasets a empresas cliente.

```json
{
  "_id": "ObjectId",
  "clientId": "ObjectId (required, indexed)",
  "adAccountId": "string (required)",
  "allowedDatasetIds": ["string"],
  "manuallyAssignedCampaignIds": ["string"],
  "isExclusiveAccount": "boolean",
  "effectiveFrom": "ISODate (required)",
  "effectiveTo": "ISODate | null",
  "assignedByUserId": "ObjectId (required)",
  "assignmentReason": "string (required)",
  "status": "enum: active | archived",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

**Indexes:**
- `{ clientId: 1, adAccountId: 1, effectiveFrom: 1 }`
- `{ adAccountId: 1, status: 1 }`

---

### 2.9 `meta_insights_daily`

Métricas diarias a nivel de AdSet ingeridas con granularidad e idempotencia estricta.

```json
{
  "_id": "ObjectId",
  "clientId": "ObjectId (required, indexed)",
  "adAccountId": "string (required)",
  "campaignId": "string (required)",
  "adsetId": "string (required)",
  "datasetId": "string | null",
  "date": "string (YYYY-MM-DD)",
  "attributionSettingKey": "string (default: 'default')",
  "actionReportTime": "string (default: 'conversion')",
  "currency": "string (ARS / USD)",
  "spendMinor": "integer (minor units/cents)",
  "impressions": "integer",
  "reach": "integer (non-additive across days)",
  "clicks": "integer",
  "linkClicks": "integer",
  "landingPageViews": "integer",
  "actions": [
    { "actionType": "string", "value": "number" }
  ],
  "actionValues": [
    { "actionType": "string", "valueMinor": "integer" }
  ],
  "costPerActionType": [
    { "actionType": "string", "costMinor": "integer" }
  ],
  "primaryResultType": "string",
  "primaryResultCount": "number",
  "syncedAt": "ISODate",
  "createdAt": "ISODate"
}
```

**Indexes:**
- `{ clientId: 1, adAccountId: 1, adsetId: 1, date: 1, attributionSettingKey: 1, actionReportTime: 1 }` — `{ unique: true, name: "uniq_insight_tenant_adset_date" }`
- `{ clientId: 1, date: -1 }`
- `{ campaignId: 1, date: -1 }`
- `{ datasetId: 1, date: -1 }`

---

### 2.10 `meta_asset_conflicts`

Registro de anomalías y campañas mixtas entre tenants.

```json
{
  "_id": "ObjectId",
  "conflictCode": "enum: MIXED_TENANT_CAMPAIGN | SHARED_PIXEL_OVERLAP | UNASSIGNED_ACTIVE_SPEND",
  "entityType": "enum: campaign | dataset | ad_account",
  "entityId": "string",
  "affectedClientIds": ["ObjectId"],
  "details": "string",
  "detectedAt": "ISODate",
  "resolvedAt": "ISODate | null",
  "resolvedByUserId": "ObjectId | null"
}
```

**Indexes:**
- `{ conflictCode: 1, entityId: 1 }` — `{ name: "idx_conflict_code_entity" }`
- `{ affectedClientIds: 1 }`

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
