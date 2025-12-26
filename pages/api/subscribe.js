import { getSubscriptionsCollection } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    // Validate email
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const subscriptionsCollection = await getSubscriptionsCollection();
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingSubscription = await subscriptionsCollection.findOne({
      email: normalizedEmail,
    });

    if (existingSubscription) {
      // Send thank you email even if already subscribed
      try {
        await sendThankYouEmail(normalizedEmail);
      } catch (emailError) {
        console.error('Error sending email to existing subscriber:', emailError);
      }
      
      return res.status(200).json({
        message: 'Thank you for subscribing! You are already subscribed to our newsletter.',
        alreadySubscribed: true,
      });
    }

    // Create new subscription
    const subscription = {
      email: normalizedEmail,
      subscribedAt: new Date(),
      status: 'active',
    };

    await subscriptionsCollection.insertOne(subscription);

    // Send thank you email
    try {
      await sendThankYouEmail(normalizedEmail);
    } catch (emailError) {
      console.error('Error sending thank you email:', emailError);
      // Don't fail the subscription if email fails
    }

    return res.status(200).json({
      message: 'Thank you for subscribing! Check your email for a confirmation message.',
      success: true,
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return res.status(500).json({
      error: 'Failed to process subscription. Please try again later.',
    });
  }
}

async function sendThankYouEmail(email) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('Resend not configured. Skipping email send.');
    return;
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  
  try {
    console.log('Attempting to send email to:', email);
    console.log('Using from email:', fromEmail);
    
    // Use https module directly for better timeout control
    const https = require('https');
    const url = require('url');
    
    const postData = JSON.stringify({
      from: fromEmail,
      to: [email],
      subject: 'Thank You for Subscribing! 🎉',
      html: getThankYouEmailTemplate(email),
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
      timeout: 30000, // 30 second timeout
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              console.log('Thank you email sent successfully to:', email);
              console.log('Email ID:', result.id);
              resolve(result);
            } else {
              console.error('Resend API error:', result);
              console.error('Status:', res.statusCode);
              resolve(null); // Don't fail subscription
            }
          } catch (parseError) {
            console.error('Failed to parse response:', parseError);
            resolve(null); // Don't fail subscription
          }
        });
      });

      req.on('error', (error) => {
        console.error('Request error:', error.message);
        resolve(null); // Don't fail subscription
      });

      req.on('timeout', () => {
        req.destroy();
        console.error('Request timeout after 30 seconds');
        resolve(null); // Don't fail subscription
      });

      req.setTimeout(30000); // 30 second timeout
      req.write(postData);
      req.end();
    });
  } catch (error) {
    console.error('Failed to send thank you email:', error);
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error?.message);
    // Don't throw - allow subscription to succeed even if email fails
    return;
  }
}

function getThankYouEmailTemplate(email) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank You for Subscribing</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 20px; text-align: center;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <tr>
                  <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🎉 Thank You for Subscribing!</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                      Hi there,
                    </p>
                    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                      Thank you for subscribing to our NFT Marketplace newsletter! We're thrilled to have you join our community.
                    </p>
                    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                      You'll now receive:
                    </p>
                    <ul style="margin: 0 0 30px 0; padding-left: 20px; color: #333333; font-size: 16px; line-height: 1.8;">
                      <li>✨ Latest NFT collections and drops</li>
                      <li>🔥 Exclusive marketplace updates</li>
                      <li>💎 Featured artists and creators</li>
                      <li>🎨 Tips and guides for NFT collectors</li>
                    </ul>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${process.env.NEXTAUTH_URL || 'https:nftdep.vercel.app'}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Explore Marketplace
                      </a>
                    </div>
                    <p style="margin: 30px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                      If you have any questions or need assistance, feel free to reach out to us anytime.
                    </p>
                    <p style="margin: 20px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                      Happy collecting!<br>
                      <strong>The NFT Marketplace Team</strong>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 30px; background-color: #f8f9fa; border-radius: 0 0 12px 12px; text-align: center;">
                    <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.6;">
                      You're receiving this email because you subscribed to our newsletter.<br>
                      <a href="${process.env.NEXTAUTH_URL || 'https://nftdep.vercel.app'}" style="color: #667eea; text-decoration: none;">Visit our website</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

