import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import type { InterviewLevelMode } from '../navigation/RootNavigator';

console.log('✅ AI services will use Supabase Edge Function secrets.');

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

type GroqChatRequest = {
  messages: ChatMessage[];
  model: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
  response_format?: { type: 'json_object' };
};

type GroqChatResponse = {
  choices: Array<{
    message: {
      content?: string;
    };
  }>;
};

const createGroqChatCompletion = async (body: GroqChatRequest): Promise<GroqChatResponse> => {
  const { data, error } = await supabase.functions.invoke<GroqChatResponse>('groq-chat', {
    method: 'POST',
    body,
  });

  if (error) {
    throw new Error(error.message || 'AI service is unavailable right now.');
  }

  return data || { choices: [] };
};

type SupportAgentReply = {
  answer: string;
  askClarify?: boolean;
  clarifyQuestion?: string;
  refuse?: boolean;
  suggestedHelp?: string;
};

const SUPPORT_KB = `APP CONTEXT (My Interview)
- Core: AI mock interviews with Aya, feedback after sessions.
- Start interview: Home -> choose mode (text/voice), then questions and feedback.
- Feedback screen: shows summary and transcript after an interview.
- Job Preferences: Settings -> Job Preferences, set or change target role.
- CV: paste CV text -> Analyse CV -> suggestions and improved CV.
- Jobs: browse jobs, filter by location and work type, save jobs.
- Interview History: view past sessions, delete entries.
- Progress Dashboard: stats and milestones.
- Question Bank: extra practice questions.
- Success Stories: read and share wins.
- Profile: Settings -> Edit Profile, update name, photo, bio.
- App customisation: Settings -> App customisation (Light, Dark, Match system).
- Privacy & Security: manage account, export/delete data.
- Notifications: manage app alerts.
- Subscription: optional upgrades.
- Support: Help centre FAQs and Contact support (email).
`;

