/**
 * Test endpoint to verify environment variables are being read
 */
export default async function handler(req, res) {
  return res.status(200).json({
    mongodb_uri: process.env.MONGODB_URI ? "✅ Present" : "❌ Missing",
    mongodb_db_name: process.env.MONGODB_DB_NAME || "❌ Missing",
    opensea_key: process.env.NEXT_PUBLIC_OPENSEA_API_KEY ? "✅ Present" : "❌ Missing",
    google_client_id: process.env.GOOGLE_CLIENT_ID ? "✅ Present" : "❌ Missing",
    google_client_secret: process.env.GOOGLE_CLIENT_SECRET ? "✅ Present" : "❌ Missing",
    nextauth_secret: process.env.NEXTAUTH_SECRET ? "✅ Present" : "❌ Missing",
    nextauth_url: process.env.NEXTAUTH_URL || "❌ Missing",
    resend_api_key: process.env.RESEND_API_KEY ? "✅ Present" : "❌ Missing",
    resend_from_email: process.env.RESEND_FROM_EMAIL || "❌ Missing",
  });
}

