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
9. Comments

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

Comments is editable.
Other columns are read-only unless explicitly requested.

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
or equivalent
- Updates Comments only

Use async/await.
Return proper status codes.

---

## Frontend UI Rules

Build responsive UI.

Student table must support:

- Loading state
- Error state
- Empty state
- Search/filter
- Inline edit Comments
- Save button per row
- Success feedback

Use functional components only.
No class components.

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

Build dashboard first.
Authentication can come later.