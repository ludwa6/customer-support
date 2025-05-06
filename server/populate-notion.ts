import { Client } from "@notionhq/client";
import { DatabaseObjectResponse, PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_INTEGRATION_SECRET
});

// Use the provided database ID directly
const DATABASE_ID = "1ebc922b6d5b80729c9dd0d4f7ccf567";

interface CategoryInfo {
  id: string;
  name: string;
}

async function getDatabaseSchema() {
  try {
    console.log(`Retrieving database schema for ID: ${DATABASE_ID}`);
    const databaseInfo = await notion.databases.retrieve({
      database_id: DATABASE_ID,
    });
    
    console.log("Database properties:", Object.keys(databaseInfo.properties));
    return databaseInfo;
  } catch (error) {
    console.error("Error retrieving database schema:", error);
    throw error;
  }
}

async function addCategories(): Promise<CategoryInfo[]> {
  console.log("Adding categories to the database...");
  
  const categories = [
    {
      Name: "Getting Started",
      Description: "Learn the basics and set up your first workflow",
      Icon: "rocket"
    },
    {
      Name: "Account Settings",
      Description: "Manage your profile, billing, and preferences",
      Icon: "user-gear"
    },
    {
      Name: "Workflows & Automations",
      Description: "Create and manage automated processes",
      Icon: "cog"
    },
    {
      Name: "Integrations",
      Description: "Connect with other apps and services",
      Icon: "plug"
    },
    {
      Name: "Team Management",
      Description: "Collaborate with team members and manage roles",
      Icon: "users"
    },
    {
      Name: "Billing & Subscription",
      Description: "Manage payment methods and subscription plans",
      Icon: "credit-card"
    }
  ];

  // Instead of just returning, let's actually create the categories
  const createdCategories: CategoryInfo[] = [];
  for (const category of categories) {
    console.log(`Adding category: ${category.Name}`);
    try {
      const newPage = await notion.pages.create({
        parent: { database_id: DATABASE_ID },
        properties: {
          // Adapt these property names based on your actual database schema
          // We'll use the most common property names, but you may need to adjust
          title: {
            title: [
              {
                text: {
                  content: category.Name
                }
              }
            ]
          },
          // Add these properties if they exist in your database
          ...(category.Description && {
            description: {
              rich_text: [
                {
                  text: {
                    content: category.Description
                  }
                }
              ]
            }
          }),
          ...(category.Icon && {
            icon: {
              rich_text: [
                {
                  text: {
                    content: category.Icon
                  }
                }
              ]
            }
          }),
          // Set type to Category
          type: {
            select: {
              name: "Category"
            }
          }
        }
      });
      createdCategories.push({
        id: newPage.id,
        name: category.Name
      });
      console.log(`Successfully added category: ${category.Name} with ID: ${newPage.id}`);
    } catch (error) {
      console.error(`Error adding category ${category.Name}:`, error);
    }
  }
  
  return createdCategories;
}

