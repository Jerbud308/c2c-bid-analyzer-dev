# Template Library Documentation

## Overview

The Template Library is a comprehensive system for managing reusable bid response content. Instead of rewriting the same information for every bid, you can create templates with variable placeholders that automatically populate with project-specific information.

## Key Concepts

### Templates
Templates are reusable blocks of rich text content (company overviews, safety programs, personnel bios, etc.) that can include variable placeholders like `{PROJECT_NAME}` or `{AGENCY}`.

### Variables
Variables are placeholders in templates that get replaced with actual values when you use the template. They follow the format `{VARIABLE_NAME}` and must use UPPERCASE letters and underscores only.

**Example:**
```
{COMPANY_NAME} is bidding on {PROJECT_NAME} for {AGENCY}.
```

When populated with values:
```
C2C Restoration LLC is bidding on Roof Replacement on {AGENCY} for Department of Veterans Affairs.
```

### Categories
Templates are organized into categories:
- **Company Info** - Company overviews, history, capabilities
- **Safety** - Safety programs, OSHA compliance
- **Quality Control** - QC approaches, inspection processes
- **Personnel** - Key personnel resumes and bios
- **Past Projects** - Past project descriptions and references
- **Capabilities** - Technical capabilities, equipment lists
- **Certifications** - Certifications, licenses, insurance
- **Other** - Miscellaneous content

### Tags
Templates can be tagged with keywords (e.g., "roofing", "asbestos", "federal", "Florida") to make them easy to find when searching.

### Status Workflow
Templates progress through a simple approval workflow:
1. **Draft** - New templates start as drafts
2. **Approved** - Phil approves templates for use in bids
3. **Archived** - Old/unused templates are archived (soft delete)

### Version Control
Every time you edit a template, the system:
1. Saves the previous version to history
2. Increments the version number
3. Records who made the change and when
4. Stores your change notes

## Getting Started

### Accessing the Template Library

Navigate to the Template Library from the main menu. You'll see:
- **Header** - Page title and "Create New Template" button
- **Sidebar** - Filters for finding templates
- **Main Area** - Grid of template cards

### Finding Templates

**Search Box**
Type keywords to search template titles and content. The search updates automatically after you stop typing (500ms delay).

**Status Filter**
- All - Show all templates
- Draft - Show only drafts (needs approval)
- Approved - Show only approved templates (default)
- Archived - Show archived templates

**Category Checkboxes**
Select one or more categories to filter templates.

**Tag Cloud**
Click tags to filter templates. Selected tags are highlighted.

**Clear Filters**
Click "Clear (X)" in the sidebar header to reset all filters.

## Creating Templates

### Step-by-Step Guide

1. **Click "Create New Template"** button in the header

2. **Fill in Template Information:**
   - **Title** - Descriptive name (e.g., "Company Overview (Short)")
   - **Category** - Select the appropriate category
   - **Tags** - Add searchable keywords
     - Type a tag and press Enter or click "Add"
     - Click the X on a tag to remove it

3. **Write Content:**
   - Use the rich text editor for formatting
   - Available formatting:
     - Headings (H1, H2, H3)
     - **Bold**, *Italic*, <u>Underline</u>
     - Bullet lists and numbered lists
   - Insert variables using the Variable Helper

4. **Use Variables:**
   - Click "Show Variable Helper" to see suggested variables
   - Click any variable to insert it into content
   - Or manually type variables: `{VARIABLE_NAME}`
   - Rules for variable names:
     - Must be UPPERCASE
     - Use underscores for spaces: `{PROJECT_NAME}`
     - Letters, numbers, underscores only
     - Start with a letter

5. **Save:**
   - Click "Save Template" button
   - Template is created with status "draft"
   - Version 1 is automatically assigned

### Variable Naming Best Practices

**Use Clear, Descriptive Names:**
- ✅ `{PROJECT_NAME}`
- ✅ `{AGENCY}`
- ✅ `{CONTRACT_VALUE}`
- ❌ `{PN}`
- ❌ `{A}`

