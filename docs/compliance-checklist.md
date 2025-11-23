# Compliance Checklist System

## Overview

The Compliance Checklist system automatically generates trackable checklists from AI-analyzed government bid documents. This ensures that Blake and Phil never miss critical requirements when preparing bid submissions.

## Business Logic

Government bids typically have 20-50 requirements including:
- Forms to submit
- Certifications needed
- Technical specifications to meet
- Insurance and bonding requirements
- Pricing structures

The system automatically extracts these requirements from the AI analysis and creates a structured checklist that can be tracked, assigned, and exported.

## Features

### 1. Automatic Generation

After AI analysis completes, the system:
- Extracts requirements from multiple analysis sections
- Categorizes them appropriately
- Creates trackable checklist items
- Calculates initial completion status

### 2. Categorization

All items are categorized into:
- **Administrative**: Forms, submissions, procedural requirements
- **Technical**: Materials, certifications, technical specifications
- **Qualifications**: Experience, past performance, capabilities
- **Pricing**: Pricing structure, line items, payment terms
- **Certifications**: Bonds, special certifications
- **Insurance**: General liability, workers comp, etc.

### 3. Item Tracking

Each checklist item includes:
- **Description**: What needs to be done
- **Reference Section**: Where in the bid document it's mentioned
- **Status**: Not Started, In Progress, or Complete
- **Responsible Party**: Blake, Phil, or Unassigned
- **Notes**: Additional context or details
- **Source**: Where the requirement came from (analysis or custom)
- **Timestamps**: Created date and completion date

### 4. User Management

Users can:
- Check off completed items
- Assign items to team members
- Add custom items not caught by AI
- Delete custom items
- Add notes to any item
- Filter by status
- Collapse/expand categories

### 5. Progress Tracking

- Visual progress bar
- Completion percentage (X of Y items complete)
- Counts by status (Not Started, In Progress, Complete)
- Color-coded status indicators

### 6. Export Functionality

Checklists can be exported to:
- **PDF** (HTML format for printing): Formatted, print-ready document
- **Excel/CSV**: Spreadsheet format for external tracking

## Database Schema

### compliance_checklists Table

```sql
CREATE TABLE compliance_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  items JSONB DEFAULT '[]'::jsonb,
  custom_items JSONB DEFAULT '[]'::jsonb,
  UNIQUE(opportunity_id)
);
```

### Items Structure (JSONB)

```typescript
{
  id: string                    // UUID
  category: string              // Administrative|Technical|Qualifications|Pricing|Certifications|Insurance
  description: string           // "Submit Standard Form 1449"
  reference_section: string     // "Section 2.1"
  status: string                // not_started|in_progress|complete
  responsible_party: string     // Blake|Phil|null
  notes: string                 // Optional notes
  source: string                // submission_requirements|qualifications_required|technical_requirements|etc.
  created_at: string            // ISO timestamp
  completed_at: string          // ISO timestamp or null
}
```

## Edge Functions

### 1. generate-checklist

**Trigger**: Called automatically after AI analysis completes

**Input**:
```json
{
  "opportunityId": "uuid"
}
```

**Process**:
1. Fetches bid analysis data
2. Extracts requirements from:
   - `submission_requirements` → Administrative items
   - `qualifications_required` (only needs_verification/not_met) → Qualifications
   - `technical_requirements` (top 5 critical) → Technical
   - `insurance_bonding` → Insurance/Certifications items
   - `pricing_structure` → Pricing items
3. Adds standard items (prevailing wage check, bond quotes)
4. Upserts to compliance_checklists table

**Output**:
```json
{
  "success": true,
  "checklist_id": "uuid",
  "item_count": 23
}
```

### 2. get-checklist

**Method**: GET
**Endpoint**: `/functions/v1/get-checklist?opportunity_id={id}`

**Output**:
```json
{
  "checklist_id": "uuid",
  "opportunity_id": "uuid",
  "items": [...],
  "custom_items": [...],
  "completion_percentage": 45,
  "generated_at": "2025-01-15T10:30:00Z",
  "last_updated": "2025-01-15T14:20:00Z"
}
```

### 3. update-checklist-item

**Method**: POST
**Endpoint**: `/functions/v1/update-checklist-item`

**Input**:
```json
{
  "checklist_id": "uuid",
  "item_id": "uuid",
  "updates": {
    "status": "complete",
    "responsible_party": "Blake",
    "notes": "Completed and uploaded"
  }
}
```

**Process**:
- Finds item by ID in items or custom_items
- Applies updates
- Sets completed_at if status changed to complete
- Recalculates completion_percentage
- Updates last_updated timestamp

### 4. add-custom-checklist-item

**Method**: POST
**Endpoint**: `/functions/v1/add-custom-checklist-item`

**Input**:
```json
{
  "checklist_id": "uuid",
  "category": "Administrative",
  "description": "Get approval from project manager",
  "responsible_party": "Blake"
}
```

**Process**:
- Creates new item with status='not_started', source='custom'
- Appends to custom_items array
- Returns new item_id

### 5. delete-custom-checklist-item

**Method**: POST or DELETE
**Endpoint**: `/functions/v1/delete-custom-checklist-item`

**Input**:
```json
{
  "checklist_id": "uuid",
  "item_id": "uuid"
}
```

**Process**:
- Removes item from custom_items array
- Recalculates completion_percentage

