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

## Current Priority

1. Filter-required data loading
2. Aggregation-based pagination
3. Index optimization (NEXT STEP)
4. Comment modal workflow
5. UI polish