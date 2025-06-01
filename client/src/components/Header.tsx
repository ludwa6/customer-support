import { useState } from "react";
import { Link } from "wouter";
import TicketForm from "@/components/TicketForm";
import { Button } from "@/components/ui/button";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTicketFormOpen, setIsTicketFormOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const openTicketForm = () => {
    setIsTicketFormOpen(true);
    // Close mobile menu if it's open
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
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
              <span className="text-xl font-semibold text-text">Quinta Vale da Lama</span>
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
            <button 
              onClick={openTicketForm} 
              className="text-gray-500 hover:text-primary font-medium"
            >
              Submit a Ticket
            </button>
          </nav>
          
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
          <button 
            onClick={openTicketForm}
            className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-primary hover:bg-gray-50"
          >
            Submit a Ticket
          </button>
        </div>
      </div>
      
      {/* Ticket Form Dialog */}
      <TicketForm 
        isOpen={isTicketFormOpen} 
        onClose={() => setIsTicketFormOpen(false)} 
      />
    </header>
  );
};

export default Header;
