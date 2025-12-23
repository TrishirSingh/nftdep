/**
 * Test endpoint to verify Resend API is working
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const { testEmail } = req.body;

  if (!testEmail) {
    return res.status(400).json({ error: 'testEmail is required' });
  }

  if (!apiKey) {
    return res.status(500).json({ error: 'RESEND_API_KEY is missing' });
  }

  try {
    console.log('Testing Resend API with:', {
      from: fromEmail,
      to: testEmail,
      apiKey: apiKey.substring(0, 10) + '...',
    });

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [testEmail],
        subject: 'Test Email from NFT Marketplace',
        html: '<h1>Test Email</h1><p>If you received this, the email system is working!</p>',
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', result);
      return res.status(500).json({
        error: 'Failed to send test email',
        details: result,
        status: response.status,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Test email sent successfully!',
      emailId: result.id,
    });
  } catch (error) {
    console.error('Test email error:', error);
    return res.status(500).json({
      error: 'Exception occurred',
      message: error.message,
    });
  }
}

