---
permalink: /support/
---

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Support | My Interview</title>
  <meta name="description" content="Support and FAQs for My Interview, the AI interview coach app." />
  <style>
    :root {
      --navy: #1C3A6B;
      --navy-dark: #0E1A2F;
      --ink: #111827;
      --muted: #687386;
      --line: #E5EAF2;
      --soft: #F3F6FA;
      --white: #FFFFFF;
      --green: #12A474;
      --amber: #F59E0B;
      --shadow: 0 18px 48px rgba(28, 58, 107, 0.12);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--soft);
      color: var(--ink);
      line-height: 1.65;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    .nav {
      max-width: 1040px;
      margin: 0 auto;
      padding: 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--navy);
      font-weight: 900;
      letter-spacing: 0.28em;
      font-size: 13px;
    }

    .brand img {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      box-shadow: 0 10px 24px rgba(28, 58, 107, 0.16);
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 16px;
      color: var(--muted);
      font-size: 14px;
      font-weight: 750;
    }

    .nav-links a:hover {
      color: var(--navy);
    }

    .hero {
      max-width: 1040px;
      margin: 0 auto;
      padding: 54px 22px 36px;
    }

    .hero-card {
      background: var(--white);
      border: 1px solid var(--line);
      border-radius: 28px;
      padding: clamp(28px, 5vw, 52px);
      box-shadow: var(--shadow);
      position: relative;
      overflow: hidden;
    }

    .hero-card::after {
      content: "";
      position: absolute;
      right: -120px;
      top: -160px;
      width: 420px;
      height: 420px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(28,58,107,0.12), rgba(28,58,107,0) 68%);
      pointer-events: none;
    }

    .eyebrow {
      color: var(--navy);
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      margin-bottom: 14px;
    }

    h1 {
      font-size: clamp(38px, 6vw, 64px);
      line-height: 1;
      margin-bottom: 16px;
    }

    .lead {
      color: var(--muted);
      font-size: 19px;
      max-width: 760px;
      margin-bottom: 26px;
    }

    .contact-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      position: relative;
      z-index: 1;
    }

    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 50px;
      padding: 0 20px;
      border-radius: 14px;
      font-weight: 850;
      border: 1px solid transparent;
    }

    .button.primary {
      background: var(--navy);
      color: var(--white);
    }

    .button.secondary {
      background: var(--soft);
      color: var(--navy);
      border-color: var(--line);
    }

    .content {
      max-width: 1040px;
      margin: 0 auto;
      padding: 24px 22px 78px;
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 22px;
    }

    .side,
    .faq {
      background: var(--white);
      border: 1px solid var(--line);
      border-radius: 22px;
      box-shadow: 0 10px 28px rgba(15,23,42,0.04);
    }

    .side {
      padding: 20px;
      align-self: start;
      position: sticky;
      top: 18px;
    }

    .side h2 {
      font-size: 17px;
      margin-bottom: 12px;
    }

    .side a {
      display: block;
      padding: 10px 0;
      color: var(--muted);
      font-weight: 750;
      border-bottom: 1px solid var(--line);
    }

    .side a:last-child {
      border-bottom: 0;
    }

    .side a:hover {
      color: var(--navy);
    }

    .faq {
      padding: clamp(22px, 4vw, 34px);
    }

    section {
      padding: 26px 0;
      border-bottom: 1px solid var(--line);
    }

    section:first-child {
      padding-top: 0;
    }

    section:last-child {
      border-bottom: 0;
      padding-bottom: 0;
    }

    h2 {
      font-size: 28px;
      line-height: 1.15;
      margin-bottom: 16px;
      color: var(--ink);
    }

    h3 {
      font-size: 18px;
      margin: 20px 0 8px;
      color: var(--navy);
    }

    p {
      color: var(--muted);
      margin-bottom: 12px;
    }

    ul,
    ol {
      color: var(--muted);
      margin: 8px 0 16px 22px;
    }

    li {
      margin-bottom: 8px;
    }

    strong {
      color: var(--ink);
    }

    .notice {
      background: #FFF7E8;
      border: 1px solid rgba(245,158,11,0.35);
      color: #8A4B08;
      padding: 14px 16px;
      border-radius: 14px;
      margin: 16px 0;
    }

    .footer {
      background: var(--navy-dark);
      color: rgba(255,255,255,0.76);
      padding: 34px 22px;
    }

    .footer-inner {
      max-width: 1040px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 18px;
    }

    .footer strong {
      color: var(--white);
      letter-spacing: 0.2em;
      font-size: 13px;
    }

    .footer-links {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      font-weight: 700;
      font-size: 14px;
    }

    @media (max-width: 820px) {
      .content {
        grid-template-columns: 1fr;
      }

      .side {
        position: static;
      }
    }

    @media (max-width: 560px) {
      .brand span {
        display: none;
      }

      .nav-links {
        gap: 12px;
        font-size: 13px;
      }

      .contact-strip {
        display: grid;
      }

      .button {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <nav class="nav" aria-label="Main navigation">
    <a class="brand" href="/InterviewApp/">
      <img src="/InterviewApp/assets/icon.png" alt="My Interview logo" />
      <span>MY INTERVIEW</span>
    </a>
    <div class="nav-links">
      <a href="/InterviewApp/">Home</a>
      <a href="/InterviewApp/privacy">Privacy</a>
      <a href="/InterviewApp/terms">Terms</a>
    </div>
  </nav>

  <header class="hero">
    <div class="hero-card">
      <div class="eyebrow">Support centre</div>
      <h1>Help for My Interview.</h1>
      <p class="lead">Find answers about accounts, mock interviews, voice practice, CV tools, jobs, subscriptions, notifications and privacy.</p>
      <div class="contact-strip">
        <a class="button primary" href="mailto:info@interviewappcom.com">Email support</a>
        <a class="button secondary" href="#troubleshooting">Troubleshooting</a>
      </div>
    </div>
  </header>

  <main class="content">
    <aside class="side" aria-label="Support topics">
      <h2>Topics</h2>
      <a href="#getting-started">Getting started</a>
      <a href="#interviews">Interview practice</a>
      <a href="#question-bank">Question Bank</a>
      <a href="#cv">CV tools</a>
      <a href="#jobs">Job search</a>
      <a href="#subscriptions">Subscriptions</a>
      <a href="#account">Account and password</a>
      <a href="#troubleshooting">Troubleshooting</a>
      <a href="#privacy">Privacy</a>
    </aside>

    <article class="faq">
      <section id="getting-started">
        <h2>Getting started</h2>
        <h3>What is My Interview?</h3>
        <p>My Interview is an AI-powered interview coach. It helps you practise mock interviews, improve answers, review feedback, work on your CV, search jobs and build confidence before real interviews.</p>

        <h3>How do I start?</h3>
        <ol>
          <li>Create an account with your email.</li>
          <li>Add your name and target job role.</li>
          <li>Start a text or voice interview, practise in the Question Bank, or improve your CV.</li>
        </ol>

        <h3>Does it work on iPhone and iPad?</h3>
        <p>Yes. My Interview is built for iPhone and iPad.</p>
      </section>

      <section id="interviews">
        <h2>Interview practice</h2>
        <h3>Can I speak my answers?</h3>
        <p>Yes. You can practise by speaking or typing. Voice practice uses your microphone to record your answer, transcribe it and let Aya respond.</p>

        <h3>What feedback do I get?</h3>
        <p>Aya can give live conversational feedback during practice and detailed feedback after the interview, including strengths, improvements and practical coaching.</p>

        <h3>Does feedback guarantee I will get a job?</h3>
        <p>No. My Interview is a practice and coaching tool. It can help you prepare, but it cannot guarantee interviews, offers or employment outcomes.</p>
      </section>

      <section id="question-bank">
        <h2>Question Bank</h2>
        <h3>How many questions are included?</h3>
        <p>The Question Bank includes 250+ practice questions, including common interview questions, behavioural, situational, strengths, technical and role-specific prompts.</p>

        <h3>Can I add my own questions?</h3>
        <p>Yes. Use the Add button in Question Bank to create custom questions. They are saved to your account, so they can remain available after signing out and back in.</p>

        <h3>Does every question use STAR?</h3>
        <p>No. The app chooses guidance based on the type of question. Behavioural questions may use STAR, while questions like “Tell me about yourself” use a professional introduction structure instead.</p>
      </section>

      <section id="cv">
        <h2>CV tools</h2>
        <h3>Can I upload my CV?</h3>
        <p>Yes. You can upload supported files such as PDF, DOCX, DOC and TXT, or paste your CV text directly.</p>

        <h3>Why did Aya misread part of my CV?</h3>
        <p>Complex CV layouts with columns, tables, graphics or unusual spacing can be harder for AI to read accurately. For best results, use a simple linear CV and always double-check dates, sections and contact details in the improved version.</p>

        <h3>Can the app create a new CV?</h3>
        <p>Yes. You can improve an uploaded or pasted CV, and you can also create a fresh CV draft from information you enter in the app.</p>
      </section>

      <section id="jobs">
        <h2>Job search</h2>
        <h3>Can I search any job title?</h3>
        <p>Yes. You can search by job title and location, then use filters such as remote, hybrid and on-site.</p>

        <h3>Can I save jobs?</h3>
        <p>Yes. You can save jobs as favourites and mark jobs as applied so you can track what you have already acted on.</p>

        <h3>Where do job listings come from?</h3>
        <p>Job listings are provided through Adzuna. When you open a job, you may be taken to an external site to view or apply.</p>
      </section>

      <section id="subscriptions">
        <h2>Subscriptions and sector packs</h2>
        <h3>What is included in the free tier?</h3>
        <p>The free tier includes limited AI interview sessions, free Question Bank access, limited AI answer analysis, job search, tips, progress tracking and reminders.</p>

        <h3>What does Premium unlock?</h3>
        <ul>
          <li>Unlimited interview sessions</li>
          <li>Interview transcripts</li>
          <li>Full role-specific Question Bank access</li>
          <li>Unlimited AI analysis in Question Bank</li>
          <li>Continued streaks and notifications</li>
        </ul>

        <h3>What are sector packs?</h3>
        <p>Sector packs are optional one-time purchases for deeper question practice in specific areas such as NHS care, graduate, retail and management.</p>
      </section>

      <section id="account">
        <h2>Account and password</h2>
        <h3>I forgot my password. What should I do?</h3>
        <ol>
          <li>Open the Sign In screen.</li>
          <li>Tap Forgot Password.</li>
          <li>Enter your account email.</li>
          <li>Open the reset email and create a new password.</li>
        </ol>
        <div class="notice">If you use Hotmail or Outlook, password reset emails can occasionally be delayed by Microsoft. Check junk, focused/other inboxes and try again later if needed.</div>

        <h3>Can I use the same account on multiple devices?</h3>
        <p>Yes. Sign in with the same email to sync account-based data such as interview history, saved custom questions and purchase status.</p>
      </section>

      <section id="troubleshooting">
        <h2>Troubleshooting</h2>
        <h3>The app will not load.</h3>
        <ul>
          <li>Check your Wi-Fi or mobile data connection.</li>
          <li>Force-close and reopen the app.</li>
          <li>Restart your device.</li>
          <li>Install the latest app version.</li>
        </ul>

        <h3>Voice recording is not working.</h3>
        <ul>
          <li>Check microphone permission in iOS Settings.</li>
          <li>Use a quiet place and speak clearly.</li>
          <li>Force-close and reopen the app if recording gets stuck.</li>
        </ul>

        <h3>I bought Premium or a sector pack but cannot access it.</h3>
        <p>Open the purchase screen and tap Restore Purchases. Make sure you are signed into the same Apple account used for the purchase.</p>
      </section>

      <section id="privacy">
        <h2>Privacy</h2>
        <h3>Are my recordings stored?</h3>
        <p>Voice recordings are used temporarily for transcription and AI feedback. They are not intended to be stored as permanent audio files by My Interview.</p>

        <h3>Can I delete my data?</h3>
        <p>Yes. Go to Settings, then Privacy & Security in the app, or contact support for help.</p>

        <h3>How do I contact support?</h3>
        <p>Email <a href="mailto:info@interviewappcom.com"><strong>info@interviewappcom.com</strong></a>. Include your device, app version, account email and a short description of the issue.</p>
      </section>
    </article>
  </main>

  <footer class="footer">
    <div class="footer-inner">
      <strong>MY INTERVIEW</strong>
      <div class="footer-links">
        <a href="/InterviewApp/">Home</a>
        <a href="/InterviewApp/privacy">Privacy</a>
        <a href="/InterviewApp/terms">Terms</a>
        <a href="mailto:info@interviewappcom.com">Contact</a>
      </div>
    </div>
  </footer>
</body>
</html>
