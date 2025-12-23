/**
 * Test endpoint to verify admin API routes are working
 */
export default async function handler(req, res) {
  return res.status(200).json({
    success: true,
    message: 'Admin API routes are working!',
    timestamp: new Date().toISOString()
  });
}

