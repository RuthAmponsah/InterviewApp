import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  RefreshControl,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';
import ScreenHeader from "../components/ScreenHeader";
import { useTheme } from "../theme/ThemeContext";
import { typography } from "../theme/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from '../config/supabase';
import { getQuestionAnswerFeedback, type QuestionAnswerFeedback } from "../services/aiService";
import PaywallModal from "../components/PaywallModal";
import { checkSubscriptionStatus, isPremiumTier } from "../services/purchaseService";
import { keyboardAwareScrollProps, keyboardAvoidingBehavior, keyboardVerticalOffset } from "../utils/keyboard";

type QuestionCategory = 'Behavioral' | 'Technical' | 'Situational' | 'Strengths' | 'Role-Specific' | 'Custom';

type Question = {
  id: string;
  category: QuestionCategory;
  text: string;
  isCustom?: boolean;
  isPremium?: boolean;
};

type AnswerFramework = {
  id: 'star' | 'intro' | 'motivation' | 'strength' | 'technical' | 'scenario' | 'direct';
  label: string;
  summary: string;
  guidance: string[];
  placeholder: string;
};

const FRAMEWORKS: Record<AnswerFramework['id'], AnswerFramework> = {
  star: {
    id: 'star',
    label: 'STAR method',
    summary: 'Best for competency questions asking about a real past example.',
    guidance: ['Situation: set the scene briefly', 'Task: explain what needed to happen', 'Action: focus on what you personally did', 'Result: show the outcome or learning'],
    placeholder: 'Situation: What was happening?\nTask: What needed to be done?\nAction: What did you personally do?\nResult: What changed or what did you learn?',
  },
  intro: {
    id: 'intro',
    label: 'Professional introduction',
    summary: 'Use this to introduce who you are and why you fit the role.',
    guidance: ['Who you are professionally', 'Relevant background or experience', 'Key strengths', 'Why this role or company interests you'],
    placeholder: 'I’m a...\nMy background includes...\nMy key strengths are...\nI’m interested in this role because...',
  },
  motivation: {
    id: 'motivation',
    label: 'Motivation structure',
    summary: 'Show genuine interest in the company, role and career fit.',
    guidance: ['Interest in the company', 'Interest in the position', 'Relevant experience or skills', 'How it fits your career goals'],
    placeholder: 'I’m interested in this company because...\nThe role appeals to me because...\nMy experience in...\nThis fits my career goals because...',
  },
  strength: {
    id: 'strength',
    label: 'Strength/reflection structure',
    summary: 'Be honest, specific and show self-awareness.',
    guidance: ['Name the strength or weakness clearly', 'Give brief evidence or context', 'Explain the impact or lesson', 'Connect it back to the role'],
    placeholder: 'One strength/area I’m developing is...\nFor example...\nThe impact/lesson was...\nThis matters for the role because...',
  },
  technical: {
    id: 'technical',
    label: 'Clear technical answer',
    summary: 'Answer directly, then support it with experience or an example.',
    guidance: ['Give the direct answer first', 'Explain your knowledge or process', 'Add a relevant example if possible', 'Mention trade-offs, tools or outcomes'],
    placeholder: 'My direct answer is...\nI approach this by...\nA relevant example is...\nThe key trade-off/outcome was...',
  },
  scenario: {
    id: 'scenario',
    label: 'Structured scenario answer',
    summary: 'Explain what you would do step by step and why.',
    guidance: ['Clarify the situation', 'Explain your first action', 'Show how you would communicate or escalate', 'End with the intended outcome'],
    placeholder: 'First, I would...\nThen I would...\nI would communicate/escalate by...\nThe outcome I’d aim for is...',
  },
  direct: {
    id: 'direct',
    label: 'Direct answer',
    summary: 'Keep it clear, relevant and connected to the role.',
    guidance: ['Answer the question directly', 'Add relevant evidence', 'Keep it concise', 'Connect it back to the role'],
    placeholder: 'My answer is...\nA relevant example/detail is...\nThis matters for the role because...',
  },
};

const getAnswerFramework = (question: Question): AnswerFramework => {
  const text = question.text.toLowerCase();

  if (/tell me about yourself|introduce yourself|walk me through your cv|walk me through your resume/.test(text)) {
    return FRAMEWORKS.intro;
  }

  if (/why do you want|why are you interested|why this company|why.*role|what motivates you/.test(text)) {
    return FRAMEWORKS.motivation;
  }

  if (/strength|weakness|unique|passionate|greatest accomplishment|why should we hire/.test(text) || question.category === 'Strengths') {
    return FRAMEWORKS.strength;
  }

  if (question.category === 'Technical') {
    return FRAMEWORKS.technical;
  }

  if (/what would you do|how would you|approach learning|handle/.test(text) || question.category === 'Situational') {
    return FRAMEWORKS.scenario;
  }

  if (/tell me about a time|describe a time|give an example|when you|had to/.test(text) || question.category === 'Behavioral') {
    return FRAMEWORKS.star;
  }

  return FRAMEWORKS.direct;
};