### 6. export-checklist

**Method**: GET
**Endpoint**: `/functions/v1/export-checklist?checklist_id={id}&format={pdf|excel}`

**Output**: Blob (file download)

**Formats**:
- **PDF**: HTML document styled for printing
- **Excel**: CSV file with categories and all fields

## Frontend Components

### ComplianceChecklist

Main component that orchestrates the entire checklist UI.

**Props**:
```typescript
{
  opportunityId: string
}
```

**Features**:
- Fetches checklist on mount
- Real-time updates with optimistic UI
- Filter by status (All, Not Started, In Progress, Complete)
- Collapsible category sections
- Progress bar and completion stats
- Export buttons

### ChecklistItemRow

Displays a single checklist item with inline editing.

**Props**:
```typescript
{
  item: ChecklistItem
  onUpdate: (itemId: string, updates: Partial<ChecklistItem>) => void
  onDelete?: (itemId: string) => void
  readOnly?: boolean
}
```

**Features**:
- Status dropdown
- Assigned to dropdown
- Notes textarea (expandable)
- Delete button (custom items only)
- Visual status indicators

### AddCustomItemModal

Modal for adding custom checklist items.

**Props**:
```typescript
{
  isOpen: boolean
  onClose: () => void
  onSubmit: (item: CustomChecklistItem) => Promise<void>
}
```

**Form Fields**:
- Category (dropdown)
- Description (textarea)
- Assigned To (dropdown)

## API Client

Located in `src/lib/api.ts`, provides methods:

```typescript
// Get checklist for opportunity
getChecklist(opportunityId: string): Promise<ChecklistResponse>

// Update single item
updateChecklistItem(checklistId: string, itemId: string, updates: ChecklistItemUpdate): Promise<void>

// Add custom item
addCustomItem(checklistId: string, item: CustomChecklistItem): Promise<void>

// Delete custom item
deleteCustomItem(checklistId: string, itemId: string): Promise<void>

// Export checklist
exportChecklist(checklistId: string, format: 'pdf' | 'excel'): Promise<Blob>

// Trigger generation (usually automatic)
generateChecklist(opportunityId: string): Promise<void>
```

## Integration Points

### AI Analyzer Integration

In `supabase/functions/ai-analyzer/index.ts`, add at the end (before return):

```typescript
// Trigger checklist generation
fetch(`${supabaseUrl}/functions/v1/generate-checklist`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseKey}`
  },
  body: JSON.stringify({ opportunityId })
}).catch(err => console.error('Failed to generate checklist:', err))
```

### Analysis Results Integration

In the bid analysis results component, add:

```typescript
import ComplianceChecklist from './ComplianceChecklist'

// In component:
<ComplianceChecklist opportunityId={opportunityId} />
```

## Smart Extraction Algorithm

The system intelligently extracts requirements:

### From submission_requirements
- Creates 1 item per requirement
- Category: Administrative
- Includes format and due date if available

### From qualifications_required
- Only includes items with `c2c_status='needs_verification'` or `'not_met'`
- Category: Qualifications
- Adds note if status is 'not_met'

### From technical_requirements
- Filters for materials, certifications, specifications
- Takes top 5 critical items
- Category: Technical

### From insurance_bonding
- Creates separate item for each insurance type
- Formats as "Provide proof of [type]: [amount]"
- Category: Insurance or Certifications

### From pricing_structure
- Creates item for pricing structure type
- Creates item for line items if present
- Category: Pricing

### Standard Items
- Prevailing wage review (if applicable)
- Performance bond quote (if not already included)

## Usage Example

```typescript
import { ComplianceChecklist } from './components/ComplianceChecklist'

function BidDetailPage({ opportunityId }) {
  return (
    <div>
      <h1>Bid Analysis</h1>

      {/* Analysis details */}
      <AnalysisResults opportunityId={opportunityId} />

      {/* Compliance Checklist */}
      <div className="mt-8">
        <ComplianceChecklist opportunityId={opportunityId} />
      </div>
    </div>
  )
}
```

## Accessibility

- Keyboard navigation for all controls
- ARIA labels on interactive elements
- Focus management in modal
- Screen reader friendly status indicators

## Mobile Responsiveness

- Responsive layout adapts to mobile screens
- Touch-friendly controls
- Collapsible sections to save space
- Optimized for tablet and phone usage

## Performance Considerations

- Optimistic UI updates for instant feedback
- Debounced API calls on rapid changes
- Lazy loading for large checklists
- Efficient JSONB queries in PostgreSQL

## Future Enhancements

- Real-time collaboration (multiple users)
- Checklist templates for common bid types
- Email notifications for assignments
- Integration with calendar for deadlines
- Attachment uploads for completed items
- Audit trail for all changes
- Bulk operations (assign all to user, mark category complete)

## Troubleshooting

### Checklist not generated
- Verify AI analysis completed successfully
- Check Edge Function logs for errors
- Ensure generate-checklist function has service_role key

### Items not updating
- Check browser console for API errors
- Verify SUPABASE_URL and SUPABASE_ANON_KEY are set
- Check RLS policies allow updates

### Export not working
- Verify blob download is allowed by browser
- Check CORS headers in Edge Function
- Ensure proper file permissions

## Support

For issues or questions, contact the development team or file an issue in the project repository.
