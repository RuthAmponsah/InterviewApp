// Email Service for sending verification and welcome emails
// Currently uses EmailJS for client-side sending
// Can be replaced with Firebase, SendGrid, or custom backend

import emailjs from '@emailjs/browser';

// EmailJS Configuration
// Sign up at https://www.emailjs.com/ to get these keys
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID'; // Replace with your EmailJS service ID
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID'; // Replace with your template ID
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY'; // Replace with your public key

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
  try {
    // Prepare email template parameters
    const templateParams = {
      to_email: userEmail,
      to_name: userName,
      subject: 'Welcome to My Interview! 🎉',
      message: `
Hi ${userName},

Welcome to My Interview! We're thrilled to have you join our community of confident job seekers.

Your account has been successfully created. Here's what you can do next:

✅ Complete your profile
🎯 Set your job preferences
💼 Browse job listings
🗣️ Start practicing with Aya, your AI interview coach

Aya is here to help you prepare for interviews, practice answering questions, and build the confidence you need to land your dream job.

Ready to get started? Open the app and begin your journey to interview success!

Best of luck,
The My Interview Team

---
Need help? Contact us at support@myinterview.com
      `,
    };

    // For now, we'll simulate sending (EmailJS requires setup)
    // Uncomment below when EmailJS is configured:
    
    /*
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );
    
    console.log('Email sent successfully:', response.status, response.text);
    return response.status === 200;
    */

    // Simulated success (remove when EmailJS is set up)
    console.log('📧 Welcome email would be sent to:', userEmail);
    console.log('Email content:', templateParams.message);
    
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
};

/**
 * Sends an email verification link
 * Note: Real verification requires backend implementation
 * This is a placeholder for the future implementation
 */
export const sendVerificationEmail = async (
  userEmail: string,
  userName: string,
  verificationToken: string
): Promise<boolean> => {
  try {
    const verificationLink = `myinterview://verify?token=${verificationToken}`;
    
    const templateParams = {
      to_email: userEmail,
      to_name: userName,
      subject: 'Verify Your My Interview Account',
      verification_link: verificationLink,
      message: `
Hi ${userName},

Thanks for signing up for My Interview!

To complete your registration, please verify your email address by clicking the link below:

${verificationLink}

This link will expire in 24 hours.

If you didn't create an account with My Interview, please ignore this email.

Best regards,
The My Interview Team
      `,
    };

    console.log('📧 Verification email would be sent to:', userEmail);
    console.log('Verification link:', verificationLink);
    
    // TODO: Implement actual email sending with backend
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
};

/**
 * Alternative: Send emails using a backend API
 * Replace EmailJS with your own backend when ready
 */
export const sendEmailViaBackend = async (
  to: string,
  subject: string,
  body: string
): Promise<boolean> => {
  try {
    const response = await fetch('https://your-api.com/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        body,
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Backend email error:', error);
    return false;
  }
};
