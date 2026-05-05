# CLAUDE.md

## Project Overview

This is a web application that uses MongoDB as the database.

Primary purpose:
- Display student contact records from MongoDB
- Allow admins/users to add/view comment history per student
- Optionally append new student rows through forms

IMPORTANT:
- Data must NOT be loaded initially
- Data is only fetched after filters are selected

Database:
igrad

Collection:
students

Schema:

{
  _id: ObjectId,
  State: "",
  district: "",
  name: "",
  fathername: "",
  phone: NumberLong or string,
  group: "",
  collegename: "",
  comments: [
    {
      text: string,
      createdAt: Date,
      createdBy: string (optional)
    }
  ],
  createdAt: Date,
  updatedAt: Date
}

If `comments` field does not exist, treat it as an empty array.

---

## Tech Stack

- Next.js 14 (App Router preferred unless existing Pages Router)
- React functional components only
- Node.js runtime for API routes
- MongoDB (native driver or mongoose)
- Environment variables for secrets

---

## Environment Variables

Required in `.env.local`:

MONGODB_URI=
MONGODB_DB=igrad
MONGODB_COLLECTION=students

Never hardcode credentials.

---

## Project Structure

/app
  /api/students/route.js
/components
  StudentTable.jsx
  StudentForm.jsx
/lib
  mongodb.js

---

## MongoDB Rules

Collection: students

- Always return `comments` as an array
- If missing, default to []
- Never overwrite comments
- Always append new comments

---

## Pagination, Filtering, Search (CRITICAL)

All data operations MUST be handled in MongoDB.

Frontend MUST NOT:
- Fetch all documents
- Perform client-side pagination

---

### Query Requirements

Backend must support:

- Pagination → `skip` + `limit`
- Sorting → `sort`
- Filtering → `match`
- Search → `$regex` or `$text`

---

### FILTER REQUIRED RULE

API must NOT return data if filters are not applied.

At least ONE of the following must be present:

- district
- collegename
- State

If no filters:

Return:

{
  data: [],
  pagination: { total: 0 }
}

---

## API Routes

GET /api/students

Query params:

?page=1
&limit=25
&search=
&district=
&college=
&state=
&sort=name
&order=asc

---

### MongoDB Query Pattern (MANDATORY)

Use aggregation with `$facet`:

[
  { $match: query },

  {
    $facet: {
      data: [
        { $sort: { [sortField]: sortOrder } },
        { $skip: skip },
        { $limit: limit }
      ],
      totalCount: [
        { $count: "count" }
      ]
    }
  }
]

---

### Response Format

{
  data: [...],
  pagination: {
    total,
    page,
    limit,
    totalPages
  }
}

---

## Search Rules

Search must work across:

- name
- fathername
- collegename
- district
- State

Preferred:

Use `$text` if index exists

Fallback:

Use `$regex` (case-insensitive)

---

## Filters

Filters:

- district
- collegename
- State

Rules:

- Exact match filtering
- Combine with search
- Combine with sorting

---

## Indexing Rules (NEXT STEP)

Must create indexes:

db.students.createIndex({ district: 1 });
db.students.createIndex({ collegename: 1 });
db.students.createIndex({ State: 1 });
db.students.createIndex({ name: 1 });

Optional (recommended):

db.students.createIndex({
  name: "text",
  fathername: "text",
  collegename: "text",
  district: "text"
});


---

## Performance Rules

- Never scan full collection
- Always use indexes
- Always paginate
- Max limit: 100
- Default limit: 25

---

## Data Table Enhancements

Supports:

- Sorting (server-side)
- Filtering (server-side)
- Search (server-side)
- Pagination (server-side)

---

## Frontend Data Rules

Frontend MUST:

- Call API on:
  - filter change
  - search input
  - sort change
  - page change

Frontend MUST NOT:

- Fetch all students at once
- Show data before filters

---

## UI Behavior (IMPORTANT)

Initial state:

- Show empty state
- Message: "Select filters to view data"

---

## Pagination Rules

- 25 rows per page
- Page numbers at bottom
- Previous / Next buttons

Behavior:

- Reset to page 1 on filter change
- Preserve page on sort

---

## Comments Rules

Comments are stored as array.

Append-only:

{
  text,
  createdAt,
  createdBy
}

Never overwrite.

---

## Add Comment UX

- Trigger via three-dot menu
- Open modal
- Show history
- Add new comment

On save:

- Append comment
- Refresh data

---

## Actions Column UI

- Use ⋮ icon
- Dropdown:
  - View/Add Comment

---

## Security Rules

- No DB access in frontend
- MongoDB only in API routes
- Validate all inputs

---

## Coding Standards

- Async/await only
- Functional components only
- Clean structure
- Error handling mandatory

---

## Deployment Notes

- Works on Vercel / Node
- Set env vars

---

## When Making Changes

- Do not break query structure
- Do not remove pagination logic
- Do not bypass filters requirement
- Maintain performance rules

---

## Status Field (NEW Column)

Each student has a `status` field.

Allowed values:

- New (default)
- Follow Up (auto-managed)
- Interested
- Closed

---

### Default Behavior

- On creation → status = "New"
- If missing → treat as "New"

---

### Automatic Status Transition

When a comment is added:

- If current status = "New"
  → change to "Follow Up"

- If status is:
  - Interested
  - Closed

  → DO NOT change

---

### Manual Status Changes

User can manually set:

- Interested
- Closed

if the status is already one of above, manually changing is disabled

---

### Backend Enforcement Rules

- Status transition must happen in backend logic
- Do NOT rely on frontend for status updates
- Comment update must also handle status transition

---

### API Rules

PATCH /api/students/:id/status

Input:

{
  "status": "Interested"
}

Validation:

Allowed values:
- New
- Follow Up
- Interested
- Closed

Reject invalid values

---

### Staus Field UI Rules

- Show status column
- Use badge colors:

  New → gray  
  Follow Up → yellow  
  Interested → green  
  Closed → red
  
Status must NOT be editable via inline dropdown in table.

Status changes must be done via Actions menu (three-dot icon).

Each row must have:

Actions Menu (⋮):

- View/Add Comment
- Set Status → submenu

Submenu options:

- Interested
- Closed

Selecting a status:

- Calls backend API
- Updates status
- Refreshes row data
- Trigger backend API on change

---

### Query Rules

Status must support:

- Filtering

## Current Priority

1. Filter-required data loading (no initial fetch)
2. Server-side query system (pagination + search + filter + sort using MongoDB aggregation)
3. Index optimization for query performance (NEXT STEP)
4. Status system with automatic transitions (New → Follow Up on comment)
5. Comment history workflow (append-only, modal-based)
6. UI consistency (three-dot actions, status badges, pagination UX)
7. Error handling and input validation (API-level)
8. Performance stability under larger datasets