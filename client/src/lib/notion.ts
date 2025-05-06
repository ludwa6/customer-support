import { Article, Category, FAQ } from "@/types";

// Helper function to fetch from API endpoints that fetch Notion data
export async function fetchFromNotion<T>(endpoint: string): Promise<T> {
  const response = await fetch(endpoint);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch from Notion: ${response.statusText}`);
  }
  
  return response.json();
}

// Function to fetch all categories
export async function getCategories(): Promise<Category[]> {
  return fetchFromNotion<Category[]>('/api/categories');
}

// Function to fetch articles with optional filters
export async function getArticles(options?: { 
  categoryId?: string,
  isPopular?: boolean,
  query?: string
}): Promise<Article[]> {
  let endpoint = '/api/articles';
  
  // Add query parameters if provided
  if (options) {
    const params = new URLSearchParams();
    
    if (options.categoryId) {
      params.append('categoryId', options.categoryId);
    }
    
    if (options.isPopular !== undefined) {
      params.append('isPopular', options.isPopular.toString());
    }
    
    if (options.query) {
      params.append('query', options.query);
    }
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
  }
  
  return fetchFromNotion<Article[]>(endpoint);
}

// Function to fetch a single article by ID
export async function getArticleById(id: string): Promise<Article> {
  return fetchFromNotion<Article>(`/api/articles/${id}`);
}

// Function to fetch FAQs with optional filters
export async function getFAQs(options?: {
  categoryId?: string,
  query?: string
}): Promise<FAQ[]> {
  let endpoint = '/api/faqs';
  
  // Add query parameters if provided
  if (options) {
    const params = new URLSearchParams();
    
    if (options.categoryId) {
      params.append('categoryId', options.categoryId);
    }
    
    if (options.query) {
      params.append('query', options.query);
    }
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
  }
  
  return fetchFromNotion<FAQ[]>(endpoint);
}
