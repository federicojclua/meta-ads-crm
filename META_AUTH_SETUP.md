# Cotejo CRM — Meta API Authentication & Setup

> ⚠️ This document is for **Stage 4**. Do not configure Meta until Stages 1-2 are complete and tested.

## 1. Overview

Cotejo CRM connects to the **Meta Marketing API** to sync:
- Ad campaigns and their status
- Daily insights (spend, impressions, clicks, leads, costs)
- Lead Ads form submissions (via webhooks)

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
- **Webhooks** — for Lead Ads real-time notifications (optional)

### 3.3 Request Permissions
The app needs these permissions:
- `ads_management` — read campaign data
- `ads_read` — read insights
- `leads_retrieval` — read Lead Ads submissions
- `pages_read_engagement` — read page data (for Lead Ads)
- `business_management` — manage business assets

### 3.4 App Review
- For development: use your own ad accounts (no review needed)
- For production with client accounts: submit for App Review

## 4. System User Setup

### 4.1 Create System User
1. Go to Business Manager → Business Settings
2. Navigate to Users → System Users
3. Create a System User (Admin level)
4. Assign the ad accounts this user can access

### 4.2 Generate Token
1. Click on the System User → Generate Token
2. Select the Meta App
3. Select permissions: `ads_management`, `ads_read`, `leads_retrieval`
4. Copy the token
5. Store as `META_SYSTEM_USER_TOKEN` in Netlify env vars

> ⚠️ System User tokens do NOT expire but can be revoked. Store securely.

## 5. Environment Variables

```
META_APP_ID=000000000000000
META_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
META_SYSTEM_USER_TOKEN=EAAG...
META_API_VERSION=v21.0
META_VERIFY_TOKEN=a-random-string-for-webhook-verification
ENABLE_META_LEAD_ADS=false
```

All are server-side only. None use `VITE_` prefix.

## 6. Ad Account Linking

When a client is created in Cotejo CRM:
1. The super_admin enters the Meta Ad Account ID(s) for that client
2. The system verifies access using the System User token
3. The ad account IDs are stored in the client's `meta.adAccountIds` field
4. Sync functions use these IDs to pull data

## 7. API Endpoints (Stage 4)

| Endpoint                  | Purpose                                  |
|---------------------------|------------------------------------------|
| `/api/meta/sync-campaigns`| Pull campaigns for a client              |
| `/api/meta/sync-insights` | Pull daily insights for a client         |
| `/api/meta/webhook`       | Receive Lead Ads submissions (POST)      |
| `/api/meta/health`        | Check API access and token validity      |

## 8. Rate Limits

- Meta Marketing API has usage-based rate limits
- Implement exponential backoff on 429 responses
- Use checkpoints for incremental sync
- Avoid pulling all data every time

## 9. Security Considerations

- System User token is a **critical secret**
- Never expose in frontend, logs, or error messages
- Rotate token if suspected compromise
- Monitor API calls in Meta Business Manager
- Use the minimum required permissions

## 10. Lead Ads Webhook Setup (optional)

1. Configure webhook URL: `https://your-site.netlify.app/api/meta/webhook`
2. Set `META_VERIFY_TOKEN` as the verify token
3. Subscribe to `leadgen` events for the client's page
4. The webhook endpoint must:
   - Verify the hub challenge on GET
   - Validate the payload signature on POST
   - Fetch full lead data using the lead ID
   - Match to the correct client by ad account
   - Create the lead in MongoDB
