# Testing the CV Improvement Feature

## 🧪 How to Test

### Prerequisites
1. Make sure you've run the SQL migration: `add_cv_suggestions_table.sql` in Supabase
2. Restart the Expo app: `npx expo start -c` (clear cache)
3. Have a CV ready to paste (at least 50 characters)
4. Set a target job role in Job Preferences

### Test Steps

#### 1. Upload/Paste CV
1. Navigate to "My Profile" → "View CV"
2. Paste your CV content into the text input field
3. Verify: Text appears in the input box
4. Verify: Clear button (X) appears when text is present

#### 2. Analyze CV
1. Click "Analyze with Aya" button
2. Wait for analysis (should take 3-5 seconds)
3. **Expected console logs:**
   ```
   🔍 Starting CV analysis for role: [Your Role]
   📝 CV text length: [number]
   ✅ AI analysis complete, suggestions: 6
   💾 Saving suggestions to database: 6
   ✅ Suggestions saved, data length: 6
   ```
4. Verify: 6-8 suggestions appear below the text box
5. Verify: Each suggestion has:
   - Category label (e.g., "SKILLS", "CONTENT")
   - Checkbox (unchecked initially)
   - Suggestion text
6. Verify: Progress bar shows 0% or low percentage

#### 3. Test Suggestion Checkboxes
1. Tap on any suggestion
2. Verify: Checkbox fills with blue background and checkmark
3. Verify: Text gets strikethrough
4. Verify: Progress bar updates
5. Tap again to uncheck
6. Verify: Checkbox reverts, strikethrough removed

#### 4. Generate Improved CV ✨
1. Click "Generate Improved CV ✨" button
2. Verify: Button shows "Generating..." loading state
3. Wait 5-10 seconds (AI generates full CV rewrite)
4. **Expected console logs:**
   ```
   🎨 Generating improved CV for role: [Your Role]
   ✅ Improved CV generated, length: [number]
   ✅ All suggestions marked as complete
   ```
5. Verify: Alert appears: "CV Improved! ✨"
6. Verify: ALL suggestions are now checked (auto-completed)
7. Verify: Progress bar shows 100%
8. Verify: Improved CV section appears below

#### 5. View Improved CV
1. Scroll down to "Your Improved CV" section
2. Verify: Section has sparkles icon (✨)
3. Verify: "Coming Soon: Download as DOCX file" banner visible
4. Verify: Improved CV text is displayed in scrollable container
5. Verify: CV text is formatted and readable
6. Verify: Content is enhanced version of your original CV

#### 6. Copy to Clipboard
1. Click "Copy to Clipboard" button
2. Verify: Button changes to:
   - Green border
   - Checkmark icon
   - "Copied!" text
3. Verify: Alert appears: "Copied! 📋"
4. Open Notes app or any text editor
5. Paste (Cmd+V / Ctrl+V)
6. Verify: Full improved CV pastes successfully
7. Wait 3 seconds
8. Verify: Copy button resets to original state

#### 7. Pull to Refresh
1. Pull down on the screen
2. Verify: Refresh spinner appears
3. Verify: Data reloads
4. Verify: Suggestions and improved CV persist

#### 8. Re-analyze CV
1. Click "Re-analyze CV" button (refresh icon)
2. Verify: New analysis starts
3. Verify: Old improved CV is replaced with new one
4. Verify: Suggestions reset and update

### Expected Behavior

#### Analysis Success ✅
- Takes 3-5 seconds
- Returns 6-8 specific suggestions
- Suggestions reference actual CV content
- Suggestions are personalized (not generic)
- Console shows success logs

#### Improvement Success ✅
- Takes 5-10 seconds
- Returns full rewritten CV
- Maintains factual information
- Improves writing quality
- Auto-checks all suggestions
- Shows in scrollable container

#### Copy Success ✅
- Works on first click
- Pastes full CV text
- Button shows success feedback
- Resets after 3 seconds

### Common Issues & Solutions

#### ❌ "Table not found" error
**Solution:** Run `add_cv_suggestions_table.sql` in Supabase SQL Editor

#### ❌ "No CV found" alert
**Solution:** Paste CV text in the text input field (minimum 50 characters)

#### ❌ "Job Role Required" alert
**Solution:** Set target job role in Settings → Job Preferences

#### ❌ Suggestions not appearing
**Check:**
- Console for error logs
- Database table exists
- User is authenticated
- Network connection

#### ❌ Improved CV not generating
**Check:**
- Console for API errors
- Groq API key in .env file
- Network connection
- CV text is present

#### ❌ Copy not working
**Check:**
- Device permissions (if needed)
- expo-clipboard is installed
- Try on physical device (may not work in simulator)

### Performance Benchmarks

| Action | Expected Time | Max Time |
|--------|--------------|----------|
| Analyze CV | 3-5 seconds | 10 seconds |
| Generate Improved CV | 5-10 seconds | 20 seconds |
| Copy to Clipboard | Instant | 1 second |
| Load saved data | Instant | 2 seconds |

### Data Validation

#### Suggestions Should Include:
- Category (Skills, Content, Experience, Keywords, etc.)
- Specific observation about YOUR CV
- Actionable improvement advice
- Reference to actual CV content

#### Improved CV Should Include:
- All original factual info (names, dates, companies)
- Enhanced action verbs
- Better formatting/structure
- Quantified achievements where possible
- Role-specific keywords
- Professional tone
- Improved readability

### Dark Mode Testing
1. Toggle dark mode in Settings
2. Verify: All new UI elements adapt correctly
3. Check:
   - Improved CV section background
   - Text colors readable
   - Button contrast
   - Banner colors
   - Coming Soon banner visible

### Edge Cases to Test

#### Empty CV
- Paste only 20 characters → Should show alert

#### Very Long CV
- Paste 5000+ word CV → Should handle gracefully
- Check scrolling works
- Check copy includes full text

#### Special Characters
- Paste CV with emojis, symbols → Should preserve them
- Copy and paste → Should maintain formatting

#### Interruptions
- Start generation → Background app → Return
- Should continue or show clear error

#### No Internet
- Try to analyze offline → Should show error
- Improved CV section should persist if already generated

### Success Criteria
✅ Analysis completes in under 10 seconds  
✅ Suggestions are specific and helpful  
✅ Improved CV is readable and professional  
✅ Copy function works reliably  
✅ Auto-check all suggestions works  
✅ Progress bar updates correctly  
✅ UI is responsive and smooth  
✅ Works in both light and dark mode  
✅ Error messages are clear and helpful  
✅ Data persists after app restart  

---

## 🐛 Bug Reporting Template

If you encounter issues, report with:

```
**Issue:** [Brief description]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected:** [What should happen]
**Actual:** [What actually happened]

**Console Logs:** [Copy error logs]

**Device:** iPhone 14 / Android Pixel 7
**OS Version:** iOS 17 / Android 13
**App Version:** [Current version]

**Screenshot:** [If applicable]
```

---

**Test Date:** _____________  
**Tested By:** _____________  
**Status:** ⬜ Pass  ⬜ Fail  ⬜ Partial  
**Notes:** _____________________________________