const PRACTICE_QUESTIONS: Question[] = [
  // Behavioral
  { id: '1', category: 'Behavioral', text: 'Tell me about yourself.' },
  { id: '2', category: 'Behavioral', text: 'Why do you want to work here?' },
  { id: '3', category: 'Behavioral', text: 'Tell me about a time you faced a challenge at work.' },
  { id: '4', category: 'Behavioral', text: 'Describe a time you worked on a team project.' },
  { id: '5', category: 'Behavioral', text: 'Tell me about a time you had a conflict with a coworker.' },
  { id: '6', category: 'Behavioral', text: 'Describe a time you failed and what you learned.' },
  { id: '7', category: 'Behavioral', text: 'Tell me about a time you showed leadership.' },
  { id: '8', category: 'Behavioral', text: 'Describe a time you had to meet a tight deadline.' },
  
  // Technical  
  { id: '9', category: 'Technical', text: 'What programming languages are you proficient in?' },
  { id: '10', category: 'Technical', text: 'Explain the difference between SQL and NoSQL databases.' },
  { id: '11', category: 'Technical', text: 'How would you optimise a slow database query?' },
  { id: '12', category: 'Technical', text: 'What is your experience with cloud platforms?' },
  { id: '13', category: 'Technical', text: 'Explain what RESTful APIs are.' },
  { id: '14', category: 'Technical', text: 'How do you handle errors in your code?' },
  { id: '15', category: 'Technical', text: 'What testing frameworks have you used?' },
  { id: '16', category: 'Technical', text: 'Explain version control and Git workflow.' },
  
  // Situational
  { id: '17', category: 'Situational', text: 'How would you handle an angry customer?' },
  { id: '18', category: 'Situational', text: 'What would you do if you disagreed with your manager?' },
  { id: '19', category: 'Situational', text: 'How would you prioritise multiple urgent tasks?' },
  { id: '20', category: 'Situational', text: 'What would you do if you made a mistake at work?' },
  { id: '21', category: 'Situational', text: 'How would you handle a team member not pulling their weight?' },
  { id: '22', category: 'Situational', text: 'What would you do if asked to do something unethical?' },
  { id: '23', category: 'Situational', text: 'How would you approach learning a new technology quickly?' },
  { id: '24', category: 'Situational', text: 'What would you do if you couldn\'t meet a deadline?' },
  
  // Strengths
  { id: '25', category: 'Strengths', text: 'What are your greatest strengths?' },
  { id: '26', category: 'Strengths', text: 'What are your weaknesses?' },
  { id: '27', category: 'Strengths', text: 'Why should we hire you?' },
  { id: '28', category: 'Strengths', text: 'Where do you see yourself in 5 years?' },
  { id: '29', category: 'Strengths', text: 'What motivates you?' },
  { id: '30', category: 'Strengths', text: 'What makes you unique?' },
  { id: '31', category: 'Strengths', text: 'What are you passionate about?' },
  { id: '32', category: 'Strengths', text: 'What is your greatest accomplishment?' },
  
  // Role-Specific (Premium) - Software Engineer
  { id: 'rs-1', category: 'Role-Specific', text: 'Walk me through your approach to debugging a critical production bug affecting customer transactions.', isPremium: true },
  { id: 'rs-2', category: 'Role-Specific', text: 'Describe how you would refactor a large, working codebase to improve performance and maintainability.', isPremium: true },
  { id: 'rs-3', category: 'Role-Specific', text: 'Tell me about your experience designing and implementing a system that scales to handle millions of users.', isPremium: true },
  { id: 'rs-4', category: 'Role-Specific', text: 'How do you approach code reviews? Give an example of constructive feedback you\'ve given a colleague.', isPremium: true },
  
  // Role-Specific (Premium) - Data Analyst
  { id: 'rs-5', category: 'Role-Specific', text: 'Describe a time when you identified an anomaly in data and how you investigated and resolved it.', isPremium: true },
  { id: 'rs-6', category: 'Role-Specific', text: 'Walk me through how you would build a dashboard to track key business metrics for executives.', isPremium: true },
  { id: 'rs-7', category: 'Role-Specific', text: 'Tell me about a time you used data to challenge an existing business assumption or decision.', isPremium: true },
  { id: 'rs-8', category: 'Role-Specific', text: 'How do you ensure data quality when working with multiple sources and complex datasets?', isPremium: true },
  
  // Role-Specific (Premium) - Sales
  { id: 'rs-9', category: 'Role-Specific', text: 'Describe how you\'ve turned a prospect who initially said "no" into a closed deal.', isPremium: true },
  { id: 'rs-10', category: 'Role-Specific', text: 'Walk me through your process for understanding a customer\'s pain points and positioning our solution.', isPremium: true },
  { id: 'rs-11', category: 'Role-Specific', text: 'Tell me about your strategy for managing a pipeline with strict quarterly targets.', isPremium: true },
  { id: 'rs-12', category: 'Role-Specific', text: 'How do you build long-term relationships with clients and identify upsell opportunities?', isPremium: true },
  
  // Role-Specific (Premium) - Project Manager
  { id: 'rs-13', category: 'Role-Specific', text: 'Describe a project that went off track. How did you identify the issue and get it back on schedule?', isPremium: true },
  { id: 'rs-14', category: 'Role-Specific', text: 'Walk me through your approach to managing stakeholder expectations across a complex project.', isPremium: true },
  { id: 'rs-15', category: 'Role-Specific', text: 'Tell me about a time you had to manage conflicting priorities between team members or departments.', isPremium: true },
  { id: 'rs-16', category: 'Role-Specific', text: 'How do you measure project success and communicate progress to leadership?', isPremium: true },
  
  // Role-Specific (Premium) - Marketing
  { id: 'rs-17', category: 'Role-Specific', text: 'Describe a marketing campaign you created from scratch and how you measured its success.', isPremium: true },
  { id: 'rs-18', category: 'Role-Specific', text: 'Walk me through your approach to A/B testing and optimising marketing performance.', isPremium: true },
  { id: 'rs-19', category: 'Role-Specific', text: 'Tell me about a time you had to pivot a marketing strategy based on data or market changes.', isPremium: true },
  { id: 'rs-20', category: 'Role-Specific', text: 'How do you collaborate with sales and product teams to ensure aligned messaging and targets?', isPremium: true },
];

const createPremiumQuestions = (
  prefix: string,
  category: QuestionCategory,
  questions: string[],
): Question[] =>
  questions.map((text, index) => ({
    id: `${prefix}-${index + 1}`,
    category,
    text,
    isPremium: true,
  }));

const FREQUENT_QUESTION_PRIORITY: string[] = [
  'tell me about yourself',
  'why do you want to work here',
  'why do you want to work in',
  'why are you interested',
  'why should we hire you',
  'what are your greatest strengths',
  'what are your weaknesses',
  'where do you see yourself',
  'what motivates you',
  'what makes you unique',
  'greatest accomplishment',
  'tell me about a time you faced a challenge',
  'tell me about a time you had a conflict',
  'describe a time you failed',
  'tell me about a time you showed leadership',
  'describe a time you worked on a team',
  'describe a time you had to meet a tight deadline',
  'prioritise multiple urgent tasks',
  'angry customer',
  'difficult or unhappy customer',
  'disagreed with your manager',
  'made a mistake',
  'couldn\'t meet a deadline',
  'tell me about a time you improved a process',
  'tell me about a time you stayed calm under pressure',
  'tell me about a time you received difficult feedback',
  'tell me about a time you went above and beyond',
  'do you have any questions',
];

const getQuestionPriority = (question: Question) => {
  const text = question.text.toLowerCase();
  const matchedIndex = FREQUENT_QUESTION_PRIORITY.findIndex((phrase) => text.includes(phrase));

  if (matchedIndex !== -1) {
    return matchedIndex;
  }

  const categoryBasePriority: Record<QuestionCategory, number> = {
    Behavioral: 100,
    Strengths: 200,
    Situational: 300,
    'Role-Specific': 400,
    Technical: 500,
    Custom: 600,
  };

  return categoryBasePriority[question.category] ?? 700;
};

const sortByInterviewFrequency = (questions: Question[]) =>
  [...questions].sort((a, b) => {
    const priorityDifference = getQuestionPriority(a) - getQuestionPriority(b);
    if (priorityDifference !== 0) return priorityDifference;
    return questions.indexOf(a) - questions.indexOf(b);
  });

