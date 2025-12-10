# Global Typography Update

## Overview
Applied consistent typography standards across the entire app, matching the improved font styling from the Welcome screen.

## Typography Standards (src/theme/colors.ts)

### Headings
- **heading**: 32px, weight 700, letterSpacing 0.3, lineHeight 38
- **headingMedium**: 24px, weight 700, letterSpacing 0.3, lineHeight 30
- **headingSmall**: 20px, weight 600, letterSpacing 0.2, lineHeight 26

### Body Text
- **body**: 20px, weight 400, letterSpacing 0.2, lineHeight 34
- **bodyMedium**: 16px, weight 400, letterSpacing 0.2, lineHeight 24
- **bodySmall**: 14px, weight 400, letterSpacing 0.2, lineHeight 20

### Labels & Captions
- **label**: 15px, weight 500, letterSpacing 0.1
- **caption**: 12px, weight 400, letterSpacing 0.1

## Updated Files

### Core Components (2 files)
✅ TextInputField.tsx - Input labels and text
✅ PrimaryButton.tsx - Button text

### All Screens (20 files)
✅ Home.tsx
✅ Jobs.tsx
✅ Settings.tsx
✅ Welcome.tsx (already had correct fonts)
✅ SignIn.tsx
✅ SignUp.tsx
✅ MyProfile.tsx
✅ EditProfile.tsx
✅ ChangePassword.tsx
✅ Notifications.tsx
✅ Support.tsx
✅ AboutUs.tsx
✅ ForgotPassword.tsx
✅ InterviewType.tsx
✅ InterviewChat.tsx
✅ InterviewExperience.tsx
✅ JobPreferences.tsx
✅ PrivacySecurity.tsx
✅ HelpCentre.tsx
✅ Feedback.tsx
✅ AppCustomisation.tsx

## Usage Pattern

Instead of hardcoded values:
```tsx
title: {
  fontSize: 24,
  fontWeight: '700',
}
```

Use typography spreads:
```tsx
title: {
  ...typography.headingMedium,
  color: colors.textDark,
}
```

## Benefits
- ✅ Consistent font sizing across all screens
- ✅ Improved readability with letter spacing
- ✅ Better line heights for multi-line text
- ✅ Easy to update fonts globally in future
- ✅ Maintains dark/light mode color support
- ✅ Professional, polished appearance

## Testing
- No TypeScript errors
- All imports verified
- Typography applied to 20 screens + 2 components
