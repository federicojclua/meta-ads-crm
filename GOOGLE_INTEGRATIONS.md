# Anima MKT CRM — Google Integrations

> ⚠️ This document is for **Stage 7**. Do not configure Google APIs until Stages 1-5 are complete and tested.

## 1. Overview

Anima MKT CRM integrates with Google services for competitive intelligence and SEO analysis:

| Service                     | Purpose                                    | Stage |
|-----------------------------|--------------------------------------------|-------|
| Google Places API           | Business discovery, reviews, details       | 7     |
| PageSpeed Insights API      | Website performance audit                  | 7     |
| Google Search Console API   | SEO data, search performance               | 7     |
| Google Analytics Data API   | Website traffic and behavior               | 7     |
| Google Ads Transparency     | Competitor ad monitoring (public data)     | 7     |

## 2. Google Cloud Project Setup

### 2.1 Create Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (e.g., "anima-mkt-crm")
3. Enable billing (some APIs require it even for free tier)

### 2.2 Enable APIs
Enable these APIs in the project:
- Places API (New)
- PageSpeed Insights API
- Search Console API
- Google Analytics Data API

### 2.3 Create API Key (for Places & PageSpeed)
1. Go to APIs & Services → Credentials
2. Create an API Key
3. Restrict it to:
   - Places API
   - PageSpeed Insights API
4. Set as `GOOGLE_PLACES_API_KEY`

### 2.4 Create OAuth 2.0 Credentials (for Search Console & Analytics)
1. Go to APIs & Services → Credentials
2. Create OAuth 2.0 Client ID
3. Application type: Web application
4. Authorized redirect URIs:
   - `http://localhost:8888/api/google/callback` (dev)
   - `https://anima-mkt-crm.netlify.app/api/google/callback` (prod)
5. Set as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

## 3. Environment Variables

```
GOOGLE_CLOUD_PROJECT_ID=<set-in-netlify>
GOOGLE_PLACES_API_KEY=<set-in-netlify>
GOOGLE_CLIENT_ID=<set-in-netlify>
GOOGLE_CLIENT_SECRET=<set-in-netlify>
ENABLE_GOOGLE_INTEGRATIONS=false
```

All are server-side only. The `ENABLE_GOOGLE_INTEGRATIONS` flag allows disabling all Google features without removing code.

## 4. Integration Details

### 4.1 Google Places API
- **Use case:** Find nearby businesses by category and location
- **Data:** Business name, address, rating, reviews, photos, website, phone
- **No OAuth needed:** API key authentication
- **Rate limits:** Pay-per-use after free tier (verify current quotas before implementation)

### 4.2 PageSpeed Insights API
- **Use case:** Audit website performance for clients and competitors
- **Data:** Performance score, LCP, FID, CLS, opportunities
- **No OAuth needed:** API key authentication
- **Rate limits:** Verify current daily quota before implementation

### 4.3 Google Search Console API
- **Use case:** SEO performance data for client websites
- **Data:** Search queries, impressions, clicks, CTR, position
- **Requires OAuth:** Client must authorize access to their property
- **Considerations:** Per-client OAuth consent flow needed

### 4.4 Google Analytics Data API
- **Use case:** Website traffic analysis
- **Data:** Sessions, users, page views, sources, conversions
- **Requires OAuth:** Client must authorize access
- **Considerations:** Per-client OAuth consent flow needed

### 4.5 Google Ads Transparency Center
- **Use case:** View competitor ads (public data)
- **Data:** Active ads by advertiser
- **No API available:** Web scraping NOT recommended
- **Alternative:** Manual reference with links, or use Meta Ad Library for Meta ads

## 5. Security Considerations

- API keys are server-side only
- OAuth tokens per client stored encrypted in MongoDB
- Client consent required for Search Console and Analytics
- No scraping of Google properties
- Respect rate limits with exponential backoff

## 6. Feature Flag

All Google integrations are gated behind `ENABLE_GOOGLE_INTEGRATIONS`:
- When `false`: Google-related UI is hidden, endpoints return 404
- When `true`: Features are available based on configuration
- Individual services can be enabled/disabled as they're implemented
