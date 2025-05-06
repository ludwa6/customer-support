import { useQuery } from "@tanstack/react-query";
import { Category, Article } from "@/types";
import SearchBar from "./SearchBar";
import CategoryCard from "./CategoryCard";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const DocumentationSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [_, setLocation] = useLocation();
  
  // Fetch categories from API
  const { data: categories, isLoading: isCategoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch all articles for search
  const { data: articles, isLoading: isArticlesLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
    // Only fetch when search query is entered
    enabled: searchQuery.length > 0,
  });

  // Handle search query change
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // If search query is not empty, navigate to the documentation page with search query
    if (query.trim()) {
      setLocation(`/documentation?search=${encodeURIComponent(query)}`);
    }
  };

  // Filter articles based on search query
  const filteredArticles = searchQuery && articles 
    ? articles.filter(article => 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="w-full md:w-2/3 documentation-section">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-text mb-2">Support Center</h1>
          <p className="text-gray-500">Find answers to your questions or submit a support ticket</p>
          
          {/* Search Bar */}
          <SearchBar onSearch={handleSearch} initialValue={searchQuery} />
          
          {/* Search Results (will only show when there are search results) */}
          {searchQuery && filteredArticles.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-blue-800">
                  {filteredArticles.length} result{filteredArticles.length !== 1 ? 's' : ''} found for "{searchQuery}"
                </p>
                <Link href="/documentation">
                  <span className="text-blue-600 hover:underline text-sm cursor-pointer">
                    View all results
                  </span>
                </Link>
              </div>
              <ul className="divide-y divide-blue-100">
                {filteredArticles.slice(0, 3).map(article => (
                  <li key={article.id} className="py-2">
                    <Link href={`/documentation?category=${article.categoryId}`}>
                      <div className="block cursor-pointer">
                        <h3 className="text-md font-medium text-primary mb-1 hover:underline">
                          {article.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {article.content}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              {filteredArticles.length > 3 && (
                <div className="mt-2 text-center">
                  <Link href={`/documentation?search=${encodeURIComponent(searchQuery)}`}>
                    <span className="text-sm text-blue-600 hover:underline cursor-pointer">
                      See all {filteredArticles.length} results
                    </span>
                  </Link>
                </div>
              )}
            </div>
          )}
          
          {/* No Results Message */}
          {searchQuery && filteredArticles.length === 0 && !isArticlesLoading && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                No results found for "{searchQuery}". Try a different search term or browse by category.
              </p>
            </div>
          )}
        </div>
        
        {/* Documentation Categories */}
        <div>
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
      </div>
    </div>
  );
};

export default DocumentationSection;
