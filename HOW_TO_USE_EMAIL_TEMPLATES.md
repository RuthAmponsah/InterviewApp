# How to Use Email Templates in Supabase

## Step 1: Copy Template Code

I've created two ready-to-use email templates:

1. **PASSWORD RESET** → [EMAIL_TEMPLATE_PASSWORD_RESET.html](EMAIL_TEMPLATE_PASSWORD_RESET.html)
2. **CONFIRMATION** (signup) → [EMAIL_TEMPLATE_CONFIRMATION.html](EMAIL_TEMPLATE_CONFIRMATION.html)

Open these files and copy all the HTML code.

---

## Step 2: Paste into Supabase

### For Password Reset Email:

1. Go to: https://app.supabase.com
2. Select your project
3. Go to: **Authentication** → **Email Templates**
4. Click on **"Reset Password"** template
5. Delete the existing code
6. Paste the HTML from `EMAIL_TEMPLATE_PASSWORD_RESET.html`
7. Click **Save**

### For Confirmation Email (optional - only if you want email verification):

1. Same as above but click **"Confirmation"** template
2. Paste the HTML from `EMAIL_TEMPLATE_CONFIRMATION.html`
3. Click **Save**

---

## Variables Used in Templates

These variables are automatically replaced by Supabase:

```
{{ .ConfirmationURL }}  → The actual reset/confirmation link
{{ .Email }}            → User's email address
```

Don't change these - they'll be populated automatically!

---

## Preview Before Saving

In Supabase's Email Templates editor:
1. You can see a **Preview** button
2. Click it to see how your email looks
3. Looks good? Click **Save**

---

## Testing

After saving templates:

1. Open your app
2. Click **"Forgot password?"**
3. Enter your test email
4. Check inbox for the reset email
5. Click link to verify it works!

---

## Need to Modify Templates?

The templates are already styled and professional, but if you want to:

1. Change colors → Edit the `background-color` in `<style>`
2. Change text → Edit the text content in `<p>` tags
3. Add/remove sections → Edit the HTML
4. Test changes → Save in Supabase, do test email again

---

## Tips

✅ **Do:**
- Keep `{{ .ConfirmationURL }}` in the email
- Keep `{{ .Email }}` if you reference the user's email
- Test after saving

❌ **Don't:**
- Remove or modify the variable names
- Change font-family drastically (stick with system fonts)
- Make templates too long (keep it concise)

---

## Confirmation Email (Optional)

The confirmation template is useful if you want to:
- Require email verification before using the app
- Prevent fake/spam signups
- Better user data quality

To enable:
1. Go to **Authentication** → **Settings**
2. Find "Confirm email" setting
3. Toggle it **ON**

If you toggle it off, confirmation emails won't be sent (users sign in immediately).

---

Done! Your email templates are ready to use. 🎉
