/**
 * Test Resend API connection
 */
export default async function handler(req, res) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  if (!apiKey) {
    return res.status(500).json({ 
      error: 'RESEND_API_KEY is missing',
      fromEmail: fromEmail 
    });
  }

  try {
    // Test connection with a simple request
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: ['test@example.com'], // This will fail but we can see the error
        subject: 'Test',
        html: '<p>Test</p>',
      }),
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    const result = await response.json();
    
    return res.status(200).json({
      success: true,
      status: response.status,
      message: 'Connection test completed',
      result: result,
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
      fromEmail: fromEmail,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Connection test failed',
      message: error.message,
      type: error.constructor.name,
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
      fromEmail: fromEmail,
    });
  }
}

