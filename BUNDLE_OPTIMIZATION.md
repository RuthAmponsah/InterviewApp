# Bundle Size Optimization Guide

## Why Optimize?

- **Faster downloads**: Users download app quicker
- **Less storage**: Takes less space on device
- **Better performance**: App loads faster
- **App Store approval**: Apple/Google prefer smaller apps

## Step 1: Check Current Bundle Size

```bash
# Run expo doctor to check for issues
npx expo-doctor

# Check bundle size (if built)
du -sh .expo

# For iOS
du -sh ios/build

# For Android
du -sh android/app/build
```

## Step 2: Analyze Dependencies

```bash
# Install bundle analyzer
npm install --save-dev @expo/webpack-config

# Check what's using space
npx react-native-bundle-visualizer
```

Or check `package.json` manually:

```bash
# List all dependencies with sizes
npm list --depth=0

# Find large packages
du -sh node_modules/* | sort -h
```

## Step 3: Remove Unused Dependencies

### Check for unused packages:

```bash
npx depcheck
```

### Commonly unused packages to check:
- Development tools only needed in dev
- Duplicate dependencies
- Old/deprecated packages

### Safe to remove from your project:
```bash
# Example - check if these are actually used
npm uninstall lodash  # If you're not using utility functions
npm uninstall moment  # If you're using date-fns or native Date
```

## Step 4: Optimize Images

### Current images to check:
- `assets/icon.png` (1024x1024 - ✅ good)
- `assets/adaptive-icon.png`
- `assets/splash-icon.png`
- `assets/sounds/woosh.mp3`

### Optimize images:
```bash
# Install image optimizer
npm install --save-dev sharp-cli

# Optimize all PNGs
npx sharp-cli -i assets/*.png -o assets/ -f png -q 80

# For splash screen, use WebP (smaller)
npx sharp-cli -i assets/splash-icon.png -o assets/splash-icon.webp -f webp -q 85
```

### Or use online tools:
- [TinyPNG](https://tinypng.com) - PNG/JPG compression
- [Squoosh](https://squoosh.app) - Google's image compressor

## Step 5: Configure Metro Bundler

Create/update `metro.config.js`:

```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Remove console logs in production
config.transformer.minifierConfig = {
  compress: {
    drop_console: true,
  },
};

// Optimize assets
config.resolver.assetExts.push('db');

module.exports = config;
```

## Step 6: Enable Hermes Engine (Android)

**Already enabled in your `app.json`** ✅

Hermes reduces Android bundle size by ~30%.

```json
{
  "expo": {
    "android": {
      "jsEngine": "hermes"
    }
  }
}
```

## Step 7: Code Splitting (Advanced)

### Lazy load screens:
```typescript
import React, { lazy, Suspense } from 'react';

// Instead of direct imports
// import InterviewChat from './screens/InterviewChat';

// Use lazy loading
const InterviewChat = lazy(() => import('./screens/InterviewChat'));
const Jobs = lazy(() => import('./screens/Jobs'));
const QuestionBank = lazy(() => import('./screens/QuestionBank'));

// Wrap in Suspense
<Suspense fallback={<LoadingScreen />}>
  <InterviewChat />
</Suspense>
```

## Step 8: Use Production Build

Development builds are MUCH larger than production:

```bash
# Build for production
eas build --platform ios --profile production
eas build --platform android --profile production
```

## Step 9: Optimize Fonts

You're using `expo-font` - good! But check:

```typescript
// In App.tsx, only load fonts you actually use
await Font.loadAsync({
  'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
  'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
  // Remove any unused font weights
});
```

## Step 10: Configure app.json for Optimization

Update `app.json`:

```json
{
  "expo": {
    "android": {
      "enableProguardInReleaseBuilds": true,
      "enableShrinkResourcesInReleaseBuilds": true
    },
    "ios": {
      "bitcode": false
    }
  }
}
```

## Quick Wins Checklist

- [ ] Run `npx expo-doctor` and fix issues
- [ ] Remove unused dependencies with `npx depcheck`
- [ ] Optimize images with TinyPNG or sharp-cli
- [ ] Enable Hermes (already done ✅)
- [ ] Remove console.logs in production (metro.config.js)
- [ ] Check font files (only include used weights)
- [ ] Remove unused assets from `assets/` folder
- [ ] Enable ProGuard for Android builds

## Expected Results

### Before Optimization:
- Development build: 50-80 MB
- Production iOS: 30-50 MB
- Production Android: 20-40 MB

### After Optimization:
- Development build: Same (optimization only affects production)
- Production iOS: 15-30 MB (40-50% reduction)
- Production Android: 10-20 MB (50% reduction)

## Test Your Optimizations

```bash
# Clear cache
npx expo start --clear

# Build and check size
eas build --platform ios --profile production
eas build --platform android --profile production

# Check APK/AAB size in EAS dashboard
```

## Monitoring Bundle Size

Add to your CI/CD:

```bash
# Check bundle size before each release
npx react-native-bundle-visualizer

# Fail if bundle exceeds threshold
if [ "$(du -sm android/app/build/outputs/apk/release/*.apk | cut -f1)" -gt 30 ]; then
  echo "Bundle too large!"
  exit 1
fi
```

## Common Issues

### "Bundle is still large"
- Check node_modules - may need to rebuild: `rm -rf node_modules && npm install`
- Use production build, not development
- Check for duplicate dependencies: `npm dedupe`

### "App crashes after optimization"
- Check if you removed a needed dependency
- Test thoroughly after removing packages
- Don't remove React Native core packages

### "Images look blurry"
- Don't over-compress images
- Keep quality at 80-85% for PNGs
- Use @2x and @3x for iOS retina displays

---

## Priority Order

1. **Quick wins** (30 mins):
   - Run expo-doctor
   - Remove unused dependencies
   - Optimize images with TinyPNG

2. **Medium effort** (1 hour):
   - Configure metro.config.js
   - Enable ProGuard for Android
   - Remove unused fonts

3. **Advanced** (2+ hours):
   - Lazy load screens
   - Code splitting
   - Detailed bundle analysis

**Start with #1, measure results, then decide if #2 is needed.**
