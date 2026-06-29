# Email Confirmation Redirect Setup

## Overview
When users confirm their email address, the confirmation link should redirect them back to the app instead of a web page. This requires setting up deep linking (app URIs) for both iOS and Android.

## iOS Setup

### 1. Configure Universal Links
- Navigate to **Apple Developer Console** → **Identifiers** → Select your App ID
- Under **Capabilities**, enable **Associated Domains**
- Add your domain with the `applinks:` prefix

Example:
```
applinks:yourdomain.com
applinks:*.yourdomain.com
```

### 2. Create `apple-app-site-association` File
Create a JSON file at `https://yourdomain.com/.well-known/apple-app-site-association`:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.yourcompany.interviewapp",
        "paths": ["/auth/confirm", "/verify/*"]
      }
    ]
  }
}
```

### 3. Add to Xcode
- In Xcode: **Project Settings** → **Signing & Capabilities**
- Add **Associated Domains**
- Enter your domain

## Android Setup

### 1. Configure Deep Links in `app.json` or AndroidManifest.xml

In `app.json`:
```json
{
  "expo": {
    "android": {
      "intentFilters": [
        {
          "action": "android.intent.action.VIEW",
          "category": ["android.intent.category.DEFAULT", "android.intent.category.BROWSABLE"],
          "data": {
            "scheme": "interviewapp",
            "host": "confirm-email"
          }
        },
        {
          "action": "android.intent.action.VIEW",
          "category": ["android.intent.category.DEFAULT", "android.intent.category.BROWSABLE"],
          "data": {
            "scheme": "https",
            "host": "yourdomain.com",
            "pathPrefix": "/auth/confirm"
          }
        }
      ]
    }
  }
}
```

### 2. Create `assetlinks.json`
Create a JSON file at `https://yourdomain.com/.well-known/assetlinks.json`:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.yourcompany.interviewapp",
      "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
    }
  }
]
```

**To find SHA256 fingerprint:**
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey
```

## Email Template Configuration

### Supabase Email Template Update
Update your email confirmation template to include the correct redirect link:

```html
<a href="https://yourdomain.com/auth/confirm?token={{.ConfirmationURL}}">
  Confirm Your Email
</a>

<!-- For deep linking (mobile) -->
<a href="interviewapp://confirm-email?token={{.ConfirmationURL}}">
  Confirm Email (Mobile)
</a>
```

Or use a universal link that works on both:
```html
<a href="https://yourdomain.com/auth/confirm?token={{.ConfirmationURL}}">
  Confirm Your Email
</a>
```

## React Navigation Deep Linking Configuration

### 1. Update Navigation Setup
In your navigation config:

```typescript
const linking = {
  prefixes: ['interviewapp://', 'https://yourdomain.com'],
  config: {
    screens: {
      ConfirmEmail: 'auth/confirm/:token',
      Home: 'home',
      // ... other screens
    },
  },
};
```

### 2. Handle Email Confirmation
Create a screen to handle the token:

```typescript
const ConfirmEmailScreen: React.FC<{route: any}> = ({ route }) => {
  const { token } = route.params;

  useEffect(() => {
    if (token) {
      confirmEmail(token);
    }
  }, [token]);

  const confirmEmail = async (token: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: userEmail,
        token: token,
        type: 'email',
      });

      if (error) throw error;
      
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Error', 'Failed to confirm email');
    }
  };

  return <ActivityIndicator size="large" />;
};
```

## Testing Deep Links

### iOS
```bash
xcrun simctl openurl booted "https://yourdomain.com/auth/confirm?token=test123"
xcrun simctl openurl booted "interviewapp://confirm-email?token=test123"
```

### Android
```bash
adb shell am start -W -a android.intent.action.VIEW -d "interviewapp://confirm-email?token=test123" com.yourcompany.interviewapp
adb shell am start -W -a android.intent.action.VIEW -d "https://yourdomain.com/auth/confirm?token=test123" com.yourcompany.interviewapp
```

## Checklist
- [ ] Add Associated Domains capability in Xcode (iOS)
- [ ] Host `apple-app-site-association` at `/.well-known/` (iOS)
- [ ] Configure intent filters in `app.json` (Android)
- [ ] Host `assetlinks.json` at `/.well-known/` (Android)
- [ ] Get SHA256 fingerprint for Android
- [ ] Update email template with correct links
- [ ] Configure React Navigation deep linking
- [ ] Create ConfirmEmail screen to handle tokens
- [ ] Test on iOS device/simulator
- [ ] Test on Android device/emulator
- [ ] Test with actual email from Supabase
- [ ] Verify token is correctly parsed and verified

## Troubleshooting

**Deep links not working on iOS:**
- Verify domain ownership (apple-app-site-association must be accessible)
- Clear app cache: `xcrun simctl erase all` then rebuild
- Check Associated Domains capability in Xcode

**Deep links not working on Android:**
- Verify SHA256 fingerprint matches production/debug key
- Check `assetlinks.json` is publicly accessible
- Test with `adb` commands above
- Clear app data: `adb shell pm clear com.yourcompany.interviewapp`

**Token not being extracted:**
- Log the full URL: `console.log(route.params)`
- Verify token parameter name matches email template
- Test with hardcoded token first

## Security Notes
- Never expose tokens in URLs (use POST if possible)
- Validate token format before verification
- Set token expiration time (typically 24 hours)
- Log failed verification attempts
