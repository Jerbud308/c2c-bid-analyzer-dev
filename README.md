# C2C Bid Analyzer - Template Management System

Government bid analyzer with comprehensive template management for reusable bid response content.

## Features

### Template Library
- **Reusable Content Templates** - Store commonly used bid response content (company overviews, safety programs, personnel resumes, etc.)
- **Variable Placeholders** - Use `{VARIABLE_NAME}` syntax to create dynamic content that auto-populates with project-specific data
- **Rich Text Editor** - Format content with headings, bullets, bold, italic, and more
- **Search & Filter** - Find templates by category, tags, status, or keyword search
- **Version Control** - Automatic version history with change notes
- **Approval Workflow** - Draft → Approved → Archived status progression
- **Usage Tracking** - Track how often each template is used

### Categories
- Company Info
- Safety Programs
- Quality Control
- Personnel Resumes
- Past Projects
- Technical Capabilities
- Certifications & Licenses
- Other

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Quill** - Rich text editor

### Backend
- **Supabase** - PostgreSQL database and Edge Functions
- **PostgreSQL** - Database with full-text search, JSONB support
- **Deno** - Edge Functions runtime

## Project Structure

```
c2c-bid-analyzer-dev/
├── src/
│   ├── components/          # React components
│   │   ├── TemplateLibrary.tsx    # Main template management page
│   │   ├── TemplateEditor.tsx     # Create/edit templates
│   │   ├── TemplatePreview.tsx    # Preview with variable substitution
│   │   └── TemplateCard.tsx       # Template card component
│   └── lib/                 # Utilities and helpers
│       ├── api.ts                 # API client for Edge Functions
│       ├── types.ts               # TypeScript type definitions
│       └── templateHelpers.ts     # Variable extraction/replacement
├── supabase/
│   ├── schema.sql           # Database schema
│   ├── seed.sql             # Opportunity seed data
│   ├── seed-templates.sql   # Template seed data
│   ├── storage.sql          # Storage buckets configuration
│   └── functions/           # Edge Functions
│       ├── templates/              # CRUD operations
│       ├── templates-approve/      # Approve templates
│       ├── templates-preview/      # Preview with variables
│       ├── templates-versions/     # Version history
│       └── templates-use/          # Increment usage count
├── docs/
│   ├── database-schema.md   # Database documentation
│   └── template-library.md  # User guide for template system
├── package.json             # Dependencies
└── README.md                # This file
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Supabase account (or local Supabase instance)

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   Create `.env` file with Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Database Setup**

   Run the schema files in order:
   ```bash
   # In Supabase SQL Editor or local PostgreSQL:
   psql -f supabase/schema.sql
   psql -f supabase/storage.sql
   psql -f supabase/seed.sql
   psql -f supabase/seed-templates.sql
   ```

4. **Deploy Edge Functions**

   Using Supabase CLI:
   ```bash
   supabase functions deploy templates
   supabase functions deploy templates-approve
   supabase functions deploy templates-preview
   supabase functions deploy templates-versions
   supabase functions deploy templates-use
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```

## Database Schema

### Templates Table
Stores template content with metadata.

**Key Fields:**
- `id` - UUID primary key
- `title` - Template name
- `category` - Template category (company_info, safety, etc.)
- `content` - Rich text content with variable placeholders
- `variables` - JSONB array of detected variable names
- `tags` - Array of searchable tags
- `status` - draft | approved | archived
- `version` - Version number (auto-incremented on updates)
- `usage_count` - Number of times used in bids

### Template Versions Table
Stores version history for templates.

**Key Fields:**
- `template_id` - References templates table
- `version` - Version number
- `content` - Content snapshot at this version
- `change_notes` - Description of changes
- `created_at` - When this version was created

## API Endpoints

All Edge Functions are located at `${SUPABASE_URL}/functions/v1/`

### GET /templates
List templates with optional filters.

**Query Parameters:**
- `category` - Filter by category
- `status` - Filter by status (default: approved)
- `tags` - Comma-separated tag list
- `search` - Full-text search

**Response:** Array of Template objects

### GET /templates/{id}
Get single template by ID.

**Response:** Template object

### POST /templates
Create new template.

**Body:**
```json
{
  "title": "Company Overview",
  "category": "company_info",
  "content": "<p>{COMPANY_NAME} is...</p>",
  "tags": ["company", "overview"],
  "status": "draft"
}
```

**Response:** Created Template object

### PUT /templates/{id}
Update existing template. Creates version snapshot first.

**Body:**
```json
{
  "title": "Updated Title",
  "content": "<p>New content...</p>",
  "change_notes": "Updated for 2025"
}
```

**Response:** Updated Template object

### POST /templates-approve/{id}
Approve a template (changes status to 'approved').

**Body:**
```json
{
  "approver": "Phil"
}
```

### POST /templates-preview/{id}
Preview template with variable substitution.

**Body:**
```json
{
  "variables": {
    "PROJECT_NAME": "Roof Replacement",
    "AGENCY": "Department of Veterans Affairs"
  }
}
```

**Response:**
```json
{
  "template_id": "...",
  "processed_content": "<p>Content with variables replaced...</p>",
  "missing_variables": ["CONTRACT_VALUE"]
}
```

### GET /templates-versions/{id}
Get version history for a template.

**Response:**
```json
{
  "template_id": "...",
  "current_version": 3,
  "versions": [...]
}
```

### POST /templates-use/{id}
Increment template usage count.

## Variable System

### Variable Syntax
Variables use the format: `{VARIABLE_NAME}`

**Rules:**
- Must be UPPERCASE
- Use underscores for spaces
- Letters, numbers, underscores only
- Must start with a letter

**Examples:**
- ✅ `{PROJECT_NAME}`
- ✅ `{AGENCY}`
- ✅ `{CONTRACT_VALUE}`
- ❌ `{project_name}` (lowercase)
- ❌ `{123}` (starts with number)

### Standard Variables

**Project Info:**
- `{PROJECT_NAME}` - Project title
- `{SOLICITATION_NUMBER}` - RFP/IFB number
- `{AGENCY}` - Government agency
- `{LOCATION}` - Project location
- `{CONTRACT_VALUE}` - Estimated value

**Company Info:**
- `{COMPANY_NAME}` - C2C Restoration LLC
- `{OWNER_NAME}` - Phil Wright
- `{ESTIMATOR_NAME}` - Blake Harkcom
- `{CERTIFICATIONS}` - SDVOSB, VBE

See full list in `/docs/template-library.md`

### Auto-Population
When templates are used within an opportunity context (future feature), variables automatically populate from the opportunity data.

## Usage Guide

### Creating a Template

1. Click "Create New Template"
2. Enter title and select category
3. Add tags for searchability
4. Write content using rich text editor
5. Insert variables using Variable Helper or type manually
6. Save as Draft
7. Have Phil approve when ready

### Using a Template

1. Search/filter to find template
2. Click "Preview"
3. Fill in variable values
4. Review populated content
5. Click "Use This Template" (future: auto-insert into bid)

### Managing Templates

**Editing:**
- Click "Edit" on template card
- Make changes
- Add change notes
- Save (creates new version)

**Approving:**
- Click "Approve" (Phil only)
- Status changes to "approved"

**Archiving:**
- Click "Archive"
- Soft-deletes template (can be restored)

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Deployment

### Frontend
Deploy to Vercel, Netlify, or any static hosting:
```bash
npm run build
# Deploy /dist folder
```

### Database Migrations
When updating schema:
1. Update `supabase/schema.sql`
2. Test locally
3. Apply to production Supabase instance
4. Update version in schema comments

### Edge Functions
Deploy using Supabase CLI:
```bash
supabase functions deploy [function-name]
```

## Roadmap

### Phase 1: Template Library ✅
- [x] Database schema
- [x] Edge Functions API
- [x] React components
- [x] Rich text editor
- [x] Variable system
- [x] Search & filter
- [x] Version control
- [x] Approval workflow

### Phase 2: Bid Integration (Planned)
- [ ] Integrate with AnalysisResults component
- [ ] Auto-populate variables from opportunity data
- [ ] Insert templates into bid response
- [ ] Template suggestions based on opportunity

### Phase 3: Advanced Features (Future)
- [ ] Auto-draft complete proposals
- [ ] Export to Word documents
- [ ] Template duplication ("Save As")
- [ ] Version diff viewer
- [ ] Template analytics (win rate)
- [ ] Multi-user collaboration
- [ ] AI-powered template suggestions

## Support

For questions or issues:
- **User Guide:** `/docs/template-library.md`
- **Database Schema:** `/docs/database-schema.md`
- **Technical Issues:** Create GitHub issue

## License

Proprietary - C2C Restoration LLC

---

*Built for C2C Restoration to streamline government bid response preparation.*
