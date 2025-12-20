# Subscription & Monetization Setup

## ✅ What's Been Added

### 1. **Freemium Model**
- **Free Tier:** 5 AI mock interviews per month
- **Paid Tiers:**
  - Monthly: £7.99/month
  - Annual: £59.99/year (save 37%)

### 2. **Sector-Specific Packs**
One-time purchases:
- NHS & Care Interviews - £14.99
- Graduate & Assessment Centre - £19.99
- Retail & Customer Service - £9.99
- Management & Leadership - £14.99

### 3. **New Screens Created**
- [Subscription.tsx](src/screens/Subscription.tsx) - Beautiful paywall with gradient header
- [SectorPacks.tsx](src/screens/SectorPacks.tsx) - Sector pack purchases
- Both support light/dark mode automatically

### 4. **Settings Updated**
- Shows "FREE" badge on Subscription row
- Added helper text for subscription and packs
- Quick access to both screens

---

## 🔧 Setup Required

### Step 1: Add Database Columns

Run this SQL in **Supabase SQL Editor**:

```sql
-- Copy from add_subscription_columns.sql
ALTER TABLE user_preferences
ADD COLUMN subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'monthly', 'annual'));

ALTER TABLE user_preferences
ADD COLUMN interviews_this_month INTEGER DEFAULT 0;

ALTER TABLE user_preferences
ADD COLUMN last_interview_date TIMESTAMP;

ALTER TABLE user_preferences
ADD COLUMN subscription_expires_at TIMESTAMP;

ALTER TABLE user_preferences
ADD COLUMN purchased_packs JSONB DEFAULT '[]'::jsonb;
```

### Step 2: Test the Screens

1. **View Subscription Screen:**
   - Go to Settings → Subscription
   - See monthly/annual pricing
   - Click "Start Annual Plan" (mock purchase)

2. **View Sector Packs:**
   - Go to Settings → Sector Packs
   - See all 4 packs
   - Click "Buy Now" on any pack (mock purchase)

### Step 3: Integrate Real Payments (Later)

For production, integrate with:

**Option A: RevenueCat (Recommended for mobile)**
- Handles iOS App Store & Google Play billing
- Simplifies subscription management
- Free up to $2,500/month
- https://www.revenuecat.com/

**Option B: Stripe**
- More control, more complex
- Good for web + mobile
- Requires more backend setup

---

## 📝 Mock Data Currently

Right now, subscriptions are **mocked**:
- Clicking "Subscribe" shows alert and navigates back
- Clicking "Buy Pack" shows alert and marks as purchased
- No actual payment processing

When ready for production:
1. Set up payment provider
2. Replace `handleSubscribe()` and `handlePurchase()` functions
3. Update subscription status in database
4. Implement server-side verification

---

## 🎨 UI Design

Styled like Flo app:
- Gradient header (purple/pink for light, dark blues for dark mode)
- Clean card-based design
- "BEST VALUE" and "POPULAR" badges
- Smooth transitions
- Professional pricing display

---

## 🚀 Next Steps

1. ✅ Run SQL to add columns
2. ✅ Test both screens in app
3. ⏳ Enforce 5-interview limit (coming next)
4. ⏳ Show paywall when limit hit
5. ⏳ Track interview count per month
6. ⏳ Integrate real payment provider (production)

---

## 💡 Tips

- Free users see "5 interviews per month" in Settings
- Premium users see "Unlimited interviews"
- Sector packs work for both free and premium users
- Annual plan has 37% discount to encourage commitment
- UK pricing (£ GBP) for psychological appeal to UK students
