# Crash Reporting Setup - Sentry

## Why Sentry?
- Catch crashes before users report them
- See exact error with stack trace
- Know which users are affected
- Track error frequency and trends
- Free tier: 5,000 errors/month

## Step 1: Create Sentry Account

1. Go to [sentry.io](https://sentry.io)
2. Sign up for free account
3. Create new project: "MY INTERVIEW"
4. Select platform: **React Native**
5. Copy your DSN (looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

## Step 2: Install Sentry SDK

```bash
npx expo install @sentry/react-native
```

## Step 3: Create Sentry Service

Create `src/services/errorService.ts`:

```typescript
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const SENTRY_DSN = Constants.expoConfig?.extra?.SENTRY_DSN;

class ErrorService {
  init() {
    if (!__DEV__) {
      Sentry.init({
        dsn: SENTRY_DSN,
        enableInExpoDevelopment: false,
        debug: false,
        environment: __DEV__ ? 'development' : 'production',
        tracesSampleRate: 1.0, // Capture 100% of transactions for performance monitoring
      });
    }
  }

  // Identify user (call after login)
  setUser(userId: string, email: string) {
    Sentry.setUser({
      id: userId,
      email,
    });
  }

  // Clear user (call on logout)
  clearUser() {
    Sentry.setUser(null);
  }

  // Add context to errors
  setContext(key: string, value: any) {
    Sentry.setContext(key, value);
  }

  // Add breadcrumb (track user actions leading to error)
  addBreadcrumb(message: string, category: string, data?: any) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  }

  // Manually capture error
  captureError(error: Error, context?: any) {
    if (context) {
      Sentry.setContext('errorContext', context);
    }
    Sentry.captureException(error);
  }

  // Capture message (non-error events)
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    Sentry.captureMessage(message, level);
  }
}

export default new ErrorService();
```

## Step 4: Add DSN to Environment

**Add to `.env`:**
```bash
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

**Update `app.json`:**
```json
{
  "expo": {
    "extra": {
      "SENTRY_DSN": "https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"
    }
  }
}
```

## Step 5: Initialize in App.tsx

```typescript
import errorService from './src/services/errorService';

export default function App() {
  useEffect(() => {
    // Initialize Sentry
    errorService.init();
  }, []);

  // ... rest of your app
}
```

## Step 6: Set User Context After Login

**In SignIn.tsx and SignUp.tsx:**
```typescript
import errorService from '../services/errorService';

// After successful login
const userId = user.id;
const email = user.email;

errorService.setUser(userId, email);
```

**In SignOut/Logout:**
```typescript
errorService.clearUser();
```

## Step 7: Add Error Boundaries

Create `src/components/ErrorBoundary.tsx`:

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Sentry from '@sentry/react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Oops! Something went wrong</Text>
          <Text style={styles.message}>
            We've been notified and are working on a fix.
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  button: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundary;
```

**Wrap your app in App.tsx:**
```typescript
import ErrorBoundary from './src/components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NavigationContainer>
          {/* ... */}
        </NavigationContainer>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
```

## Step 8: Add Breadcrumbs for User Actions

Track user actions to understand what led to errors:

```typescript
// In navigation
errorService.addBreadcrumb('Navigated to Interview', 'navigation', { screen: 'InterviewChat' });

// In API calls
errorService.addBreadcrumb('API call started', 'api', { endpoint: '/interview/start' });

// In user actions
errorService.addBreadcrumb('Started interview', 'user-action', { type: 'technical' });
```

## Step 9: Catch and Report Errors

**Example in API calls:**
```typescript
try {
  const response = await supabase.from('interviews').insert(data);
} catch (error) {
  console.error('Failed to save interview:', error);
  errorService.captureError(error as Error, {
    action: 'save_interview',
    interviewType: data.type,
  });
  throw error;
}
```

**Example in async operations:**
```typescript
const handleStartInterview = async () => {
  try {
    await startInterview();
  } catch (error) {
    Alert.alert('Error', 'Failed to start interview');
    errorService.captureError(error as Error, {
      screen: 'InterviewType',
      action: 'start_interview',
    });
  }
};
```

## Step 10: Test Sentry Integration

Add a test button (remove before production):

```typescript
import errorService from '../services/errorService';

// In a test screen
<Button 
  title="Test Sentry Error" 
  onPress={() => {
    errorService.captureError(new Error('Test error from app'), {
      test: true,
      screen: 'Home'
    });
  }} 
/>
```

Check Sentry dashboard to see the error appear.

## Best Practices

### DO:
- ✅ Capture errors in API calls
- ✅ Capture errors in async operations
- ✅ Add user context after login
- ✅ Add breadcrumbs for important actions
- ✅ Set context for errors (screen, action, etc)

### DON'T:
- ❌ Capture errors in development (already disabled)
- ❌ Log sensitive data (passwords, tokens)
- ❌ Capture expected errors (validation, network timeouts)
- ❌ Over-breadcrumb (only important actions)

## Monitoring in Production

1. **Check Sentry dashboard daily** for new errors
2. **Set up alerts** for high-frequency errors
3. **Review stack traces** to identify root cause
4. **Track affected users** to prioritize fixes
5. **Monitor error trends** over time

## Sentry Dashboard Features

- **Issues**: See all errors grouped by type
- **Performance**: Monitor app performance
- **Releases**: Track errors by version
- **Alerts**: Get notified of critical errors
- **Users**: See which users are affected

---

## Cost

- **Free tier**: 5,000 errors/month
- **Paid tier**: $26/month for 50,000 errors/month
- Start free, upgrade if needed
