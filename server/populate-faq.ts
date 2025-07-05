import { Client } from "@notionhq/client";

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_INTEGRATION_SECRET
});

// Will be populated with a database ID found at runtime
let DATABASE_ID: string;

async function populateFAQs() {
  console.log("Adding FAQs to the database...");

  const faqs = [
    {
      Question: "How do I reset my password?",
      Answer: "To reset your password, go to the login page and click on 'Forgot Password'. Enter your email address, and we'll send you a password reset link.",
      Category: "Account and Subscription"
    },
    {
      Question: "Can I integrate Quinta Vale da Lama with my existing tools?",
      Answer: "Yes! Quinta Vale da Lama integrates with over 100 popular tools and services, including Notion, Slack, Google Workspace, Microsoft Office, Trello, Asana, and many more. Visit our Integrations page to see the full list.",
      Category: "Technical Help"
    },
    {
      Question: "How many workflows can I create on the free plan?",
      Answer: "The free plan allows you to create up to 5 active workflows with a total of 1,000 operations per month. For unlimited workflows and higher usage limits, consider upgrading to one of our paid plans.",
      Category: "Account and Subscription"
    },
    {
      Question: "How do I invite team members to my workspace?",
      Answer: "To invite team members, go to Settings > Team Members, click 'Invite Members', and enter their email addresses. You can also set their roles and permissions during the invitation process.",
      Category: "Content and Features"
    },
    {
      Question: "Can I schedule workflows to run at specific times?",
      Answer: "Yes, Quinta Vale da Lama supports scheduled workflows. When creating a workflow, select 'Schedule' as your trigger, then specify the timing (hourly, daily, weekly, monthly, or custom cron expressions).",
      Category: "Content and Features"
    },
    {
      Question: "What happens if my workflow encounters an error?",
      Answer: "If your workflow encounters an error, Quinta Vale da Lama will notify you via email and in the dashboard. You can view detailed error logs and retry failed workflows from the Workflow Monitoring section.",
      Category: "Technical Help"
    },
    {
      Question: "How do I cancel my subscription?",
      Answer: "To cancel your subscription, go to Settings > Billing, click 'Manage Subscription', and select 'Cancel Subscription'. Your plan will remain active until the end of your current billing period.",
      Category: "Account and Subscription"
    },
    {
      Question: "Is my data secure with Quinta Vale da Lama?",
      Answer: "Yes, security is our top priority. Quinta Vale da Lama uses industry-standard encryption for all data in transit and at rest. We are SOC 2 compliant and conduct regular security audits. We never store your third-party service credentials in plain text.",
      Category: "Privacy and Security"
    },
    {
      Question: "How do I get started with Quinta Vale da Lama?",
      Answer: "Getting started is easy! Sign up for a free account, follow our interactive onboarding guide, and check out our Quick Start tutorials. You'll be creating your first workflow in minutes.",
      Category: "Getting Started"
    },
    {
      Question: "What browsers are supported by SerenityFlow?",
      Answer: "SerenityFlow supports all modern browsers including Chrome, Firefox, Safari, and Edge. For the best experience, we recommend using the latest version of Chrome or Firefox.",
      Category: "Technical Help"
    },
    {
      Question: "Can I customize the appearance of my workflows?",
      Answer: "Yes, SerenityFlow offers various customization options. You can change colors, add custom icons, and organize workflows into folders with your own naming scheme.",
      Category: "Personalization"
    },
    {
      Question: "How can I contact support?",
      Answer: "You can reach our support team through the Help button in the app, by emailing support@serenityflow.com, or by using the live chat on our website during business hours.",
      Category: "Community and Support"
    }
  ];

  let successCount = 0;
  for (const faq of faqs) {
    console.log(`Adding FAQ: ${faq.Question}`);
    try {
      await notion.pages.create({
        parent: { database_id: DATABASE_ID },
        properties: {
          // Using the property names we discovered in the schema
          question: {
            title: [
              {
                text: {
                  content: faq.Question
                }
              }
            ]
          },
          answer: {
            rich_text: [
              {
                text: {
                  content: faq.Answer
                }
              }
            ]
          },
          category: {
            select: {
              name: faq.Category
            }
          }
        }
      });
      successCount++;
      console.log(`✅ Successfully added FAQ: ${faq.Question}`);
    } catch (error) {
      console.error(`❌ Error adding FAQ ${faq.Question}:`, error);
    }
  }
  
  return successCount;
}

// Main function to run the setup and seeding
async function main() {
  try {
    // Check if we have the required environment variable
    if (!process.env.NOTION_INTEGRATION_SECRET) {
      console.error("Missing required environment variable: NOTION_INTEGRATION_SECRET");
      console.error("Please set this variable and try again.");
      process.exit(1);
    }
    
    // Find a suitable database
    console.log("Looking for a database to use...");
    try {
      // First try to find a database by name - preferring FAQs
      const faqsDb = await notion.search({
        query: "FAQs",
        filter: {
          property: "object",
          value: "database"
        }
      });
      
      if (faqsDb.results.length > 0) {
        // Use the first FAQ database found
        DATABASE_ID = faqsDb.results[0].id;
        console.log(`Using FAQ database: ${DATABASE_ID}`);
      } else {
        // If no FAQ database found, try to find any database
        console.log("No FAQ database found, searching for any database...");
        const anyDatabases = await notion.search({
          filter: {
            property: "object",
            value: "database"
          }
        });
        
        if (anyDatabases.results.length > 0) {
          // Use the first database found
          DATABASE_ID = anyDatabases.results[0].id;
          console.log(`Using first available database: ${DATABASE_ID}`);
        } else {
          console.error("No databases found. Make sure your integration has access to at least one database.");
          process.exit(1);
        }
      }
      
      // Add FAQs
      const successCount = await populateFAQs();
      
      console.log(`🎉 Successfully added ${successCount} FAQs to the Notion database!`);
      console.log("You can now refresh your application to see the content.");
    } catch (searchError) {
      console.error("Error finding or using databases:", searchError);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
}

// Run the main function
main();