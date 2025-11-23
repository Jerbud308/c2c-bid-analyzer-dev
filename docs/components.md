# Frontend Components Documentation

## Overview

This document describes the React component architecture for the C2C Bid Analyzer frontend application.

## Technology Stack

- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Routing:** React Router v6
- **Styling:** TailwindCSS
- **Icons:** lucide-react
- **Date Handling:** date-fns
- **Backend:** Supabase (PostgreSQL + Storage)

## Component Hierarchy

```
App
├── Layout (wrapper for all pages)
│   ├── Header
│   ├── Main Content (children)
│   └── Footer
│
├── Routes
│   ├── / → BidUpload
│   ├── /processing/:opportunityId → ProcessingStatus
│   └── /analysis/:opportunityId → AnalysisResults
│       └── Multiple CollapsibleSection instances
```

## Core Components

### 1. Layout

**Location:** `src/components/Layout.tsx`

**Purpose:** Provides consistent page structure with header and footer.

**Props:**
```typescript
interface LayoutProps {
  children: ReactNode
}
```

**Features:**
- Sticky header with logo and title
- Max-width container for content
- Footer with copyright

**Styling:**
- Uses Tailwind utility classes
- Responsive padding and margins
- Gray background (#f9fafb)

---

### 2. BidUpload

**Location:** `src/components/BidUpload.tsx`

**Purpose:** File upload interface for bid documents.

**State:**
```typescript
const [file, setFile] = useState<File | null>(null)
const [dragActive, setDragActive] = useState(false)
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
const [success, setSuccess] = useState<{ opportunityId: string; message: string } | null>(null)

// Form fields
const [solicitationNumber, setSolicitationNumber] = useState('')
const [title, setTitle] = useState('')
const [agency, setAgency] = useState('')
```

**Features:**
- Drag-and-drop file zone with visual feedback
- File type validation (PDF only)
- File size validation (<50MB)
- Form inputs: solicitation_number (optional), title (required), agency (optional)
- Upload button disabled until file + title provided
- Loading state with spinner
- Success state with navigation options
- Error alerts

**API Integration:**
- Calls `uploadBid()` from `src/lib/api.ts`
- On success, shows success screen with "View Status" and "Upload Another" buttons
- "View Status" navigates to `/processing/:opportunityId`

**Responsive:**
- Stacks form elements vertically on mobile
- Full-width buttons on mobile

---

### 3. ProcessingStatus

**Location:** `src/components/ProcessingStatus.tsx`

**Purpose:** Shows real-time processing status with polling.

**Props:**
```typescript
// From route params
const { opportunityId } = useParams<{ opportunityId: string }>()
```

**State:**
```typescript
const [status, setStatus] = useState<StatusResponse | null>(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
```

**Features:**
- Auto-polls `checkStatus()` every 5 seconds
- Stops polling when status='completed' or 'failed'
- Visual progress stages (stepper UI):
  - Stage 1: Document Uploaded (always green checkmark)
  - Stage 2: OCR Text Extraction (spinner when active, checkmark when done)
  - Stage 3: AI Analysis (spinner when active, checkmark when done)
- Progress bar showing completion_percent
- Estimated time remaining calculation
- Auto-redirect to `/analysis/:opportunityId` when ready_for_review=true (after 2s delay)
- Failed state with error message and "Try Again" button

**Stage Logic:**
```typescript
const getStageStatus = (stageName: string): 'completed' | 'active' | 'pending' => {
  // Returns status based on processing_status field
}
```

**Responsive:**
- Progress bar scales to container width
- Stages stack vertically with consistent spacing

---

### 4. AnalysisResults

**Location:** `src/components/AnalysisResults.tsx`

**Purpose:** Displays complete AI analysis results.

**Props:**
```typescript
// From route params
const { opportunityId } = useParams<{ opportunityId: string }>()
```

**State:**
```typescript
const [data, setData] = useState<AnalysisResponse | null>(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
```

**Features:**
- Fetches `getAnalysis()` on mount
- Loading skeleton while fetching

**Sections:**

1. **Header**
   - Title (h1)
   - Metadata: solicitation_number, agency, location, deadline
   - Fit score badge (circular, color-coded)
   - Confidence indicator

2. **Red Flags Alert** (if any)
   - Red alert box with warning icon
   - List of red flags
   - Always visible when present

3. **Scope Summary**
   - Always expanded
   - Full text display (whitespace preserved)

4. **Technical Requirements** (CollapsibleSection)
   - Category badges (blue)
   - Requirement text
   - Reference section (gray text)
   - Gray background cards

5. **Submission Requirements** (CollapsibleSection)
   - Checkmark icons
   - Item name (bold)
   - Format and due date

6. **Qualifications Required** (CollapsibleSection, default expanded)
   - Status icons: ✓ (green), ⚠ (yellow), ✗ (red)
   - Type badges
   - Color-coded backgrounds by status

7. **Timeline & Schedule** (CollapsibleSection)
   - Grid: start_date, duration
   - Milestones as bulleted list

8. **Insurance & Bonding** (CollapsibleSection)
   - Grid of key-value pairs
   - Shows GL, WC, PL, bonding info

9. **Pricing Structure** (CollapsibleSection)
   - Structure type
   - Line items (bulleted)
   - Payment terms

10. **Site Conditions** (CollapsibleSection)
    - Text descriptions

11. **Questions Flagged** (CollapsibleSection, default expanded)
    - Yellow background cards
    - Numbered list
    - Priority ordering (high → low)

12. **Action Buttons**
    - "Mark as: Pursue" (green, ThumbsUp icon)
    - "Mark as: Pass" (gray, ThumbsDown icon)
    - Full width on mobile, side-by-side on desktop

13. **Footer**
    - Page count
    - Processing date

**Helper Functions:**
```typescript
getFitScoreColor(score: number | null): string
getConfidenceBadgeColor(confidence: string | null): string
getQualificationIcon(status: string): ReactNode
getQualificationBgColor(status: string): string
formatDeadline(deadline: string | null): string
```

**Responsive:**
- Header stacks vertically on mobile
- Fit score moves below title on mobile
- Grid layouts become single column on mobile
- Buttons stack on mobile

---

### 5. CollapsibleSection

**Location:** `src/components/CollapsibleSection.tsx`

**Purpose:** Reusable expandable/collapsible section container.

**Props:**
```typescript
interface CollapsibleSectionProps {
  title: string
  icon: ReactNode
  count?: number
  defaultExpanded?: boolean
  children: ReactNode
}
```

**State:**
```typescript
const [expanded, setExpanded] = useState(defaultExpanded)
```

**Features:**
- Clickable header with icon, title, count badge
- Chevron icon indicating state (up/down)
- Smooth CSS transition for expand/collapse
- Accessible (aria-expanded attribute)

**Styling:**
- Border and rounded corners
- Gray background on header
- Hover state on header
- Content padding when expanded

---

## API Library

### Location: `src/lib/api.ts`

**Functions:**

1. **uploadBid(file: File, metadata: {...}): Promise<UploadResponse>**
   - Validates file type and size
   - Uploads to Supabase storage
   - Creates opportunity record
   - Returns opportunityId

2. **checkStatus(opportunityId: string): Promise<StatusResponse>**
   - Fetches current opportunity status
   - Used for polling

3. **getAnalysis(opportunityId: string): Promise<AnalysisResponse>**
   - Fetches opportunity + analysis + all related data
   - Parallel fetches for performance
   - Returns complete analysis object

4. **updateOpportunityStatus(opportunityId: string, status: string): Promise<void>**
   - Updates opportunity status (for future "Pursue"/"Pass" buttons)

---

## Type Definitions

### Location: `src/types/index.ts`

**Database Types:**
- `Opportunity`
- `Analysis`
- `TechnicalRequirement`
- `SubmissionRequirement`
- `Qualification`
- `Timeline`
- `Insurance`
- `Pricing`
- `SiteCondition`
- `Question`

**API Response Types:**
- `UploadResponse`
- `StatusResponse`
- `AnalysisResponse`

---

## Styling Approach

### TailwindCSS Configuration

**Custom Colors:**
- `primary`: Blue (#2563eb)
- `success`: Green (#16a34a)
- `warning`: Yellow (#eab308)
- `danger`: Red (#dc2626)

Each color has shades from 50-900 for flexibility.

**Custom Animations:**
- `spin-slow`: 3s spin
- `pulse-slow`: 3s pulse

**Fonts:**
- Sans: System font stack
- Mono: SFMono, Consolas, etc.

### Custom CSS Classes

**Location:** `src/index.css`

- `.collapsible-content`: Smooth expand/collapse
- `.drop-zone`: File upload hover effects
- `.skeleton`: Loading placeholder animation
- `.scrollbar-thin`: Custom scrollbar styling

---

## Responsive Breakpoints

**TailwindCSS default breakpoints:**
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

**Usage:**
- Most layouts stack vertically below `sm`
- Two-column grids appear at `sm` breakpoint
- Header logo/title inline at `lg` breakpoint
- Max content width: 1280px (7xl)

---

## Accessibility

**Semantic HTML:**
- `<header>`, `<main>`, `<footer>`
- `<button>` for clickable elements
- `<nav>` (if needed in future)

**ARIA Labels:**
- `aria-expanded` on collapsible sections
- Descriptive button labels
- Form labels for all inputs

**Keyboard Navigation:**
- All interactive elements focusable
- Focus states visible (blue outline ring)
- Tab order follows visual order

**Color Contrast:**
- WCAG AA compliant
- Status indicators use both color and icons
- Text colors chosen for readability

---

## State Management

**Current Approach:**
- Component-level state with `useState`
- No global state management (Redux, Zustand, etc.)
- API calls in `useEffect` hooks
- Data passed via route params (`useParams`)

**Future Considerations:**
- If app grows, consider Context API for shared state
- React Query for API caching and synchronization
- Form libraries (React Hook Form) for complex forms

---

## Error Handling

**API Errors:**
- Try-catch blocks in all API calls
- Error messages displayed in red alert boxes
- User-friendly error text
- Option to retry (navigate back or refresh)

**Loading States:**
- Skeleton screens for initial loads
- Spinners for in-progress actions
- Disabled buttons during async operations

**Validation:**
- Client-side file validation (type, size)
- Required field validation (title)
- Visual feedback for invalid states

---

## Performance Optimizations

1. **Code Splitting:**
   - Vite automatically splits by route
   - Lazy loading not needed (small app)

2. **Image/Icon Optimization:**
   - SVG icons (lucide-react) are tree-shaken
   - No large images to optimize

3. **API Calls:**
   - Parallel fetches in `getAnalysis()`
   - Polling stops when complete/failed
   - No unnecessary re-renders

4. **CSS:**
   - Tailwind purges unused styles in production
   - CSS animations use GPU-accelerated properties

---

## Development Workflow

**Start Dev Server:**
```bash
npm run dev
```
Opens at http://localhost:5173

**Build for Production:**
```bash
npm run build
```
Output: `dist/` folder

**Preview Production Build:**
```bash
npm run preview
```

**Linting:**
```bash
npm run lint
```

**Formatting:**
```bash
npm run format
```

---

## Environment Variables

**Required:**
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key

**Setup:**
1. Copy `.env.example` to `.env`
2. Fill in Supabase credentials
3. Never commit `.env` to git

---

## Testing Considerations

**Not Yet Implemented:**
- Unit tests (Vitest)
- Component tests (React Testing Library)
- E2E tests (Playwright)

**Future Testing:**
- Test file upload flow
- Test status polling
- Test error states
- Test responsive layouts
- Test accessibility (axe-core)

---

## Browser Support

**Modern Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Not Supported:**
- Internet Explorer (any version)

**Why:**
- Uses ES2020 features
- CSS Grid and Flexbox
- Fetch API
- Modern JavaScript syntax

---

## File Structure

```
c2c-bid-analyzer-dev/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── .env.example
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx (entry point)
│   ├── App.tsx (router setup)
│   ├── index.css (global styles)
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── BidUpload.tsx
│   │   ├── ProcessingStatus.tsx
│   │   ├── AnalysisResults.tsx
│   │   └── CollapsibleSection.tsx
│   ├── lib/
│   │   ├── supabase.ts (Supabase client)
│   │   └── api.ts (API functions)
│   └── types/
│       └── index.ts (TypeScript types)
└── docs/
    ├── database-schema.md
    └── components.md (this file)
```

---

## Next Steps / Future Enhancements

1. **Authentication:**
   - Add Supabase Auth for user accounts
   - Restrict access to analysis results
   - User-specific bid lists

2. **Dashboard:**
   - List all opportunities
   - Filter by status
   - Search functionality

3. **Collaboration:**
   - Comments on analysis
   - Share results via link
   - Team notifications

4. **Advanced Features:**
   - Export analysis as PDF
   - Compare multiple bids
   - Deadline reminders
   - Custom scoring criteria

5. **Backend Processing:**
   - Implement OCR worker
   - Implement AI analysis worker
   - Handle large files (streaming)

---

## Contact / Support

For questions about this frontend implementation, refer to:
- This documentation
- Inline code comments
- Supabase documentation: https://supabase.com/docs
- React documentation: https://react.dev
- TailwindCSS documentation: https://tailwindcss.com

---

*Last updated: 2024*
