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
 * 
 * This function has been modified to always return false, as per user request.
 * The redirect to support functionality has been disabled.
 */
export async function shouldRedirectToSupport(userMessage: string): Promise<boolean> {
  // Always return false - no redirection to support
  return false;
}
