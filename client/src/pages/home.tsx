import { useState } from "react";
import DocumentationSection from "@/components/DocumentationSection";
import ChatAssistant from "@/components/ChatAssistant";
import TicketForm from "@/components/TicketForm";
import { Button } from "@/components/ui/button";

const Home = () => {
  const [isTicketFormOpen, setIsTicketFormOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row split-view gap-6">
        {/* Documentation Section */}
        <DocumentationSection />
        
        {/* Chat Section */}
        <div className="w-full md:w-1/3 chat-section">
          <ChatAssistant />
        </div>
      </div>
      
      {/* Submit Ticket Section */}
      <div className="max-w-7xl mx-auto mt-8">
        <div className="w-full md:w-2/3">
          <h2 className="text-lg font-semibold text-text mb-4">Still Need Help?</h2>
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <div className="sm:flex sm:items-center sm:justify-between">
              <div>
                <h3 className="text-md font-medium text-text mb-1">Submit a Support Ticket</h3>
                <p className="text-sm text-gray-500 mb-4 sm:mb-0">Our support team will get back to you within 24 hours</p>
              </div>
              <Button 
                onClick={() => setIsTicketFormOpen(true)}
                className="bg-primary text-white hover:bg-secondary"
              >
                Create New Ticket
              </Button>
            </div>
          </div>
          
          {/* Ticket Form (conditionally rendered) */}
          {isTicketFormOpen && (
            <TicketForm onClose={() => setIsTicketFormOpen(false)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