async function addArticles(categories: CategoryInfo[]) {
  console.log("Adding articles to the database...");

  // Get category mapping for easy reference
  const categoryMap: Record<string, string> = {};
  categories.forEach(cat => {
    categoryMap[cat.name] = cat.id;
  });

  const articles = [
    {
      Title: "Getting started with SerenityFlow",
      Content: "Learn the basics of using our platform in under 10 minutes.\n\nSerenityFlow is a powerful workflow automation platform designed to help teams streamline their processes. This guide will walk you through the essential features and help you set up your first workflow.\n\n1. Sign up for an account\n2. Set up your profile\n3. Create your first workspace\n4. Invite team members\n5. Create your first workflow",
      CategoryName: "Getting Started",
      IsPopular: true
    },
    {
      Title: "How to connect your Notion workspace",
      Content: "Step-by-step guide to linking your Notion account.\n\nSerenityFlow allows you to seamlessly integrate with Notion, enabling you to automate your Notion workflows. This guide will show you how to connect your Notion workspace to SerenityFlow.\n\n1. Navigate to the Integrations tab in your SerenityFlow dashboard\n2. Find and select the Notion integration\n3. Click 'Connect'\n4. You will be redirected to Notion to authorize the connection\n5. Select which Notion workspace you want to connect\n6. Grant the necessary permissions\n7. You'll be redirected back to SerenityFlow with your connection established",
      CategoryName: "Integrations",
      IsPopular: true
    },
    {
      Title: "Troubleshooting common integration issues",
      Content: "Solutions to the most frequent connection problems.\n\nIntegrations sometimes encounter issues that prevent them from working correctly. This guide addresses the most common problems users face with SerenityFlow integrations.\n\n1. Authentication failures\n2. Permission issues\n3. Rate limit exceeded\n4. Webhook delivery problems\n5. Data mapping mismatches\n\nFor each issue, we provide detailed troubleshooting steps and solutions.",
      CategoryName: "Integrations",
      IsPopular: true
    },
    {
      Title: "Creating your first automated workflow",
      Content: "Build powerful automations with a few simple steps.\n\nWorkflows are the heart of SerenityFlow. They allow you to automate repetitive tasks and connect different services together. This guide will walk you through creating your first workflow.\n\n1. Navigate to the Workflows tab in your dashboard\n2. Click 'Create New Workflow'\n3. Choose a trigger - this is the event that starts your workflow\n4. Add actions - these are the tasks that will be performed when the trigger occurs\n5. Configure your actions with the required information\n6. Test your workflow\n7. Turn on your workflow to activate it",
      CategoryName: "Workflows & Automations",
      IsPopular: true
    },
    {
      Title: "Managing team permissions and roles",
      Content: "Control who can access and modify your workflows.\n\nAs your team grows, you'll need to manage who has access to what in SerenityFlow. This guide covers how to set up team permissions and roles.\n\n1. Understanding role types (Admin, Editor, Viewer)\n2. Setting up custom roles\n3. Assigning permissions to specific workflows\n4. Managing team member access\n5. Setting up approval workflows for sensitive actions",
      CategoryName: "Team Management",
      IsPopular: true
    },
    {
      Title: "Understanding SerenityFlow pricing plans",
      Content: "A detailed overview of our pricing tiers and features.\n\nSerenityFlow offers several pricing plans to suit different needs and team sizes. This article breaks down what's included in each plan.\n\n1. Free Plan: Basic features for individuals\n2. Pro Plan ($12/month): Advanced features for professionals\n3. Team Plan ($25/user/month): Collaboration features for teams\n4. Enterprise Plan: Custom pricing for large organizations\n\nEach plan includes different limits on workflows, integrations, and support levels.",
      CategoryName: "Billing & Subscription",
      IsPopular: false
    }
  ];

  for (const article of articles) {
    console.log(`Adding article: ${article.Title}`);
    try {
      const categoryId = categoryMap[article.CategoryName] || "";
      const newPage = await notion.pages.create({
        parent: { database_id: DATABASE_ID },
        properties: {
          // Adapt these property names based on your actual database schema
          title: {
            title: [
              {
                text: {
                  content: article.Title
                }
              }
            ]
          },
          // Content/description field
          description: {
            rich_text: [
              {
                text: {
                  content: article.Content
                }
              }
            ]
          },
          // Reference to category (if your database supports this)
          ...(categoryId && {
            category: {
              rich_text: [
                {
                  text: {
                    content: categoryId
                  }
                }
              ]
            }
          }),
          // Category name for convenience
          categoryName: {
            rich_text: [
              {
                text: {
                  content: article.CategoryName
                }
              }
            ]
          },
          // Popularity flag
          ...(article.IsPopular !== undefined && {
            isPopular: {
              checkbox: article.IsPopular
            }
          }),
          // Set type to Article
          type: {
            select: {
              name: "Article"
            }
          }
        }
      });
      console.log(`Successfully added article: ${article.Title} with ID: ${newPage.id}`);
    } catch (error) {
      console.error(`Error adding article ${article.Title}:`, error);
    }
  }
}

