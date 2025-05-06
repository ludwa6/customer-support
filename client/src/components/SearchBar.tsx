import { useState, useEffect } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialValue?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, initialValue = "" }) => {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  
  // Update searchQuery when initialValue changes
  useEffect(() => {
    setSearchQuery(initialValue);
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <div className="mt-4 relative">
      <form onSubmit={handleSubmit} className="flex items-center relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className="h-5 w-5 text-gray-400" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            fill="currentColor" 
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
        <input 
          type="text" 
          name="search" 
          id="search" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search documentation or FAQs..." 
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
        />
        <button 
          type="submit" 
          className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Search
        </button>
      </form>
    </div>
  );
};

export default SearchBar;
