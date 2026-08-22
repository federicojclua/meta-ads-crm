# Cotejo CRM — Security Policy

## 1. Authentication

### Provider: Firebase Authentication
- Email + password only (no social login initially)
- Public self-registration is **DISABLED**
- Users are created exclusively by super_admin or authorized admin
- Email verification required before activation
- Password recovery via Firebase's built-in flow

### Token Management
- Firebase ID tokens are short-lived (1 hour)
- Frontend uses `onIdTokenChanged` to auto-refresh
- Every API call includes `Authorization: Bearer <idToken>`
- Backend verifies token with Firebase Admin SDK on every request
- No session cookies — stateless token-based auth

## 2. Authorization

### Role Enforcement
- Roles are stored exclusively in MongoDB, never in Firebase custom claims initially
- Roles are checked server-side on **every** API request
- Frontend role checks are for UX only (hiding menus) — never for security
- The `api-auth-me` endpoint is the single source of truth for the frontend

### Multi-Tenant Isolation

**Critical Rule:** Every database query for tenant-scoped data MUST include `clientId` from the verified user profile.

```
❌ WRONG: db.leads.find({ _id: req.params.id })
✅ RIGHT: db.leads.find({ _id: req.params.id, clientId: { $in: user.clientIds } })
```

**Enforcement checklist:**
- [ ] `clientId` is never accepted from request body/params without validation
- [ ] `super_admin` can select clientId, but it's validated server-side
- [ ] `admin` can only query their assigned `clientIds`
- [ ] `client` can only query their own `clientIds`
- [ ] `salesperson` can only query their own client + their assigned leads

## 3. Secrets Management

### Environment Variable Classification

| Variable              | Location     | Visible in Browser | Notes                    |
|-----------------------|-------------|-------------------|--------------------------|
| `SUPER_ADMIN_EMAIL`   | Netlify env | ❌ No             | Bootstrap only           |
| `MONGODB_URI`         | Netlify env | ❌ No             | Database connection      |
| `FIREBASE_PRIVATE_KEY`| Netlify env | ❌ No             | Token verification       |
| `META_APP_SECRET`     | Netlify env | ❌ No             | Meta API access          |
| `GEMINI_API_KEY`      | Netlify env | ❌ No             | AI provider key          |
| `CRON_SECRET`         | Netlify env | ❌ No             | Cron auth                |
| `VITE_FIREBASE_*`     | .env / build| ✅ Yes            | Firebase client config   |

### Rules
1. **NO** secret may use the `VITE_` prefix
2. **NO** secret may appear in `console.log`, error messages returned to client, or source maps
3. **NO** secret may be committed to Git (enforced by `.gitignore`)
4. `.env`, `.env.local`, `.env.production` are all git-ignored
5. Only `.env.example` with placeholder values is committed
6. Firebase service account JSON files are git-ignored

## 4. API Security

### Request Validation
- All inputs are validated and sanitized before use
- MongoDB injection prevention: no direct use of `$where`, no `eval`
- ObjectId format validation before database queries
- Request body size limits on Netlify Functions (default: 1MB)

### Error Handling
- Never expose stack traces to clients in production
- Use generic error messages: "Unauthorized", "Forbidden", "Not found"
- Log detailed errors server-side only
- Standard error response format:
  ```json
  { "error": "human_readable_code", "message": "User-friendly message" }
  ```

### Rate Limiting
- Netlify provides basic DDoS protection at the CDN layer
- Consider adding per-user rate limiting in Stage 9 if needed
- Cron endpoints require `CRON_SECRET` header validation

## 5. CORS & Headers

- Netlify handles CORS for same-origin requests automatically
- API functions should set appropriate headers:
  - `Content-Type: application/json`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
- No wildcard CORS (`Access-Control-Allow-Origin: *`) on authenticated endpoints

## 6. Data Protection

### In Transit
- All traffic over HTTPS (Netlify enforces this)
- MongoDB Atlas connections use TLS

### At Rest
- MongoDB Atlas provides encryption at rest by default
- Sensitive fields (Meta tokens) should be stored encrypted if possible

### PII Handling
- Lead contact data (email, phone, WhatsApp) is PII
- Access restricted by clientId isolation
- Export functionality restricted by role permissions
- Audit logs track who accessed what

## 7. "View As" Mode (Impersonation)

- Available only to `super_admin`
- Does NOT change the actual user identity or session
- Applies a client context filter for dashboard viewing
- All actions are still logged under the super_admin's identity
- Visible indicator banner when active
- Exit button always accessible
- Audited: entry and exit logged in audit_logs

## 8. Security Audit Checklist (Stage 9)

- [ ] No secrets in frontend bundle (search build output)
- [ ] No secrets in browser console or network tab
- [ ] Token verification on every API endpoint
- [ ] clientId isolation on every tenant query
- [ ] Role check on every protected endpoint
- [ ] Suspended users cannot access any endpoint
- [ ] Cross-client access returns 403
- [ ] Audit log covers all sensitive operations
- [ ] Password reset flow works correctly
- [ ] Rate limiting on login attempts (Firebase handles this)
- [ ] Source maps disabled in production
- [ ] No debug logging in production build
