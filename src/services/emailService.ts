// Email Service using Resend API
// Free tier: 3,000 emails/month, 100 emails/day
// Sign up: https://resend.com/
import Constants from 'expo-constants';

// CONFIGURATION
const RESEND_API_KEY = Constants.expoConfig?.extra?.resendApiKey || process.env.EXPO_PUBLIC_RESEND_API_KEY || '';
const FROM_EMAIL = Constants.expoConfig?.extra?.fromEmail || process.env.EXPO_PUBLIC_FROM_EMAIL || 'info@myinterviewappcom.com';
const FROM_NAME = Constants.expoConfig?.extra?.fromName || process.env.EXPO_PUBLIC_FROM_NAME || 'MY INTERVIEW';

if (!RESEND_API_KEY) {
  console.warn('⚠️ Resend API key not found. Email functionality will be disabled.');
}

/**
 * Sends a welcome email to new users
 * @param userEmail - User's email address
 * @param userName - User's name
 * @returns Promise<boolean> - Success status
 */
export const sendWelcomeEmail = async (
  userEmail: string,
  userName: string
): Promise<boolean> => {
  // Email service configured - emails will be sent
  console.log('📧 Sending welcome email to:', userEmail);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [userEmail],
        subject: 'Welcome to MY INTERVIEW! 🎯',
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 800;">MY INTERVIEW</h1>
      </td>
    </tr>
    
    <!-- Content -->
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 700;">Welcome, ${userName}! 👋</h2>
        
        <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
          You're now part of the MY INTERVIEW community! We're excited to help you ace your next interview.
        </p>
        
        <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Here's what you can do:
        </p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
          <tr>
            <td style="padding: 16px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #667eea;">
              <p style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: 600;">🎤 Practice with Aya</p>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Your AI interview coach ready to help you prepare</p>
            </td>
          </tr>
          <tr><td style="height: 12px;"></td></tr>
          <tr>
            <td style="padding: 16px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #10b981;">
              <p style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: 600;">💼 Browse Jobs</p>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Find real opportunities from top UK employers</p>
            </td>
          </tr>
          <tr><td style="height: 12px;"></td></tr>
          <tr>
            <td style="padding: 16px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <p style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: 600;">📊 Track Progress</p>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">See your improvement and build your streak</p>
            </td>
          </tr>
        </table>
        
        <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Need help? Check out the Help Centre in the app or reply to this email.
        </p>
        
        <p style="margin: 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
          Good luck! 🚀
        </p>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="padding: 30px; text-align: center; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 14px;">
          MY INTERVIEW - Your AI Interview Coach
        </p>
        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
          This email was sent to ${userEmail}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Resend API error:', error);
      return false;
    }

    const data = await response.json();
    console.log('✅ Email sent successfully! ID:', data.id);
    return true;

  } catch (error) {
    console.error('❌ Email service error:', error);
    return false;
  }
};

/**
 * Sends an email verification link (optional feature)
 */
export const sendVerificationEmail = async (
  userEmail: string,
  userName: string,
  verificationToken: string
): Promise<boolean> => {
  // Send verification email
  console.log('📧 Sending verification email to:', userEmail);

  try {
    const verificationLink = `myinterview://verify?token=${verificationToken}`;
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [userEmail],
        subject: 'Verify Your MY INTERVIEW Account',
        html: `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 40px;">
    <h1 style="color: #667eea; font-size: 28px; margin-bottom: 20px;">Verify Your Email</h1>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      Hi ${userName},
    </p>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      Please verify your email address by clicking the button below:
    </p>
    <a href="${verificationLink}" style="display: inline-block; background-color: #667eea; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
      Verify Email
    </a>
    <p style="color: #9ca3af; font-size: 14px; margin-top: 32px;">
      This link expires in 24 hours.
    </p>
  </div>
</body>
</html>
        `,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Verification email error:', error);
    return false;
  }
};

/**
 * Test email configuration
 * Call this to verify your Resend API key works
 */
export const testEmailConfiguration = async (): Promise<boolean> => {
  console.log('🧪 Testing email configuration...');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: ['delivered@resend.dev'], // Resend test email
        subject: 'Test Email from MY INTERVIEW',
        html: '<h1>Email service is working! ✅</h1>',
      }),
    });

    if (response.ok) {
      console.log('✅ Email configuration working!');
      return true;
    } else {
      const error = await response.json();
      console.error('❌ Email configuration error:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ Email test failed:', error);
    return false;
  }
};