const EXPANDED_PREMIUM_QUESTIONS: Question[] = [
  ...createPremiumQuestions('exp-beh', 'Behavioral', [
    'Tell me about a time you improved a process at work.',
    'Tell me about a time you had to earn someone\'s trust.',
    'Tell me about a time you dealt with unclear instructions.',
    'Tell me about a time you supported a colleague who was struggling.',
    'Tell me about a time you had to stay calm under pressure.',
    'Tell me about a time you took ownership of a mistake.',
    'Tell me about a time you received difficult feedback.',
    'Tell me about a time you changed your approach after something did not work.',
    'Tell me about a time you had to persuade someone to see your point of view.',
    'Tell me about a time you worked with someone whose style was different from yours.',
    'Tell me about a time you had to learn something quickly.',
    'Tell me about a time you went above and beyond what was expected.',
    'Tell me about a time you handled confidential or sensitive information.',
    'Tell me about a time you improved communication within a team.',
    'Tell me about a time you dealt with a demanding customer, client or stakeholder.',
    'Tell me about a time you had to manage competing priorities.',
    'Tell me about a time you noticed a risk before it became a bigger problem.',
    'Tell me about a time you had to make a decision with limited information.',
    'Tell me about a time you helped someone understand a complex issue.',
    'Tell me about a time you had to adapt to a major change.',
    'Tell me about a time you challenged a decision respectfully.',
    'Tell me about a time you delivered work you were proud of.',
    'Tell me about a time you had to work independently.',
    'Tell me about a time you contributed to a positive team culture.',
    'Tell me about a time you had to rebuild confidence after a setback.',
    'Describe a time you handled a complaint professionally.',
    'Describe a time you spotted an opportunity to make work more efficient.',
    'Describe a time you balanced quality with speed.',
    'Describe a time you helped train or guide someone else.',
    'Describe a time you used initiative without being asked.',
    'Describe a time you worked towards a difficult target.',
    'Describe a time you had to manage expectations.',
    'Describe a time you took responsibility for a difficult outcome.',
    'Describe a time you built a good relationship with a difficult person.',
    'Describe a time you had to communicate bad news.',
    'Describe a time you showed attention to detail.',
    'Describe a time you helped solve a team problem.',
    'Describe a time you had to stay organised during a busy period.',
    'Give an example of when you showed resilience.',
    'Give an example of when you improved the experience of a customer, patient, client or user.',
    'Give an example of when you used data or evidence to support a decision.',
    'Give an example of when you handled pressure without lowering your standards.',
    'Give an example of when you had to be flexible at short notice.',
    'Give an example of when you learned from a mistake and changed your behaviour.',
    'Give an example of when you made a positive contribution outside your normal duties.',
  ]),
  ...createPremiumQuestions('exp-sit', 'Situational', [
    'What would you do if you were given two urgent tasks at the same time?',
    'What would you do if a customer or client became rude to you?',
    'What would you do if you realised you had made an error after submitting work?',
    'What would you do if you did not understand a task you had been given?',
    'What would you do if your manager was unavailable and you needed a decision quickly?',
    'What would you do if a colleague asked you to cover up a mistake?',
    'What would you do if you joined a team where morale was low?',
    'What would you do if a deadline moved forward unexpectedly?',
    'What would you do if you had too much work and not enough time?',
    'What would you do if you noticed a safety, safeguarding or compliance concern?',
    'What would you do if a customer asked for something you could not provide?',
    'What would you do if your workload was interrupted repeatedly?',
    'What would you do if a team member was not communicating properly?',
    'What would you do if you disagreed with feedback you received?',
    'What would you do if you were asked to learn a new system quickly?',
    'How would you handle a manager giving you conflicting instructions?',
    'How would you handle a colleague taking credit for your work?',
    'How would you respond if a customer left a negative review about your service?',
    'How would you approach your first week in this role?',
    'How would you prepare for a busy day with limited resources?',
    'How would you handle a situation where quality standards were slipping?',
    'How would you build trust with a new team?',
    'How would you deal with someone who repeatedly interrupts you?',
    'How would you handle being asked to do something outside your comfort zone?',
    'How would you respond if you saw a colleague being treated unfairly?',
    'How would you prioritise if everything felt important?',
    'How would you manage a task where the goal was clear but the method was not?',
    'How would you keep yourself motivated during repetitive work?',
    'How would you handle a mistake made by someone you supervise or support?',
    'How would you approach a difficult conversation with a colleague?',
    'How would you handle a sudden change in customer, client or service-user needs?',
    'How would you respond if you were falling behind in training?',
    'How would you handle confidential information being discussed inappropriately?',
    'How would you approach a task where you had no previous experience?',
    'How would you deal with a stakeholder who keeps changing their mind?',
    'How would you handle a situation where you had to say no professionally?',
    'How would you keep communication clear during a stressful shift or project?',
    'How would you respond if your work was criticised in front of others?',
    'How would you manage your time if your normal routine was disrupted?',
    'How would you make sure a handover was clear and complete?',
  ]),
  ...createPremiumQuestions('exp-str', 'Strengths', [
    'What kind of work brings out your best performance?',
    'What kind of team environment helps you thrive?',
    'What feedback have you received most often?',
    'What skill are you currently trying to improve?',
    'What do people usually rely on you for?',
    'What would your previous manager say you do well?',
    'What would your colleagues say is your biggest strength?',
    'What is one area you have actively developed recently?',
    'What are you naturally good at?',
    'What makes you reliable?',
    'What does professionalism mean to you?',
    'What does good communication look like in this role?',
    'What does excellent service mean to you?',
    'What does accountability mean to you?',
    'What does teamwork mean to you?',
    'What are you most proud of in your career so far?',
    'What have you learned about yourself at work?',
    'What would you like to be known for professionally?',
    'What is one habit that helps you stay organised?',
    'What is one weakness you have made real progress on?',
    'What motivates you during challenging periods?',
    'What helps you stay calm when things are busy?',
    'What makes you a good fit for this role?',
    'What separates you from other candidates?',
    'What value would you bring to this team?',
    'What are your long-term career goals?',
    'What are your short-term development goals?',
    'What kind of manager helps you do your best work?',
    'What kind of feedback helps you improve?',
    'What achievement best shows your work ethic?',
    'Why should we trust you with this responsibility?',
    'Why are you ready for this next step?',
    'Why do you believe this role suits your personality?',
    'How do you keep yourself accountable?',
    'How do you respond when you are outside your comfort zone?',
    'How do you build confidence in a new role?',
    'How do you handle constructive criticism?',
    'How do you maintain high standards?',
    'How do you stay consistent when motivation drops?',
    'How do you know when you have done a good job?',
  ]),
  ...createPremiumQuestions('exp-tech', 'Technical', [
    'What tools or systems have you used most confidently in previous roles?',
    'How do you check your work for accuracy?',
    'How do you approach solving a problem you have not seen before?',
    'How do you document your work so others can understand it?',
    'How do you decide when to ask for help?',
    'How do you keep your technical or role-specific knowledge up to date?',
    'How do you explain technical information to someone without your background?',
    'How do you balance speed, accuracy and quality?',
    'How do you make sure important information is not missed?',
    'How do you approach troubleshooting?',
    'How do you manage records, notes or documentation accurately?',
    'How do you protect confidential or sensitive information?',
    'How do you learn a new tool, system or process?',
    'How do you test whether your work has solved the original problem?',
    'How do you manage version control, file naming or document changes?',
    'How do you prioritise technical tasks when there are dependencies?',
    'How do you identify root causes rather than symptoms?',
    'How do you reduce errors in repetitive tasks?',
    'How do you handle a system or process failure?',
    'How do you communicate risk to non-technical colleagues?',
    'What role-specific regulations, policies or standards matter most here?',
    'What would you do if a system gave you information that looked wrong?',
    'What would you do if you found inconsistent data or records?',
    'What would you do if a process was inefficient but well established?',
    'What would you check before escalating a technical issue?',
    'What does good documentation look like to you?',
    'What does quality assurance mean in your work?',
    'What does data accuracy mean in your role?',
    'What does continuous improvement mean in practice?',
    'What technical skill are you most confident using?',
    'What technical skill are you currently developing?',
    'What is your process for reviewing important work before submission?',
    'What is your approach to using AI or automation responsibly at work?',
    'What is your experience working with spreadsheets, databases or reporting tools?',
    'What is your experience following procedures or standard operating processes?',
    'What is your experience working with customer, client, patient or user records?',
    'What is your experience using digital communication tools professionally?',
    'What is your experience working with targets, KPIs or service levels?',
    'What is your experience handling high-volume work accurately?',
    'What is your experience improving a technical or operational process?',
  ]),
  ...createPremiumQuestions('exp-role', 'Role-Specific', [
    'What would success look like in this role after three months?',
    'What would you focus on first if you were offered this role?',
    'What parts of this role match your strongest experience?',
    'What parts of this role would stretch you the most?',
    'What do you understand about the day-to-day responsibilities of this role?',
    'What risks or pressures do you think come with this role?',
    'What standards would you hold yourself to in this role?',
    'What would you need from your manager to perform well in this role?',
    'What transferable skills would help you succeed in this role?',
    'What relevant achievement best prepares you for this role?',
    'What would you do to build credibility quickly in this role?',
    'What would you do to understand the team\'s priorities?',
    'What would you do if you realised your skills had a gap for this role?',
    'What would you do if the reality of the role differed from your expectations?',
    'What would make you stay and grow in this role?',
    'Why does this role feel like the right next step?',
    'Why are you interested in this sector?',
    'Why are you interested in this level of responsibility?',
    'Why would this team benefit from hiring you?',
    'Why do you think your background is relevant here?',
    'How would your previous experience help you handle the busiest part of this role?',
    'How would you build relationships with people you depend on in this role?',
    'How would you measure your own performance in this role?',
    'How would you keep learning once you started this role?',
    'How would you manage pressure specific to this role?',
    'How would you communicate with stakeholders in this role?',
    'How would you make sure your work supports wider team goals?',
    'How would you handle feedback during your probation period?',
    'How would you show initiative in this role without overstepping?',
    'How would you approach a task in this role that you had never done before?',
    'How would you handle conflicting expectations in this role?',
    'How would you show professionalism with customers, clients, patients or service users?',
    'How would you deal with repetitive parts of this role while staying engaged?',
    'How would you bring fresh ideas while respecting existing ways of working?',
    'How would you support colleagues during a busy period?',
    'How would you decide when to escalate an issue in this role?',
    'How would you prepare yourself before starting this role?',
    'How would you make sure you understood company policies and expectations?',
    'How would you contribute to a positive culture in this role?',
    'How would you handle a difficult first month?',
    'How would you balance learning with delivering results?',
    'How would you respond if the role required more independence than expected?',
    'How would you respond if the role required more teamwork than expected?',
    'How would you show that you are serious about this career path?',
    'How would you use your strengths to add value in this role?',
    'How would you explain your interest in this role to someone outside the industry?',
    'How would you make your first impression count?',
    'How would you handle being compared with more experienced candidates?',
    'How would you show that you understand the organisation\'s customers or service users?',
    'How would you keep yourself organised in this role?',
    'How would you deal with uncertainty in this role?',
    'How would you make sure you keep improving after training ends?',
    'How would you contribute if the team was short staffed or under pressure?',
    'How would you connect your personal values to this role?',
    'How would you answer concerns about limited direct experience?',
    'How would you turn your previous experience into value for this employer?',
    'How would you handle a role where priorities change quickly?',
    'How would you show attention to detail in this role?',
    'How would you build confidence with the systems or processes used in this role?',
    'How would you know when to work independently and when to collaborate?',
  ]),
];

