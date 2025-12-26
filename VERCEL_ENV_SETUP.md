# Vercel Environment Variables Setup

Your APIs are not working because environment variables are missing in Vercel. Follow these steps to add them:

## Step 1: Go to Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click on your project: **nftmarket-final-deployed**
3. Go to **Settings** → **Environment Variables**

## Step 2: Add All Required Environment Variables

Add each of these variables one by one:

### 1. MongoDB Configuration
```
MONGODB_URI
```
- **Value**: Your MongoDB connection string (from your `.env.local`)
- **Example**: `mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority`

```
MONGODB_DB_NAME
```
- **Value**: Your database name (usually `nft-marketplace` or similar)

### 2. NextAuth Configuration
```
NEXTAUTH_SECRET
```
- **Value**: A random secret string (generate one at: https://generate-secret.vercel.app/32)
- **Important**: Use a different secret than your local one for production

```
NEXTAUTH_URL
```
- **Value**: Your Vercel deployment URL
- **Format**: `https://your-project-name.vercel.app`
- **Note**: Vercel will auto-fill this, but you can set it manually

### 3. Google OAuth
```
GOOGLE_CLIENT_ID
```
- **Value**: Your Google OAuth Client ID

```
GOOGLE_CLIENT_SECRET
```
- **Value**: Your Google OAuth Client Secret

**Important**: Update your Google OAuth redirect URI to include:
- `https://your-project-name.vercel.app/api/auth/callback/google`

### 4. OpenSea API
```
NEXT_PUBLIC_OPENSEA_API_KEY
```
- **Value**: Your OpenSea API key

### 5. Resend Email API
```
RESEND_API_KEY
```
- **Value**: Your Resend API key (starts with `re_`)

```
RESEND_FROM_EMAIL
```
- **Value**: Your verified email address in Resend
- **Example**: `noreply@yourdomain.com` or `onboarding@resend.dev`

### 6. Admin Secret (Optional)
```
ADMIN_SECRET
```
- **Value**: A secret string for admin operations (database cleanup, etc.)

## Step 3: Apply to All Environments

For each variable, make sure to select:
- ✅ **Production**
- ✅ **Preview** 
- ✅ **Development**

## Step 4: Redeploy

After adding all variables:
1. Go to **Deployments** tab
2. Click the **⋯** (three dots) on the latest deployment
3. Click **Redeploy**

Or push a new commit to trigger automatic redeployment.

## Step 5: Verify

After redeployment, test your APIs:
- Try logging in (Google OAuth)
- Try subscribing to newsletter
- Try contact form
- Check if NFTs are loading

## Quick Checklist

- [ ] MONGODB_URI
- [ ] MONGODB_DB_NAME
- [ ] NEXTAUTH_SECRET
- [ ] NEXTAUTH_URL
- [ ] GOOGLE_CLIENT_ID
- [ ] GOOGLE_CLIENT_SECRET
- [ ] NEXT_PUBLIC_OPENSEA_API_KEY
- [ ] RESEND_API_KEY
- [ ] RESEND_FROM_EMAIL
- [ ] ADMIN_SECRET (optional)

## Need Help?

If APIs still don't work after adding variables:
1. Check Vercel deployment logs for errors
2. Make sure all variables are added to all environments (Production, Preview, Development)
3. Verify your MongoDB URI is correct and accessible
4. Check that your Google OAuth redirect URI includes your Vercel URL