async function addFAQs(categories: CategoryInfo[]) {
  console.log("Adding FAQs to the database...");

  // Get category mapping for easy reference
  const categoryMap: Record<string, string> = {};
  categories.forEach(cat => {
    categoryMap[cat.name] = cat.id;
  });

  const faqs = [
    {
      Question: "How do I reset my password?",
      Answer: "To reset your password, go to the login page and click on 'Forgot Password'. Enter your email address, and we'll send you a password reset link.",
      CategoryName: "Account Settings"
    },
    {
      Question: "Can I integrate SerenityFlow with my existing tools?",
      Answer: "Yes! SerenityFlow integrates with over 100 popular tools and services, including Notion, Slack, Google Workspace, Microsoft Office, Trello, Asana, and many more. Visit our Integrations page to see the full list.",
      CategoryName: "Integrations"
    },
    {
      Question: "How many workflows can I create on the free plan?",
      Answer: "The free plan allows you to create up to 5 active workflows with a total of 1,000 operations per month. For unlimited workflows and higher usage limits, consider upgrading to one of our paid plans.",
      CategoryName: "Billing & Subscription"
    },
    {
      Question: "How do I invite team members to my workspace?",
      Answer: "To invite team members, go to Settings > Team Members, click 'Invite Members', and enter their email addresses. You can also set their roles and permissions during the invitation process.",
      CategoryName: "Team Management"
    },
    {
      Question: "Can I schedule workflows to run at specific times?",
      Answer: "Yes, SerenityFlow supports scheduled workflows. When creating a workflow, select 'Schedule' as your trigger, then specify the timing (hourly, daily, weekly, monthly, or custom cron expressions).",
      CategoryName: "Workflows & Automations"
    },
    {
      Question: "What happens if my workflow encounters an error?",
      Answer: "If your workflow encounters an error, SerenityFlow will notify you via email and in the dashboard. You can view detailed error logs and retry failed workflows from the Workflow Monitoring section.",
      CategoryName: "Workflows & Automations"
    },
    {
      Question: "How do I cancel my subscription?",
      Answer: "To cancel your subscription, go to Settings > Billing, click 'Manage Subscription', and select 'Cancel Subscription'. Your plan will remain active until the end of your current billing period.",
      CategoryName: "Billing & Subscription"
    },
    {
      Question: "Is my data secure with SerenityFlow?",
      Answer: "Yes, security is our top priority. SerenityFlow uses industry-standard encryption for all data in transit and at rest. We are SOC 2 compliant and conduct regular security audits. We never store your third-party service credentials in plain text.",
      CategoryName: "Account Settings"
    }
  ];

  for (const faq of faqs) {
    console.log(`Adding FAQ: ${faq.Question}`);
    try {
      const categoryId = categoryMap[faq.CategoryName] || "";
      const newPage = await notion.pages.create({
        parent: { database_id: DATABASE_ID },
        properties: {
          // Adapt these property names based on your actual database schema
          title: {
            title: [
              {
                text: {
                  content: faq.Question
                }
              }
            ]
          },
          // Answer field
          answer: {
            rich_text: [
              {
                text: {
                  content: faq.Answer
                }
              }
            ]
          },
          // Reference to category (if your database supports this)
          ...(categoryId && {
            category: {
              rich_text: [
                {
                  text: {
                    content: categoryId
                  }
                }
              ]
            }
          }),
          // Category name for convenience
          categoryName: {
            rich_text: [
              {
                text: {
                  content: faq.CategoryName
                }
              }
            ]
          },
          // Set type to FAQ
          type: {
            select: {
              name: "FAQ"
            }
          }
        }
      });
      console.log(`Successfully added FAQ: ${faq.Question} with ID: ${newPage.id}`);
    } catch (error) {
      console.error(`Error adding FAQ ${faq.Question}:`, error);
    }
  }
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

    // 1. First, check the database schema
    await getDatabaseSchema();
    
    // 2. Add categories
    const categories = await addCategories();
    
    // 3. Add articles
    await addArticles(categories);
    
    // 4. Add FAQs
    await addFAQs(categories);
    
    console.log("🎉 Notion database population completed successfully!");
    console.log("You can now refresh your application to see the content.");
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
}

// Run the main function
main();