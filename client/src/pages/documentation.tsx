import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Category, Article } from "@/types";
import SearchBar from "@/components/SearchBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatAssistant from "@/components/ChatAssistant";

const Documentation = () => {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const categoryId = searchParams.get("category");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>(categoryId || "all");
  
  // Update active tab when category changes in URL
  useEffect(() => {
    setActiveTab(categoryId || "all");
    
    // Add event listener for URL changes
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const newCategoryId = params.get("category");
      setActiveTab(newCategoryId || "all");
    };

    window.addEventListener("popstate", handleUrlChange);
    
    return () => {
      window.removeEventListener("popstate", handleUrlChange);
    };
  }, [categoryId]);
  
  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  // Fetch all articles - we'll filter them on the client side
  const { data: articles, isLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
    queryFn: async () => {
      const response = await fetch("/api/articles");
      if (!response.ok) throw new Error("Failed to fetch articles");
      const data = await response.json();
      console.log("Fetched articles:", data);
      return data;
    },
  });
  
  // Get the selected category name
  const selectedCategory = categories?.find(cat => cat.id === categoryId);
  
  // Filter articles based on category and search query
  const filteredArticles = articles 
    ? articles.filter(article => {
        // First filter by category if one is selected
        if (categoryId && article.categoryId !== categoryId) {
          return false;
        }
        
        // Then filter by search query if one exists
        if (searchQuery) {
          return (
            article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.content.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        
        // If no search query and category matches (or no category selected), keep the article
        return true;
      })
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row split-view gap-6">
        <div className="w-full md:w-2/3">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-text mb-2">
                {selectedCategory ? selectedCategory.name : "Documentation"}
              </h1>
              <p className="text-gray-500">
                {selectedCategory 
                  ? selectedCategory.description 
                  : "Browse all documentation and guides"}
              </p>
              
              {/* Search Bar */}
              <SearchBar onSearch={setSearchQuery} />
            </div>
            
            {/* Categories Tabs */}
            {categories && categories.length > 0 && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="flex flex-wrap gap-1.5 mb-4 overflow-x-auto p-1">
                  <Link href="/documentation" className="inline-block">
                    <TabsTrigger value="all" className="px-3 py-1.5 whitespace-nowrap text-sm">All</TabsTrigger>
                  </Link>
                  {categories.map(category => (
                    <Link 
                      key={category.id} 
                      href={`/documentation?category=${category.id}`}
                      className="inline-block"
                    >
                      <TabsTrigger value={category.id} className="px-3 py-1.5 whitespace-nowrap text-sm">
                        {category.name}
                      </TabsTrigger>
                    </Link>
                  ))}
                </TabsList>
                
                <TabsContent value="all">
                  {isLoading ? (
                    <div className="animate-pulse space-y-4 mt-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="bg-gray-100 p-4 rounded-lg">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-full"></div>
                        </div>
                      ))}
                    </div>
                  ) : filteredArticles && filteredArticles.length > 0 ? (
                    <div className="space-y-4 mt-4">
                      {filteredArticles.map(article => (
                        <div key={article.id} className="bg-gray-50 p-4 rounded-lg">
                          <h2 className="text-lg font-medium text-primary mb-2">{article.title}</h2>
                          <div className="prose prose-sm text-gray-700">
                            {article.content.split('\n').map((paragraph, idx) => (
                              <p key={idx} className="mb-2">{paragraph}</p>
                            ))}
                          </div>

                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-gray-500">
                        {searchQuery 
                          ? `No articles found matching "${searchQuery}"` 
                          : "No articles available for this category yet."}
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                {categories.map(category => (
                  <TabsContent key={category.id} value={category.id}>
                    {isLoading ? (
                      <div className="animate-pulse space-y-4 mt-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="bg-gray-100 p-4 rounded-lg">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                          </div>
                        ))}
                      </div>
                    ) : filteredArticles && filteredArticles.length > 0 ? (
                      <div className="space-y-4 mt-4">
                        {filteredArticles.map(article => (
                          <div key={article.id} className="bg-gray-50 p-4 rounded-lg">
                            <h2 className="text-lg font-medium text-primary mb-2">{article.title}</h2>
                            <div className="prose prose-sm text-gray-700">
                              {article.content.split('\n').map((paragraph, idx) => (
                                <p key={idx} className="mb-2">{paragraph}</p>
                              ))}
                            </div>

                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-gray-500">
                          {searchQuery 
                            ? `No articles found matching "${searchQuery}" in this category` 
                            : "No articles available for this category yet."}
                        </p>
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            )}
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

export default Documentation;
