// Adzuna Job Search API Service
// Sign up for free API keys at: https://developer.adzuna.com/
import Constants from 'expo-constants';

const ADZUNA_APP_ID = Constants.expoConfig?.extra?.adzunaAppId || process.env.EXPO_PUBLIC_ADZUNA_APP_ID || '';
const ADZUNA_APP_KEY = Constants.expoConfig?.extra?.adzunaAppKey || process.env.EXPO_PUBLIC_ADZUNA_APP_KEY || '';
const BASE_URL = 'https://api.adzuna.com/v1/api/jobs/gb/search';

if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
  console.warn('⚠️ Adzuna API credentials not found. Job search will be disabled.');
}

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  category: string;
  type: 'Full-time' | 'Part-time' | 'Contract';
  remote: 'Remote' | 'Hybrid' | 'On-site';
  url: string;
  postedDays: number;
  description?: string;
};

type AdzunaJob = {
  id: string;
  title: string;
  company: {
    display_name: string;
  };
  location: {
    display_name: string;
    area: string[];
  };
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted?: string;
  category: {
    label: string;
    tag: string;
  };
  contract_time?: string;
  redirect_url: string;
  created: string;
  description: string;
};

// Category mapping from app categories to Adzuna tags
const CATEGORY_MAP: { [key: string]: string } = {
  'Software Developer': 'it-jobs',
  'Data Analyst': 'it-jobs',
  'Cyber Security': 'it-jobs',
  'IT Support': 'it-jobs',
  'Project Manager': 'it-jobs',
  'Sales': 'sales-jobs',
  'Customer Service': 'customer-services-jobs',
  'Marketing': 'pr-advertising-marketing-jobs',
  'Accounting': 'accounting-finance-jobs',
  'Finance': 'accounting-finance-jobs',
  'Human Resources': 'hr-recruitment-jobs',
  'Healthcare': 'healthcare-nursing-jobs',
  'Nursing': 'healthcare-nursing-jobs',
  'Teaching': 'teaching-jobs',
  'Engineering': 'engineering-jobs',
  'Business Analyst': 'it-jobs',
  'Product Manager': 'it-jobs',
  'UX/UI Designer': 'it-jobs',
  'Graphic Designer': 'creative-design-jobs',
  'Operations': 'logistics-warehouse-jobs',
  'Supply Chain': 'logistics-warehouse-jobs',
  'Legal': 'legal-jobs',
  'Architecture': 'property-jobs',
  'Consulting': 'consultancy-jobs',
};

const determineRemoteType = (title: string, description: string, location: string): 'Remote' | 'Hybrid' | 'On-site' => {
  const text = `${title} ${description} ${location}`.toLowerCase();
  if (text.includes('remote') || text.includes('work from home')) return 'Remote';
  if (text.includes('hybrid')) return 'Hybrid';
  return 'On-site';
};

const formatSalary = (min?: number, max?: number, isPredicted?: string): string => {
  if (!min && !max) return 'Competitive salary';
  
  const formatAmount = (amount: number) => {
    if (amount >= 1000) {
      return `£${(amount / 1000).toFixed(0)}k`;
    }
    return `£${amount.toLocaleString()}`;
  };

  const predicted = isPredicted === '1' ? ' (est.)' : '';
  
  if (min && max) {
    return `${formatAmount(min)} - ${formatAmount(max)}${predicted}`;
  } else if (min) {
    return `From ${formatAmount(min)}${predicted}`;
  } else if (max) {
    return `Up to ${formatAmount(max)}${predicted}`;
  }
  
  return 'Competitive salary';
};

const calculateDaysAgo = (createdDate: string): number => {
  const created = new Date(createdDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const transformAdzunaJob = (job: AdzunaJob): Job => {
  const contractType = job.contract_time?.toLowerCase() || '';
  let type: 'Full-time' | 'Part-time' | 'Contract' = 'Full-time';
  
  if (contractType.includes('part')) type = 'Part-time';
  else if (contractType.includes('contract')) type = 'Contract';

  return {
    id: job.id,
    title: job.title,
    company: job.company.display_name,
    location: job.location.display_name,
    salary: formatSalary(job.salary_min, job.salary_max, job.salary_is_predicted),
    category: job.category.label,
    type,
    remote: determineRemoteType(job.title, job.description, job.location.display_name),
    url: job.redirect_url,
    postedDays: calculateDaysAgo(job.created),
    description: job.description,
  };
};

export const searchJobs = async (
  category: string = 'All Jobs',
  page: number = 1,
  resultsPerPage: number = 20
): Promise<{ jobs: Job[]; totalResults: number }> => {
  try {
    // Build query parameters
    const params = new URLSearchParams({
      app_id: ADZUNA_APP_ID,
      app_key: ADZUNA_APP_KEY,
      results_per_page: resultsPerPage.toString(),
      what: '', // Keywords
      where: 'uk', // Location
    });

    // Add category filter if not "All Jobs"
    if (category !== 'All Jobs' && CATEGORY_MAP[category]) {
      params.append('category', CATEGORY_MAP[category]);
    }

    const url = `${BASE_URL}/${page}?${params.toString()}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    const jobs: Job[] = data.results.map(transformAdzunaJob);
    
    return {
      jobs,
      totalResults: data.count || 0,
    };
  } catch (error) {
    console.error('Error fetching jobs from Adzuna:', error);
    throw error;
  }
};

export const searchJobsByKeyword = async (
  keyword: string,
  location: string = 'uk',
  page: number = 1
): Promise<{ jobs: Job[]; totalResults: number }> => {
  try {
    const params = new URLSearchParams({
      app_id: ADZUNA_APP_ID,
      app_key: ADZUNA_APP_KEY,
      results_per_page: '20',
      what: keyword,
      where: location,
    });

    const url = `${BASE_URL}/${page}?${params.toString()}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const jobs: Job[] = data.results.map(transformAdzunaJob);
    
    return {
      jobs,
      totalResults: data.count || 0,
    };
  } catch (error) {
    console.error('Error searching jobs:', error);
    throw error;
  }
};
