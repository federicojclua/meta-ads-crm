# Cotejo CRM — Testing Plan

## 1. Testing Strategy

| Level              | Tool / Method             | Stage  |
|--------------------|---------------------------|--------|
| Unit tests         | Vitest                    | 1+     |
| Component tests    | Vitest + Testing Library  | 2+     |
| API tests          | Manual + scripts          | 1+     |
| Integration tests  | End-to-end manual         | 2+     |
| Security tests     | Manual checklist          | 2+, 9  |
| E2E automated      | Playwright (optional)     | 9      |

## 2. Stage 1 — Auth Acceptance Tests

### Manual Test Protocol

#### Test 1: Super Admin First Login
1. Set `SUPER_ADMIN_EMAIL` in Netlify environment
2. Create the user in Firebase Console (email + password)
3. Open the app in incognito
4. Log in with the super_admin email
5. ✅ Verify: role is `super_admin`
6. ✅ Verify: dashboard loads with empty states
7. ✅ Verify: sidebar shows all menu items

#### Test 2: Session Persistence
1. Log in as super_admin
2. Refresh the page (F5)
3. ✅ Verify: still logged in, no redirect to login
4. Close tab, open new tab, navigate to app
5. ✅ Verify: still logged in

#### Test 3: Logout
1. While logged in, click logout
2. ✅ Verify: redirected to login page
3. ✅ Verify: accessing /dashboard redirects to /login
4. ✅ Verify: no user data in browser storage

#### Test 4: Password Recovery
1. On login page, click "Forgot password"
2. Enter super_admin email
3. ✅ Verify: recovery email received
4. Click link in email
5. ✅ Verify: can set new password
6. ✅ Verify: can log in with new password

#### Test 5: Unauthorized Access
1. Try accessing /dashboard without logging in
2. ✅ Verify: redirected to /login
3. Try calling /api/auth-me without token
4. ✅ Verify: 401 response

#### Test 6: Non-registered User
1. Create a Firebase user NOT in MongoDB
2. Try to log in
3. ✅ Verify: 403 or appropriate error (user exists in Firebase but no CRM profile)

## 3. Stage 2 — Multi-tenant Acceptance Tests

#### Test 7: Create Client
1. Log in as super_admin
2. Go to Clients page
3. Create a new client "Test Company"
4. ✅ Verify: client appears in list
5. ✅ Verify: no campaigns shown (empty state)

#### Test 8: Invite User
1. As super_admin, go to Users page
2. Create user: name, email, role=client, assign to "Test Company"
3. ✅ Verify: user created with status "pending_invite"
4. ✅ Verify: invitation email sent (or manual process documented)

#### Test 9: Accept Invitation
1. Open invitation email in incognito
2. Set password
3. Log in
4. ✅ Verify: sees only "Test Company" data
5. ✅ Verify: sidebar shows only client-appropriate items
6. ✅ Verify: status changed to "active"

#### Test 10: Client Isolation
1. As super_admin, create a second client "Other Company"
2. As the client user from Test 9, try to access /dashboard?clientId=<other_company_id>
3. ✅ Verify: 403 or no data returned
4. Try calling /api/leads?clientId=<other_company_id> directly
5. ✅ Verify: 403 response

#### Test 11: Salesperson Isolation
1. Create a salesperson user assigned to "Test Company"
2. Create 5 leads, assign 2 to the salesperson
3. Log in as the salesperson
4. ✅ Verify: sees only 2 assigned leads
5. ✅ Verify: cannot see other leads even with URL manipulation

#### Test 12: Suspend User
1. As super_admin, suspend the client user
2. Refresh the client user's session (or wait for token refresh)
3. ✅ Verify: client user gets 403 on next API call
4. ✅ Verify: client user is redirected to login or error page

#### Test 13: View As Mode
1. As super_admin, enter "View As" mode for "Test Company"
2. ✅ Verify: banner indicates impersonation mode
3. ✅ Verify: sees only "Test Company" data
4. ✅ Verify: exit button works
5. ✅ Verify: actions still logged under super_admin

#### Test 14: Resend Invitation
1. Create a new user with pending_invite status
2. Click "Resend invitation"
3. ✅ Verify: new invitation email sent
4. ✅ Verify: old invitation still works (or new one replaces it)

## 4. Security Tests

#### Test 15: No Secrets in Bundle
1. Run `npm run build`
2. Search the `dist/` folder for:
   - `MONGODB_URI`
   - `FIREBASE_PRIVATE_KEY`
   - `META_APP_SECRET`
   - `SUPER_ADMIN_EMAIL`
   - `CRON_SECRET`
3. ✅ Verify: none found

#### Test 16: No Secrets in Browser
1. Open the app in Chrome
2. Check:
   - Console output
   - Network tab (request/response bodies)
   - Application → Local Storage / Session Storage
   - Source maps (should be disabled in prod)
3. ✅ Verify: no secrets visible

#### Test 17: Direct API Manipulation
1. Using curl or Postman:
   - Call API without auth header → ✅ 401
   - Call API with expired token → ✅ 401
   - Call API with valid token but wrong clientId → ✅ 403
   - Call API with valid token but suspended user → ✅ 403

## 5. Automated Test Ideas (Stage 9)

```javascript
// Example Vitest unit test for permissions
describe('permissions', () => {
  it('super_admin can access any clientId', () => { ... });
  it('client can only access their clientIds', () => { ... });
  it('salesperson can only see assigned leads', () => { ... });
  it('suspended user is rejected', () => { ... });
});
```

## 6. Test Data Cleanup

- Test users should use a dedicated email domain or naming convention
- After testing, clean up:
  - Firebase test users
  - MongoDB test documents
  - Note: audit logs should be preserved
