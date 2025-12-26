# Fix Authentication on Vercel

## The Problem
Even when signed in on Vercel, the app shows the sign-in page and you can't create NFTs or access protected pages. This works fine on localhost.

## Root Cause
The issue is usually caused by missing or incorrect environment variables on Vercel, particularly `NEXTAUTH_URL` and `NEXTAUTH_SECRET`.

## Solution

### Step 1: Set Environment Variables on Vercel

Go to your Vercel project dashboard:
1. Navigate to **Settings** → **Environment Variables**
2. Add/Update these variables:

#### Required Variables:

1. **NEXTAUTH_URL**
   - Value: `https://nftdep.vercel.app` (or your actual Vercel URL)
   - Environment: Production, Preview, Development

2. **NEXTAUTH_SECRET**
   - Value: Generate a random secret (see below)
   - Environment: Production, Preview, Development
   - **Important**: Must be the same value you use in `.env.local` for localhost

3. **GOOGLE_CLIENT_ID**
   - Value: Your Google OAuth Client ID
   - Environment: Production, Preview, Development

4. **GOOGLE_CLIENT_SECRET**
   - Value: Your Google OAuth Client Secret
   - Environment: Production, Preview, Development

5. **MONGODB_URI**
   - Value: Your MongoDB connection string
   - Environment: Production, Preview, Development

6. **MONGODB_DB_NAME**
   - Value: `nft-marketplace` (or your database name)
   - Environment: Production, Preview, Development

7. **RESEND_API_KEY**
   - Value: Your Resend API key
   - Environment: Production, Preview, Development

8. **RESEND_FROM_EMAIL**
   - Value: Your verified email from Resend
   - Environment: Production, Preview, Development

9. **NEXT_PUBLIC_OPENSEA_API_KEY**
   - Value: Your OpenSea API key
   - Environment: Production, Preview, Development

### Step 2: Generate NEXTAUTH_SECRET

If you don't have a secret, generate one:

**On Linux/Mac:**
```bash
openssl rand -base64 32
```

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Or use an online generator:**
- Visit: https://generate-secret.vercel.app/32

### Step 3: Update Google OAuth Redirect URI

**Important:** Vercel creates different URLs for production and preview deployments. You need to add both:

#### For Production Deployment:
- **Authorized redirect URI**: `https://nftdep.vercel.app/api/auth/callback/google`
- **Authorized JavaScript origin**: `https://nftdep.vercel.app`

#### For Preview Deployments (Optional but Recommended):
Vercel creates unique preview URLs for each branch/PR. You have two options:

**Option 1: Add Preview URLs Manually (Not Recommended)**
- You'd need to add each preview URL manually, which is tedious

**Option 2: Use Production URL Only (Recommended)**
- Only test on the production deployment (`https://nftdep.vercel.app`)
- Preview deployments won't work with Google OAuth unless you add their specific URLs

**Option 3: Use Custom Domain (Best Solution)**
- Set up a custom domain in Vercel (e.g., `nftmarketplace.com`)
- Add only the custom domain to Google OAuth
- This works for both production and preview deployments if configured correctly

### Step 4: Redeploy

After setting environment variables:
1. Go to **Deployments** tab in Vercel
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger a new deployment

### Step 5: Clear Browser Cache

After redeploying:
1. Clear your browser cache and cookies for the Vercel site
2. Or use an incognito/private window
3. Try signing in again

## Verification

To verify your environment variables are set correctly:

1. Visit: `https://nftdep.vercel.app/api/test-env`
2. Check that all variables show "✅ Present"

## Common Issues

### Issue: Still showing sign-in page after login
- **Fix**: Make sure `NEXTAUTH_URL` is set to your exact Vercel URL (with `https://`)
- **Fix**: Make sure `NEXTAUTH_SECRET` matches your local `.env.local` file

### Issue: "Invalid redirect URI" error
- **Fix**: Add `https://nftdep.vercel.app/api/auth/callback/google` to Google OAuth redirect URIs
- **Fix for Preview Deployments**: If you're testing on a preview URL (like `nftdep-xxxxx.vercel.app`), you need to add that specific URL to Google OAuth, OR use the production URL (`https://nftdep.vercel.app`) for testing

### Issue: Session not persisting
- **Fix**: Clear browser cookies and try again
- **Fix**: Make sure you're using HTTPS (Vercel provides this automatically)

## Testing

1. Sign in with Google on Vercel
2. Try accessing `/create` - should work without redirect
3. Try accessing `/myprofile` - should show your profile
4. Try creating an NFT - should work

If it still doesn't work, check the Vercel function logs for errors.

