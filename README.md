# C2C Restoration - Government Bid Analyzer

A comprehensive platform for managing government contract opportunities, featuring AI-powered bid analysis, document processing, and pipeline management.

## Features

### ✅ Implemented

- **Opportunities Dashboard**: Full pipeline view with filtering, sorting, and search
- **Metrics Overview**: Total opportunities, average fit score, urgent deadlines
- **Advanced Filtering**: By status, NAICS code, set-aside type, deadline range, and fit score
- **Multiple Views**: Table and card layouts for desktop and mobile
- **Bulk Actions**: Update status, delete, and export multiple opportunities
- **Export Functionality**: Export to CSV or Excel
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Database Schema**: Complete Supabase PostgreSQL schema with RLS
- **API Layer**: Supabase Edge Functions for all operations

### 🚧 Coming Soon

- Upload page for new opportunities
- PDF document processing with OCR
- AI-powered bid analysis
- Detailed analysis view
- Bid/No-bid checklist
- Email notifications for urgent deadlines

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Storage**: Supabase Storage (for PDF documents)
- **AI/OCR**: To be integrated (OpenAI GPT-4, Tesseract)

## Project Structure

```
c2c-bid-analyzer-dev/
├── src/
│   ├── components/          # React components
│   │   ├── OpportunitiesDashboard.tsx
│   │   ├── DashboardMetrics.tsx
│   │   ├── OpportunityFilters.tsx
│   │   ├── OpportunityTable.tsx
│   │   ├── OpportunityCard.tsx
│   │   └── BulkActionBar.tsx
│   ├── hooks/               # Custom React hooks
│   │   └── useOpportunities.ts
│   ├── lib/                 # Utilities and types
│   │   ├── api.ts          # API client
│   │   └── types.ts        # TypeScript types
│   ├── App.tsx             # Main app with routing
│   ├── main.tsx            # React entry point
│   └── index.css           # Global styles
├── supabase/
│   ├── schema.sql          # Database schema
│   ├── seed.sql            # Sample data
│   ├── storage.sql         # Storage bucket setup
│   └── functions/          # Edge Functions
│       ├── opportunities/
│       ├── opportunities-bulk/
│       └── opportunities-export/
├── docs/
│   ├── database-schema.md  # Database documentation
│   └── dashboard.md        # Dashboard user guide
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Git

### 1. Clone Repository

```bash
git clone <repository-url>
cd c2c-bid-analyzer-dev
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get these from: Supabase Dashboard → Project Settings → API

### 4. Set Up Supabase Database

#### Option A: Via Supabase Dashboard

1. Go to SQL Editor
2. Paste contents of `supabase/schema.sql`
3. Click "Run"
4. Repeat for `supabase/storage.sql`
5. (Optional) Load sample data from `supabase/seed.sql`

#### Option B: Via CLI

```bash
supabase db reset
```

### 5. Deploy Supabase Edge Functions

```bash
# Deploy opportunities function
supabase functions deploy opportunities

# Deploy bulk operations function
supabase functions deploy opportunities-bulk

# Deploy export function
supabase functions deploy opportunities-export
```

### 6. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Usage

### Dashboard

Navigate to http://localhost:3000/dashboard (or just http://localhost:3000)

- View all opportunities in your pipeline
- Filter by status, NAICS code, deadline, fit score, etc.
- Sort by deadline, fit score, created date, etc.
- Switch between table and card views
- Select multiple opportunities for bulk actions
- Export to CSV or Excel

See [docs/dashboard.md](./docs/dashboard.md) for detailed usage guide.

### API Endpoints

All endpoints are Supabase Edge Functions:

#### GET /functions/v1/opportunities
List opportunities with filters and pagination

Query parameters:
- `status` - Filter by status (comma-separated)
- `naics_code` - Filter by NAICS (comma-separated)
- `set_aside_type` - Filter by set-aside
- `deadline_from` - Minimum deadline date
- `deadline_to` - Maximum deadline date
- `fit_score_min` - Minimum fit score (0-100)
- `fit_score_max` - Maximum fit score (0-100)
- `search` - Search in title, solicitation number, agency
- `sort` - Field to sort by
- `order` - Sort order (asc/desc)
- `page` - Page number
- `limit` - Items per page

#### PUT /functions/v1/opportunities/{id}/status
Update opportunity status

Body:
```json
{
  "status": "reviewed"
}
```

#### DELETE /functions/v1/opportunities/{id}
Delete opportunity (cascades to documents and analysis)

#### PUT /functions/v1/opportunities-bulk
Bulk update status

Body:
```json
{
  "opportunity_ids": ["uuid1", "uuid2"],
  "status": "pass"
}
```

#### GET /functions/v1/opportunities-export
Export opportunities to CSV or Excel

Query parameters: Same as list endpoint, plus:
- `format` - Export format (csv or excel)

## Database Schema

See [docs/database-schema.md](./docs/database-schema.md) for complete schema documentation.

Key tables:
- **opportunities**: Government contract opportunities
- **bid_documents**: Uploaded PDF documents
- **bid_analysis**: AI-generated analysis results

## Development Roadmap

### Phase 1: Dashboard (✅ Complete)
- [x] Database schema
- [x] Opportunities dashboard
- [x] Filtering and search
- [x] Bulk actions
- [x] Export functionality

### Phase 2: Document Upload (Next)
- [ ] Upload page UI
- [ ] PDF validation
- [ ] Supabase Storage integration
- [ ] Processing status tracking

### Phase 3: Document Processing
- [ ] OCR integration
- [ ] Text extraction
- [ ] Document parsing

### Phase 4: AI Analysis
- [ ] OpenAI GPT-4 integration
- [ ] Structured data extraction
- [ ] Fit score calculation
- [ ] Red flag detection

### Phase 5: Analysis View
- [ ] Detailed analysis page
- [ ] Bid/No-bid checklist
- [ ] Document viewer
- [ ] Notes and collaboration

### Phase 6: Enhancements
- [ ] Email notifications
- [ ] Saved filter presets
- [ ] Team assignment
- [ ] Calendar integration

## Contributing

This is a private project for C2C Restoration. For questions or issues, contact the development team.

## License

Proprietary - All rights reserved by C2C Restoration

---

**Last Updated**: 2025-01-23
**Version**: 1.0.0
**Status**: Phase 1 Complete
