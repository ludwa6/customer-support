import { Link } from "wouter";
import { Article } from "@/types";

interface PopularArticlesListProps {
  articles: Article[];
  isLoading: boolean;
  searchQuery?: string;
}

const PopularArticlesList: React.FC<PopularArticlesListProps> = ({ 
  articles, 
  isLoading,
  searchQuery = ""
}) => {
  // Filter articles based on search query
  const filteredArticles = searchQuery 
    ? articles.filter(article => 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : articles;

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-text mb-4">
        {searchQuery ? "Search Results" : "Popular Articles"}
      </h2>
      
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="block p-3 rounded-md animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : filteredArticles.length > 0 ? (
        <div className="space-y-3">
          {filteredArticles.map(article => (
            <Link key={article.id} href={`/article/${article.id}`} className="block p-3 rounded-md hover:bg-gray-50">
                <h3 className="text-md font-medium text-primary mb-1">{article.title}</h3>
                <p className="text-sm text-gray-500">
                  {article.content.length > 100 
                    ? `${article.content.substring(0, 100)}...` 
                    : article.content}
                </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          {searchQuery ? (
            <p className="text-gray-500">No articles found matching "{searchQuery}"</p>
          ) : (
            <p className="text-gray-500">No popular articles available at the moment.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PopularArticlesList;
