# Opportunities Dashboard - User Guide

## Overview

The Opportunities Dashboard is the central hub for managing all government contract opportunities. It provides a comprehensive view of your entire bid pipeline, allowing Phil and the team to efficiently track, filter, and manage opportunities from discovery through award.

---

## Features

### 1. Dashboard Metrics

At the top of the dashboard, three key metrics provide an at-a-glance overview:

- **Total Opportunities**: The total number of opportunities currently in your pipeline
- **Average Fit Score**: The average AI-calculated fit score across all analyzed opportunities (0-100 scale)
- **Urgent**: Number of opportunities with deadlines in the next 7 days (requires immediate attention)

### 2. Filters

The filter panel allows you to narrow down opportunities based on multiple criteria:

#### Search
- Full-text search across:
  - Opportunity title
  - Solicitation number
  - Agency name
- Auto-debounced (500ms delay) to avoid excessive requests

#### Status Filter
Filter by workflow status:
- **New**: Just discovered, not yet analyzed
- **Analyzing**: AI processing in progress
- **Reviewed**: Analysis complete, awaiting decision
- **Bidding**: Actively preparing bid response
- **Submitted**: Bid submitted to agency
- **Won**: Contract awarded to C2C
- **Lost**: Contract awarded to competitor
- **Pass**: Decision made not to bid

#### NAICS Code Filter
Filter by industry classification:
- **238160**: Roofing Contractors
- **238310**: Drywall and Insulation Contractors
- **236220**: Commercial and Institutional Building Construction
- **236118**: Residential Remodelers
- **238210**: Electrical Contractors
- **562910**: Remediation Services (Asbestos)

#### Set-Aside Type Filter
Filter by contract set-aside designation:
- **SDVOSB**: Service-Disabled Veteran-Owned Small Business
- **8(a)**: Small Disadvantaged Business
- **HUBZone**: Historically Underutilized Business Zone
- **WOSB**: Women-Owned Small Business
- **None**: Open competition

#### Deadline Range
- **From Date**: Show opportunities with deadlines on or after this date
- **To Date**: Show opportunities with deadlines on or before this date

#### Fit Score Range
- **Min Score**: Minimum fit score (0-100)
- **Max Score**: Maximum fit score (0-100)
- Only shows opportunities that have been analyzed (have a fit score)

#### Filter Management
- **Active Filter Badge**: Shows count of active filters
- **Clear All**: Remove all active filters at once
- **Collapse/Expand**: Toggle filter panel visibility (useful on mobile)

### 3. Sorting and View Options

#### Sort Controls
Sort opportunities by:
- **Deadline**: Submission deadline (default: ascending for active bids)
- **Fit Score**: AI-calculated match score (default: descending, highest first)
- **Created Date**: When opportunity was added to system
- **Updated Date**: Last modification timestamp
- **Status**: Alphabetical by status

Toggle between:
- **Ascending** (↑): Oldest/lowest first
- **Descending** (↓): Newest/highest first

#### View Modes

**Table View** (default)
- Dense, information-rich layout
- Sortable columns
- Best for desktop use
- Easy to compare multiple opportunities side-by-side

**Card View**
- Visual, card-based layout
- Better for mobile/tablet
- Easier to scan key information
- Shows deadline countdown prominently

### 4. Table View Features

#### Columns
1. **Checkbox**: Select for bulk actions
2. **Solicitation Number**: Government ID for the opportunity
3. **Title**: Opportunity title (bold, clickable)
4. **Agency**: Issuing agency (truncated with tooltip)
5. **Deadline**: Submission deadline with urgency color coding:
   - **Red**: < 7 days (urgent)
   - **Yellow**: 7-30 days (warning)
   - **Gray**: > 30 days (normal)
   - Shows "X days remaining" for upcoming deadlines
6. **Fit Score**: AI-calculated score (0-100) with color-coded badge:
   - **Green**: 80+ (excellent fit)
   - **Yellow**: 60-79 (good fit)
   - **Red**: < 60 (poor fit)
7. **Status**: Current workflow status badge
8. **Actions**: Quick action buttons (View, etc.)

#### Interactions
- **Click Row**: Navigate to full analysis page
- **Click Checkbox**: Select/deselect individual opportunity
- **Click Header**: Sort by that column
- **Hover Row**: Highlight effect

### 5. Card View Features

Each card displays:
- **Title**: Bold, 2-line truncation
- **Agency + Location**: Small text below title
- **Deadline Countdown**: "X days remaining" with urgency color
- **Fit Score Badge**: Large, prominent display
- **Status Badge**: Current status
- **Estimated Value**: Contract value (if available)
- **Checkbox**: Top-right corner for selection

**Click card** to navigate to full analysis.

### 6. Bulk Actions

When one or more opportunities are selected, a fixed action bar appears at the bottom of the screen.

#### Available Actions

**Change Status**
- Dropdown menu with all status options
- Updates all selected opportunities to chosen status
- Common bulk status changes:
  - Mark multiple as "Reviewed" after team review
  - Move multiple to "Pass" after bid/no-bid decision
  - Update to "Bidding" when actively working on submissions

**Mark as Pass**
- Quick action to mark opportunities as "Pass"
- Use when deciding not to pursue opportunities

**Export**
- **CSV**: Export selected opportunities to CSV file
- **Excel**: Export selected opportunities to Excel format
- Exported file includes:
  - Solicitation Number
  - Title
  - Agency
  - Location
  - NAICS Code
  - Set-Aside Type
  - Posted Date
  - Deadline
  - Estimated Value
  - Fit Score
  - Status

