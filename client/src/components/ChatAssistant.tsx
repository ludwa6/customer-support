import { useState, useEffect, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { ChatMessage } from "@/types";
import { v4 as uuidv4 } from "uuid";

const ChatAssistant = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      content: "👋 Hi there! I'm your SerenityFlow AI assistant. I can help with product questions, troubleshooting, and guide you to the right resources. How can I help you today?",
      role: "assistant",
      timestamp: new Date()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Load session ID from localStorage or create a new one when the component mounts
  useEffect(() => {
    // Try to get existing session ID from localStorage
    const savedSessionId = localStorage.getItem('chat_session_id');
    
    if (savedSessionId) {
      // Use the existing session ID
      setSessionId(savedSessionId);
      console.log('Restored chat session:', savedSessionId);
    } else {
      // Create a new session ID
      const newSessionId = uuidv4();
      setSessionId(newSessionId);
      localStorage.setItem('chat_session_id', newSessionId);
      console.log('Created new chat session:', newSessionId);
    }
  }, []);

  // Function to handle opening and closing the chat widget
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };
  
  // Function to reset the chat session
  const resetChatSession = () => {
    // Create a new session ID
    const newSessionId = uuidv4();
    
    // Update the session ID
    setSessionId(newSessionId);
    localStorage.setItem('chat_session_id', newSessionId);
    
    // Reset the messages to just the welcome message
    setMessages([
      {
        id: "welcome",
        content: "👋 Hi there! I'm your SerenityFlow AI assistant. I can help with product questions, troubleshooting, and guide you to the right resources. How can I help you today?",
        role: "assistant",
        timestamp: new Date()
      }
    ]);
    
    toast({
      title: "Chat Reset",
      description: "Your chat session has been reset.",
      variant: "default"
    });
    
    console.log('Chat session reset. New session ID:', newSessionId);
  };

  // Scroll to the bottom of the messages container when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // API call to get AI response
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      // Include the sessionId in the API request
      const response = await apiRequest("POST", "/api/chat", { 
        message,
        sessionId // Send the session ID with each message
      });
      return response.json();
    },
    onSuccess: (data) => {
      const newMessage: ChatMessage = {
        id: uuidv4(),
        content: data.response,
        role: "assistant",
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, newMessage]);
      
      // If the server returns a different sessionId, update ours
      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again later.",
        variant: "destructive"
      });
      console.error("Chat error:", error);
    }
  });

  // Function to handle submitting a message
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (inputMessage.trim() === "") return;
    
    // Add user message to the chat
    const userMessage: ChatMessage = {
      id: uuidv4(),
      content: inputMessage,
      role: "user",
      timestamp: new Date()
    };
    
    setMessages((prev) => [...prev, userMessage]);
    
    // Make sure we have a session ID before sending
    if (!sessionId) {
      setSessionId(uuidv4());
    }
    
    // Call API to get response
    sendMessageMutation.mutate(inputMessage);
    
    // Clear input
    setInputMessage("");
  };

  return (
    <div className="chat-section">
      {/* Chat Widget (minimized) */}
      {!isChatOpen && (
        <div className="fixed bottom-5 right-5 z-50 chat-widget-minimized">
          <button 
            onClick={toggleChat}
            className="bg-primary text-white rounded-full p-4 shadow-lg hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 flex items-center justify-center"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" 
              />
            </svg>
            <span className="ml-2 font-medium hidden sm:inline">Chat with AI Assistant</span>
          </button>
        </div>
      )}
      
      {/* Chat Widget (expanded) */}
      {isChatOpen && (
        <div className="fixed bottom-5 right-5 z-50 h-[calc(100vh-2rem)] md:h-[600px] bg-white rounded-lg shadow-lg overflow-hidden w-full max-w-sm">
          <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className="bg-primary text-white px-4 py-3 flex justify-between items-center">
              <div className="flex items-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6 mr-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                  />
                </svg>
                <h3 className="font-medium">AI Support Assistant</h3>
                <span className="ml-2 text-xs bg-black bg-opacity-20 px-2 py-1 rounded-full">
                  ID: {sessionId.substring(0, 8)}
                </span>
              </div>
              <div className="flex items-center">
                <button 
                  onClick={resetChatSession}
                  className="text-white hover:text-gray-200 focus:outline-none mr-3"
                  title="Reset chat session"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                    />
                  </svg>
                </button>
                <button 
                  onClick={toggleChat}
                  className="text-white hover:text-gray-200 focus:outline-none"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.role === "user" ? "flex-row-reverse" : ""} mb-4`}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 mr-3">
                      <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-5 w-5" 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                          <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                        </svg>
                      </div>
                    </div>
                  )}
                  
                  <div 
                    className={`p-3 rounded-lg shadow-sm chat-message ${
                      message.role === "user" 
                        ? "bg-primary text-white ml-3" 
                        : "bg-white text-gray-800"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Chat Input */}
            <div className="border-t border-gray-200 p-3 bg-white">
              <form onSubmit={handleSubmit} className="flex items-center">
                <input 
                  type="text" 
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-l-md py-2 px-3 focus:ring-primary focus:border-primary" 
                  placeholder="Type your question here..."
                  disabled={sendMessageMutation.isPending}
                />
                <button 
                  type="submit" 
                  className={`bg-primary text-white py-2 px-4 rounded-r-md hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary ${
                    sendMessageMutation.isPending ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                  disabled={sendMessageMutation.isPending}
                >
                  {sendMessageMutation.isPending ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatAssistant;
