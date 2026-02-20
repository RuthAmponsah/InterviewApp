// Email Service using Supabase Auth
// All emails (Welcome, Password Reset) are handled by Supabase Auth
// Configure templates at: https://app.supabase.com → Authentication → Email Templates

import { supabase } from '../config/supabase';


/**
 * Sends a password reset email using Supabase Auth
 * User clicks the link to reset their password
 */
export const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'myinterviewapp://reset-password',
    });

    if (error) {
      console.error('❌ Password reset email error:', error);
      return false;
    }

    console.log('✅ Password reset email sent to:', email);
    return true;
  } catch (error) {
    console.error('❌ Error sending reset email:', error);
    return false;
  }
};

/**
 * Sends a welcome email (handled by Supabase automatically on signup)
 * No action needed - Supabase Auth handles this
 */
export const sendWelcomeEmail = async (
  userEmail: string,
  userName: string
): Promise<boolean> => {
  // Email is automatically sent by Supabase Auth when user signs up
  // Template can be customized at: Supabase Dashboard > Authentication > Email Templates
  console.log('📧 Welcome email: Supabase Auth will send automatically to', userEmail);
  return true;
};

/**
 * Changes user email (sends verification to new email)
 */
export const sendEmailChangeConfirmation = async (newEmail: string): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.updateUser({
      email: newEmail,
    });

    if (error) {
      console.error('❌ Email change error:', error);
      return false;
    }

    console.log('✅ Email change confirmation sent to:', newEmail);
    return true;
  } catch (error) {
    console.error('❌ Error changing email:', error);
    return false;
  }
};