const getRoleSpecificQuestions = (role?: string): Question[] => {
  const targetRole = role?.trim() || 'your target role';
  const safeRoleId = targetRole.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'target-role';

  return [
    {
      id: `role-${safeRoleId}-1`,
      category: 'Role-Specific',
      text: `What interests you most about working as a ${targetRole}?`,
      isPremium: true,
    },
    {
      id: `role-${safeRoleId}-2`,
      category: 'Role-Specific',
      text: `Talk me through the experience, strengths or personal qualities that would help you succeed as a ${targetRole}.`,
      isPremium: true,
    },
    {
      id: `role-${safeRoleId}-3`,
      category: 'Role-Specific',
      text: `Tell me about a time you handled a difficult situation that is relevant to a ${targetRole} role.`,
      isPremium: true,
    },
    {
      id: `role-${safeRoleId}-4`,
      category: 'Role-Specific',
      text: `How would you prioritise your workload during a busy shift or demanding day as a ${targetRole}?`,
      isPremium: true,
    },
    {
      id: `role-${safeRoleId}-5`,
      category: 'Role-Specific',
      text: `What standards, checks or good practices matter most in a ${targetRole} role?`,
      isPremium: true,
    },
    {
      id: `role-${safeRoleId}-6`,
      category: 'Role-Specific',
      text: `How would you communicate with colleagues, customers, clients, patients or service users in a ${targetRole} role?`,
      isPremium: true,
    },
    {
      id: `role-${safeRoleId}-7`,
      category: 'Role-Specific',
      text: `What tools, systems, processes or role-specific knowledge would you expect to use as a ${targetRole}?`,
      isPremium: true,
    },
    {
      id: `role-${safeRoleId}-8`,
      category: 'Role-Specific',
      text: `If you were offered a ${targetRole} role, what would you focus on in your first 30 days?`,
      isPremium: true,
    },
  ];
};

const AI_FREE_LIMIT = 2;
const AI_USAGE_KEY = 'question_bank_ai_usage_v1';

const CATEGORIES: QuestionCategory[] = ['Behavioral', 'Technical', 'Situational', 'Strengths', 'Role-Specific', 'Custom'];

