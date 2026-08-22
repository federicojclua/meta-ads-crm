# Anima MKT CRM — Meta API Authentication & Setup

> ⚠️ This document is for **Stage 4**. Do not configure Meta until Stages 1-2 are complete and tested.

## 1. Overview

Anima MKT CRM connects to the **Meta Marketing API** to sync:
- Ad campaigns and their status
- Daily insights (spend, impressions, clicks, actions, costs)

Lead Ads webhook ingestion is a separate integration gated behind `ENABLE_META_LEAD_ADS=false` and documented in section 10.

## 2. Prerequisites

- A Meta Business Account
- A Meta App (type: Business)
- A System User with appropriate permissions
- Ad accounts added to the Business Manager

## 3. Meta App Setup

### 3.1 Create Meta App
1. Go to [Meta for Developers](https://developers.facebook.com)
2. Create a new app → Business type
3. Note the **App ID** and **App Secret**

### 3.2 Add Products
- **Marketing API** — for campaign and insights data

### 3.3 Request Permissions

**MVP (read-only campaign sync):**
- `ads_read` — read campaigns, insights, and ad account metadata

**Not required for MVP:**
- `ads_management` — only needed if the CRM will create, edit, or pause campaigns in the future
- `business_management` — only needed if programmatic asset assignment is required; not justified for the current scope

**Lead Ads integration (gated by `ENABLE_META_LEAD_ADS`):**
- `leads_retrieval` — read Lead Ads submissions
- `pages_read_engagement` — required alongside leads_retrieval for page-level access

### 3.4 App Review
- For development: use your own ad accounts (no review needed)
- For production with client accounts: submit for App Review
- `ads_read` typically does not require full App Review for your own Business assets

## 4. System User Setup

### 4.1 Create System User
1. Go to Business Manager → Business Settings
2. Navigate to Users → System Users
3. Create a System User (Admin level)
4. Assign the ad accounts this user can access

### 4.2 Generate Token
1. Click on the System User → Generate Token
2. Select the Meta App
3. Select permissions: `ads_read` (add `leads_retrieval` later if needed)
4. Copy the token
5. Store as `META_SYSTEM_USER_TOKEN` in Netlify environment variables (server-side only)

> ⚠️ **Token validity:** System User tokens do not have a built-in expiration date, but they **can become invalid** due to:
> - Manual revocation in Business Manager
> - Changes in asset assignments (ad accounts removed from the System User)
> - Permission changes on the Meta App
> - Security events (e.g., Business Manager flagged or restricted)
> - Meta platform policy changes
>
> **Requirement:** Implement a health check endpoint (`/api/meta/health`) that validates the token periodically. Set up alerts when the token becomes invalid so it can be rotated promptly.

### 4.3 Token Storage

- The System User token must be stored **exclusively** in Netlify environment variables (server-side)
- **Never** store the token inside a client document in MongoDB
- In `clients.meta`, store only: ad account IDs, connection status, last verification date, and a connection reference — not the token itself

## 5. Environment Variables

```
META_APP_ID=<set-in-netlify>
META_APP_SECRET=<set-in-netlify>
META_SYSTEM_USER_TOKEN=<set-in-netlify>
META_API_VERSION=v26.0
META_VERIFY_TOKEN=<set-in-netlify>
ENABLE_META_LEAD_ADS=false
```

All are server-side only. None use `VITE_` prefix. `META_API_VERSION` is configurable to allow future upgrades without code changes.

## 6. Ad Account Linking

When a client is created in Anima MKT CRM:
1. The super_admin enters the Meta Ad Account ID(s) for that client
2. The system verifies access using the System User token via a server-side function
3. In `clients.meta`, store:
   - `adAccountIds` — the linked account IDs
   - `connectionStatus` — e.g., "verified", "pending", "error"
   - `lastVerifiedAt` — timestamp of last successful verification
   - `connectionRef` — an internal reference identifier (not a token)
4. Sync functions use these IDs to pull data

## 7. API Endpoints (Stage 4)

| Endpoint                  | Purpose                                  |
|---------------------------|------------------------------------------|
| `/api/meta/sync-campaigns`| Pull campaigns for a client              |
| `/api/meta/sync-insights` | Pull daily insights for a client         |
| `/api/meta/health`        | Validate token and check API access      |

The webhook endpoint (`/api/meta/webhook`) is part of the Lead Ads integration and will be added when `ENABLE_META_LEAD_ADS` is activated.

## 8. Rate Limits

- Meta Marketing API has usage-based rate limits (verify current thresholds before implementing)
- Implement exponential backoff on 429 and 500-level responses
- Use checkpoints for incremental sync
- Avoid pulling all data every time
- Log rate limit headers for monitoring

## 9. Security Considerations

- System User token is a **critical secret**
- Never expose in frontend, logs, error messages, or MongoDB documents
- Rotate token immediately if suspected compromise
- Monitor API calls in Meta Business Manager
- Use the minimum required permissions (`ads_read` for MVP)
- Health check must alert on token invalidation

## 10. Lead Ads Webhook Setup (future, gated by ENABLE_META_LEAD_ADS)

> This integration is **disabled by default** and requires additional permissions (`leads_retrieval`, `pages_read_engagement`). Do not enable until the base Meta sync (Stage 4) is tested and working.

When enabled:
1. Configure webhook URL: `https://your-site.netlify.app/api/meta/webhook`
2. Set `META_VERIFY_TOKEN` as the verify token
3. Subscribe to `leadgen` events for the client's page
4. The webhook endpoint must:
   - Verify the hub challenge on GET
   - Validate the payload signature on POST
   - Fetch full lead data using the lead ID
   - Match to the correct client by ad account
   - Create the lead in MongoDB
