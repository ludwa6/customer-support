import { useQuery } from "@tanstack/react-query";
import { Article as ArticleType } from "@/types";
import { Link, useRoute } from "wouter";
import ChatAssistant from "@/components/ChatAssistant";
import { Button } from "@/components/ui/button";

const Article = () => {
  // Get article ID from URL
  const [matched, params] = useRoute("/article/:id");
  const articleId = params?.id;
  
  // Fetch article data
  const { data: article, isLoading, error } = useQuery<ArticleType>({
    queryKey: [`/api/articles/${articleId}`],
    enabled: !!articleId,
  });
  
  // Fetch related articles in the same category
  const { data: relatedArticles } = useQuery<ArticleType[]>({
    queryKey: ["/api/articles", article?.categoryId],
    queryFn: async () => {
      if (!article?.categoryId) return [];
      const response = await fetch(`/api/articles?categoryId=${article.categoryId}`);
      if (!response.ok) throw new Error("Failed to fetch related articles");
      return response.json();
    },
    enabled: !!article?.categoryId,
  });
  
  // Filter out the current article from related articles
  const filteredRelatedArticles = relatedArticles?.filter(
    related => related.id !== articleId
  ).slice(0, 3);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row split-view gap-6">
          <div className="w-full md:w-2/3">
            <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
              
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-4/5"></div>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-1/3 chat-section">
            <ChatAssistant />
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !article) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <h1 className="text-2xl font-semibold text-text mb-4">Article Not Found</h1>
          <p className="text-gray-500 mb-6">The article you are looking for does not exist or has been removed.</p>
          <Link href="/documentation">
            <Button>Browse Documentation</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row split-view gap-6">
        <div className="w-full md:w-2/3">
          <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <Link href="/">
                <a className="hover:text-primary">Home</a>
              </Link>
              <span className="mx-2">/</span>
              <Link href="/documentation">
                <a className="hover:text-primary">Documentation</a>
              </Link>
              <span className="mx-2">/</span>
              <Link href={`/documentation?category=${article.categoryId}`}>
                <a className="hover:text-primary">{article.categoryName}</a>
              </Link>
            </div>
            
            {/* Article Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-text mb-2">{article.title}</h1>
              <div className="flex items-center text-sm text-gray-500">
                <span>Category: {article.categoryName}</span>
                <span className="mx-2">•</span>
                <span>Updated: {new Date(article.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            {/* Article Content */}
            <div className="prose prose-lg max-w-none text-gray-700 mb-8">
              {article.content.split('\n').map((paragraph, idx) => (
                <p key={idx} className="mb-4">{paragraph}</p>
              ))}
            </div>
            
            {/* Related Articles */}
            {filteredRelatedArticles && filteredRelatedArticles.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h2 className="text-lg font-semibold text-text mb-4">Related Articles</h2>
                <div className="space-y-3">
                  {filteredRelatedArticles.map(related => (
                    <Link key={related.id} href={`/article/${related.id}`}>
                      <a className="block p-3 rounded-md hover:bg-gray-50">
                        <h3 className="text-md font-medium text-primary mb-1">{related.title}</h3>
                        <p className="text-sm text-gray-500">
                          {related.content.length > 100 
                            ? `${related.content.substring(0, 100)}...` 
                            : related.content}
                        </p>
                      </a>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            {/* Helpful? */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-md font-medium text-text mb-4">Was this article helpful?</h3>
              <div className="flex space-x-3">
                <Button variant="outline" size="sm">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 mr-1" 
                    fill="none"
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" 
                    />
                  </svg>
                  Yes
                </Button>
                <Button variant="outline" size="sm">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 mr-1" 
                    fill="none"
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2" 
                    />
                  </svg>
                  No
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Chat Section */}
        <div className="w-full md:w-1/3 chat-section">
          <ChatAssistant />
        </div>
      </div>
    </div>
  );
};

export default Article;