const parseSupportReply = (text: string): SupportAgentReply | null => {
  if (!text) return null;
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/```\n?/g, '');
  }

  try {
    const parsed = JSON.parse(cleaned) as SupportAgentReply;
    if (!parsed.answer || typeof parsed.answer !== 'string') return null;
    return parsed;
  } catch (error) {
    return null;
  }
};

export const getSupportAgentReply = async (userQuestion: string): Promise<SupportAgentReply> => {
  const prompt = `You are a support agent for the My Interview app.
You MUST ONLY answer questions about this app. If the question is outside the app, refuse and suggest contacting support.
Use UK English spelling and phrasing throughout.

${SUPPORT_KB}

User question: ${userQuestion}

Return ONLY valid JSON in this exact format:
{
  "answer": "string",
  "askClarify": true|false,
  "clarifyQuestion": "string",
  "refuse": true|false,
  "suggestedHelp": "string"
}

Rules:
- If the question is about the app: refuse=false, answer helpfully, and optionally suggest where in the app to find it.
- If the question is unclear: askClarify=true with a short clarifying question.
- If the question is outside the app: refuse=true and suggestedHelp should say: "Go back and tap Contact support to email the team."
`;

  try {
    const completion = await createGroqChatCompletion({
      messages: [
        {
          role: 'system',
          content: 'You are a strict app-only support agent. Only answer questions about My Interview. Use UK English. Respond in JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const parsed = parseSupportReply(responseText);
    if (parsed) return parsed;
  } catch (error) {
    console.error('Support agent error:', error);
  }

  return {
    answer: 'I can help with app features, settings, CV tips, jobs, and interview practice. What part of the app is this about?',
    askClarify: true,
    clarifyQuestion: 'Is this about interviews, CVs, jobs, or account settings?',
    refuse: false,
    suggestedHelp: 'Go back and tap Contact support to email the team.',
  };
};

// Common interview questions by category (most popular first)
const COMMON_QUESTIONS = {
  opener: "Tell me about yourself and why you're interested in this role.",
  behavioral: [
    "Tell me about a time you faced a significant challenge at work. How did you handle it?",
    "Describe a situation where you had to work with a difficult colleague or client.",
    "Give me an example of a goal you achieved and how you reached it.",
    "Tell me about a time you made a mistake. How did you handle it?",
    "Describe a situation where you had to meet a tight deadline.",
    "Tell me about a time you showed leadership.",
    "Give an example of when you had to adapt to a major change.",
    "Describe a time you went above and beyond for a customer or project.",
    "Tell me about a conflict you resolved at work.",
    "Give an example of when you had to learn something new quickly.",
    "Tell me about a time you had to persuade someone to see things differently.",
    "Describe a time you received difficult feedback. What did you do with it?",
    "Give me an example of when you had to take initiative without being asked.",
    "Tell me about a time you improved a process or way of working.",
    "Describe a time you had to stay calm under pressure.",
    "Give me an example of when you worked as part of a successful team.",
    "Tell me about a time you had to manage competing priorities.",
    "Describe a time you helped someone else succeed.",
    "Tell me about a time you disagreed with a decision. How did you handle it?",
    "Give me an example of when you delivered excellent service.",
    "Tell me about a time you had to make a decision with limited information.",
    "Describe a time you had to build trust with someone quickly.",
  ],
  general: [
    "What are your greatest strengths?",
    "What do you consider your weaknesses?",
    "Where do you see yourself in 5 years?",
    "Why are you leaving your current position?",
    "What motivates you in your work?",
    "How do you handle stress and pressure?",
    "What's your ideal work environment?",
    "How do you prioritise your tasks?",
    "What are you most proud of in your career?",
    "What do you know about our company?",
    "Why do you want this role?",
    "What makes you a good fit for this position?",
    "What kind of manager helps you do your best work?",
    "How do you like to receive feedback?",
    "What skills are you currently trying to improve?",
    "How would your colleagues describe you?",
    "What would you like to achieve in your first 90 days?",
    "Why should we hire you?",
    "What does success look like to you in this role?",
    "What attracted you to this company or sector?",
  ],
  closing: [
    "Do you have any questions for me?",
    "Is there anything else you'd like to add that we haven't covered?",
  ]
};

// Role-specific scenario questions
const ROLE_SPECIFIC_SCENARIOS: Record<string, string[]> = {
  'Software Engineer': [
    'You find a critical bug in production affecting thousands of users. Walk me through how you would approach debugging and fixing it.',
    'Describe your approach to designing scalable system architecture for a feature that needs to handle millions of requests.',
    'How would you handle a situation where a teammate\'s code quality is poor and impacting the team\'s velocity?',
    'Tell me about a time you had to optimise code or database queries. What was the challenge and how did you solve it?',
    'How would you explain a technical trade-off to a non-technical stakeholder?',
    'Walk me through how you test a feature before it reaches production.',
    'Describe how you would approach refactoring a messy part of a codebase.',
    'How do you decide whether to build a quick fix or a more robust long-term solution?',
    'Tell me about a time you worked with product or design to shape a technical solution.',
    'How would you investigate a performance issue that only happens for some users?',
  ],
  'DevOps Engineer': [
    'A deployment fails shortly before release. Walk me through how you would investigate and respond.',
    'How would you improve a CI/CD pipeline that is slow and unreliable?',
    'Tell me about how you would monitor a production system and spot issues early.',
    'How would you handle an incident where users are affected but the root cause is unclear?',
    'Describe how you would balance release speed with system stability.',
    'How would you explain infrastructure risk to a non-technical stakeholder?',
    'Walk me through how you would approach automating a repeated operational task.',
    'How do you make sure environments are secure, consistent and recoverable?',
  ],
  'Machine Learning Engineer': [
    'Walk me through how you would take a machine learning model from experiment to production.',
    'How would you evaluate whether a model is performing well enough for real users?',
    'Tell me about how you would handle poor-quality or biased training data.',
    'How would you explain a model decision or limitation to a non-technical stakeholder?',
    'Describe how you would monitor model performance after deployment.',
    'How would you decide whether a machine learning solution is actually needed?',
    'What would you do if a model performed well in testing but poorly in production?',
    'How would you balance accuracy, speed, cost and explainability?',
  ],
  'Quality Assurance Engineer': [
    'A release is approaching and you find a serious defect. How would you handle it?',
    'Walk me through how you would create a test plan for a new feature.',
    'How would you decide what should be automated versus tested manually?',
    'Tell me about a time you found a bug that others had missed.',
    'How would you communicate a difficult defect to developers or product managers?',
    'Describe how you would test an edge case that is hard to reproduce.',
    'How do you balance thorough testing with tight delivery timelines?',
    'What would you do if requirements were unclear but testing needed to begin?',
  ],
  'Data Analyst': [
    'Imagine you discover an unexpected spike in user behaviour in your analytics. How would you investigate the root cause?',
    'Walk me through how you would approach a project to improve customer retention using data analysis.',
    'Describe a time you had to present complex data findings to non-technical stakeholders. How did you simplify it?',
    'How would you validate the accuracy of a large dataset before using it for critical business decisions?',
    'How would you handle missing or inconsistent data in a report?',
    'Walk me through how you would define the right metrics for a new business dashboard.',
    'Tell me about a time your analysis changed someone\'s decision.',
    'How would you explain correlation versus causation to a stakeholder?',
    'Describe your process for turning a vague business question into an analysis plan.',
    'How do you make sure your visualisations are clear and not misleading?',
  ],
  'Cyber Security': [
    'You detect unusual network activity that could indicate a security breach. What steps would you take immediately?',
    'Walk me through your approach to conducting a security audit of a company\'s systems.',
    'How would you prioritise security issues with limited resources? Give me an example.',
    'Describe a time you had to explain security risks to management and get approval for expensive security measures.',
  ],
  'IT Support': [
    'A critical system goes down affecting the entire department. Walk me through your troubleshooting process.',
    'How would you handle an aggressive user frustrated with a technical issue?',
    'Tell me about a time you solved a complex technical problem that no one else could figure out.',
    'Describe how you would document a recurring issue and create a knowledge base solution for users.',
  ],
  'Security': [
    'You notice suspicious behaviour on site. How would you respond while keeping people safe?',
    'How would you handle a member of the public who becomes aggressive?',
    'Tell me about how you would follow procedures during an emergency.',
    'How would you balance being approachable with maintaining authority?',
    'Describe how you would complete an accurate incident report.',
    'What would you do if someone refused to follow site rules?',
    'How would you manage access control during a busy period?',
    'How would you stay alert and professional during a long shift?',
  ],
  'Project Manager': [
    'A project is way behind schedule due to unexpected technical issues. How would you get it back on track?',
    'Walk me through how you would manage competing priorities from multiple stakeholders.',
    'Tell me about a project failure. What did you learn and how would you prevent it?',
    'Describe how you would handle scope creep from a demanding client without derailing the timeline.',
    'How would you handle a key stakeholder who keeps changing their mind?',
    'Tell me about how you would manage risks on a high-pressure project.',
    'How do you keep a team motivated when a project becomes difficult?',
    'Walk me through how you would run a project kick-off meeting.',
    'How would you communicate a delay to senior leadership?',
    'Describe how you would prioritise tasks when everything feels urgent.',
  ],
  'Sales': [
    'A prospect says "Your product is too expensive compared to competitors." How do you respond?',
    'Walk me through your approach to prospecting and building a sales pipeline.',
    'Tell me about your biggest deal. How did you close it?',
    'How would you handle a long sales cycle with multiple decision-makers? Give me a specific example.',
  ],
  'Customer Service': [
    'A customer is extremely upset about a product failure. How would you handle this interaction?',
    'Tell me about a time you went above and beyond to retain a customer.',
    'Walk me through how you would respond to a negative online review.',
    'Describe a situation where you had to deny a customer request. How did you handle it professionally?',
    'How would you calm a customer who feels they have been ignored?',
    'Tell me about a time you turned a poor customer experience around.',
    'How do you balance empathy with following company policy?',
    'Describe how you would handle a queue of customers while one person needs extra help.',
    'How would you explain a complicated policy in simple language?',
    'Tell me about a time you had to deal with repeated complaints about the same issue.',
  ],
  'Marketing': [
    'You\'re launching a new campaign with a limited budget. Walk me through your strategy.',
    'Tell me about a marketing campaign you\'re proud of. What were the results?',
    'How would you measure the success of a marketing initiative? What metrics matter most?',
    'Describe how you\'d use social media data to optimise a targeted advertising campaign.',
    'How would you adapt campaign messaging for a different audience?',
    'Tell me about a time a campaign did not perform as expected. What did you change?',
    'How would you prioritise channels if your budget was reduced?',
    'Walk me through how you would create content for a new product launch.',
    'How do you balance creativity with commercial goals?',
    'Describe how you would use customer insight to improve a campaign.',
  ],
  'Product Manager': [
    'You\'re prioritising features for the next product release. How would you make that decision?',
    'Walk me through how you would approach a feature that has competing user requests.',
    'Tell me about a product decision you made that didn\'t perform as expected. How did you respond?',
    'How would you work with engineering and design teams when they disagree on a feature implementation?',
  ],
  'Business Analyst': [
    'A stakeholder gives you a vague request for a new process or system. How would you turn that into clear requirements?',
    'Walk me through how you would map a broken business process and identify improvements.',
    'Tell me about a time you had to balance user needs with business constraints.',
    'How would you handle conflicting requirements from two senior stakeholders?',
    'Describe how you would test whether a process change actually improved performance.',
    'How would you explain a technical requirement to a non-technical team?',
    'Tell me about a time you used data or evidence to challenge an assumption.',
    'How would you prioritise requirements when the delivery team has limited time?',
  ],
  'Graduate Trainee': [
    'Why are you interested in this graduate or trainee programme?',
    'Tell me about a time you learned something difficult quickly.',
    'How would you approach rotating through different teams or departments?',
    'Describe how you would ask for feedback and use it to improve.',
    'How would you contribute while you are still learning the role?',
    'Tell me about a time you showed potential beyond your experience level.',
    'How would you handle being given responsibility earlier than expected?',
    'What would you do in your first three months to build credibility?',
  ],
  'Human Resources': [
    'An employee raises a sensitive workplace concern. How would you handle it professionally?',
    'Walk me through how you would support a manager dealing with poor performance in their team.',
    'Tell me about how you would keep recruitment fair, consistent and inclusive.',
    'How would you handle confidential employee information?',
    'Describe how you would manage a difficult conversation about absence or conduct.',
    'How would you help a new starter settle into the organisation?',
    'Tell me about a time you had to apply a policy while still showing empathy.',
    'How would you improve the candidate experience during recruitment?',
  ],
  'Healthcare': [
    'A patient comes in with unclear symptoms. Walk me through your diagnostic approach.',
    'Tell me about a time you had to deliver difficult news to a patient. How did you handle it?',
    'Describe how you would handle a high-stress emergency situation.',
    'How do you stay current with medical best practices and changes in healthcare?',
    'How would you handle a patient who refuses recommended care?',
    'Tell me about a time you had to communicate with a worried family member.',
    'How do you balance compassion with maintaining professional boundaries?',
    'Describe how you would prioritise care when several patients need support.',
    'How would you respond if you noticed a colleague making a potential safety mistake?',
    'Tell me about how you maintain accurate records under pressure.',
  ],
  'Teaching': [
    'You have a disruptive student in class. How would you handle this situation?',
    'Walk me through how you would design a lesson plan to engage students with different learning styles.',
    'Tell me about a time a student struggled to understand a concept. How did you help them?',
    'How do you measure student success and adjust your teaching methods accordingly?',
    'How would you build positive relationships with a new class?',
    'Tell me about how you would support a pupil with low confidence.',
    'How do you adapt your teaching when a lesson is not landing?',
    'Describe how you would communicate progress or concerns to parents or carers.',
    'How would you promote inclusion in your classroom?',
    'Tell me about a time you used feedback to improve your teaching practice.',
  ],
  'Finance': [
    'You\'re analysing a company\'s financial statements and notice concerning trends. What\'s your approach?',
    'Walk me through how you would build a financial forecast for a new business initiative.',
    'Tell me about a time you caught a major financial error. How did you handle it?',
    'Describe your approach to risk assessment and mitigation in financial planning.',
    'How would you explain a budget variance to a non-finance colleague?',
    'Walk me through how you would check the accuracy of a financial report.',
    'Tell me about a time you had to meet a strict month-end or reporting deadline.',
    'How would you prioritise competing finance tasks during a busy period?',
    'Describe how you would handle confidential financial information.',
    'How would you investigate an unexplained reconciliation difference?',
  ],
  'Administrative Assistant': [
    'You have several urgent requests from different people at once. How would you prioritise them?',
    'Walk me through how you would organise a busy diary or meeting schedule.',
    'Tell me about a time you spotted an error before it caused a problem.',
    'How would you handle confidential documents or sensitive information?',
    'Describe how you would support a team during a particularly busy period.',
    'How would you deal with a visitor or caller who is frustrated?',
    'Tell me about a time you improved an admin process or made something more efficient.',
    'How do you stay organised when tasks keep changing during the day?',
  ],
  'Facilities': [
    'A maintenance or facilities issue is affecting people using the building. How would you respond?',
    'How would you prioritise several site tasks that all feel urgent?',
    'Tell me about a time you kept standards high during a busy or repetitive shift.',
    'How would you report a safety issue or repair need clearly?',
    'Describe how you would work around others while causing minimal disruption.',
    'What would you do if you noticed equipment, cleaning or site standards slipping?',
    'How would you manage a task that required attention to detail and physical stamina?',
    'How would you handle a request from someone frustrated about the building or environment?',
  ],
  'Retail': [
    'A customer is unhappy with a purchase and wants an immediate solution. How would you handle it?',
    'Tell me about a time you delivered excellent customer service in a busy environment.',
    'How would you approach meeting sales targets without being pushy?',
    'Describe how you would manage stock, displays or store standards during a busy shift.',
    'How would you handle a customer complaint while other customers are waiting?',
    'Tell me about a time you worked well as part of a shop floor team.',
    'How would you respond if you noticed a colleague not following store procedures?',
    'What would you do if the shop suddenly became very busy and short-staffed?',
  ],
  'Hospitality': [
    'A guest complains that their experience has not met expectations. How would you recover the situation?',
    'Tell me about a time you stayed calm during a very busy service.',
    'How would you manage competing guest requests when time is limited?',
    'Describe how you maintain high standards when the work is repetitive or physically demanding.',
    'How would you handle a booking, order or room issue that was not your fault?',
    'Tell me about a time you worked closely with kitchen, front-of-house or housekeeping teams.',
    'How would you make a guest feel welcome from the first interaction?',
    'What would you do if a guest became rude or aggressive?',
  ],
  'Legal': [
    'You are given a large amount of information with a tight deadline. How would you organise your review?',
    'Walk me through how you would check the accuracy of a legal document or case file.',
    'Tell me about a time attention to detail helped you avoid a mistake.',
    'How would you handle confidential client information?',
    'Describe how you would explain a complex issue clearly to a client or colleague.',
    'How would you manage competing deadlines from different matters?',
    'Tell me about a time you had to research something unfamiliar quickly.',
    'How would you respond if you noticed an inconsistency in a document before submission?',
  ],
  'Engineering': [
    'You are asked to solve a technical issue with limited information. How would you approach it?',
    'Walk me through how you would balance safety, cost and quality on a project.',
    'Tell me about a time you identified a fault or risk before it became serious.',
    'How would you explain a technical problem to a non-technical stakeholder?',
    'Describe how you would manage a project where specifications changed late.',
    'How do you check that your work meets required standards and regulations?',
    'Tell me about a time you worked with different trades, teams or departments to solve a problem.',
    'How would you handle pressure when a technical deadline is approaching?',
  ],
  'Architecture': [
    'Walk me through how you would respond to a client brief that is ambitious but constrained by budget.',
    'How would you balance design quality, regulations, sustainability and practicality?',
    'Tell me about how you would communicate a design idea to a non-technical client.',
    'How would you respond if planning, safety or building requirements changed late?',
    'Describe how you would review drawings or specifications for accuracy.',
    'How would you work with engineers, contractors or consultants on a complex project?',
    'What would you do if a client wanted something that created a compliance risk?',
    'How would you manage feedback on a design you had invested a lot of work in?',
  ],
  'Construction': [
    'A site task is delayed and other trades are affected. How would you respond?',
    'How would you keep safety at the centre of your work on a busy site?',
    'Tell me about a time you solved a practical problem under pressure.',
    'How would you handle unclear instructions on site?',
    'Describe how you would coordinate with different trades or supervisors.',
    'What would you do if you noticed a potential hazard?',
    'How would you balance speed, quality and safety?',
    'How would you maintain standards during physically demanding work?',
  ],
  'Operations Manager': [
    'You need to reduce operational costs by 20% without impacting quality. How would you approach this?',
    'Walk me through how you would optimise a broken process.',
    'Tell me about a time you implemented a major operational change. What were the challenges?',
    'How would you measure operational efficiency, and what metrics do you track?',
    'How would you handle a sudden staffing issue that affects service delivery?',
    'Tell me about how you would improve quality while keeping productivity high.',
    'Describe how you would deal with repeated delays in a workflow.',
    'How would you get a team to adopt a new process they are resistant to?',
  ],
  'Warehouse': [
    'You notice an order-picking error that could affect a customer delivery. What would you do?',
    'Tell me about a time you worked accurately under time pressure.',
    'How would you keep safe while working quickly in a warehouse environment?',
    'Describe how you would handle a busy shift with changing priorities.',
    'How would you respond if stock levels did not match the system?',
    'Tell me about a time you worked well as part of a warehouse or logistics team.',
    'What would you do if you noticed unsafe behaviour on the floor?',
    'How would you maintain quality when the workload is repetitive?',
  ],
  'Driving': [
    'You are delayed on a route and customers are waiting. How would you handle the situation?',
    'Tell me about how you keep safety at the centre of your driving work.',
    'How would you deal with an unhappy customer during a delivery or journey?',
    'Describe how you would plan a route with several time-sensitive stops.',
    'What would you do if your vehicle developed a fault during a shift?',
    'How do you stay calm and professional during traffic, delays or pressure?',
    'Tell me about a time you followed procedures carefully to avoid a problem.',
    'How would you handle paperwork, proof of delivery or route records accurately?',
  ],
  'Design': [
    'A client or stakeholder dislikes your first design direction. How would you respond?',
    'Walk me through how you would turn a brief into a finished design.',
    'Tell me about a time you used feedback to improve your work.',
    'How would you balance user needs, brand guidelines and business goals?',
    'Describe how you would explain a design decision to a non-designer.',
    'How do you prioritise design work when deadlines are tight?',
    'Tell me about a project where your design improved the user experience.',
    'How would you handle conflicting feedback from different stakeholders?',
  ],
  'Personal Trainer': [
    'How would you assess a new client\'s goals, fitness level and confidence?',
    'What would you do if a client was losing motivation?',
    'How would you adapt a session for someone with different ability or limitations?',
    'Tell me about how you would build trust with a nervous client.',
    'How would you keep sessions safe while still challenging the client?',
    'Describe how you would track progress and adjust a training plan.',
    'How would you handle a client who wanted unrealistic results quickly?',
    'How would you explain technique or safety in a simple, encouraging way?',
  ],
};

type InterviewQuestionSet = {
  behavioural: string[];
  general: string[];
  scenarios: string[];
};

const INTERVIEW_LEVEL_CONFIG: Record<InterviewLevelMode, {
  label: string;
  behaviouralCount: number;
  generalCount: number;
  scenarioCount: number;
  opener: (jobRole: string) => string;
  guidance: string;
}> = {
  guided: {
    label: 'Guided Practice',
    behaviouralCount: 3,
    generalCount: 2,
    scenarioCount: 1,
    opener: () => COMMON_QUESTIONS.opener,
    guidance: 'Use a supportive beginner-friendly style. Give clearer prompts, explain what you are looking for when needed, and keep follow-ups gentle.',
  },
  standard: {
    label: 'Standard Mock Interview',
    behaviouralCount: 3,
    generalCount: 2,
    scenarioCount: 1,
    opener: () => COMMON_QUESTIONS.opener,
    guidance: 'Run a balanced realistic mock interview with natural pacing and useful but concise follow-ups.',
  },
  realistic: {
    label: 'Realistic Interview',
    behaviouralCount: 3,
    generalCount: 2,
    scenarioCount: 1,
    opener: () => COMMON_QUESTIONS.opener,
    guidance: 'Run this like a real interview. Keep it warm, but expect specific answers and ask concise follow-ups when detail is missing.',
  },
  challenge: {
    label: 'Challenge Mode',
    behaviouralCount: 3,
    generalCount: 2,
    scenarioCount: 1,
    opener: () => COMMON_QUESTIONS.opener,
    guidance: 'Make this harder. Challenge vague claims, ask sharper follow-ups, and push the user to give evidence, impact and clearer structure.',
  },
  quick: {
    label: 'Quick Practice',
    behaviouralCount: 1,
    generalCount: 0,
    scenarioCount: 0,
    opener: (jobRole) => `What would you like the interviewer to remember about you as a ${jobRole} candidate?`,
    guidance: 'Keep this short and casual. Ask only the listed quick-practice questions, give brief encouragement, then wrap up.',
  },
  technical: {
    label: 'Technical Interview',
    behaviouralCount: 1,
    generalCount: 1,
    scenarioCount: 3,
    opener: (jobRole) => `Talk me through your relevant experience for this kind of ${jobRole} work.`,
    guidance: 'Focus on practical role knowledge, decision-making, trade-offs, process and evidence. Ask role-specific or technical follow-ups where appropriate.',
  },
};

const ROLE_SCENARIO_ALIASES: Record<string, string> = {
  'Accountant': 'Finance',
  'Accounting': 'Finance',
  'Accounts Assistant': 'Finance',
  'Accounts Payable Assistant': 'Finance',
  'Accounts Receivable Assistant': 'Finance',
  'Assistant Accountant': 'Finance',
  'Bookkeeper': 'Finance',
  'Finance Assistant': 'Finance',
  'Junior Accountant': 'Finance',
  'Junior Finance Analyst': 'Finance',
  'Payroll Assistant': 'Finance',
  'Trainee Accountant': 'Finance',
  'Software Developer': 'Software Engineer',
  'Junior Software Developer': 'Software Engineer',
  'Mobile Developer': 'Software Engineer',
  'Web Developer': 'Software Engineer',
  'Data Administrator': 'Data Analyst',
  'Data Engineer': 'Data Analyst',
  'Data Entry Clerk': 'Data Analyst',
  'Data Scientist': 'Data Analyst',
  'Junior Data Analyst': 'Data Analyst',
  'Digital Marketing Assistant': 'Marketing',
  'Digital Marketing Specialist': 'Marketing',
  'Marketing Assistant': 'Marketing',
  'Social Media Assistant': 'Marketing',
  'Social Media Manager': 'Marketing',
  'Customer Service Associate': 'Customer Service',
  'Customer Service Representative': 'Customer Service',
  'Customer Success Manager': 'Customer Service',
  'Front Desk Agent': 'Customer Service',
  'Guest Services Agent': 'Customer Service',
  'Project Coordinator': 'Project Manager',
  'Helpdesk Analyst': 'IT Support',
  'IT Technician': 'IT Support',
  'Security Guard': 'Security',
  'Security Officer': 'Security',
  'Account Manager': 'Sales',
  'Business Development': 'Sales',
  'Sales Assistant': 'Sales',
  'Sales Manager': 'Sales',
  'Administrative Assistant': 'Administrative Assistant',
  'Administrator': 'Administrative Assistant',
  'Office Administrator': 'Administrative Assistant',
  'Office Manager': 'Administrative Assistant',
  'Receptionist': 'Administrative Assistant',
  'Dispatcher': 'Administrative Assistant',
  'HR Assistant': 'Human Resources',
  'Recruiter': 'Human Resources',
  'Recruitment Consultant': 'Human Resources',
  'Legal Assistant': 'Legal',
  'Paralegal': 'Legal',
  'Content Writer': 'Marketing',
  'Graphic Designer': 'Design',
  'Product Designer': 'Design',
  'UX Researcher': 'Design',
  'UX/UI Designer': 'Design',
  'Web Designer': 'Design',
  'Construction Laborer': 'Construction',
  'Construction Manager': 'Construction',
  'Electrician': 'Engineering',
  'Mechanical Engineer': 'Engineering',
  'Apprentice Electrician': 'Engineering',
  'Apprentice Plumber': 'Engineering',
  'Maintenance Technician': 'Engineering',
  'Painter': 'Engineering',
  'Quantity Surveyor': 'Engineering',
  'Welder': 'Engineering',
  'Facilities Manager': 'Operations Manager',
  'Operations Analyst': 'Operations Manager',
  'Supervisor': 'Operations Manager',
  'Team Leader': 'Operations Manager',
  'Assistant Manager': 'Operations Manager',
  'Shift Supervisor': 'Operations Manager',
  'Property Manager': 'Operations Manager',
  'Supply Chain': 'Operations Manager',
  'Warehouse Associate': 'Warehouse',
  'Warehouse Manager': 'Warehouse',
  'Warehouse Operative': 'Warehouse',
  'Warehouse Supervisor': 'Warehouse',
  'Order Picker': 'Warehouse',
  'Picker Packer': 'Warehouse',
  'Material Handler': 'Warehouse',
  'Loader': 'Warehouse',
  'Delivery Driver': 'Driving',
  'Van Driver': 'Driving',
  'Bus Driver': 'Driving',
  'HGV Driver': 'Driving',
  'Retail Assistant': 'Retail',
  'Retail Associate': 'Retail',
  'Retail Manager': 'Retail',
  'Retail Supervisor': 'Retail',
  'Cashier': 'Retail',
  'Store Associate': 'Retail',
  'Store Manager': 'Retail',
  'Hospitality Manager': 'Hospitality',
  'Hotel Manager': 'Hospitality',
  'Food and Beverage Manager': 'Hospitality',
  'Front of House Manager': 'Hospitality',
  'Catering Manager': 'Hospitality',
  'Chef': 'Hospitality',
  'Assistant Chef': 'Hospitality',
  'Commis Chef': 'Hospitality',
  'Cook': 'Hospitality',
  'Kitchen Assistant': 'Hospitality',
  'Line Cook': 'Hospitality',
  'Barista': 'Hospitality',
  'Bartender': 'Hospitality',
  'Server': 'Hospitality',
  'Waiter': 'Hospitality',
  'Waitress': 'Hospitality',
  'Housekeeper': 'Hospitality',
  'Room Attendant': 'Hospitality',
  'Cleaner': 'Facilities',
  'Domestic Assistant': 'Facilities',
  'Doorman': 'Hospitality',
  'Dishwasher': 'Hospitality',
  'Event Coordinator': 'Hospitality',
  'Event Planner': 'Hospitality',
  'Groundskeeper': 'Facilities',
  'Janitor': 'Facilities',
  'Maitre D': 'Hospitality',
  'Care Assistant': 'Healthcare',
  'Dental Nurse': 'Healthcare',
  'Healthcare Assistant': 'Healthcare',
  'Home Health Aide': 'Healthcare',
  'Mental Health Counselor': 'Healthcare',
  'Nanny': 'Teaching',
  'Nursing': 'Healthcare',
  'Occupational Therapist': 'Healthcare',
  'Paramedic': 'Healthcare',
  'Pharmacy Assistant': 'Healthcare',
  'Pharmacy Technician': 'Healthcare',
  'Physical Therapist': 'Healthcare',
  'Physical Therapy Assistant': 'Healthcare',
  'Registered Nurse': 'Healthcare',
  'School Counselor': 'Healthcare',
  'School Nurse': 'Healthcare',
  'Social Worker': 'Healthcare',
  'Speech Therapist': 'Healthcare',
  'Therapist': 'Healthcare',
  'Childcare Assistant': 'Teaching',
  'Childcare Worker': 'Teaching',
  'Classroom Assistant': 'Teaching',
  'Early Years Teacher': 'Teaching',
  'Education Assistant': 'Teaching',
  'Instructional Assistant': 'Teaching',
  'Nursery Assistant': 'Teaching',
  'Preschool Teacher': 'Teaching',
  'Substitute Teacher': 'Teaching',
  'Teacher Assistant': 'Teaching',
  'Teaching Assistant': 'Teaching',
  'Trainee Teacher': 'Teaching',
  'Tutor': 'Teaching',
};

const getScenarioRoleKey = (jobRole: string) =>
  ROLE_SPECIFIC_SCENARIOS[jobRole] ? jobRole : ROLE_SCENARIO_ALIASES[jobRole] || jobRole;

const getQuestionRotationKey = (jobRole: string, category: string) =>
  `askedQuestions_${jobRole.replace(/[^a-z0-9]+/gi, '_')}_${category}`;

const getRotatingQuestions = async (
  jobRole: string,
  category: string,
  pool: string[],
  count: number
) => {
  if (pool.length === 0 || count <= 0) return [];

  const key = getQuestionRotationKey(jobRole, category);
  const askedStr = await AsyncStorage.getItem(key);
  const askedQuestions: string[] = askedStr ? JSON.parse(askedStr) : [];
  let availableQuestions = pool.filter((question) => !askedQuestions.includes(question));

  if (availableQuestions.length < count) {
    const recentlyAsked = askedQuestions.slice(-Math.min(count, pool.length - 1));
    availableQuestions = pool.filter((question) => !recentlyAsked.includes(question));
  }

  const selectedQuestions = availableQuestions.slice(0, count);
  const updatedAskedQuestions = [
    ...askedQuestions.filter((question) => pool.includes(question)),
    ...selectedQuestions,
  ].slice(-pool.length);

  await AsyncStorage.setItem(key, JSON.stringify(updatedAskedQuestions));

  return selectedQuestions;
};

// Get rotating questions for this role. The opener is handled separately by
// the selected interview level so standard interviews can stay consistent.
const getQuestionsForRole = async (jobRole: string, level: InterviewLevelMode): Promise<InterviewQuestionSet> => {
  try {
    const scenarioRoleKey = getScenarioRoleKey(jobRole);
    const roleScenarios = ROLE_SPECIFIC_SCENARIOS[scenarioRoleKey] || [];
    const config = INTERVIEW_LEVEL_CONFIG[level];
    const scenarioCount = Math.min(config.scenarioCount, roleScenarios.length);
    const behaviouralCount = scenarioCount > 0 ? config.behaviouralCount : config.behaviouralCount + config.scenarioCount;

    const [behavioural, general, scenarios] = await Promise.all([
      getRotatingQuestions(jobRole, 'behavioural', COMMON_QUESTIONS.behavioral, behaviouralCount),
      getRotatingQuestions(jobRole, 'general', COMMON_QUESTIONS.general, config.generalCount),
      getRotatingQuestions(jobRole, 'scenario', roleScenarios, scenarioCount),
    ]);

    return { behavioural, general, scenarios };
  } catch (e) {
    console.log('Error getting questions:', e);
    return {
      behavioural: COMMON_QUESTIONS.behavioral.slice(0, 4),
      general: COMMON_QUESTIONS.general.slice(0, 2),
      scenarios: [],
    };
  }
};

// Keep conversation history for context
let conversationHistory: ChatMessage[] = [];

export const initializeInterviewChat = async (
  jobRole: string,
  userName?: string,
  level: InterviewLevelMode = 'standard'
) => {
  // Role-specific guidance
  const roleGuidance: { [key: string]: string } = {
    'Software Engineer': 'Focus on coding skills, algorithms, system design, debugging, and problem-solving approaches.',
    'DevOps Engineer': 'Focus on deployments, CI/CD, monitoring, incident response, cloud infrastructure, automation, reliability, and security.',
    'Machine Learning Engineer': 'Focus on model development, data quality, evaluation, deployment, monitoring, explainability, and production trade-offs.',
    'Quality Assurance Engineer': 'Focus on test planning, defect investigation, automation, manual testing, quality standards, edge cases, and release risk.',
    'Data Analyst': 'Focus on SQL, data visualization, statistical analysis, Excel/Python, and business insights.',
    'Cyber Security': 'Focus on security protocols, threat analysis, risk management, compliance, and incident response.',
    'IT Support': 'Focus on troubleshooting, customer service, technical knowledge, and problem resolution.',
    'Security': 'Focus on public safety, access control, incident reporting, professionalism, de-escalation, procedures, and alertness.',
    'Project Manager': 'Focus on leadership, planning, stakeholder management, risk mitigation, and delivery.',
    'Sales': 'Focus on persuasion, customer relationships, targets, negotiation, and closing techniques.',
    'Customer Service': 'Focus on communication, empathy, problem-solving, patience, and customer satisfaction.',
    'Marketing': 'Focus on campaigns, analytics, creativity, brand strategy, and digital marketing.',
    'Accounting': 'Focus on financial reporting, compliance, attention to detail, and accounting software.',
    'Finance': 'Focus on analysis, forecasting, budgeting, risk assessment, and financial modelling.',
    'Graduate Trainee': 'Focus on learning agility, potential, adaptability, communication, curiosity, feedback, and early career professionalism.',
    'Human Resources': 'Focus on recruitment, employee relations, policies, conflict resolution, and HR systems.',
    'Healthcare': 'Focus on patient care, medical knowledge, empathy, teamwork, and clinical skills.',
    'Nursing': 'Focus on patient assessment, medication administration, care planning, and communication.',
    'Teaching': 'Focus on lesson planning, classroom management, student engagement, and assessment.',
    'Engineering': 'Focus on technical design, problem-solving, project execution, and safety compliance.',
    'Architecture': 'Focus on design briefs, regulations, technical drawings, client communication, sustainability, and collaboration.',
    'Construction': 'Focus on site safety, practical problem-solving, teamwork, quality, reliability, and working under pressure.',
    'Business Analyst': 'Focus on requirements gathering, process improvement, stakeholder communication, and data analysis.',
    'Product Manager': 'Focus on product strategy, user research, roadmapping, cross-functional leadership, and metrics.',
    'UX/UI Designer': 'Focus on user research, wireframing, prototyping, usability, and design tools.',
    'Graphic Designer': 'Focus on creativity, design software, brand consistency, and visual communication.',
    'Operations Manager': 'Focus on efficiency, process optimisation, team management, and performance metrics.',
    'Facilities': 'Focus on site standards, safety, maintenance, cleanliness, prioritisation, practical problem-solving, and reliability.',
    'Retail': 'Focus on customer service, sales, stock standards, teamwork, targets, complaint handling, and store procedures.',
    'Hospitality': 'Focus on guest experience, service standards, teamwork, pressure, professionalism, and attention to detail.',
    'Warehouse': 'Focus on accuracy, safety, stock handling, speed, teamwork, procedures, and quality control.',
    'Driving': 'Focus on safety, route planning, customer service, punctuality, vehicle checks, and accurate records.',
    'Design': 'Focus on creative process, user needs, feedback, stakeholder communication, brand consistency, and deadlines.',
    'Personal Trainer': 'Focus on client goals, motivation, safety, adapting sessions, communication, progress tracking, and trust.',
    'Supply Chain': 'Focus on logistics, inventory management, supplier relationships, and cost optimisation.',
    'Legal': 'Focus on legal research, contracts, compliance, analytical skills, and attention to detail.',
    'Consulting': 'Focus on problem-solving, client management, analytical thinking, and communication.',
  };

  const guidanceRoleKey = roleGuidance[jobRole] ? jobRole : ROLE_SCENARIO_ALIASES[jobRole] || jobRole;
  const specificGuidance = roleGuidance[guidanceRoleKey] || 'Focus on relevant skills, experience, and problem-solving ability.';
  const levelConfig = INTERVIEW_LEVEL_CONFIG[level] || INTERVIEW_LEVEL_CONFIG.standard;
  const openerQuestion = levelConfig.opener(jobRole);

  // Get fresh rotating questions for this interview. The opener stays fixed.
  const questionsForInterview = await getQuestionsForRole(jobRole, level);

  const allQuestionsForInterview = [
    ...questionsForInterview.behavioural,
    ...questionsForInterview.general,
    ...questionsForInterview.scenarios,
  ];

  const closingQuestionNumber = allQuestionsForInterview.length + 2;
  const questionList = allQuestionsForInterview.map((q, i) => `${i + 2}. ${q}`).join('\n');

  // Reset conversation history
  conversationHistory = [
    {
      role: 'system',
      content: `You are Aya, an empathetic and professional interview coach. You're helping ${userName || 'the user'} prepare for a ${jobRole} position.

INTERVIEW MODE:
- Mode: ${levelConfig.label}
- ${levelConfig.guidance}

Your responsibilities:
- Ask interview questions from the list below (adapt wording naturally but cover these topics)
- ${specificGuidance}
- Provide brief constructive feedback on their answers (1 sentence)
- Keep your responses concise (2-3 sentences max)
- Be friendly and supportive, not intimidating
- Use UK English spelling and phrasing throughout.

QUESTIONS TO ASK (in this order):
1. ${openerQuestion}
${questionList}
${closingQuestionNumber}. ${COMMON_QUESTIONS.closing[0]}

IMPORTANT RULES:
- Ask questions one at a time, wait for their response
- You can rephrase questions to sound natural, but cover these topics
- Add brief encouragement between questions
- After question ${closingQuestionNumber}, wrap up the interview
- At the end of your FIRST message, add: "Feel free to ask me anything during the interview too. If your role is broad (e.g., Teaching), you can specify the focus (e.g., Maths, English, or Primary)."

FOLLOW-UP QUESTIONS (CRITICAL):
- If they give a SHORT, VAGUE, or POOR answer (less than 2 sentences, no specific examples, or "I don't know"), ask a follow-up like:
  * "Can you tell me more about that?" 
  * "Could you give me a specific example?"
  * "What did you learn from that experience?"
  * "How did you handle that specifically?"
- Follow-ups are NOT new questions - they help the user elaborate on the SAME question
- Only ask ONE follow-up per question, then move to the next main question
- If they answer well with good detail, move directly to the next main question
- Keep follow-ups short (1 sentence) - they're just prompts, not full questions

ENDING THE INTERVIEW:
- After covering all ${closingQuestionNumber} questions, end with: "Great job today! Good luck with your ${jobRole} career - I'm confident you'll do well! [END INTERVIEW]"
- The [END INTERVIEW] tag signals the app to navigate to feedback

Start with question 1 exactly in line with the selected mode: "${openerQuestion}"`
    }
  ];
};

export const sendMessageToAI = async (userMessage: string): Promise<string> => {
  try {
    // Add user message to history
    conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    // Call Groq through the Supabase Edge Function.
    const chatCompletion = await createGroqChatCompletion({
      messages: conversationHistory,
      model: "llama-3.3-70b-versatile", // Latest and best model
      temperature: 0.7,
      max_tokens: 200, // Keep responses concise
      top_p: 1,
      stream: false,
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || "I'm sorry, could you repeat that?";

    // Add AI response to history
    conversationHistory.push({
      role: 'assistant',
      content: aiResponse,
    });

    return aiResponse;
  } catch (error) {
    console.error('Error calling Groq AI:', error);
    return "I'm having trouble connecting right now. Could you try again?";
  }
};

export const getConversationSummary = async (): Promise<string> => {
  try {
    console.log('Getting conversation summary...');
    console.log('Conversation history length:', conversationHistory.length);
    console.log('Full history:', JSON.stringify(conversationHistory, null, 2));
    
    if (conversationHistory.length <= 1) {
      console.log('No user responses in conversation history');
      return "NO_RESPONSES_SUBMITTED";
    }
    
    const summaryPrompt = {
      role: 'user' as const,
      content: `Please analyse this interview practice session and provide honest, critical feedback in this format:

STRENGTHS:
- [Specific positive observation 1]
- [Specific positive observation 2]
- [Specific positive observation 3]

IMPROVEMENTS:
- [Specific actionable improvement 1]
- [Specific actionable improvement 2]
- [Specific actionable improvement 3]

QUESTIONS TO PRACTICE:
- [List any questions where they struggled or needed multiple follow-ups]

SCORE: [0-100]

CRITICAL: Only evaluate the USER'S responses. Do NOT give credit for MY (the interviewer's) questions or guidance. Ignore my responses entirely when scoring.

