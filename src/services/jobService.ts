// Adzuna Job Search API Service
// Sign up for free API keys at: https://developer.adzuna.com/
import { supabase } from '../config/supabase';

console.log('✅ Adzuna job search will use Supabase Edge Function secrets.');

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

type AdzunaSearchResponse = {
  count?: number;
  results?: AdzunaJob[];
  error?: string;
  display?: string;
};

type SearchJobsFunctionParams = {
  page: number;
  resultsPerPage: number;
  keywords: string;
  location: string;
  categoryTag?: string;
};

const invokeSearchJobsFunction = async (body: SearchJobsFunctionParams): Promise<AdzunaSearchResponse> => {
  const { data, error } = await supabase.functions.invoke<AdzunaSearchResponse>('search-jobs', {
    method: 'POST',
    body,
  });

  if (error) {
    const message = String(error.message || '').toLowerCase();
    if (message.includes('temporarily unavailable') || message.includes('503')) {
      throw new Error('Adzuna is temporarily unavailable. Please try again in a moment.');
    }
    throw new Error(error.message || 'Job search is unavailable right now.');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data || {};
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

const UK_LOCATION_TERMS = [
  'aberdeen',
  'belfast',
  'birmingham',
  'bradford',
  'brighton',
  'bristol',
  'cambridge',
  'cardiff',
  'coventry',
  'derby',
  'edinburgh',
  'glasgow',
  'leeds',
  'leicester',
  'liverpool',
  'london',
  'manchester',
  'milton keynes',
  'newcastle',
  'norwich',
  'nottingham',
  'oxford',
  'plymouth',
  'portsmouth',
  'reading',
  'sheffield',
  'southampton',
  'slough',
  'wakefield',
  'york',
];

const splitCombinedJobSearch = (query: string) => {
  const cleanQuery = query.trim().replace(/\s+/g, ' ');
  if (!cleanQuery) {
    return { title: '', location: '' };
  }

  const commaParts = cleanQuery.split(',').map((part) => part.trim()).filter(Boolean);
  if (commaParts.length > 1) {
    return {
      title: commaParts.slice(0, -1).join(' '),
      location: commaParts[commaParts.length - 1],
    };
  }

  const lowerQuery = cleanQuery.toLowerCase();
  if (UK_LOCATION_TERMS.includes(lowerQuery)) {
    return { title: '', location: cleanQuery };
  }

  const locationMatch = UK_LOCATION_TERMS
    .sort((a, b) => b.length - a.length)
    .find((term) => lowerQuery.endsWith(` ${term}`));

  if (locationMatch) {
    const title = cleanQuery.slice(0, cleanQuery.length - locationMatch.length).trim();
    return {
      title,
      location: cleanQuery.slice(cleanQuery.length - locationMatch.length).trim(),
    };
  }

  return { title: cleanQuery, location: '' };
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
  resultsPerPage: number = 20,
  remoteFilter: string = 'All',
  location: string = '',
  jobTitle: string = ''
): Promise<{ jobs: Job[]; totalResults: number }> => {
  try {
    const combinedSearch = !location.trim() ? splitCombinedJobSearch(jobTitle) : null;
    const titleSearch = combinedSearch?.title ?? jobTitle.trim();
    const locationSearch = location.trim() || combinedSearch?.location || '';

    // Build search keywords - include category name for better results
    let keywords = titleSearch;
    
    // Add category as keyword search when the user has not typed a specific title.
    if (!keywords && category !== 'All Jobs' && category !== 'Saved Jobs' && category !== 'Applied Jobs') {
      keywords = category;
    }
    
    // Add remote filter keywords
    if (remoteFilter === 'Remote') {
      keywords = keywords ? `${keywords} remote` : 'remote';
    } else if (remoteFilter === 'Hybrid') {
      keywords = keywords ? `${keywords} hybrid` : 'hybrid';
    }

    const categoryTag =
      !titleSearch && category !== 'All Jobs' && category !== 'Saved Jobs' && category !== 'Applied Jobs'
        ? CATEGORY_MAP[category]
        : undefined;

    const data = await invokeSearchJobsFunction({
      page,
      resultsPerPage,
      keywords,
      location: locationSearch || 'uk',
      categoryTag,
    });
    
    const jobs: Job[] = (data.results || []).map(transformAdzunaJob);
    
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
    const data = await invokeSearchJobsFunction({
      page,
      resultsPerPage: 20,
      keywords: keyword,
      location,
    });
    const jobs: Job[] = (data.results || []).map(transformAdzunaJob);
    
    return {
      jobs,
      totalResults: data.count || 0,
    };
  } catch (error) {
    console.error('Error searching jobs:', error);
    throw error;
  }
};
