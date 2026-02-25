# App Encryption Compliance Documentation

## Overview
This document explains the encryption compliance status for the My Interview iOS app.

## Current Configuration

The app has the following declaration in `app.json`:

```json
"ITSAppUsesNonExemptEncryption": false
```

This setting is also reflected in the iOS Info.plist as `ITSAppUsesNonExemptEncryption: NO`.

## Why We're Exempt

Our app is **exempt from export compliance documentation** because:

### 1. Standard Encryption Only
The app uses only standard encryption algorithms provided by Apple's operating system:
- HTTPS/TLS for all network communications
- iOS Keychain for secure credential storage
- Standard file system encryption when device encryption is enabled

### 2. No Custom Encryption
The app does NOT implement:
- Proprietary encryption algorithms
- Custom cryptographic implementations
- Non-standard encryption methods

### 3. Third-Party Services
All API communications use standard HTTPS/TLS:
- **Supabase** - Database and authentication (HTTPS)
- **Groq** - AI/LLM services (HTTPS)
- **Adzuna** - Job search API (HTTPS)
- **ElevenLabs** - Text-to-speech API (HTTPS)
- **RevenueCat** - Subscription management (HTTPS)

## When to Change This Setting

You would need to set `ITSAppUsesNonExemptEncryption` to `true` if you:

1. Implement custom encryption algorithms
2. Add proprietary cryptographic functionality
3. Use encryption libraries not provided by Apple's OS
4. Implement end-to-end encryption with custom key exchange
5. Add blockchain or cryptocurrency functionality with custom cryptography

## App Store Submission

With the current setting (`false`):
- ✅ No additional export compliance documentation required
- ✅ No encryption description needed during App Review
- ✅ Streamlined app submission process

## Reference Links

- [Apple: Complying with Encryption Export Regulations](https://developer.apple.com/documentation/security/complying_with_encryption_export_regulations)
- [App Store Connect Help: Export Compliance](https://help.apple.com/app-store-connect/#/dev88f5c7bf9)
- [U.S. Export Compliance Information](https://www.bis.doc.gov/)

## Last Updated
24 February 2026

## Notes
This declaration is automatically included in both:
- Expo's `app.json` configuration
- The generated iOS `Info.plist` file during build

No manual editing of Info.plist required when using Expo.