**Delete**
- Permanently removes opportunities from database
- **Warning**: This action cannot be undone
- Cascades to delete all related documents and analysis
- Confirmation dialog required

#### Selection Management
- **X items selected**: Shows count of selected opportunities
- **Clear selection**: Deselect all at once

### 7. Pagination

When results exceed page limit (default: 20 items):
- **Previous/Next**: Navigate between pages
- **Page Numbers**: Jump directly to specific page
- **Results Count**: Shows total matching opportunities

---

## Keyboard Shortcuts

### Planned Shortcuts (Future Enhancement)
- **/** (slash): Focus search input
- **Esc**: Clear selection
- **Arrow Keys**: Navigate table rows
- **Enter**: Open selected opportunity

---

## Workflow Examples

### Example 1: Find High-Priority Opportunities

1. Click **Filters**
2. Set **Fit Score Min**: 80
3. Set **Deadline To**: 30 days from today
4. Set **Status**: New, Reviewing
5. **Sort by**: Deadline (ascending)
6. Review list of high-fit, upcoming opportunities

### Example 2: Bulk Review New Opportunities

1. Set **Status Filter**: New
2. Review each opportunity
3. **Select** opportunities worth pursuing (checkbox)
4. Click **Change Status** → **Reviewed**
5. Remaining "New" opportunities can be marked "Pass"

### Example 3: Export Active Bids Report

1. Set **Status Filter**: Bidding, Submitted
2. Select all (checkbox in table header)
3. Click **Export** → **Excel**
4. Share file with team for weekly bid review meeting

### Example 4: Monitor Urgent Deadlines

1. Look at **Urgent** metric card (shows deadlines < 7 days)
2. Set **Deadline To**: 7 days from today
3. **Sort by**: Deadline (ascending)
4. Review red-highlighted deadlines
5. Assign team members or update status as needed

---

## Tips and Best Practices

### For Phil (Owner)

1. **Daily Check**: Review "Urgent" metric each morning
2. **Weekly Review**: Filter by Status="Reviewed" to make bid/no-bid decisions
3. **Pipeline Health**: Monitor Average Fit Score to ensure quality opportunities
4. **Quick Export**: Export "Bidding" status for team standup meetings

### For Team Members

1. **Use Filters**: Don't scroll through everything—filter to your assigned areas
2. **Save Time**: Use Card View on mobile/tablet for quick reviews
3. **Bulk Actions**: Select multiple similar opportunities and change status together
4. **Search**: Use search for specific solicitation numbers or agencies you track

### General

1. **Keep Status Updated**: Ensures accurate pipeline metrics
2. **Use Fit Score**: Trust the AI—focus on opportunities scoring 70+
3. **Watch Deadlines**: Red deadlines (<7 days) require immediate action
4. **Regular Cleanup**: Periodically delete or mark as "Pass" to keep dashboard clean

---

## Troubleshooting

### Dashboard is Slow
- **Reduce page size**: Set limit to 10 or 15 instead of 20
- **Use more filters**: Narrow down results to improve performance
- **Clear old opportunities**: Delete or archive past-deadline opportunities

### No Results Showing
- **Check filters**: Click "Clear All Filters" to reset
- **Verify data**: Navigate to Upload page to add opportunities

### Export Not Working
- **Check selection**: Ensure opportunities are selected (or filters are set)
- **File permissions**: Ensure browser allows downloads
- **Try CSV**: If Excel fails, try CSV format instead

### Bulk Actions Failed
- **Refresh page**: Click Refresh button and try again
- **Reduce selection**: Try updating fewer opportunities at once
- **Check network**: Ensure stable internet connection

---

## Data Freshness

- **Auto-refresh**: Dashboard does NOT auto-refresh
- **Manual refresh**: Click "🔄 Refresh" button to reload data
- **Real-time updates**: Changes from bulk actions reflect immediately
- **Filter changes**: Automatically trigger new data fetch (debounced 500ms)

---

## Mobile Responsiveness

The dashboard is optimized for mobile devices:

- **Filters**: Collapse into expandable drawer on mobile
- **Metrics**: Stack vertically on small screens
- **Table**: Horizontal scroll on narrow screens
- **Card View**: Recommended for mobile (single column)
- **Bulk Actions**: Fixed bar stays at bottom (accessible while scrolling)

---

## Future Enhancements

Planned features:
- **Saved Filter Presets**: "High Priority", "Needs Review", "Active Bids"
- **Status Update Modal**: Add notes when changing status (e.g., "Why passing?")
- **Quick Actions Menu**: View Analysis, Download Docs, Change Status, Delete
- **Keyboard Navigation**: Full keyboard shortcut support
- **Auto-refresh**: Optional auto-refresh every X minutes
- **Email Notifications**: Alerts for urgent deadlines
- **Drag-and-Drop**: Reorder opportunities manually
- **Custom Views**: Save personal dashboard configurations

---

## Related Documentation

- [Database Schema](./database-schema.md) - Technical details of data model
- [API Documentation](./api-docs.md) - Edge Functions and endpoints *(coming soon)*
- [Analysis View Guide](./analysis-view.md) - Detailed opportunity analysis *(coming soon)*

---

**Last Updated**: 2025-01-23
**Version**: 1.0
**Contact**: C2C Restoration Team
