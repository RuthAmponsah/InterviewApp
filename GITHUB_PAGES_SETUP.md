# GitHub Pages Setup - MY INTERVIEW App

## ✅ COMPLETED

### Files Created
- **docs/privacy.md** - Full UK GDPR-compliant privacy policy
- **docs/terms.md** - Comprehensive terms of service with subscription details
- **app.json** - Updated with GitHub Pages URLs

### URLs Configured
- Privacy Policy: `https://ruthamponsah.github.io/InterviewApp/docs/privacy`
- Terms of Service: `https://ruthamponsah.github.io/InterviewApp/docs/terms`

## 🔧 Next Step: Enable GitHub Pages

### How to Enable (5 minutes)

1. **Go to GitHub Repository Settings**
   - Visit: https://github.com/RuthAmponsah/InterviewApp
   - Click **Settings** tab (top right)

2. **Navigate to Pages Section**
   - Scroll down left sidebar
   - Click **Pages** under "Code and automation"

3. **Configure Source**
   - **Source**: Deploy from a branch
   - **Branch**: `main`
   - **Folder**: `/ (root)`
   - Click **Save**

4. **Wait for Deployment (2-5 minutes)**
   - GitHub will build and deploy your site
   - You'll see a green banner: "Your site is published at https://ruthamponsah.github.io/InterviewApp/"

5. **Verify URLs Work**
   - Privacy: https://ruthamponsah.github.io/InterviewApp/docs/privacy
   - Terms: https://ruthamponsah.github.io/InterviewApp/docs/terms

### ✅ Already Done
- ✅ Files created and committed
- ✅ Files pushed to GitHub
- ✅ URLs added to app.json
- ✅ Markdown files properly formatted

### 📱 Usage in App Stores

**App Store Connect**
- Add privacy policy URL during app submission
- Add to app description or metadata

**Google Play Console**
- Required field in "Store presence" → "Privacy policy"
- Copy-paste URL: https://ruthamponsah.github.io/InterviewApp/docs/privacy

**In-App Links**
- Settings → Privacy & Security → "Privacy Policy"
- Settings → Terms & Conditions
- Already shows placeholder text, will link to URLs when tapped

## 🎨 Optional: Custom Domain (Later)

If you want a custom domain like `https://myinterviewapp.com/privacy`:

1. Purchase domain (e.g., Namecheap, Google Domains)
2. Add CNAME file to docs/ folder with your domain
3. Configure DNS records
4. Update URLs in app.json

**Not required for launch** - GitHub Pages URLs are perfectly acceptable for app store submissions.

## 📊 Analytics (Optional)

GitHub Pages doesn't provide analytics. To track policy page views, you can:
- Add Google Analytics to markdown files (convert to HTML)
- Use simple-analytics.com
- Check GitHub Actions deploy logs

## 🔒 Security

- ✅ GitHub Pages serves over HTTPS (required by stores)
- ✅ No user data collected on policy pages
- ✅ Static pages only (no server-side code)

## ✅ Checklist

- [x] Create privacy.md and terms.md
- [x] Commit and push files to GitHub
- [x] Add URLs to app.json
- [ ] Enable GitHub Pages in repo settings (DO THIS NOW)
- [ ] Verify URLs load correctly after deployment
- [ ] Test links from App Store Connect
- [ ] Test links from Google Play Console

## 🆘 Troubleshooting

### URLs Return 404
- Wait 5 minutes for initial deployment
- Check GitHub Pages is enabled in repo settings
- Verify branch is set to `main`
- Verify files exist in docs/ folder on GitHub

### Markdown Not Rendering
- GitHub Pages automatically renders .md files as HTML
- No additional configuration needed
- Links and formatting will work automatically

### Custom 404 Page (Optional)
Create `docs/404.md` for custom error page:
```markdown
# Page Not Found

The page you're looking for doesn't exist.

[Return to Privacy Policy](/InterviewApp/docs/privacy) | [Terms of Service](/InterviewApp/docs/terms)
```

---

**Status**: Ready to enable GitHub Pages ✅  
**Time Required**: 5 minutes  
**Action Required**: Enable Pages in repo settings