Special attention:
- If I had to ask follow-up questions to get them to elaborate, note this as an area to work on
- Questions where they struggled after 2 attempts should be listed in "QUESTIONS TO PRACTICE"

Scoring criteria - be HARSH and REALISTIC:
- 90-100: Outstanding - Detailed STAR method examples, quantifiable results, highly professional language, perfect alignment with questions, demonstrates deep expertise
- 75-89: Very Good - Specific examples with some detail, mostly professional, good structure, addresses questions well
- 60-74: Adequate - Vague answers, limited examples, somewhat relevant but lacks depth, needs better structure
- 40-59: Poor - Very brief responses (1-2 sentences), casual/unprofessional language, no concrete examples, doesn't fully answer questions
- 20-39: Very Poor - Single word answers, completely off-topic, shows no preparation or effort
- 0-19: Unacceptable - Inappropriate responses, refusal to engage, gibberish

Key factors to score HARSHLY on:
- Answer LENGTH: Brief answers (under 3 sentences) = automatic score penalty
- SPECIFICITY: Vague answers like "I like security" without examples = low score
- PROFESSIONALISM: Casual language like "it's scooo" or "money" = major penalty
- RELEVANCE: Not answering the actual question asked = deduct points
- EXAMPLES: No concrete examples or stories = significant deduction
- DEPTH: Surface-level responses without technical knowledge = low score

