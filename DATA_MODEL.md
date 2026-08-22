# Cotejo CRM — Data Model

## 1. Database: MongoDB Atlas

- **Single shared database** (`cotejo_crm`)
- **Multi-tenant isolation** enforced by `clientId` field on all tenant-scoped collections
- All timestamps in UTC (ISO 8601)
- All `_id` fields are MongoDB ObjectId unless noted

## 2. Collections

### 2.1 `users`

Stores CRM user profiles. Authentication credentials are managed exclusively by Firebase.

```json
{
  "_id": "ObjectId",
  "firebaseUid": "string (unique, indexed)",
  "email": "string (unique, indexed)",
  "name": "string",
  "role": "enum: super_admin | admin | client | salesperson",
  "clientIds": ["ObjectId"],          // clients this user can access
  "status": "enum: pending_invite | active | suspended",
  "permissions": {                     // optional granular permissions
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
- `{ clientIds: 1 }` — for multi-tenant queries
- `{ role: 1, status: 1 }` — for user listing filters

**Rules:**
- `firebaseUid` is set after the user accepts the invitation and their Firebase account is created
- `super_admin` has `clientIds: []` (empty = access to all)
- Passwords are NEVER stored here — Firebase Auth manages them

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
    "adAccountIds": ["string"],       // Meta ad account IDs linked
    "pageId": "string | null",
    "accessToken": "string | null"    // encrypted or reference
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

---

### 2.3 `leads`

Individual lead/prospect captured from ads or manual entry.

```json
{
  "_id": "ObjectId",
  "clientId": "ObjectId (required, indexed)",
  "source": "enum: meta_ads | manual | csv_import | website | referral | other",
  "campaignId": "ObjectId | null",
  "adId": "string | null",
  "formId": "string | null",
  "name": "string",
  "email": "string | null",
  "phone": "string | null",
  "whatsapp": "string | null",
  "message": "string | null",
  "customFields": {},                   // dynamic form fields from Meta
  "status": "enum: new | contacted | qualified | proposal | negotiation | won | lost | discarded",
  "assignedTo": "ObjectId | null",      // salesperson userId
  "pipelineStage": "string",
  "saleAmount": "number | null",        // revenue if won
  "saleCurrency": "string",             // default: ARS
  "lostReason": "string | null",
  "notes": "string | null",
  "tags": ["string"],
  "contactedAt": "ISODate | null",
  "qualifiedAt": "ISODate | null",
  "wonAt": "ISODate | null",
  "lostAt": "ISODate | null",
  "metaLeadId": "string | null",        // Meta's lead ID
  "metaReceivedAt": "ISODate | null",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

**Indexes:**
- `{ clientId: 1, status: 1 }` — primary tenant query
- `{ clientId: 1, assignedTo: 1 }` — salesperson filtering
- `{ clientId: 1, createdAt: -1 }` — chronological listing
- `{ clientId: 1, campaignId: 1 }` — campaign attribution
- `{ metaLeadId: 1 }` — unique, sparse (deduplication)

**Multi-tenant rule:** Every query MUST include `clientId` filter.

---

### 2.4 `campaigns`

Synced from Meta Ads. Read-only from CRM perspective.

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

Daily performance metrics per campaign, synced from Meta.

```json
{
  "_id": "ObjectId",
  "clientId": "ObjectId (required)",
  "campaignId": "ObjectId",
  "metaCampaignId": "string",
  "date": "ISODate",
  "spend": "number",
  "impressions": "number",
  "reach": "number",
  "clicks": "number",
  "ctr": "number",
  "cpc": "number",
  "cpm": "number",
  "leads": "number",
  "costPerLead": "number | null",
  "conversions": "number",
  "costPerConversion": "number | null",
  "currency": "string",
  "createdAt": "ISODate"
}
```

**Indexes:**
- `{ clientId: 1, campaignId: 1, date: 1 }` — unique compound
- `{ clientId: 1, date: -1 }` — dashboard date range queries

---

### 2.6 `audit_logs`

Immutable log of significant actions.

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "userEmail": "string",
  "action": "string",                // e.g., "lead.status_changed", "user.invited"
  "resource": "string",              // e.g., "leads", "users", "clients"
  "resourceId": "ObjectId | string",
  "clientId": "ObjectId | null",
  "changes": {
    "before": {},
    "after": {}
  },
  "metadata": {},                    // additional context
  "ip": "string | null",
  "createdAt": "ISODate"
}
```

**Indexes:**
- `{ clientId: 1, createdAt: -1 }`
- `{ userId: 1, createdAt: -1 }`
- `{ resource: 1, resourceId: 1 }`

**Rules:**
- Never update or delete audit logs
- Always write on: user creation, role change, status change, lead stage change, client modification

---

### 2.7 `sync_checkpoints`

Tracks Meta sync progress to enable incremental syncing.

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

audit_logs ← written on every significant action
sync_checkpoints ← one per client+type+adAccount
```

## 4. Data Access Patterns

| Query                            | Collection        | Filter               |
|----------------------------------|-------------------|----------------------|
| Dashboard metrics                | campaign_insights | clientId + date range|
| Lead list for salesperson        | leads             | clientId + assignedTo|
| All leads for client             | leads             | clientId             |
| Campaign list                    | campaigns         | clientId             |
| User management                  | users             | (super_admin: all)   |
| Client list                      | clients           | (super_admin: all)   |
| Audit trail                      | audit_logs        | clientId or userId   |

## 5. Migration Strategy

- No ORM; use native MongoDB driver
- Schema validation via MongoDB JSON Schema (optional, Stage 9)
- Indexes created programmatically on first deploy
- No automatic migrations — all changes documented in CHANGELOG.md
