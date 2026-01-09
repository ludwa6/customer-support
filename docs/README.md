# CustomerSupport Documentation

Complete documentation for the CustomerSupport application.

---

## Quick Links

### For Developers

**Developer Brief (for Pedro):**
- Full technical brief (24KB) is available in outputs folder
- Walt will provide this file directly
- Contains complete implementation guide for subdomain deployment

**Setup & Integration:**
- [Notion Integration](../REMIXING.md) - How to set up Notion databases
- [Schema Validation](../SCHEMA-VALIDATION.md) - Validating Notion schema

### For Project Management

**Planning Documents:**
- [Production Roadmap](https://github.com/ludwa6/claude-workspace/blob/main/projects/customer-support/PRODUCTION-ROADMAP.md) - Full AEO strategy
- [Current Status](https://github.com/ludwa6/claude-workspace/blob/main/projects/customer-support/README.md) - Project status & decisions

---

## Current Status

**Phase:** Beta Testing  
**Live URL:** https://customer-support-walt6.replit.app/  
**Target Deployment:** support.valedalama.net + support.casavaledalama.com

### Progress

✅ **Complete:**
- App deployed to Replit Reserved VM
- Notion integration working
- FAQ display functional
- Ticket submission working

⏳ **In Progress:**
- FAQ editing in Notion (not yet tested)
- Beta testing with internal users

📋 **Next:**
- Production deployment to custom domains
- Context detection (farm vs hotel)
- Schema.org markup for AEO

---

## For Content Managers

**Editing FAQs:**
- Edit directly in Notion
- Changes sync automatically to the app
- No code changes required

**Viewing Tickets:**
- Check Notion database for submitted tickets
- Filter and organize as needed

---

## For Developers

**Making Code Changes:**
1. Edit code in Replit
2. Test changes locally
3. Commit to main branch (auto-deploys)
4. Monitor Replit logs for errors

**Testing:**
```bash
npm test                    # Run tests
node check-setup.js         # Verify Notion connection
node check-notion-schema.js # Verify database schema
```

---

## Getting the Full Documentation

The complete technical brief (DEVELOPER-BRIEF-subdomain-deployment.md, 24KB) includes:
- Complete implementation guide
- DNS configuration steps
- Schema.org markup examples
- Full checklists
- Troubleshooting guide

**To get it:**
- Request from Walt Ludwig
- Or see: `claude-workspace/projects/customer-support/DEVELOPER-BRIEF-subdomain-deployment.md`

---

**Last updated:** Jan 9, 2026
