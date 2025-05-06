import { Link } from "wouter";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="bg-primary rounded-lg p-1 mr-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 text-white" 
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
            <span className="text-sm text-gray-500">© {new Date().getFullYear()} SerenityFlow. All rights reserved.</span>
          </div>
          <div className="flex space-x-6">
            <Link href="/privacy">
              <a className="text-sm text-gray-500 hover:text-primary">Privacy Policy</a>
            </Link>
            <Link href="/terms">
              <a className="text-sm text-gray-500 hover:text-primary">Terms of Service</a>
            </Link>
            <Link href="/#contact">
              <a className="text-sm text-gray-500 hover:text-primary">Contact Us</a>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
