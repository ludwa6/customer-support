import { useState } from "react";
import { Link } from "wouter";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
              <div className="bg-primary rounded-lg p-2 mr-3">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6 text-white" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" 
                  />
                </svg>
              </div>
              <span className="text-xl font-semibold text-text">SerenityFlow</span>
              <span className="ml-2 text-sm text-gray-500">Support Portal</span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <nav className="hidden md:flex space-x-4">
            <Link href="/" className="text-primary font-medium">
              Support Home
            </Link>
            <Link href="/documentation" className="text-gray-500 hover:text-primary font-medium">
              Documentation
            </Link>
            <Link href="/#faq" className="text-gray-500 hover:text-primary font-medium">
              FAQs
            </Link>
            <Link href="/#contact" className="text-gray-500 hover:text-primary font-medium">
              Contact
            </Link>
          </nav>
          
          <div className="relative ml-3">
            <button 
              type="button" 
              className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              aria-expanded="false" 
              aria-haspopup="true"
            >
              <img 
                className="h-8 w-8 rounded-full" 
                src="https://ui-avatars.com/api/?name=Guest+User&background=6366F1&color=fff" 
                alt="User profile" 
              />
            </button>
          </div>
          
          <button 
            type="button" 
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-primary hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            onClick={toggleMobileMenu}
          >
            <svg 
              className="h-6 w-6" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 6h16M4 12h16M4 18h16" 
              />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link href="/" className="block px-3 py-2 rounded-md text-base font-medium text-primary bg-gray-50">
            Support Home
          </Link>
          <Link href="/documentation" className="block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-primary hover:bg-gray-50">
            Documentation
          </Link>
          <Link href="/#faq" className="block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-primary hover:bg-gray-50">
            FAQs
          </Link>
          <Link href="/#contact" className="block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-primary hover:bg-gray-50">
            Contact
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