Language:
- Use UK English spelling and phrasing throughout. Prefer analyse, practise, behavioural, personalised, organisation, programme, optimise and CV where relevant.

Remember: The user is practising for a REAL interview. Be critical to help them improve. Most practice sessions should score 40-60 unless truly exceptional.`,
    };

    const chatCompletion = await createGroqChatCompletion({
      messages: [...conversationHistory, summaryPrompt],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_tokens: 400,
    });

    const result = chatCompletion.choices[0]?.message?.content || "Practice session completed.";
    console.log('AI Summary result:', result);
    return result;
  } catch (error) {
    console.error('Error generating summary:', error);
    return "Unable to generate summary at this time.";
  }
};

export type QuestionAnswerFeedback = {
  score: number;
  strengths: string[];
  improvements: string[];
  betterAnswer: string;
};

export const getQuestionAnswerFeedback = async (
  question: string,
  answer: string,
  jobRole?: string,
  questionCategory?: string,
  answerFramework?: {
    label: string;
    guidance: string[];
  }
): Promise<QuestionAnswerFeedback | null> => {
  try {
    const roleLine = jobRole ? `Target role: ${jobRole}` : 'Target role: Not specified';
    const frameworkLine = answerFramework
      ? `${answerFramework.label}: ${answerFramework.guidance.join(' | ')}`
      : 'Use the most appropriate interview answer structure for this question.';
    const prompt = `You are Aya, a supportive UK interview coach. Review the user's draft answer to this specific interview question.

