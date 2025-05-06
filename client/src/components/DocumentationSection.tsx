import { useQuery } from "@tanstack/react-query";
import { Category, Article } from "@/types";
import SearchBar from "./SearchBar";
import CategoryCard from "./CategoryCard";
import PopularArticlesList from "./PopularArticlesList";
import { useState } from "react";

const DocumentationSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch categories from API
  const { data: categories, isLoading: isCategoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  // Fetch popular articles from API
  const { data: popularArticles, isLoading: isArticlesLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles/popular"],
  });

  // Handle search query change
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="w-full md:w-2/3 documentation-section">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-text mb-2">Support Center</h1>
          <p className="text-gray-500">Find answers to your questions or submit a support ticket</p>
          
          {/* Search Bar */}
          <SearchBar onSearch={handleSearch} />
        </div>
        
        {/* Documentation Categories */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-text mb-4">Browse By Category</h2>
          
          {isCategoriesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                  <div className="flex items-center mb-2">
                    <div className="bg-gray-200 p-2 rounded-lg mr-3 w-10 h-10"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-full mt-2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories?.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </div>
        
        {/* Popular Articles */}
        <PopularArticlesList 
          articles={popularArticles || []} 
          isLoading={isArticlesLoading} 
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
};

export default DocumentationSection;
