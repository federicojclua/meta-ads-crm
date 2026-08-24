# Anima MKT CRM — Meta API Authentication & Setup (v26.0)

## 1. Overview

Anima MKT CRM connects to the **Meta Marketing API v26.0** (Official Meta Graph API) to sync:
- Ad accounts, campaigns, AdSets, and data sources (Datasets/Pixels).
- Daily AdSet insights (spend in cents, impressions, reach, clicks, conversions).
- Cross-correlation with CRM leads and closed/collected revenue for real ROAS.

All Graph API calls strictly send `Authorization: Bearer <token>` in HTTP headers (never in query parameters) and compute `appsecret_proof` via HMAC-SHA256(`META_APP_SECRET`, `META_SYSTEM_USER_TOKEN`).

---

## 2. Official Endpoints & Verification (Meta Graph API v26.0)

Official Meta Documentation Reference: [Meta Marketing API Reference](https://developers.facebook.com/docs/marketing-apis)

### 2.1 Confirmed Official Edges
| Asset / Edge | Method & Official URL Pattern | Required Permission | App Review Required |
|---|---|---|---|
| **Account Identity** | `GET https://graph.facebook.com/v26.0/me?fields=id,name` | `ads_read` | No (System User) |
| **Owned Ad Accounts** | `GET https://graph.facebook.com/v26.0/{business_id}/owned_ad_accounts?fields=id,name,currency,timezone_name,account_status` | `ads_read` | No for owned assets |
| **Client Ad Accounts** | `GET https://graph.facebook.com/v26.0/{business_id}/client_ad_accounts?fields=id,name,currency,timezone_name,account_status` | `ads_read` | No for assigned assets |
| **Owned Pixels** | `GET https://graph.facebook.com/v26.0/{business_id}/owned_pixels?fields=id,name,is_unavailable,creation_time` | `ads_read` | No for owned pixels |
| **Pixel Validation** | `GET https://graph.facebook.com/v26.0/{pixel_id}?fields=id,name,is_unavailable,creation_time` | `ads_read` | No |
| **Ad Account Campaigns**| `GET https://graph.facebook.com/v26.0/{ad_account_id}/campaigns?fields=id,name,status,objective,start_time,stop_time` | `ads_read` | No |
| **Ad Account AdSets** | `GET https://graph.facebook.com/v26.0/{ad_account_id}/adsets?fields=id,name,status,campaign_id,promoted_object,daily_budget,lifetime_budget` | `ads_read` | No |
| **AdSet Insights** | `GET https://graph.facebook.com/v26.0/{ad_account_id}/insights?level=adset&time_increment=1&fields=adset_id,campaign_id,date_start,date_stop,spend,impressions,reach,clicks,inline_link_clicks,actions,action_values,cost_per_action_type,attribution_setting` | `ads_read` | No |

### 2.2 Unverified Generic Endpoints Policy
- The unconfirmed generic edge `GET https://graph.facebook.com/v26.0/{business_id}/datasets` is **NOT utilized**.
- Any call to an unverified endpoint is blocked by `isVerifiedMetaEndpoint` and returns `META_ENDPOINT_UNAVAILABLE`.
- Datasets and custom data sources are managed via manual input of `datasetId` or `pixelId` by the `super_admin` and validated individually against `GET /{pixel_id}`.

---

## 3. System User & Token Setup

1. In Meta Business Manager → **Business Settings** → **Users** → **System Users**.
2. Create an Admin System User.
3. Assign assets (Ad Accounts, Pixels/Datasets) with `ads_read` permission.
4. Generate a permanent System User access token.
5. Save the token as `META_SYSTEM_USER_TOKEN` in Netlify environment variables (never in source code or database).

---

## 4. Environment Variables

### Netlify Functions Config
Configure these variables in the Netlify site settings (marked as secret where appropriate):
* `META_APP_ID`: Meta Developer App ID.
* `META_APP_SECRET`: Meta App Secret (Secret).
* `META_SYSTEM_USER_TOKEN`: Dedicated System User access token (Secret).
* `META_BUSINESS_ID`: Business Portfolio ID.
* `META_API_VERSION`: Graph API version (`v26.0`).
* `CRON_SECRET`: Random 32-character token to secure crons (Secret).
* `META_MANUAL_SYNC_ENABLED`: Set to `true` to allow manual sync triggers by super_admins; if absent/false, manual sync is completely disabled.
* `MONGODB_URI`: MongoDB connection string (Secret).
* `URL`: Reserved server variable automatically injected by Netlify. Do not configure manually.

### GitHub Actions Variables & Secrets
Configure these in the GitHub Repository settings:
* `secrets.CRON_SECRET`: Match value in Netlify (Secret).
* `vars.APP_URL`: Public base URL of the Netlify application (e.g., `https://crm.animamkt.com`) (Non-secret Variable).
* `vars.META_SYNC_ENABLED`: Set to `true` to enable automatic cron; set to `false` to disable.

---

## 5. Security & Rate Limiting Guidelines

1. **Authorization Header:** All HTTP requests send `Authorization: Bearer <token>`.
2. **AppSecret Proof:** Every outgoing request appends `appsecret_proof = HMAC-SHA256(META_APP_SECRET, META_SYSTEM_USER_TOKEN)`.
3. **Usage Headers:** Parsed from `x-business-use-case-usage`, `x-app-usage`, and `Retry-After`.
   - Preventative limit: $\ge 75\%$ triggers proactive backoff and sleep delays.
   - Throttling: If rate limits are exceeded, the client backs off gracefully according to HTTP 429/17/32/613 instructions.
4. **Log Sanitization:** All tokens and secrets are redacted to `[REDACTED]` prior to logging.
5. **No Token Leakage:** The `/api/meta/status` API only returns boolean flags indicating whether the secrets are set. It never exposes token values, prefixes, suffixes, or enmascarados.

---

## 6. Scheduled Automation (Every 6 Hours)

- Managed by GitHub Actions workflow: `.github/workflows/meta-sync-cron.yml`.
- Runs on schedule `0 */6 * * *` and `workflow_dispatch`.
- Authenticates via header `X-Cron-Auth: ${{ secrets.CRON_SECRET }}` compared with `crypto.timingSafeEqual`.
- Concurrency protected: multiple simultaneous syncs for the same account are rejected (`409 SYNC_JOB_ALREADY_RUNNING`).
- Independent: Automatic cron execution does not require or depend on the status of `META_MANUAL_SYNC_ENABLED`.