${roleLine}
Question category/type: ${questionCategory || 'Not specified'}
Recommended answer framework: ${frameworkLine}

Question: ${question}
User draft answer: ${answer}

Return ONLY valid JSON with this exact structure:
{
  "score": number, // 0-10
  "strengths": ["...", "...", "..."],
  "improvements": ["...", "...", "..."],
  "betterAnswer": "..."
}

Rules:
- Judge whether the draft actually answers the specific question, not a generic interview question.
- Do not force STAR unless the recommended framework says STAR is appropriate.
- For introductory questions such as "Tell me about yourself", assess professional introduction, relevant background, strengths, role fit, clarity and concision.
- For motivation questions, assess company interest, role interest, relevant skills/experience and career fit.
- For technical or role-specific questions, assess clarity, knowledge, examples and practical experience.
- Use UK English.
- Sound human, supportive and practical. Avoid robotic phrases like "Your response demonstrates" or "The candidate has effectively".
- Prefer wording like "You’ve got a strong start here..." or "I’d make the result clearer..."
- Keep strengths and improvements concise enough to read.
- The betterAnswer should improve the user's own answer without removing their personality or inventing facts.
- Make the betterAnswer 3-5 sentences, STAR-style only if applicable.
`;

    const completion = await createGroqChatCompletion({
      messages: [
        { role: 'system', content: 'You are Aya, a helpful UK interview coach. Return JSON only.' },
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.55,
      max_tokens: 520,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content || '';
    const parsed = JSON.parse(content) as QuestionAnswerFeedback;

    if (!parsed || typeof parsed.score !== 'number') {
      return null;
    }

    return {
      score: Math.max(0, Math.min(10, parsed.score)),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 4) : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 4) : [],
      betterAnswer: parsed.betterAnswer || '',
    };
  } catch (error) {
    console.error('Error generating question feedback:', error);
    return null;
  }
};

export const clearConversationHistory = () => {
  conversationHistory = [];
};

// Text-to-Speech using ElevenLabs (soothing) with Google TTS fallback
let currentSound: Audio.Sound | null = null;
let isSpeaking = false;

// Try ElevenLabs first for natural voice
const getElevenLabsAudio = async (text: string): Promise<string | null> => {
  console.log('🎙️ Requesting ElevenLabs speech via Edge Function...');

  try {
    const { data, error } = await supabase.functions.invoke<{
      audioBase64?: string;
      audioDataUrl?: string;
      mimeType?: string;
      voiceSource?: 'custom' | 'default';
    }>('elevenlabs-tts', {
      method: 'POST',
      body: { text },
    });

    if (error) {
      console.log('❌ ElevenLabs Edge Function error, falling back to Google TTS:', error.message);
      return null;
    }

    const audioBase64 = data?.audioBase64 || data?.audioDataUrl?.split(',')[1] || '';
    if (audioBase64) {
      const fileUri = `${FileSystem.cacheDirectory}aya-elevenlabs-${Date.now()}.mp3`;
      await FileSystem.writeAsStringAsync(fileUri, audioBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log(`✅ ElevenLabs audio saved locally (${data?.voiceSource || 'unknown'} voice):`, fileUri);
      return fileUri;
    }

    console.log('⚠️ ElevenLabs Edge Function returned no audio, falling back to Google TTS');
    return null;
  } catch (error) {
    console.log('❌ ElevenLabs Edge Function fetch error, falling back to Google TTS:', error);
    return null;
  }
};

type SpeakTextOptions = {
  onPlaybackStart?: () => void;
};

export const speakText = async (text: string, options: SpeakTextOptions = {}): Promise<boolean> => {
  try {
    console.log('🔊 Starting TTS for text:', text.substring(0, 50) + '...');
    console.log('Full text length:', text.length);
    
    // Stop any currently playing audio and clean up
    await stopSpeaking();
    
    // Small delay to ensure previous audio is fully released
    await new Promise(resolve => setTimeout(resolve, 100));
    
    isSpeaking = true;

    // Configure audio mode for playback (important after recording!)
    console.log('Configuring audio mode for playback...');
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    // Try ElevenLabs first for beautiful voice
    console.log('🎙️ Trying ElevenLabs voice...');
    const audioData = await getElevenLabsAudio(text);

    if (audioData) {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioData },
          { shouldPlay: true }
        );
        currentSound = sound;
        await sound.setRateAsync(1.03, true, Audio.PitchCorrectionQuality.High);
        options.onPlaybackStart?.();

        // Wait for playback to complete
        await new Promise<void>((resolve) => {
          const interval = setInterval(async () => {
            if (!isSpeaking) {
              clearInterval(interval);
              resolve();
              return;
            }
            try {
              const status = await sound.getStatusAsync();
              if (status.isLoaded && !status.isPlaying && status.positionMillis > 0) {
                clearInterval(interval);
                resolve();
              }
            } catch {
              clearInterval(interval);
              resolve();
            }
          }, 200);
          setTimeout(() => { clearInterval(interval); resolve(); }, 120000);
        });

        await sound.unloadAsync();
        currentSound = null;
        isSpeaking = false;
        console.log('✅ ElevenLabs playback complete');
        return true;
      } catch (e) {
        console.log('ElevenLabs playback failed, using Google TTS');
      }
    }

    // Fallback to Google TTS
    console.log('📢 Using Google TTS...');

    // Split text into chunks for reliable playback (Google TTS has ~200 char limit per request)
    const maxLength = 180;
    const chunks: string[] = [];
    
    // Split by sentences first
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= maxLength) {
        currentChunk += sentence;
      } else {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        // If single sentence is too long, split by commas or just truncate
        if (sentence.length > maxLength) {
          const parts = sentence.split(/,\s*/);
          let part = '';
          for (const p of parts) {
            if ((part + p).length <= maxLength) {
              part += (part ? ', ' : '') + p;
            } else {
              if (part.trim()) chunks.push(part.trim());
              part = p.substring(0, maxLength);
            }
          }
          if (part.trim()) currentChunk = part;
          else currentChunk = '';
        } else {
          currentChunk = sentence;
        }
      }
    }
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    console.log(`Split into ${chunks.length} chunks for TTS`);

    // Play each chunk sequentially
    for (let i = 0; i < chunks.length; i++) {
      if (!isSpeaking) {
        console.log('Speech stopped by user');
        break;
      }
      
      const chunk = chunks[i];
      console.log(`Playing chunk ${i + 1}/${chunks.length}: "${chunk.substring(0, 30)}..."`);
      
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(chunk)}`;
      
      try {
        // Ensure clean state before loading new sound
        if (currentSound) {
          try {
            await currentSound.unloadAsync();
          } catch (e) {
            // Ignore
          }
          currentSound = null;
        }
        
        // Re-configure audio mode before each chunk (ensures it works after recording)
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
        
        // Create and load the sound with expo-av
        console.log(`Loading audio for chunk ${i + 1}...`);
        const { sound } = await Audio.Sound.createAsync(
          { uri: ttsUrl },
          { shouldPlay: false }
        );
        currentSound = sound;
        console.log(`Audio loaded for chunk ${i + 1}`);
        
        // Set rate with pitch correction AFTER loading (1.0x speed, same pitch)
        await sound.setRateAsync(1.0, true, Audio.PitchCorrectionQuality.High);
        
        // Play the sound
        console.log(`Playing audio for chunk ${i + 1}...`);
        await sound.playAsync();
        if (i === 0) {
          options.onPlaybackStart?.();
        }
        
        // Wait for this chunk to finish before playing next using polling
        await new Promise<void>((resolve) => {
          let resolved = false;
          
          // Poll playback status every 200ms
          const checkStatus = setInterval(async () => {
            if (resolved) return;
            
            // Check if user stopped
            if (!isSpeaking) {
              resolved = true;
              clearInterval(checkStatus);
              resolve();
              return;
            }
            
            try {
              const status = await sound.getStatusAsync();
              if (status.isLoaded) {
                // Check if finished playing
                if (!status.isPlaying && status.positionMillis > 0) {
                  console.log(`✅ Chunk ${i + 1} finished (pos: ${status.positionMillis}ms, duration: ${status.durationMillis}ms)`);
                  resolved = true;
                  clearInterval(checkStatus);
                  resolve();
                }
              }
            } catch (e) {
              // Sound may have been unloaded
              if (!resolved) {
                resolved = true;
                clearInterval(checkStatus);
                resolve();
              }
            }
          }, 200);
          
          // Safety timeout (30 seconds max per chunk)
          setTimeout(() => {
            if (!resolved) {
              console.log(`⚠️ Chunk ${i + 1} safety timeout reached`);
              resolved = true;
              clearInterval(checkStatus);
              resolve();
            }
          }, 30000);
        });
        
        // Clean up this chunk's sound
        await sound.unloadAsync();
        currentSound = null;
        
      } catch (chunkError) {
        console.error(`Error playing chunk ${i + 1}:`, chunkError);
        // Continue with next chunk
      }
    }
    
    console.log('✅ Completed speaking all chunks');
    isSpeaking = false;
    return true;
  } catch (error) {
    console.error('❌ Error with text-to-speech:', error);
    isSpeaking = false;
    return false;
  }
};

