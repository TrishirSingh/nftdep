# OpenSea API Integration

## Do I Need an API Key?

**Short answer:** It's **recommended** but not strictly required for basic testing.

### Without API Key:
- ✅ Will work for basic testing
- ⚠️ Very limited rate limits (may get blocked after a few requests)
- ⚠️ Some endpoints may not work

### With API Key:
- ✅ Higher rate limits
- ✅ Access to all endpoints
- ✅ More reliable

## How to Get an OpenSea API Key (Free):

1. **Go to OpenSea**: https://opensea.io
2. **Click your profile** → **Settings**
3. **Click "Developer"** in the left sidebar
4. **Verify your email** (if not already verified)
5. **Click "Get access"** or "Create key"
6. **Fill out the form**:
   - Organization name
   - Website
   - Intended use
7. **Wait for approval** (usually takes a few days)
8. **Create your API key** once approved

## How to Add API Key:

1. Create a `.env.local` file in your project root (if it doesn't exist)
2. Add this line:
   ```
   NEXT_PUBLIC_OPENSEA_API_KEY=your_api_key_here
   ```
3. Restart your dev server (`npm run dev`)

## Testing Without API Key:

The code will work without an API key, but you may see:
- Rate limit errors after a few requests
- Some collections may not load
- Slower response times

If you see errors, try:
1. Wait a few minutes and try again
2. Get an API key (recommended)
3. Use the "My Marketplace" tab instead

## More Info:

- OpenSea API Docs: https://docs.opensea.io/reference/api-keys
- API Documentation: https://docs.opensea.io/

