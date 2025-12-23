// Using direct Resend API calls with fetch

const CONTACT_EMAIL = 'trishirsingh9@gmail.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, message } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Send email using Resend API
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    
    const emailSubject = `New Contact Form Message from ${name}`;
    const emailHtml = getContactEmailTemplate(name, email, message);

    console.log('Attempting to send contact email:', {
      from: fromEmail,
      to: CONTACT_EMAIL,
      replyTo: email,
      subject: emailSubject,
    });

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY is missing');
      return res.status(500).json({ 
        error: 'Email service not configured. Please contact the administrator.' 
      });
    }

    try {
      const emailPayload = {
        from: fromEmail,
        to: [CONTACT_EMAIL],
        subject: emailSubject,
        html: emailHtml,
      };

      // Only add replyTo if email is valid
      if (email && emailRegex.test(email)) {
        emailPayload.replyTo = email;
      }

      // Use https module directly for better timeout control
      const https = require('https');
      const postData = JSON.stringify(emailPayload);

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
        timeout: 30000, // 30 second timeout
      };

      console.log('Sending contact email via Resend API...');

      await new Promise((resolve, reject) => {
        const req = https.request(options, (response) => {
          let data = '';
          
          response.on('data', (chunk) => {
            data += chunk;
          });
          
          response.on('end', () => {
            try {
              const result = JSON.parse(data);
              if (response.statusCode >= 200 && response.statusCode < 300) {
                console.log('Contact form email sent successfully:', result);
                console.log('Email ID:', result.id);
                resolve(result);
              } else {
                console.error('Resend API error:', result);
                console.error('Status:', response.statusCode);
                reject(new Error(result.message || 'Failed to send email'));
              }
            } catch (parseError) {
              console.error('Failed to parse response:', parseError);
              reject(new Error('Invalid response from email service'));
            }
          });
        });

        req.on('error', (error) => {
          console.error('Request error:', error.message);
          reject(error);
        });

        req.on('timeout', () => {
          req.destroy();
          console.error('Request timeout after 30 seconds');
          reject(new Error('Email send timed out. Please check your internet connection.'));
        });

        req.setTimeout(30000); // 30 second timeout
        req.write(postData);
        req.end();
      });
    } catch (sendError) {
      console.error('Failed to send contact email:', sendError);
      console.error('Error type:', sendError?.constructor?.name);
      console.error('Error message:', sendError?.message);
      return res.status(500).json({ 
        error: `Failed to send email: ${sendError?.message || 'Unknown error'}. Please try again later.` 
      });
    }

    return res.status(200).json({
      message: 'Message sent successfully! We will get back to you soon.',
    });
  } catch (error) {
    console.error('Contact form error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      error: `An error occurred: ${error.message || 'Unknown error'}. Please try again later.`,
    });
  }
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function getContactEmailTemplate(name, email, message) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Contact Form Message</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0A0A0A; color: #E0E0E0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 2rem;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #00D9FF 0%, #3B82F6 100%); padding: 2rem; border-radius: 1rem 1rem 0 0; text-align: center;">
          <h1 style="margin: 0; color: #0A0A0A; font-size: 1.8rem; font-weight: 700;">
            New Contact Form Message
          </h1>
        </div>

        <!-- Content -->
        <div style="background: #141414; padding: 2rem; border: 1px solid #333333; border-top: none;">
          <div style="margin-bottom: 1.5rem;">
            <p style="margin: 0 0 0.5rem 0; color: #B0B0B0; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">
              From
            </p>
            <p style="margin: 0; color: #FFFFFF; font-size: 1.1rem; font-weight: 600;">
              ${name}
            </p>
            <p style="margin: 0.25rem 0 0 0; color: #00D9FF; font-size: 1rem;">
              ${email}
            </p>
          </div>

          <div style="margin-bottom: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #333333;">
            <p style="margin: 0 0 0.5rem 0; color: #B0B0B0; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">
              Message
            </p>
            <div style="background: #0A0A0A; padding: 1.5rem; border-radius: 0.5rem; border: 1px solid #333333;">
              <p style="margin: 0; color: #E0E0E0; font-size: 1rem; line-height: 1.6; white-space: pre-wrap;">
                ${escapeHtml(message).replace(/\n/g, '<br>')}
              </p>
            </div>
          </div>

          <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #333333; text-align: center;">
            <p style="margin: 0; color: #B0B0B0; font-size: 0.85rem;">
              You can reply directly to this email to respond to ${name}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #141414; padding: 1.5rem; border: 1px solid #333333; border-top: none; border-radius: 0 0 1rem 1rem; text-align: center;">
          <p style="margin: 0; color: #B0B0B0; font-size: 0.85rem;">
            This message was sent from the NFT Marketplace contact form
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