export const stopSpeaking = async () => {
  console.log('🛑 Stopping speech...');
  isSpeaking = false;
  if (currentSound) {
    try {
      const status = await currentSound.getStatusAsync();
      if (status.isLoaded) {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
      }
      currentSound = null;
      console.log('🛑 Sound stopped and unloaded');
    } catch (error) {
      console.log('Stop speaking cleanup error (safe to ignore):', error);
      currentSound = null;
    }
  }
};

const MAX_CV_CHUNK_CHARS = 12000;
const MAX_FULL_CV_ANALYSIS_CHARS = 20000;

const cleanJsonResponse = (responseText: string) => {
  let cleaned = responseText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/```\n?/g, '');
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
};

export const cleanGeneratedCVText = (text: string) => {
  let cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .replace(/```(?:text|markdown)?/gi, '')
    .replace(/```/g, '')
    .trim();

  const finalMarkers = [
    /(?:^|\n)\s*(?:final cv|final answer|rewritten cv|improved cv|complete improved cv)\s*:\s*/i,
    /(?:^|\n)\s*(?:here is the final cv|here is the improved cv)\s*:?\s*/i,
  ];

  for (const marker of finalMarkers) {
    const match = cleaned.match(marker);
    if (match?.index !== undefined && match.index > 0) {
      cleaned = cleaned.slice(match.index + match[0].length).trim();
      break;
    }
  }

  cleaned = cleaned
    .replace(/^\s*(?:thinking process|reasoning|analysis)\s*:[\s\S]*?(?=\n\s*(?:[A-Z][A-Z\s/&-]{2,}|Personal Profile|Profile|Summary|Contact|Name)\b)/i, '')
    .replace(/^\s*(?:sure|of course)[,.! ]+/i, '')
    .replace(/\n?\s*Please assist in rewriting this CV[\s\S]*$/i, '')
    .replace(/\bAvailableuponrequest\b/gi, 'Available upon request')
    .replace(/\bConflictResolution\b/g, 'Conflict Resolution')
    .replace(/\bDataProtection\b/g, 'Data Protection')
    .replace(/\bEqualityandDiversity\b/g, 'Equality and Diversity')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  cleaned = repairMergedCVWords(cleaned);

  return cleaned;
};

const normalizeCVSuggestions = (parsed: any): { category: string; suggestion: string }[] => {
  const source =
    Array.isArray(parsed?.suggestions) ? parsed.suggestions :
    Array.isArray(parsed?.analysis?.suggestions) ? parsed.analysis.suggestions :
    Array.isArray(parsed?.feedback) ? parsed.feedback :
    Array.isArray(parsed) ? parsed :
    [];

  return source
    .map((item: any, index: number) => {
      if (typeof item === 'string') {
        return { category: 'Suggestion', suggestion: item };
      }

      const suggestion =
        item?.suggestion ||
        item?.feedback ||
        item?.advice ||
        item?.recommendation ||
        item?.improvement ||
        item?.text;

      if (!suggestion || typeof suggestion !== 'string') return null;

      return {
        category: String(item?.category || item?.section || item?.area || `Suggestion ${index + 1}`),
        suggestion,
      };
    })
    .filter(Boolean) as { category: string; suggestion: string }[];
};

const getFallbackCVSuggestions = (jobRole: string, cvContent: string) => {
  const hasEducation = /education|degree|bachelor|master|certificate|qualification/i.test(cvContent);
  const hasSkills = /skills|communication|teamwork|leadership|planning|time management/i.test(cvContent);
  const hasExperience = /experience|teacher|teaching|school|classroom|student|lesson/i.test(cvContent);

  return {
    suggestions: [
      {
        category: "Achievements",
        suggestion: `Add measurable outcomes for your ${jobRole} experience, such as student progress, class size, lesson outcomes, attendance improvements, or parent feedback where true.`
      },
      {
        category: "Experience",
        suggestion: hasExperience
          ? `Expand the teaching experience section with specific classroom responsibilities, age groups, subjects, teaching methods, and examples of how you supported learners.`
          : `Add a clear experience section showing responsibilities and examples relevant to ${jobRole} roles.`
      },
      {
        category: "Skills",
        suggestion: hasSkills
          ? `Group skills into role-focused categories such as classroom management, lesson planning, safeguarding, communication, assessment, and inclusive learning.`
          : `Add a dedicated skills section tailored to ${jobRole}, including role-specific technical and interpersonal skills.`
      },
      {
        category: "Education",
        suggestion: hasEducation
          ? `Keep the education and certificates section, but add dates, institutions, and any relevant modules or training that support your ${jobRole} target.`
          : `Add education, certifications, and training details that support your ${jobRole} application.`
      },
      {
        category: "Keywords",
        suggestion: `Include ATS keywords from ${jobRole} job adverts, such as curriculum planning, differentiation, assessment, behaviour management, safeguarding, learner progress, and SEND support where accurate.`
      },
      {
        category: "Formatting",
        suggestion: "Use consistent section headings, bullet points, dates, and spacing so recruiters can scan your CV quickly."
      },
    ],
  };
};

const CV_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'for', 'from', 'in', 'of', 'on', 'or', 'the', 'to', 'upon', 'with',
  'available', 'request', 'developed', 'strong', 'relationships', 'relationship', 'patients',
  'patient', 'colleagues', 'families', 'family', 'communication', 'conflict', 'resolution',
  'data', 'protection', 'equality', 'diversity', 'team', 'work', 'teamwork', 'adaptability',
  'time', 'management', 'safeguarding', 'teaching', 'teacher', 'education', 'classroom',
  'lesson', 'planning', 'assessment', 'behaviour', 'support', 'student', 'students', 'learner',
  'learners', 'curriculum', 'differentiation', 'send', 'care', 'professional', 'profile',
  'skills', 'experience', 'employment', 'certificates', 'certificate', 'training', 'references',
  'english', 'language', 'bachelor', 'master', 'arts', 'completion', 'appreciation', 'outstanding',
  'practice', 'programme', 'program', 'health', 'social', 'assistant', 'communication', 'organisation',
  'organised', 'organising', 'responsible', 'responsibilities', 'supporting', 'delivering',
  'maintaining', 'ensuring', 'working', 'within', 'across', 'needs', 'progress', 'positive',
]);

const segmentMergedWord = (value: string): string | null => {
  if (value.length < 14 || /[^A-Za-z]/.test(value)) return null;

  const lower = value.toLowerCase();
  const memo = new Map<number, string[] | null>();

  const solve = (index: number): string[] | null => {
    if (index === lower.length) return [];
    if (memo.has(index)) return memo.get(index) || null;

    for (let end = lower.length; end > index + 1; end -= 1) {
      const word = lower.slice(index, end);
      if (!CV_WORDS.has(word)) continue;

      const rest = solve(end);
      if (rest) {
        const result = [word, ...rest];
        memo.set(index, result);
        return result;
      }
    }

    memo.set(index, null);
    return null;
  };

  const parts = solve(0);
  if (!parts || parts.length < 2) return null;

  const segmented = parts.join(' ');
  return /^[A-Z]/.test(value)
    ? segmented.charAt(0).toUpperCase() + segmented.slice(1)
    : segmented;
};

const repairMergedCVWords = (text: string) =>
  text.replace(/\b[A-Za-z]{14,}\b/g, (word) => segmentMergedWord(word) || word);

const repairFragmentedCVLine = (line: string) => {
  const segments = line.split(/([ \t]{2,})/);

  return segments
    .map((segment) => {
      if (/^[ \t]{2,}$/.test(segment)) return ' ';

      const tokens = segment.match(/[A-Za-z]+/g) || [];
      const shortTokens = tokens.filter((token) => token.length <= 2).length;
      const averageLength = tokens.length
        ? tokens.reduce((sum, token) => sum + token.length, 0) / tokens.length
        : 0;
      const looksFragmented =
        tokens.length >= 4 &&
        shortTokens / tokens.length > 0.55 &&
        averageLength < 3.2;

      return looksFragmented
        ? segment.replace(/([A-Za-z])[\t ]+(?=[A-Za-z])/g, '$1')
        : segment;
    })
    .join('')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
};

export const normalizeCVText = (text: string) => {
  let normalized = text
    .replace(/\r/g, '\n')
    .split('\n')
    .map(repairFragmentedCVLine)
    .join('\n')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([(\[])\s+/g, '$1')
    .replace(/\s+([)\]])/g, '$1')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const commonPhraseFixes: Array<[RegExp, string]> = [
    [/Communicationskills/gi, 'Communication skills'],
    [/Timemanagement/gi, 'Time management'],
    [/BachelorofArtsinEducation/gi, 'Bachelor of Arts in Education'],
    [/MasterofArtsinEducation/gi, 'Master of Arts in Education'],
    [/CertificateinTeachingEnglishasaSecondLanguage/gi, 'Certificate in Teaching English as a Second Language'],
    [/CertificateofAppreciationforoutstandingteachingpractice/gi, 'Certificate of Appreciation for outstanding teaching practice'],
    [/CertificateofCompletionforteachertrainingprogram/gi, 'Certificate of Completion for teacher training programme'],
    [/Availableuponrequest/gi, 'Available upon request'],
  ];

  for (const [pattern, replacement] of commonPhraseFixes) {
    normalized = normalized.replace(pattern, replacement);
  }

  return repairMergedCVWords(normalized);
};

const splitCvIntoChunks = (text: string) => {
  const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = '';

  for (const paragraph of paragraphs) {
    if ((current + '\n\n' + paragraph).length > MAX_CV_CHUNK_CHARS) {
      if (current) {
        chunks.push(current);
        current = '';
      }
      if (paragraph.length > MAX_CV_CHUNK_CHARS) {
        for (let i = 0; i < paragraph.length; i += MAX_CV_CHUNK_CHARS) {
          chunks.push(paragraph.slice(i, i + MAX_CV_CHUNK_CHARS));
        }
      } else {
        current = paragraph;
      }
    } else {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
};

const analyzeCvChunk = async (cvChunk: string, jobRole: string, index: number, total: number) => {
  const prompt = `You are Aya, an expert UK CV consultant. I will provide you with PART ${index + 1} of ${total} of someone's CV content and their target job role. Analyse ONLY this part and provide 2-3 SPECIFIC suggestions based on what you see in this chunk.

Target Job Role: ${jobRole}

CV Content (Part ${index + 1} of ${total}):
${cvChunk}

You MUST respond with ONLY valid JSON in this EXACT format (no other text):
{
  "suggestions": [
    {"category": "Content", "suggestion": "Your SPECIFIC observation about this chunk and actionable suggestion"}
  ]
}

IMPORTANT:
- Use UK English spelling and wording throughout. Use terms like CV, role, organisation, programme, centre, analyse, optimise, tailored and professional.
- Base ALL suggestions on the CV chunk provided above
- Reference specific parts of their CV in your suggestions
- Give personalised, actionable advice, NOT generic tips
- Focus on what's missing, what's weak, and what could be stronger for ${jobRole} roles
- Suggest specific keywords, skills, or improvements based on their content
- Do NOT invent roles, employers, qualifications, dates, metrics, or achievements
- Prioritise ATS keywords, quantified impact, role fit, clarity, and evidence

Respond with ONLY the JSON object, no markdown, no code blocks, no explanations.`;

  const completion = await createGroqChatCompletion({
    messages: [
      {
        role: 'system',
        content: 'You are Aya, a professional UK CV adviser. Analyse the provided CV content and give SPECIFIC feedback. Use UK English. Respond with ONLY valid JSON.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.4,
    max_tokens: 700,
  });

  const responseText = completion.choices[0]?.message?.content || '{}';
  const cleanedResponse = cleanJsonResponse(responseText);

  try {
    const parsed = JSON.parse(cleanedResponse);
    const suggestions = normalizeCVSuggestions(parsed);
    return suggestions;
  } catch {
    console.warn('CV chunk response was not parseable JSON; skipping chunk.');
    return [] as { category: string; suggestion: string }[];
  }
};

const mergeSuggestions = (chunks: { category: string; suggestion: string }[][]) => {
  const flat = chunks.flat();
  const seen = new Set<string>();
  const merged: { category: string; suggestion: string }[] = [];

  for (const item of flat) {
    const key = `${item.category}|${item.suggestion}`.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
    if (merged.length >= 8) break;
  }

  return merged;
};

// CV Analysis Function
export const analyzeCVWithAI = async (cvContent: string, jobRole: string) => {
  try {
    const normalizedCV = normalizeCVText(cvContent);

    if (normalizedCV.length > MAX_FULL_CV_ANALYSIS_CHARS) {
      const chunks = splitCvIntoChunks(normalizedCV);
      const chunkResults: { category: string; suggestion: string }[][] = [];

      for (let i = 0; i < chunks.length; i += 1) {
        const chunkSuggestions = await analyzeCvChunk(chunks[i], jobRole, i, chunks.length);
        chunkResults.push(chunkSuggestions);
      }

      const mergedSuggestions = mergeSuggestions(chunkResults);
      if (mergedSuggestions.length > 0) {
        return { suggestions: mergedSuggestions };
      }
    }

    const prompt = `You are Aya, an expert UK CV consultant. I will provide you with someone's CV content and their target job role. Analyse their ACTUAL CV and provide 6-8 SPECIFIC suggestions based on what you see in their CV.

Target Job Role: ${jobRole}

CV Content:
${normalizedCV}

You MUST respond with ONLY valid JSON in this EXACT format (no other text):
{
  "suggestions": [
    {"category": "Content", "suggestion": "Your SPECIFIC observation about their CV and actionable suggestion"},
    {"category": "Skills", "suggestion": "Your SPECIFIC observation about their CV and actionable suggestion"},
    {"category": "Experience", "suggestion": "Your SPECIFIC observation about their CV and actionable suggestion"},
    {"category": "Keywords", "suggestion": "Your SPECIFIC observation about their CV and actionable suggestion"},
    {"category": "Achievements", "suggestion": "Your SPECIFIC observation about their CV and actionable suggestion"},
    {"category": "Formatting", "suggestion": "Your SPECIFIC observation about their CV and actionable suggestion"}
  ]
}

IMPORTANT: 
- Use UK English spelling and wording throughout. Use terms like CV, role, organisation, programme, centre, analyse, optimise, tailored and professional.
- Base ALL suggestions on the ACTUAL CV content provided above
- Read the ENTIRE CV content from top to bottom, including any text after page markers like "--- PDF PAGE 2 OF 2 ---" or "--- ADDITIONAL PDF TEXT RECOVERED ---"
- Do not ignore sidebars, second pages, certificates, education, skills, references, or later sections just because the layout/text order is imperfect
- Reference specific parts of their CV in your suggestions
- Give personalised, actionable advice, NOT generic tips
- Focus on what's missing, what's weak, and what could be stronger for ${jobRole} roles
- Suggest specific keywords, skills, or improvements based on their content
- Do NOT invent roles, employers, qualifications, dates, metrics, or achievements
- Prioritise ATS keywords, quantified impact, role fit, clarity, and evidence
- If a metric is missing, suggest where the user could add one rather than making it up

Respond with ONLY the JSON object, no markdown, no code blocks, no explanations.`;

    const completion = await createGroqChatCompletion({
      messages: [
        {
          role: 'system',
          content: 'You are Aya, a professional UK CV adviser. Analyse the provided CV content and give SPECIFIC feedback. Use UK English. Respond with ONLY valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: 1500,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    
    const cleanedResponse = cleanJsonResponse(responseText);
    
    // Parse JSON response
    try {
      const parsed = JSON.parse(cleanedResponse);
      const suggestions = normalizeCVSuggestions(parsed);

      if (suggestions.length === 0) {
        throw new Error('Invalid suggestions format');
      }
      
      return { suggestions };
    } catch (parseError) {
      console.warn('CV analysis response was not valid suggestions JSON; using fallback suggestions.', parseError);
      return getFallbackCVSuggestions(jobRole, normalizedCV);
    }
  } catch (error) {
    console.error('Error analyzing CV with AI:', error);
    throw error;
  }
};

// Improve CV Function - Generates a rewritten, enhanced version
export const improveCV = async (cvContent: string, jobRole: string): Promise<string> => {
  try {
    const normalizedCV = normalizeCVText(cvContent);

    const prompt = `You are Aya, an elite UK CV writer. I will provide extracted CV text and a target job role. The extraction may be messy because PDFs can contain columns, tables, missing spaces, odd line breaks, page markers, or duplicated fragments.

Your task is to reconstruct the readable facts into a polished, outstanding, human-sounding UK CV for ${jobRole} roles.

Target Job Role: ${jobRole}

Extracted CV Content:
${normalizedCV}

Create a complete CV with these sections where the source supports them:
- Name and contact details
- Professional Profile
- Key Skills
- Employment / Relevant Experience
- Education and Qualifications
- Certifications / Training
- Achievements
- Additional Information
- References

IMPORTANT INSTRUCTIONS:
- Use UK English spelling and wording throughout. Use terms like CV, role, organisation, programme, centre, analyse, optimise, tailored and professional.
- Do not reveal hidden reasoning, chain-of-thought, planning notes, or analysis steps
- Read and preserve the ENTIRE CV, including every page marker and any recovered PDF text section
- Do NOT only rewrite the first page or the first obvious section
- Repair extraction artefacts before writing. Examples: "ConflictResolution" becomes "Conflict Resolution", "Availableuponrequest" becomes "Available upon request", spaced-out names become normal names, and broken lines are merged sensibly.
- Remove any user instruction text accidentally included in the extraction, such as "Please assist in rewriting this CV..."
- Keep factual information (names, dates, employers, education, qualifications, certifications) from the original when readable
- Do NOT invent new employers, dates, qualifications, certifications, metrics, or achievements
- If impact numbers are missing, write strong but truthful bullets without fake numbers
- If a section has no real information in the source CV, do NOT write filler, apologies, assumptions, or generic positive claims for that section
- For missing sections, write exactly "(No information given)" on the next line, then add one short practical line telling the user what to add there
- Missing-section examples:
  Education and Qualifications
  (No information given)
  Add your school, college, university, course names, dates, grades or relevant qualifications here.

  Certifications / Training
  (No information given)
  Add any safeguarding, first aid, DBS, childcare, teaching, food hygiene, online courses or professional training here.

  Achievements
  (No information given)
  Add awards, praise from employers, extra responsibilities, measurable results, promotions, positive feedback or examples of impact here.
- Never write phrases like "Unfortunately, the provided information does not include...", "No specific certifications are mentioned...", "I am committed to ongoing learning..." or "While specific achievements are not detailed..."
- Only include a normal written section when the original CV actually gives usable information for that section
- If a line is unreadable or obviously corrupted, omit it rather than copying broken text
- Make the CV sound confident, warm, capable and employable without sounding robotic
- Use polished bullet points that "plump up" the user's real experience and skills while staying truthful
- Make it ready to copy-paste into a Word document
- Use professional plain-text formatting with clear section headers
- Keep all original sections where useful, including profile, skills, experience, education, certificates, awards, projects, volunteering, languages, interests, and references
- You may reorganise the CV into a stronger structure if the extracted order is poor
- Output plain text with line breaks for readability (no markdown)
- Tailor wording and skills toward ${jobRole} while staying faithful to the original CV
- Before returning, check that every non-empty original section has either been preserved or intentionally merged into a better section

Return ONLY the finished CV text. Do not include commentary, apologies, prompt text, instructions, analysis, or notes.`;

    const completion = await createGroqChatCompletion({
      messages: [
        {
          role: 'system',
          content: 'You are Aya, an expert UK CV writer. Transform messy extracted CV text into a polished, truthful, professional CV. Use UK English. Output only the finished CV text. Never invent missing education, certifications, achievements, dates, employers or qualifications. If a CV section has no source information, write "(No information given)" plus a short instruction telling the user what to add.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: 8000,
    });

    const improvedCVText = cleanGeneratedCVText(completion.choices[0]?.message?.content || '');
    
    if (!improvedCVText) {
      throw new Error('No improved CV returned from AI');
    }
    
    return improvedCVText;
  } catch (error) {
    console.error('Error improving CV with AI:', error);
    throw error;
  }
};

export type NewCVDetails = {
  fullName: string;
  targetRole: string;
  contact: string;
  profile: string;
  experience: string;
  education: string;
  skills: string;
  certifications: string;
  achievements: string;
  extraDetails: string;
};

export const createCVFromDetails = async (details: NewCVDetails): Promise<string> => {
  const prompt = `You are Aya, an elite UK CV writer who creates outstanding, human-sounding CVs that feel confident, specific, polished and employable without sounding robotic.

Target role: ${details.targetRole}
Full name: ${details.fullName}
Contact details: ${details.contact}
Professional profile / goals:
${details.profile}

Experience:
${details.experience}

Education:
${details.education}

Skills:
${details.skills}

Certifications / training:
${details.certifications}

Achievements:
${details.achievements}

Extra details:
${details.extraDetails}

Instructions:
- Use UK English spelling and wording throughout. Use terms like CV, role, organisation, programme, centre, analyse, optimise, tailored and professional.
- Return ONLY the finished CV text
- Do not reveal hidden reasoning, chain-of-thought, planning notes, or analysis steps
- Create an outstanding CV, not a basic template
- Make the writing sound human, natural, confident and professional
- Strengthen and "plump up" the user's details by expanding thin notes into richer, clearer achievement-focused bullets
- Use strong action verbs and role-relevant language
- Make responsibilities sound purposeful and valuable, while staying truthful
- Turn rough notes into polished statements a recruiter would understand quickly
- Add professional section headings and concise bullet points
- Do not invent employers, dates, qualifications, or achievements
- Do not invent exact metrics, numbers, awards, certifications, software, employers, schools or dates
- If the user gives vague work, describe the likely responsibility in neutral terms without adding false specifics
- If a detail is missing, leave it out rather than making it up
- Tailor the wording toward ${details.targetRole || 'the target role'}
- Prioritise profile, key skills, experience, education, certifications/training, achievements and additional information where supplied
- Output plain text only, no markdown fences`;

  const completion = await createGroqChatCompletion({
    messages: [
      {
        role: 'system',
        content: 'You are Aya, a professional UK CV writer. Use UK English. Output only the finished CV text, never reasoning or hidden thinking.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.35,
    max_tokens: 5000,
  });

  const cvText = cleanGeneratedCVText(completion.choices[0]?.message?.content || '');
  if (!cvText) {
    throw new Error('No CV returned from AI');
  }

  return cvText;
};