**Common Variables:**
- `{COMPANY_NAME}` - C2C Restoration LLC
- `{PROJECT_NAME}` - Name of the project being bid
- `{AGENCY}` - Government agency (VA, DOD, GSA, etc.)
- `{LOCATION}` - Project location
- `{SOLICITATION_NUMBER}` - RFP/IFB number
- `{CONTRACT_VALUE}` - Estimated contract value
- `{OWNER_NAME}` - Phil Wright
- `{ESTIMATOR_NAME}` - Blake Harkcom

See "Standard Variables" section below for complete list.

## Editing Templates

### Making Changes

1. Click "Edit" button on a template card
2. Make your changes in the editor
3. Add **Change Notes** describing what you changed
   - Example: "Updated certifications list"
   - Example: "Added paragraph about emergency response"
4. Click "Save Template"

The system automatically:
- Saves the old version to history
- Increments version number (v1 → v2)
- Records your change notes
- Updates the "updated_at" timestamp

### Version History

To view previous versions of a template:
1. Click "Preview" on the template
2. Click "Show Version History"
3. See list of all previous versions with:
   - Version number
   - Date created
   - Who created it
   - Change notes

*Note: Currently viewing old versions is read-only. To restore an old version, you'll need to manually copy the content and create a new version.*

## Using Templates

### Preview Mode

1. Click "Preview" on any template card
2. Fill in variable values in the form
   - Default values are pre-populated when possible
   - Update any field to see live preview update
3. Review the populated content in the preview area
4. Click "Use This Template" to insert into bid (coming soon)

### Auto-Population

When viewing a template from within an opportunity (future feature), the system will automatically populate:
- `{PROJECT_NAME}` from opportunity title
- `{AGENCY}` from opportunity agency
- `{LOCATION}` from opportunity location
- `{SOLICITATION_NUMBER}` from opportunity
- `{CONTRACT_VALUE}` from opportunity estimated value
- Other opportunity-specific data

## Template Approval Workflow

### For Blake (Creating Templates)

1. Create template with all content
2. Set appropriate category and tags
3. Save as **Draft**
4. Notify Phil that template is ready for review

### For Phil (Approving Templates)

1. Review draft template content
2. Make any needed edits
3. Click **"Approve"** button on template card
4. Template status changes to "Approved"
5. Template is now available for use in bids

**Only approved templates should be used in actual bid submissions.**

## Managing Templates

### Archiving Templates

When a template is no longer needed:
1. Click "Archive" button on template card
2. Confirm the action
3. Template status changes to "Archived"
4. Template no longer appears in default view
5. Can still be viewed by filtering Status: Archived

**Note:** Archived templates are soft-deleted (not permanently removed) and can be restored if needed.

### Usage Tracking

Each template tracks:
- **Usage Count** - Number of times used in bids
- **Last Updated** - When it was last modified
- **Version** - Current version number

Templates with higher usage counts appear first in search results (along with recently updated templates).

## Standard Variables Reference

### Project Information
- `{PROJECT_NAME}` - Name of the project
- `{SOLICITATION_NUMBER}` - RFP/IFB/Solicitation number
- `{NAICS_CODE}` - NAICS code for the project
- `{SET_ASIDE}` - Set-aside type (SDVOSB, 8(a), etc.)
- `{CONTRACT_VALUE}` - Estimated contract value
- `{LOCATION}` - Project location (city, state)
- `{DEADLINE}` - Bid submission deadline
- `{POSTED_DATE}` - Date solicitation was posted

### Agency Information
- `{AGENCY}` - Government agency name
- `{AGENCY_ABBREVIATION}` - Short form (VA, DOD, GSA)
- `{CONTRACTING_OFFICE}` - Specific contracting office

### Company Information
- `{COMPANY_NAME}` - C2C Restoration LLC
- `{COMPANY_FULL_NAME}` - Full legal name
- `{PHONE}` - Company phone number
- `{EMAIL}` - Company email
- `{WEBSITE}` - Company website
- `{CERTIFICATIONS}` - SDVOSB, VBE certifications
- `{YEAR_ESTABLISHED}` - Year company was founded
- `{YEARS_EXPERIENCE}` - Years in business

### Personnel
- `{OWNER_NAME}` - Phil Wright
- `{ESTIMATOR_NAME}` - Blake Harkcom
- `{PROJECT_MANAGER}` - Name of assigned PM

### Project-Specific (Past Projects)
- `{COMPLETION_DATE}` - When project was completed
- `{BUILDING_SIZE}` - Square footage
- `{PROJECT_DURATION}` - How long project took

