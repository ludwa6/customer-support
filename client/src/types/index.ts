// Notion content types
export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  categoryName: string;
  createdAt: string;
  updatedAt: string;
  isPopular: boolean;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  categoryId: string;
  categoryName: string;
}

// Chat types
export interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

// Support Ticket types
export interface SupportTicket {
  id: string;
  name: string;
  email: string;
  subject: string;
  category: string;
  description: string;
  attachments?: File[];
  status: "new" | "in-progress" | "resolved" | "closed";
  createdAt: Date;
}

export interface TicketFormData {
  name: string;
  email: string;
  subject: string;
  category: string;
  description: string;
  attachments?: File[];
}
