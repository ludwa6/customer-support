import { db } from "./index";
import * as schema from "@shared/schema";

async function seed() {
  try {
    console.log("🌱 Starting database seeding...");
    
    // Seed categories
    console.log("Seeding categories...");
    const categories = [
      {
        name: "Getting Started",
        description: "Learn the basics and set up your first workflow",
        icon: "plus",
        notionId: "getting-started-notion-id",
      },
      {
        name: "Account Settings",
        description: "Manage your profile, billing, and preferences",
        icon: "settings",
        notionId: "account-settings-notion-id",
      },
      {
        name: "Workflows & Automations",
        description: "Create and manage automated processes",
        icon: "workflow",
        notionId: "workflows-automations-notion-id",
      },
      {
        name: "Integrations",
        description: "Connect with other apps and services",
        icon: "integrations",
        notionId: "integrations-notion-id",
      },
      {
        name: "Team Management",
        description: "Collaborate with team members and manage roles",
        icon: "team",
        notionId: "team-management-notion-id",
      },
      {
        name: "Billing & Subscription",
        description: "Manage payment methods and subscription plans",
        icon: "billing",
        notionId: "billing-subscription-notion-id",
      },
    ];
    
    // Insert all categories and store their IDs for relationships
    const categoryRecords: Record<string, number> = {};
    
    for (const category of categories) {
      const existingCategory = await db.query.categories.findFirst({
        where: (c, { eq }) => eq(c.name, category.name),
      });
      
      if (!existingCategory) {
        const [insertedCategory] = await db.insert(schema.categories).values(category).returning();
        categoryRecords[category.name] = insertedCategory.id;
        console.log(`Category created: ${category.name}`);
      } else {
        categoryRecords[category.name] = existingCategory.id;
        console.log(`Category already exists: ${category.name}`);
      }
    }
    
    // Seed articles
    console.log("Seeding articles...");
    
    const articles = [
      {
        title: "Getting started with SerenityFlow",
        content: "Learn the basics of using our platform in under 10 minutes.\n\nSerenityFlow is a powerful workflow automation platform designed to help teams streamline their processes. This guide will walk you through the essential features and help you set up your first workflow.\n\n1. Sign up for an account\n2. Set up your profile\n3. Create your first workspace\n4. Invite team members\n5. Create your first workflow",
        categoryId: categoryRecords["Getting Started"],
        isPopular: true,
        notionId: "getting-started-article-notion-id",
      },
      {
        title: "How to connect your Notion workspace",
        content: "Step-by-step guide to linking your Notion account.\n\nSerenityFlow allows you to seamlessly integrate with Notion, enabling you to automate your Notion workflows. This guide will show you how to connect your Notion workspace to SerenityFlow.\n\n1. Navigate to the Integrations tab in your SerenityFlow dashboard\n2. Find and select the Notion integration\n3. Click 'Connect'\n4. You will be redirected to Notion to authorize the connection\n5. Select which Notion workspace you want to connect\n6. Grant the necessary permissions\n7. You'll be redirected back to SerenityFlow with your connection established",
        categoryId: categoryRecords["Integrations"],
        isPopular: true,
        notionId: "notion-connection-article-notion-id",
      },
      {
        title: "Troubleshooting common integration issues",
        content: "Solutions to the most frequent connection problems.\n\nIntegrations sometimes encounter issues that prevent them from working correctly. This guide addresses the most common problems users face with SerenityFlow integrations.\n\n1. Authentication failures\n2. Permission issues\n3. Rate limit exceeded\n4. Webhook delivery problems\n5. Data mapping mismatches\n\nFor each issue, we provide detailed troubleshooting steps and solutions.",
        categoryId: categoryRecords["Integrations"],
        isPopular: true,
        notionId: "integration-troubleshooting-article-notion-id",
      },
      {
        title: "Creating your first automated workflow",
        content: "Build powerful automations with a few simple steps.\n\nWorkflows are the heart of SerenityFlow. They allow you to automate repetitive tasks and connect different services together. This guide will walk you through creating your first workflow.\n\n1. Navigate to the Workflows tab in your dashboard\n2. Click 'Create New Workflow'\n3. Choose a trigger - this is the event that starts your workflow\n4. Add actions - these are the tasks that will be performed when the trigger occurs\n5. Configure your actions with the required information\n6. Test your workflow\n7. Turn on your workflow to activate it",
        categoryId: categoryRecords["Workflows & Automations"],
        isPopular: true,
        notionId: "first-workflow-article-notion-id",
      },
      {
        title: "Managing team permissions and roles",
        content: "Control who can access and modify your workflows.\n\nAs your team grows, you'll need to manage who has access to what in SerenityFlow. This guide covers how to set up team permissions and roles.\n\n1. Understanding role types (Admin, Editor, Viewer)\n2. Setting up custom roles\n3. Assigning permissions to specific workflows\n4. Managing team member access\n5. Setting up approval workflows for sensitive actions",
        categoryId: categoryRecords["Team Management"],
        isPopular: true,
        notionId: "team-permissions-article-notion-id",
      },
      {
        title: "Understanding SerenityFlow pricing plans",
        content: "A detailed overview of our pricing tiers and features.\n\nSerenityFlow offers several pricing plans to suit different needs and team sizes. This article breaks down what's included in each plan.\n\n1. Free Plan: Basic features for individuals\n2. Pro Plan ($12/month): Advanced features for professionals\n3. Team Plan ($25/user/month): Collaboration features for teams\n4. Enterprise Plan: Custom pricing for large organizations\n\nEach plan includes different limits on workflows, integrations, and support levels.",
        categoryId: categoryRecords["Billing & Subscription"],
        isPopular: false,
        notionId: "pricing-plans-article-notion-id",
      },
    ];
    
    // Insert articles
    for (const article of articles) {
      const existingArticle = await db.query.articles.findFirst({
        where: (a, { eq }) => eq(a.title, article.title),
      });
      
      if (!existingArticle) {
        await db.insert(schema.articles).values({
          ...article,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`Article created: ${article.title}`);
      } else {
        console.log(`Article already exists: ${article.title}`);
      }
    }
    
    // Seed FAQs
    console.log("Seeding FAQs...");
    
    const faqs = [
      {
        question: "How do I reset my password?",
        answer: "To reset your password, go to the login page and click on 'Forgot Password'. Enter your email address, and we'll send you a password reset link.",
        categoryId: categoryRecords["Account Settings"],
        notionId: "password-reset-faq-notion-id",
      },
      {
        question: "Can I integrate SerenityFlow with my existing tools?",
        answer: "Yes! SerenityFlow integrates with over 100 popular tools and services, including Notion, Slack, Google Workspace, Microsoft Office, Trello, Asana, and many more. Visit our Integrations page to see the full list.",
        categoryId: categoryRecords["Integrations"],
        notionId: "integrations-faq-notion-id",
      },
      {
        question: "How many workflows can I create on the free plan?",
        answer: "The free plan allows you to create up to 5 active workflows with a total of 1,000 operations per month. For unlimited workflows and higher usage limits, consider upgrading to one of our paid plans.",
        categoryId: categoryRecords["Billing & Subscription"],
        notionId: "free-plan-limits-faq-notion-id",
      },
      {
        question: "How do I invite team members to my workspace?",
        answer: "To invite team members, go to Settings > Team Members, click 'Invite Members', and enter their email addresses. You can also set their roles and permissions during the invitation process.",
        categoryId: categoryRecords["Team Management"],
        notionId: "invite-members-faq-notion-id",
      },
      {
        question: "Can I schedule workflows to run at specific times?",
        answer: "Yes, SerenityFlow supports scheduled workflows. When creating a workflow, select 'Schedule' as your trigger, then specify the timing (hourly, daily, weekly, monthly, or custom cron expressions).",
        categoryId: categoryRecords["Workflows & Automations"],
        notionId: "scheduled-workflows-faq-notion-id",
      },
      {
        question: "What happens if my workflow encounters an error?",
        answer: "If your workflow encounters an error, SerenityFlow will notify you via email and in the dashboard. You can view detailed error logs and retry failed workflows from the Workflow Monitoring section.",
        categoryId: categoryRecords["Workflows & Automations"],
        notionId: "workflow-errors-faq-notion-id",
      },
      {
        question: "How do I cancel my subscription?",
        answer: "To cancel your subscription, go to Settings > Billing, click 'Manage Subscription', and select 'Cancel Subscription'. Your plan will remain active until the end of your current billing period.",
        categoryId: categoryRecords["Billing & Subscription"],
        notionId: "cancel-subscription-faq-notion-id",
      },
      {
        question: "Is my data secure with SerenityFlow?",
        answer: "Yes, security is our top priority. SerenityFlow uses industry-standard encryption for all data in transit and at rest. We are SOC 2 compliant and conduct regular security audits. We never store your third-party service credentials in plain text.",
        categoryId: categoryRecords["Account Settings"],
        notionId: "data-security-faq-notion-id",
      },
    ];
    
    // Insert FAQs
    for (const faq of faqs) {
      const existingFAQ = await db.query.faqs.findFirst({
        where: (f, { eq }) => eq(f.question, faq.question),
      });
      
      if (!existingFAQ) {
        await db.insert(schema.faqs).values(faq);
        console.log(`FAQ created: ${faq.question}`);
      } else {
        console.log(`FAQ already exists: ${faq.question}`);
      }
    }
    
    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}

seed();