### Insurance & Bonding
- `{GENERAL_LIABILITY}` - GL coverage amount
- `{GENERAL_LIABILITY_AGGREGATE}` - GL aggregate
- `{AUTO_LIABILITY}` - Auto liability amount
- `{UMBRELLA}` - Umbrella policy amount
- `{POLLUTION}` - Environmental liability amount
- `{SURETY_COMPANY}` - Bonding company name
- `{SINGLE_PROJECT_BOND}` - Single project capacity
- `{AGGREGATE_BOND}` - Aggregate bonding capacity

## Tips & Best Practices

### Creating Effective Templates

1. **Start General, Then Customize**
   - Create a general template first
   - Use it a few times to see what needs to be variable
   - Add variables where content changes project-to-project

2. **Don't Over-Variable**
   - Not everything needs to be a variable
   - Only make something a variable if it changes frequently
   - Example: Company name is ALWAYS "C2C Restoration LLC" - you could hardcode it or use a variable

3. **Use Descriptive Titles**
   - ✅ "Company Overview (Short - 2 paragraphs)"
   - ✅ "Safety Program for Roofing Projects"
   - ❌ "Template 1"
   - ❌ "Company Stuff"

4. **Tag Thoroughly**
   - Add all relevant tags
   - Include: trade (roofing, asbestos), location (Florida, federal), type (emergency, large-project)
   - More tags = easier to find later

5. **Keep Multiple Versions**
   - Create "Short" and "Long" versions of common content
   - Example: "Company Overview (Short)" for page-limited bids
   - Example: "Company Overview (Detailed)" for comprehensive proposals

### Content Writing Tips

1. **Write in Third Person**
   - ✅ "C2C Restoration provides..."
   - ✅ "{COMPANY_NAME} has completed..."
   - ❌ "We provide..."

2. **Use Active Voice**
   - ✅ "C2C completed the project on schedule"
   - ❌ "The project was completed on schedule by C2C"

3. **Be Specific**
   - Include numbers, dates, specifics
   - "20+ years of experience" better than "extensive experience"
   - "$2.3M project" better than "large project"

4. **Focus on Benefits**
   - Don't just list features, explain benefits
   - ❌ "We have OSHA 30-hour training"
   - ✅ "All supervisors maintain OSHA 30-hour certification, ensuring job sites meet or exceed federal safety standards"

### Template Maintenance

1. **Review Quarterly**
   - Every 3 months, review your templates
   - Update outdated information (certifications, insurance amounts, project examples)
   - Archive templates you're not using

2. **Update After Each Use**
   - If you customize a template significantly for a bid, update the master template
   - Add that variation to your library

3. **Track What Works**
   - Note which templates are used most
   - Use high-usage templates as models for new ones
   - Archive low-usage templates

## Troubleshooting

### Variables Not Replacing

**Problem:** Variables show as `{VARIABLE_NAME}` instead of actual values

**Solutions:**
- Check variable spelling matches exactly (case-sensitive)
- Ensure variable follows naming rules (UPPERCASE, underscores only)
- Verify variable value was provided (not blank)

### Can't Find Template

**Problem:** Template exists but doesn't appear in search

**Solutions:**
- Check Status filter - template might be Draft or Archived
- Clear all filters and search again
- Verify template wasn't accidentally deleted

### Rich Text Formatting Issues

**Problem:** Formatting looks wrong in preview

**Solutions:**
- Preview shows exact HTML - what you see is what you get
- Test with "Preview" before using in bid
- Keep formatting simple (bullets, bold, headings only)

## Future Enhancements

The following features are planned for future releases:

- **Auto-Draft Proposals** - Select templates and automatically generate complete proposal
- **Word Export** - Export populated templates directly to Word documents
- **Template Duplication** - "Save As" feature to create variations
- **Version Diffing** - See exactly what changed between versions
- **Template Suggestions** - AI suggests relevant templates based on opportunity details
- **Collaboration** - Multiple users can comment on draft templates
- **Template Analytics** - Track which templates win the most bids

## Getting Help

Questions about the Template Library? Contact:
- **Phil Wright** - For approval workflow and template content questions
- **Technical Support** - For system issues or bugs

---

*Last Updated: November 2025*
