# Cotejo CRM — Environment Setup

## Prerequisites

| Tool          | Version  | Purpose                              |
|---------------|----------|--------------------------------------|
| Node.js       | 20 LTS   | Runtime for Vite and Netlify Fns     |
| npm           | 10+      | Package manager                      |
| Git           | 2.40+    | Version control                      |
| Netlify CLI   | latest   | Local development with functions     |

## 1. Local Development Setup

```bash
# 1. Clone or navigate to the project
cd cotejo-crm

# 2. Install dependencies (after Stage 1)
npm install

# 3. Create local environment file
cp .env.example .env.local

# 4. Fill in real values in .env.local
#    - Firebase client keys (VITE_FIREBASE_*)
#    - Firebase Admin credentials
#    - MongoDB connection string
#    - SUPER_ADMIN_EMAIL

# 5. Start development server
npm run dev
# or with Netlify Functions:
npx netlify dev
```

## 2. Firebase Setup

### 2.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (e.g., "cotejo-crm")
3. Disable Google Analytics (optional)

### 2.2 Enable Authentication
1. Go to Authentication → Sign-in method
2. Enable **Email/Password** provider
3. **DISABLE** "Allow users to sign up" (Email link / passwordless)
   - Users must be created by admin only
4. Configure authorized domains:
   - `localhost` (dev)
   - Your Netlify site URL

### 2.3 Get Client Configuration
1. Go to Project Settings → General → Your apps
2. Click "Add app" → Web
3. Copy the configuration values:
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

### 2.4 Generate Service Account Key
1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract these values for environment variables:
   ```
   FIREBASE_PROJECT_ID=...
   FIREBASE_CLIENT_EMAIL=...
   FIREBASE_PRIVATE_KEY=...  (the RSA key, with \n preserved)
   ```
5. **NEVER** commit the JSON file — it's git-ignored

### 2.5 Disable Public Registration
In the Firebase Console:
1. Go to Authentication → Settings
2. Under "User account linking", ensure settings are restrictive
3. Note: The Admin SDK will be used to create users server-side

## 3. MongoDB Atlas Setup

### 3.1 Create Cluster
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free M0 cluster
3. Choose a region close to your Netlify Functions region

### 3.2 Create Database User
1. Go to Database Access
2. Create a user with readWrite role on the `cotejo_crm` database
3. Use a strong password

### 3.3 Configure Network Access
1. Go to Network Access
2. Add these IPs:
   - `0.0.0.0/0` (allow from anywhere — required for Netlify Functions)
   - Note: This is safe because authentication is required

### 3.4 Get Connection String
1. Go to Database → Connect → Drivers
2. Copy the connection string
3. Replace `<password>` with the actual password
4. Add database name: `cotejo_crm`
5. Set as `MONGODB_URI` in environment

## 4. Netlify Setup

### 4.1 Create New Site
1. Go to [Netlify](https://app.netlify.com)
2. Create a new site from Git (when repo is pushed)
3. **DO NOT** use the existing crmmet.netlify.app site
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`

### 4.2 Set Environment Variables
In Netlify Dashboard → Site settings → Environment variables:

```
SUPER_ADMIN_EMAIL=federicojclua@gmail.com
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=cotejo_crm
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```

> ⚠️ These variables must NOT have the `VITE_` prefix.
> They are only available to Netlify Functions (server-side).

### 4.3 Verify Identity Service
- Netlify Identity is NOT used in this project
- Firebase Authentication replaces it entirely
- Do NOT enable Netlify Identity on the new site

## 5. Development Workflow

```bash
# Start local dev (Vite + Netlify Functions)
npx netlify dev

# Build for production
npm run build

# Deploy preview
npx netlify deploy

# Deploy production
npx netlify deploy --prod
```

## 6. Environment Variable Summary

| Variable                    | Where to Set         | Notes                        |
|-----------------------------|---------------------|------------------------------|
| `VITE_FIREBASE_API_KEY`     | .env.local + Netlify | Public, safe                 |
| `VITE_FIREBASE_AUTH_DOMAIN` | .env.local + Netlify | Public, safe                 |
| `VITE_FIREBASE_PROJECT_ID`  | .env.local + Netlify | Public, safe                 |
| `VITE_FIREBASE_APP_ID`      | .env.local + Netlify | Public, safe                 |
| `SUPER_ADMIN_EMAIL`         | Netlify only         | Server-side only             |
| `MONGODB_URI`               | .env.local + Netlify | Server-side only, SECRET     |
| `MONGODB_DB_NAME`           | .env.local + Netlify | Server-side only             |
| `FIREBASE_PROJECT_ID`       | .env.local + Netlify | Server-side only             |
| `FIREBASE_CLIENT_EMAIL`     | .env.local + Netlify | Server-side only             |
| `FIREBASE_PRIVATE_KEY`      | .env.local + Netlify | Server-side only, SECRET     |
