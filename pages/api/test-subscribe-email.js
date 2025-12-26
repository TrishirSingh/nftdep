// Test endpoint to diagnose email sending issues
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  if (!apiKey) {
    return res.status(500).json({ 
      error: 'RESEND_API_KEY is not configured',
      fromEmail,
    });
  }

  try {
    const https = require('https');
    
    const postData = JSON.stringify({
      from: fromEmail,
      to: [email],
      subject: 'Test Email from NFT Marketplace',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email to verify Resend configuration.</p>
        <p>If you received this, email sending is working correctly!</p>
      `,
    });

    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 30000,
    };

    return new Promise((resolve) => {
      const req = https.request(options, (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          try {
            const result = JSON.parse(data);
            
            if (response.statusCode >= 200 && response.statusCode < 300) {
              res.status(200).json({
                success: true,
                message: 'Test email sent successfully!',
                emailId: result.id,
                to: email,
                from: fromEmail,
                details: result,
              });
            } else {
              res.status(response.statusCode).json({
                success: false,
                error: 'Failed to send test email',
                statusCode: response.statusCode,
                to: email,
                from: fromEmail,
                resendError: result,
                diagnostic: {
                  message: result?.message,
                  errors: result?.errors,
                  suggestion: getSuggestion(result),
                },
              });
            }
            resolve();
          } catch (parseError) {
            res.status(500).json({
              success: false,
              error: 'Failed to parse Resend API response',
              rawResponse: data,
              parseError: parseError.message,
            });
            resolve();
          }
        });
      });

      req.on('error', (error) => {
        res.status(500).json({
          success: false,
          error: 'Network error when calling Resend API',
          message: error.message,
          to: email,
          from: fromEmail,
        });
        resolve();
      });

      req.on('timeout', () => {
        req.destroy();
        res.status(500).json({
          success: false,
          error: 'Request to Resend API timed out',
          to: email,
          from: fromEmail,
        });
        resolve();
      });

      req.setTimeout(30000);
      req.write(postData);
      req.end();
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Unexpected error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

function getSuggestion(resendError) {
  if (!resendError) return 'Unknown error';
  
  const message = resendError.message?.toLowerCase() || '';
  const errors = resendError.errors || [];
  
  // Check for domain verification issues
  if (message.includes('domain') || message.includes('verify') || message.includes('not verified')) {
    return 'Your sending domain may not be verified in Resend. Go to Resend Dashboard → Domains to verify your domain.';
  }
  
  // Check for invalid email
  if (message.includes('invalid') && message.includes('email')) {
    return 'The recipient email address may be invalid. Please check the email format.';
  }
  
  // Check for rate limiting
  if (message.includes('rate limit') || message.includes('too many')) {
    return 'You may have hit Resend rate limits. Wait a few minutes and try again.';
  }
  
  // Check for API key issues
  if (message.includes('unauthorized') || message.includes('api key')) {
    return 'Your Resend API key may be invalid or expired. Check your RESEND_API_KEY environment variable.';
  }
  
  // Check validation errors
  if (errors.length > 0) {
    const errorMessages = errors.map(e => e.message || e).join(', ');
    return `Validation error: ${errorMessages}`;
  }
  
  return `Resend API error: ${resendError.message || 'Unknown error'}. Check the Resend dashboard for more details.`;
}