export default function QuestionBank({ navigation }: any) {
  const { colors, theme } = useTheme();
  const isDark = theme === "dark";
  const styles = makeStyles(colors, isDark);
  
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | 'All' | 'Favorites'>('All');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [customQuestions, setCustomQuestions] = useState<Question[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newCategory, setNewCategory] = useState<QuestionCategory>('Behavioral');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [previousAnswers, setPreviousAnswers] = useState<any[]>([]);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [jobRole, setJobRole] = useState<string>('');
  const [aiFeedback, setAiFeedback] = useState<QuestionAnswerFeedback | null>(null);
  const [feedbackAnswerSnapshot, setFeedbackAnswerSnapshot] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiUsageCount, setAiUsageCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    loadCustomQuestions();
    loadFavorites();
    loadUserData();
    loadAiUsage();
  }, []);


  const loadAiUsage = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const stored = await AsyncStorage.getItem(AI_USAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { date: string; count: number };
        if (parsed.date === today) {
          setAiUsageCount(parsed.count || 0);
          return;
        }
      }
      await AsyncStorage.setItem(AI_USAGE_KEY, JSON.stringify({ date: today, count: 0 }));
      setAiUsageCount(0);
    } catch (error) {
      console.error('Error loading AI usage:', error);
    }
  };

  const incrementAiUsage = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const nextCount = aiUsageCount + 1;
      await AsyncStorage.setItem(AI_USAGE_KEY, JSON.stringify({ date: today, count: nextCount }));
      setAiUsageCount(nextCount);
    } catch (error) {
      console.error('Error saving AI usage:', error);
    }
  };

  const loadUserData = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const jobRoleStored = await AsyncStorage.getItem('jobRole');
      
      if (userId) {
        const status = await checkSubscriptionStatus();
        setSubscriptionTier(status.tier);
      }
      
      if (jobRoleStored) {
        setJobRole(jobRoleStored);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadFavorites = async () => {
    try {
      const saved = await AsyncStorage.getItem('favorite_questions');
      if (saved) {
        setFavorites(new Set(JSON.parse(saved)));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const toggleFavorite = async (questionId: string) => {
    const newFavorites = new Set(favorites);
    const isAdding = !newFavorites.has(questionId);
    
    if (newFavorites.has(questionId)) {
      newFavorites.delete(questionId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      newFavorites.add(questionId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setFavorites(newFavorites);
    try {
      await AsyncStorage.setItem('favorite_questions', JSON.stringify(Array.from(newFavorites)));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  // Load previous answers for a selected question
  const loadPreviousAnswers = async (questionId: string) => {
    try {
      const user_id = await AsyncStorage.getItem('userId');
      if (!user_id) return;

      const { data, error } = await supabase
        .from('question_answers')
        .select('*')
        .eq('user_id', user_id)
        .eq('question_id', questionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading previous answers:', error);
      } else if (data) {
        setPreviousAnswers(data);
      }
    } catch (error) {
      console.error('Error loading previous answers:', error);
    }
  };

  const loadCustomQuestions = async () => {
    try {
      // Get user ID from AsyncStorage
      const user_id = await AsyncStorage.getItem('userId');
      
      if (user_id) {
        const { data, error } = await supabase
          .from('custom_questions')
          .select('id, question_text, category')
          .eq('user_id', user_id)
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Error loading from database, trying local storage:', error);
        } else if (data) {
          // Convert database format to Question format
          const dbQuestions: Question[] = data.map((q: any) => ({
            id: q.id,
            category: q.category as QuestionCategory,
            text: q.question_text,
            isCustom: true,
          }));
          setCustomQuestions(dbQuestions);
          return;
        }
      }

      // Fallback to local storage if not logged in or database fails
      const saved = await AsyncStorage.getItem('custom_questions');
      if (saved) {
        setCustomQuestions(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading custom questions:', error);
    }
  };

  const saveCustomQuestions = async (questions: Question[]) => {
    try {
      // Update local state
      setCustomQuestions(questions);
      // Also save to local storage as backup
      await AsyncStorage.setItem('custom_questions', JSON.stringify(questions));
    } catch (error) {
      console.error('Error saving custom questions locally:', error);
    }
  };

  const addCustomQuestion = async () => {
    if (!newQuestion.trim()) {
      Alert.alert('Error', 'Please enter a question');
      return;
    }

    try {
      // Get user ID from AsyncStorage
      const user_id = await AsyncStorage.getItem('userId');
      
      if (!user_id) {
        Alert.alert('Error', 'You must be logged in to create custom questions.');
        return;
      }

      // Save to database first
      const { data, error } = await supabase
        .from('custom_questions')
        .insert([
          {
            user_id,
            question_text: newQuestion.trim(),
            category: newCategory,
          },
        ])
        .select();

      if (error) {
        console.error('Database error:', error);
        Alert.alert('Error', 'Failed to create custom question. Please try again.');
        return;
      }

      // Create local question object with database ID
      const question: Question = {
        id: data[0].id, // Use database UUID as ID
        category: newCategory,
        text: newQuestion.trim(),
        isCustom: true,
      };

      // Update local state
      const updated = [...customQuestions, question];
      saveCustomQuestions(updated);
      setNewQuestion('');
      setShowAddModal(false);
      Alert.alert('✅ Success', 'Custom question created and saved!');
    } catch (error) {
      console.error('Error creating custom question:', error);
      Alert.alert('Error', 'Failed to create custom question.');
    }
  };

  const deleteCustomQuestion = (id: string) => {
    Alert.alert(
      'Delete Question',
      'Are you sure you want to delete this custom question?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Get user ID from AsyncStorage
              const user_id = await AsyncStorage.getItem('userId');
              if (!user_id) {
                Alert.alert('Error', 'You must be logged in to delete questions.');
                return;
              }

              // Delete from database (specify user_id for RLS)
              const { error } = await supabase
                .from('custom_questions')
                .delete()
                .eq('id', id)
                .eq('user_id', user_id);

              if (error) {
                console.error('Database error:', error);
                Alert.alert('Error', 'Failed to delete question.');
                return;
              }

              // Delete from local state
              const updated = customQuestions.filter(q => q.id !== id);
              saveCustomQuestions(updated);
              Alert.alert('✅ Deleted', 'Custom question removed.');
            } catch (error) {
              console.error('Error deleting question:', error);
              Alert.alert('Error', 'Failed to delete question.');
            }
          },
        },
      ]
    );
  };

  const roleSpecificQuestions = getRoleSpecificQuestions(jobRole);
  const standardQuestions = sortByInterviewFrequency([
    ...PRACTICE_QUESTIONS.filter((q) => q.category !== 'Role-Specific'),
    ...EXPANDED_PREMIUM_QUESTIONS,
  ]);
  const allQuestions = [...standardQuestions, ...roleSpecificQuestions, ...customQuestions];
  const selectedFramework = selectedQuestion ? getAnswerFramework(selectedQuestion) : null;
  
  let filteredQuestions = selectedCategory === 'All' 
    ? allQuestions
    : selectedCategory === 'Custom'
    ? customQuestions
    : selectedCategory === 'Favorites'
    ? allQuestions.filter(q => favorites.has(q.id))
    : allQuestions.filter(q => q.category === selectedCategory);

  // Apply search filter
  if (searchQuery.trim()) {
    filteredQuestions = filteredQuestions.filter(q => 
      q.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Save answer to Supabase
  const saveAnswer = async () => {
    if (!selectedQuestion || !answer.trim()) {
      Alert.alert('Error', 'Please write an answer first.');
      return;
    }
    try {
      // Get user ID from AsyncStorage (most reliable method)
      const user_id = await AsyncStorage.getItem('userId');
      console.log('📝 Attempting to save answer - userId:', user_id);
      
      if (!user_id) {
        Alert.alert('Error', 'You must be logged in to save answers.');
        return;
      }

      // Determine question type
      const questionType = selectedQuestion.isCustom ? 'custom' : 'standard';

      const { error } = await supabase.from('question_answers').insert([
        {
          user_id,
          question_id: selectedQuestion.id,
          question_text: selectedQuestion.text,
          answer: answer.trim(),
          question_type: questionType,
        },
      ]);

      if (error) {
        console.error('Database error:', error);
        Alert.alert('Error', 'Failed to save answer. Please try again.');
        return;
      }

      Alert.alert('✅ Saved!', 'Your answer has been saved to your account.');
      setAnswer('');
      setSelectedQuestion(null);
    } catch (error) {
      console.error('Error saving answer:', error);
      Alert.alert('Error', 'Failed to save answer.');
    }
  };

  const handleGetAiFeedback = async () => {
    if (!selectedQuestion || !answer.trim()) {
      Alert.alert('Error', 'Please write an answer first.');
      return;
    }

    if (!isPremiumTier(subscriptionTier) && aiUsageCount >= AI_FREE_LIMIT) {
      setShowPaywall(true);
      return;
    }

    try {
      setAiLoading(true);
      const feedback = await getQuestionAnswerFeedback(
        selectedQuestion.text,
        answer.trim(),
        jobRole || undefined,
        selectedQuestion.category,
        getAnswerFramework(selectedQuestion)
      );

      if (!feedback) {
        Alert.alert('Error', 'Unable to generate feedback right now. Please try again.');
        return;
      }

      setAiFeedback(feedback);
      setFeedbackAnswerSnapshot(answer.trim());

      if (!isPremiumTier(subscriptionTier)) {
        await incrementAiUsage();
      }
    } catch (error) {
      console.error('Error generating AI feedback:', error);
      Alert.alert('Error', 'Unable to generate feedback right now.');
    } finally {
      setAiLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCustomQuestions();
    await loadFavorites();
    setRefreshing(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={keyboardAvoidingBehavior}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <View style={styles.root}>
          <ScrollView 
            contentContainerStyle={styles.content}
            {...keyboardAwareScrollProps}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primaryBlue}
              />
            }
          >
            <ScreenHeader />
            
            <View style={styles.headerRow}>
            </View>

            <View style={styles.titleRow}>
              <Text style={styles.title}>Question Bank</Text>
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: colors.primaryBlue + '15', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.primaryBlue }]}
                onPress={() => setShowAddModal(true)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="add-circle" size={20} color={colors.primaryBlue} />
                  <Text style={{ color: colors.primaryBlue, fontSize: 12, fontWeight: '600' }}>Add</Text>
                </View>
              </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>
              Practice answering common interview questions
            </Text>

            {/* Info banner about custom questions */}
            <View style={[styles.infoBanner, { backgroundColor: colors.primaryBlue + '08', borderColor: colors.primaryBlue + '30', borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'flex-start' }]}>
              <Ionicons name="information-circle" size={16} color={colors.primaryBlue} style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={[styles.infoBannerText, { color: isDark ? '#b5b5b5' : colors.textMuted, fontSize: 12, flex: 1 }]}>
                Use the <Text style={{ fontWeight: '600', color: colors.primaryBlue }}>Add</Text> button to create your own interview questions
              </Text>
            </View>

            {/* Premium unlock message for role-specific */}
            {!isPremiumTier(subscriptionTier) && (
              <View style={[styles.premiumUnlockBanner, { backgroundColor: colors.primaryBlue + '15', borderColor: colors.primaryBlue, borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 20, flexDirection: 'row', alignItems: 'center' }]}>
                <Ionicons name="lock-closed" size={16} color={colors.primaryBlue} style={{ marginRight: 8 }} />
                <Text style={[styles.premiumUnlockText, { color: colors.primaryBlue, fontSize: 13 }]}>
                  Unlock role-specific questions with Premium
                </Text>
              </View>
            )}

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search questions..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} accessibilityLabel="Clear search" accessibilityRole="button">
                  <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Category Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterChip, selectedCategory === 'All' && styles.filterChipActive]}
                onPress={() => setSelectedCategory('All')}
              >
                <Text style={[styles.filterText, selectedCategory === 'All' && styles.filterTextActive]}>
                  All ({allQuestions.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, selectedCategory === 'Favorites' && styles.filterChipActive]}
                onPress={() => setSelectedCategory('Favorites')}
              >
                <Ionicons 
                  name={selectedCategory === 'Favorites' ? "star" : "star-outline"} 
                  size={16} 
                  color={selectedCategory === 'Favorites' ? '#fff' : colors.textDark}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.filterText, selectedCategory === 'Favorites' && styles.filterTextActive]}>
                  Favourites ({favorites.size})
                </Text>
              </TouchableOpacity>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.filterText, selectedCategory === cat && styles.filterTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Questions List */}
            {!selectedQuestion ? (
              <View style={styles.questionsList}>
                {filteredQuestions.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIllustration}>
                      <View style={styles.emptyCircle}>
                        <Ionicons name="help-circle-outline" size={52} color={colors.primaryBlue} />
                      </View>
                      <View style={styles.emptyDotA} />
                      <View style={styles.emptyDotB} />
                    </View>
                    <Text style={styles.emptyText}>No questions yet</Text>
                    <Text style={styles.emptySubtext}>Add your first custom question!</Text>
                  </View>
                ) : (
                  filteredQuestions.map((question) => (
                    <View key={question.id}>
                      {question.isPremium && !isPremiumTier(subscriptionTier) ? (
                        <TouchableOpacity 
                          style={[styles.questionCard, { backgroundColor: isDark ? '#1d1d1d' : '#FFFFFF', borderWidth: 1, borderColor: isDark ? '#333' : '#E5E7EB' }]}
                          onPress={() => setShowPaywall(true)}
                        >
                          <View style={styles.lockedQuestionContent}>
                            <View style={{ flex: 1, position: 'relative' }}>
                              <View style={styles.questionHeader}>
                                <Text style={[styles.categoryBadge, { opacity: 0.4 }]}>{question.category}</Text>
                              </View>
                              <View style={{ position: 'relative', marginVertical: 8 }}>
                                <Text style={[styles.questionText, { color: colors.textDark, marginVertical: 8, opacity: 0 }]}>{question.text}</Text>
                                <View style={{ 
                                  position: 'absolute', 
                                  top: 0, 
                                  left: 0, 
                                  right: 0, 
                                  bottom: 0,
                                  backgroundColor: isDark ? '#2a2a2a' : '#F0F0F0',
                                  borderRadius: 6,
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  opacity: 0.85
                                }}>
                                  <View style={{ alignItems: 'center', gap: 8 }}>
                                    <Ionicons name="lock-closed" size={20} color={colors.textMuted} />
                                    <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '500' }}>Premium content</Text>
                                    <Text style={{ color: colors.textMuted, fontSize: 10 }}>Tap to unlock</Text>
                                  </View>
                                </View>
                              </View>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.questionCard}>
                          <TouchableOpacity
                            style={styles.questionContent}
                            onPress={() => {
                              setSelectedQuestion(question);
                              setAnswer('');
                              setAiFeedback(null);
                              setFeedbackAnswerSnapshot('');
                              setPreviousAnswers([]);
                              loadPreviousAnswers(question.id);
                            }}
                          >
                            <View style={styles.questionHeader}>
                              <Text style={styles.categoryBadge}>{question.category}</Text>
                              {question.isCustom && (
                                <Text style={styles.customBadge}>Custom</Text>
                              )}
                            </View>
                            <Text style={styles.questionText}>{question.text}</Text>
                            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                          </TouchableOpacity>
                          <View style={styles.actionButtons}>
                            <TouchableOpacity
                              style={styles.favoriteButton}
                              onPress={() => toggleFavorite(question.id)}
                            >
                              <Ionicons 
                                name={favorites.has(question.id) ? "star" : "star-outline"} 
                                size={20} 
                                color={favorites.has(question.id) ? "#FFD700" : colors.textMuted}
                              />
                            </TouchableOpacity>
                            {question.isCustom && (
                              <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => deleteCustomQuestion(question.id)}
                                accessibilityLabel="Delete question"
                                accessibilityRole="button"
                              >
                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      )}
                    </View>
                  ))
                )}
              </View>
            ) : (
              <View style={styles.answerSection}>
                <TouchableOpacity
                  style={styles.backToList}
                  onPress={() => {
                    setSelectedQuestion(null);
                    setAnswer('');
                    setAiFeedback(null);
                    setFeedbackAnswerSnapshot('');
                  }}
                >
                  <Ionicons name="arrow-back" size={20} color={colors.primaryBlue} />
                  <Text style={styles.backToListText}>Back to questions</Text>
                </TouchableOpacity>

                <View style={styles.selectedQuestionCard}>
                  <Text style={styles.categoryBadge}>{selectedQuestion.category}</Text>
                  <Text style={styles.selectedQuestionText}>{selectedQuestion.text}</Text>
                </View>

                {selectedFramework && (
                  <View style={styles.frameworkCard}>
                    <Text style={styles.frameworkTitle}>{selectedFramework.label}</Text>
                    <Text style={styles.frameworkSummary}>{selectedFramework.summary}</Text>
                    {selectedFramework.guidance.map((item) => (
                      <Text key={item} style={styles.frameworkItem}>• {item}</Text>
                    ))}
                  </View>
                )}

                {/* Display Previous Answers */}
                {previousAnswers.length > 0 && (
                  <View style={[styles.previousAnswersSection, { borderColor: colors.primaryBlue }]}>
                    <Text style={styles.previousAnswersTitle}>📋 Your Previous Answers ({previousAnswers.length})</Text>
                    {previousAnswers.map((prev, index) => (
                      <View key={index} style={[styles.previousAnswerCard, { backgroundColor: isDark ? '#1a1a1a' : '#f9fafb' }]}>
                        <Text style={styles.previousAnswerDate}>
                          {new Date(prev.created_at).toLocaleDateString('en-GB', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                        <Text style={[styles.previousAnswerText, { color: colors.textDark }]}>{prev.answer}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <Text style={styles.answerLabel}>
                  Your Draft Answer{selectedFramework ? ` (${selectedFramework.label})` : ''}
                </Text>
                <TextInput
                  style={styles.answerInput}
                  placeholder={selectedFramework?.placeholder || 'Draft your answer here...'}
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  value={answer}
                  onChangeText={(text) => {
                    setAnswer(text);
                  }}
                  multiline
                  numberOfLines={12}
                  scrollEnabled={false}
                  textAlignVertical="top"
                />

                <View style={styles.aiSection}>
                  {!isPremiumTier(subscriptionTier) && (
                    <Text style={styles.aiUsageText}>
                      Free AI feedback left today: {Math.max(0, AI_FREE_LIMIT - aiUsageCount)}
                    </Text>
                  )}
                  <TouchableOpacity
                    style={[styles.aiButton, aiLoading && { opacity: 0.6 }]}
                    onPress={handleGetAiFeedback}
                    disabled={aiLoading}
                  >
                    <Text style={styles.aiButtonText}>
                      {aiLoading ? 'Analyzing...' : 'Get AI Feedback'}
                    </Text>
                  </TouchableOpacity>

                  {aiFeedback && (
                    <View style={styles.aiFeedbackCard}>
                      <View style={styles.aiFeedbackHeader}>
                        <Text style={styles.aiFeedbackTitle}>AI Feedback</Text>
                        <View style={styles.aiScoreBadge}>
                          <Text style={styles.aiScoreText}>{aiFeedback.score}/10</Text>
                        </View>
                      </View>

                      <Text style={styles.aiSectionLabel}>Strengths</Text>
                      {aiFeedback.strengths.map((item, index) => (
                        <Text key={`s-${index}`} style={styles.aiFeedbackItem}>• {item}</Text>
                      ))}

                      <Text style={styles.aiSectionLabel}>Improvements</Text>
                      {aiFeedback.improvements.map((item, index) => (
                        <Text key={`i-${index}`} style={styles.aiFeedbackItem}>• {item}</Text>
                      ))}

                      <Text style={styles.aiSectionLabel}>Better Answer</Text>
                      <Text style={styles.aiFeedbackText}>{aiFeedback.betterAnswer}</Text>

                      {feedbackAnswerSnapshot && feedbackAnswerSnapshot !== answer.trim() && (
                        <Text style={styles.feedbackNote}>
                          You’ve edited your draft since this feedback. Save the version you’re happy with, or get fresh feedback.
                        </Text>
                      )}
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.saveButton, !answer.trim() && styles.saveButtonDisabled]}
                  onPress={saveAnswer}
                  disabled={!answer.trim()}
                >
                  <Text style={styles.saveButtonText}>
                    {aiFeedback ? '💾 Save Final Answer' : '💾 Save Answer'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
          <PaywallModal
            visible={showPaywall}
            onClose={() => setShowPaywall(false)}
            onSuccess={() => loadUserData()}
          />
          {/* Add Custom Question Modal */}
          <Modal
            visible={showAddModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowAddModal(false)}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <KeyboardAvoidingView
                style={styles.modalOverlay}
                behavior={keyboardAvoidingBehavior}
                keyboardVerticalOffset={0}
              >
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Add Custom Question</Text>
                  <Text style={styles.inputLabel}>Question</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter your question..."
                    placeholderTextColor={isDark ? '#666' : '#999'}
                    value={newQuestion}
                    onChangeText={setNewQuestion}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                  <Text style={styles.inputLabel}>Category</Text>
                  <View style={styles.categoryGrid}>
                    {['Behavioral', 'Technical', 'Situational', 'Strengths'].map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryOption,
                          newCategory === cat && styles.categoryOptionSelected
                        ]}
                        onPress={() => setNewCategory(cat as QuestionCategory)}
                      >
                        <Text style={[
                          styles.categoryOptionText,
                          newCategory === cat && styles.categoryOptionTextSelected
                        ]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.modalButtons}>
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.modalButtonCancel]}
                      onPress={() => {
                        setShowAddModal(false);
                        setNewQuestion('');
                      }}
                    >
                      <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.modalButtonSave]}
                      onPress={addCustomQuestion}
                    >
                      <Text style={styles.modalButtonTextSave}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </Modal>
        </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: isDark ? "#0f0f0f" : "#F3F4F6",
    },
    content: {
      paddingHorizontal: 24,
      paddingBottom: 120,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 28,
      position: 'relative',
    },
    logoText: {
      ...typography.brandMark,
      color: colors.primaryBlue,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    addButton: {
      padding: 0,
    },
    title: {
      ...typography.headingMedium,
      textAlign: 'center',
      color: isDark ? "#fff" : colors.textDark,
    },
    subtitle: {
      ...typography.bodyMedium,
      textAlign: 'center',
      color: isDark ? "#b5b5b5" : colors.textMuted,
      marginBottom: 20,
    },
    infoBanner: {
      gap: 8,
    },
    infoBannerText: {
      ...typography.caption,
    },
    premiumUnlockBanner: {
      gap: 8,
    },
    premiumUnlockText: {
      ...typography.bodySmall,
      fontWeight: '600',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#2a2a2a' : '#fff',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? '#3a3a3a' : colors.border,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      ...typography.bodyMedium,
      color: isDark ? '#fff' : colors.textDark,
    },
    filterRow: {
      flexDirection: 'row',
      marginBottom: 24,
    },
    filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: isDark ? '#1d1d1d' : '#FFFFFF',
      marginRight: 8,
      borderWidth: 1,
      borderColor: isDark ? '#333' : colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    filterChipActive: {
      backgroundColor: colors.primaryBlue,
      borderColor: colors.primaryBlue,
    },
    filterText: {
      ...typography.bodySmall,
      color: isDark ? '#fff' : colors.textDark,
      fontWeight: '500',
    },
    filterTextActive: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    questionsList: {
      gap: 12,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 48,
    },
    emptyIllustration: {
      width: 120,
      height: 120,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.primaryBlue + '14',
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyDotA: {
      position: 'absolute',
      top: 6,
      right: 8,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.primaryBlue + '28',
    },
    emptyDotB: {
      position: 'absolute',
      bottom: 6,
      left: 10,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primaryBlue + '1e',
    },
    emptyText: {
      ...typography.bodyMedium,
      fontWeight: '600',
      color: isDark ? '#fff' : colors.textDark,
      marginTop: 12,
    },
    emptySubtext: {
      ...typography.bodySmall,
      color: isDark ? '#b5b5b5' : colors.textMuted,
      marginTop: 4,
    },
    questionCard: {
      backgroundColor: isDark ? '#1d1d1d' : '#FFFFFF',
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#E5E7EB',
    },
    questionContent: {
      flex: 1,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    lockedQuestionContent: {
      flex: 1,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    questionHeader: {
      marginBottom: 8,
      flexDirection: 'row',
      gap: 8,
    },
    categoryBadge: {
      ...typography.caption,
      color: colors.primaryBlue,
      fontWeight: '600',
      backgroundColor: colors.primaryBlue + '15',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      alignSelf: 'flex-start',
      marginBottom: 8,
    },
    customBadge: {
      ...typography.caption,
      color: '#8B5CF6',
      fontWeight: '600',
      backgroundColor: '#8B5CF6' + '15',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      alignSelf: 'flex-start',
      marginBottom: 8,
    },
    actionButtons: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    favoriteButton: {
      padding: 16,
    },
    deleteButton: {
      padding: 16,
    },
    questionText: {
      ...typography.bodyMedium,
      color: isDark ? '#fff' : colors.textDark,
      flex: 1,
    },
    answerSection: {
      gap: 16,
    },
    backToList: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    backToListText: {
      ...typography.bodyMedium,
      color: colors.primaryBlue,
      fontWeight: '600',
    },
    selectedQuestionCard: {
      backgroundColor: isDark ? '#1d1d1d' : '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    selectedQuestionText: {
      ...typography.body,
      color: isDark ? '#fff' : colors.textDark,
      fontWeight: '600',
    },
    frameworkCard: {
      backgroundColor: isDark ? '#162033' : '#EFF6FF',
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.primaryBlue + '35',
      gap: 4,
    },
    frameworkTitle: {
      ...typography.bodyMedium,
      color: colors.primaryBlue,
      fontWeight: '800',
    },
    frameworkSummary: {
      ...typography.bodySmall,
      color: isDark ? '#d1d5db' : colors.textDark,
      lineHeight: 19,
      marginBottom: 4,
    },
    frameworkItem: {
      ...typography.bodySmall,
      color: isDark ? '#b5b5b5' : colors.textMuted,
      lineHeight: 19,
    },
    answerLabel: {
      ...typography.bodyMedium,
      color: isDark ? '#fff' : colors.textDark,
      fontWeight: '600',
      marginTop: 8,
    },
    previousAnswersSection: {
      backgroundColor: isDark ? '#1a1a1a' : '#f0f9ff',
      borderRadius: 12,
      padding: 12,
      marginVertical: 12,
      borderLeftWidth: 4,
    },
    previousAnswersTitle: {
      ...typography.bodyMedium,
      color: colors.primaryBlue,
      fontWeight: '700',
      marginBottom: 12,
    },
    previousAnswerCard: {
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: isDark ? '#333' : colors.border,
    },
    previousAnswerDate: {
      ...typography.caption,
      color: isDark ? '#999' : '#666',
      marginBottom: 6,
      fontWeight: '500',
    },
    previousAnswerText: {
      ...typography.bodySmall,
      lineHeight: 20,
    },
    answerInput: {
      backgroundColor: isDark ? '#1d1d1d' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      ...typography.bodyMedium,
      color: isDark ? '#fff' : colors.textDark,
      height: 240,
      borderWidth: 1,
      borderColor: isDark ? '#333' : colors.border,
    },
    saveButton: {
      backgroundColor: colors.primaryBlue,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.45,
    },
    saveButtonText: {
      ...typography.bodyMedium,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    aiSection: {
      marginTop: 16,
      gap: 12,
    },
    aiUsageText: {
      ...typography.caption,
      color: isDark ? '#b5b5b5' : colors.textMuted,
    },
    aiButton: {
      backgroundColor: isDark ? '#111827' : '#111827',
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    aiButtonText: {
      ...typography.bodyMedium,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    aiFeedbackCard: {
      backgroundColor: isDark ? '#1a1a1a' : '#F9FAFB',
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? '#333' : colors.border,
      gap: 8,
    },
    aiFeedbackHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    aiFeedbackTitle: {
      ...typography.bodyMedium,
      color: isDark ? '#fff' : colors.textDark,
      fontWeight: '700',
    },
    aiScoreBadge: {
      backgroundColor: colors.primaryBlue + '20',
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    aiScoreText: {
      ...typography.caption,
      color: colors.primaryBlue,
      fontWeight: '700',
    },
    aiSectionLabel: {
      ...typography.caption,
      color: isDark ? '#b5b5b5' : colors.textMuted,
      fontWeight: '600',
      marginTop: 4,
    },
    aiFeedbackItem: {
      ...typography.bodySmall,
      color: isDark ? '#fff' : colors.textDark,
    },
    aiFeedbackText: {
      ...typography.bodySmall,
      color: isDark ? '#fff' : colors.textDark,
      lineHeight: 18,
    },
    feedbackNote: {
      ...typography.caption,
      color: isDark ? '#fbbf24' : '#92400E',
      backgroundColor: isDark ? '#33220f' : '#FFFBEB',
      borderRadius: 8,
      padding: 10,
      lineHeight: 18,
      marginTop: 6,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    modalContent: {
      backgroundColor: isDark ? "#1d1d1d" : "#fff",
      borderRadius: 20,
      padding: 24,
      width: "100%",
      maxWidth: 400,
    },
    modalTitle: {
      ...typography.headingSmall,
      color: isDark ? "#fff" : colors.textDark,
      marginBottom: 20,
      textAlign: "center",
    },
    inputLabel: {
      ...typography.bodyMedium,
      fontWeight: "600",
      color: isDark ? "#b5b5b5" : colors.textMuted,
      marginBottom: 8,
      marginTop: 12,
    },
    modalInput: {
      backgroundColor: isDark ? '#2a2a2a' : '#F9FAFB',
      borderRadius: 12,
      padding: 12,
      ...typography.bodyMedium,
      color: isDark ? '#fff' : colors.textDark,
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#E5E7EB',
      minHeight: 80,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 20,
    },
    categoryOption: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: isDark ? '#2a2a2a' : '#F9FAFB',
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#E5E7EB',
    },
    categoryOptionSelected: {
      backgroundColor: colors.primaryBlue,
      borderColor: colors.primaryBlue,
    },
    categoryOptionText: {
      ...typography.bodySmall,
      color: isDark ? '#fff' : colors.textDark,
      fontWeight: '500',
    },
    categoryOptionTextSelected: {
      color: '#fff',
      fontWeight: '600',
    },
    modalButtons: {
      flexDirection: "row",
      gap: 12,
      marginTop: 8,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
    },
    modalButtonCancel: {
      backgroundColor: isDark ? "#2a2a2a" : "#F3F4F6",
    },
    modalButtonSave: {
      backgroundColor: colors.primaryBlue,
    },
    modalButtonTextCancel: {
      ...typography.bodyMedium,
      fontWeight: "600",
      color: isDark ? "#fff" : colors.textDark,
    },
    modalButtonTextSave: {
      ...typography.bodyMedium,
      fontWeight: "600",
      color: "#fff",
    },
  });
