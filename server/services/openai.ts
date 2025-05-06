import OpenAI from "openai";
import { getFAQs } from "./notion";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Prepare context from FAQs
async function prepareContext() {
  try {
    // Fetch all FAQs from Notion
    const faqs = await getFAQs();
    
    // Format FAQs as context for the AI
    let context = "Here are the common questions and answers:\n\n";
    
    faqs.forEach((faq, index) => {
      context += `Q${index + 1}: ${faq.question}\n`;
      context += `A${index + 1}: ${faq.answer}\n\n`;
    });
    
    return context;
  } catch (error) {
    console.error("Error preparing context from FAQs:", error);
    return "";
  }
}

/**
 * Generate a response to a user message using OpenAI
 */
export async function generateAIResponse(userMessage: string): Promise<string> {
  try {
    // Get context from FAQs
    const context = await prepareContext();
    
    // Create system message with context and instructions
    const systemMessage = `
      You are an AI assistant for SerenityFlow, a workflow automation platform. 
      Your task is to help users with their questions about the platform.
      
      Use the following FAQ data to answer questions:
      ${context}
      
      If you don't know the answer:
      1. Admit that you don't have enough information
      2. Suggest that the user submit a support ticket for more assistance
      3. Don't make up information or pretend to know something you don't
      
      Be concise, professional, and helpful. Format your responses with proper spacing and structure.
    `;
    
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    
    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Error generating AI response:", error);
    throw new Error("Failed to generate AI response. Please try again later.");
  }
}

/**
 * Analyze user message to determine if it should be redirected to support
 */
export async function shouldRedirectToSupport(userMessage: string): Promise<boolean> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "You are an AI assistant that determines if a user question should be redirected to human support. Answer with JSON: { \"redirect\": true/false }" 
        },
        { 
          role: "user", 
          content: `Analyze this question and determine if it should be redirected to human support: "${userMessage}". Redirect if: 1) It's a complex technical issue, 2) It's about account-specific details, 3) It's about billing/payments, or 4) The user is expressing frustration or urgency.` 
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });
    
    try {
      const result = JSON.parse(response.choices[0].message.content);
      return result.redirect === true;
    } catch (e) {
      console.error("Failed to parse OpenAI response:", e);
      return false;
    }
  } catch (error) {
    console.error("Error determining if support redirection is needed:", error);
    return false;
  }
}
