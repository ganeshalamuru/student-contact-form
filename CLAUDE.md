# CLAUDE.md

## Project Overview

This is a web application that uses Google Sheets as a serverless database.

Primary purpose:
- Display student contact records from Google Sheets
- Allow admins/users to update the Comments column
- Optionally append new student rows through forms

Google Sheet tab name:
Student Contact Form

Columns:
1. District
2. Student_Name
3. Father_Name
4. Mobile
5. Group
6. College_Name
7. Remarks
8. Date_time
9. Comments (shows latest comment with timestamp only, past comments can be viewed from actions column)

---

## Tech Stack

- Next.js 14 (App Router preferred unless existing Pages Router)
- React functional components only
- Node.js runtime for API routes
- googleapis package for Sheets integration
- Environment variables for secrets

---

## Environment Variables

Required in `.env.local`:

GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SHEET_ID=

Private key must be normalized:

process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')

Never hardcode credentials.

---

## Project Structure

Use this structure:

/app
  /api/students/route.js
/components
  StudentTable.jsx
  StudentForm.jsx
/lib
  sheets.js

Keep utilities in `/lib`.

---

## Google Sheets Rules

Use only the tab:

Student Contact Form

Always preserve column order.

Use existing Comments cell to store full history text.

When updating:

1. Read existing Comments cell
2. Append newline + new timestamped comment
3. Write updated full value back

Never clear old comments.


---

## Required Features

### Read Rows

Create helper:

getRows()

Should:
- Read all rows
- Return JSON objects with consistent keys
- Skip empty rows if needed

### Append Rows

Create helper:

appendRow(data)

Validate:
- Required fields present
- Mobile format reasonable
- Duplicate mobile prevention if possible

### Update Comments

Create helper:

updateComment(rowIndex, comment)

Only modify Comments column.

---

## API Routes

Implement:

GET /api/students
- Returns all rows

POST /api/students
- Adds new row

PATCH /api/students/:id

Now accepts:

{
  "comment": "New follow-up text"
}

Server behavior:

- Validate non-empty comment
- Read existing row comments
- Append timestamp
- Save merged history
- Return updated row

Use async/await.
Return proper status codes.

---

## Data Table Enhancements

The student table must support sorting on all columns.

Sortable columns:
- District
- Student_Name
- Father_Name
- Mobile
- Group
- College_Name
- Remarks
- Date_time
- Comments

Sorting rules:
- Click column header toggles: ascending -> descending -> none
- Strings sort alphabetically
- Dates sort chronologically
- Mobile sorts numerically when possible

---

## Filters

Add filters for:

1. District
2. College_Name

Filter UI requirements:
- Dropdown or searchable select
- Multi-select preferred if simple
- Include "All" option
- Filters work together
- Filters combine with search and sorting

---

## Comments Column Rules (Important)

The Comments column is a running history log, not a single editable value.

Never overwrite previous comments.

When a new comment is added, append it to existing Comments content with timestamp.

Format each entry as:

[YYYY-MM-DD HH:mm] New comment text

Example:

[2026-04-28 18:10] Called student, interested in CSE
[2026-04-29 09:20] Asked to call next week

Newest comment should append to bottom unless requested otherwise.

---

## Frontend UI Rules

Main table must support:

- Sorting on all columns
- Filter by District
- Filter by College_Name
- Search across text fields
- Loading state
- Error state
- Empty state
- Pagination optional

Actions column:

- View Comments
- Add Comment

Use modal for comment actions.

---

## Add Comment UX

Do not inline edit comments directly in table.

When user clicks Edit / Add Comment action:

- Open modal dialog
- Show student summary (name, mobile, district)
- Show previous comment history in scrollable area
- Textarea for new comment
- Save button
- Cancel button

On save:

- Append timestamped comment to history
- Update Google Sheet
- Close modal
- Refresh row data
- Show success message

---

## Preferred Libraries

Allowed:
- shadcn/ui
- Headless UI
- Radix UI
- Native dialog

Use lightweight solution.

---

## Coding Standards

- Add comment at top of each file explaining purpose
- Use clear variable names
- Avoid duplication
- Keep functions small
- Handle errors gracefully
- Validate inputs server-side

---

## Security Rules

Never expose private key client-side.

Google Sheets access must happen only in server code:
- API routes
- server actions
- backend utilities

Do not import googleapis into client components.

---

## Deployment Notes

Works on Vercel or any Node host.

Ensure env vars are configured in deployment dashboard.

---

## When Making Changes

Before changing code:

1. Understand current structure
2. Preserve working env config
3. Avoid breaking Sheets schema
4. Keep Comments editing functional

When uncertain, prefer minimal safe changes.

---

## Preferred Output Style

When generating code:

- Full file contents
- Ready to paste
- Production quality
- No placeholders unless requested


## Current Priority

- Stable sorting/filtering
- Comment history modal workflow
- Clean responsive dashboard
- Then optional auth/export