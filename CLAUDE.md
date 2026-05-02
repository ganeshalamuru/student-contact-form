# CLAUDE.md

## Project Overview

This is a web application that uses MongoDB as the database.

Primary purpose:
- Display student contact records from MongoDB
- Allow admins/users to add/view comment history per student
- Optionally append new student rows through forms

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

Use this structure:

/app
  /api/students/route.js
/components
  StudentTable.jsx
  StudentForm.jsx
/lib
  mongodb.js

Keep utilities in `/lib`.

---

## MongoDB Rules

Collection: students

- Always return `comments` as an array
- If missing, default to []
- Never overwrite comments
- Always append new comments

When updating comments:

Use MongoDB `$push`:

{
  $push: {
    comments: {
      text: "...",
      createdAt: new Date(),
      createdBy: "admin"
    }
  },
  $set: { updatedAt: new Date() }
}

---

## Required Features

### Read Rows

Fetch from MongoDB:

- Return all students
- Normalize comments field → []

---

### Append Rows

Insert new student:

- Validate required fields
- Prevent duplicate phone if possible
- Initialize:

comments: []

---

### Update Comments

Append new comment:

- Never overwrite existing comments
- Use `$push`
- Add timestamp

---

## API Routes

Implement:

GET /api/students
- Fetch all students
- Ensure comments array exists

POST /api/students
- Insert new student
- Initialize empty comments array

PATCH /api/students/:id

Input:
{
  "comment": "New follow-up text"
}

Server behavior:

- Validate non-empty comment
- Append to comments array using $push
- Add createdAt timestamp
- Return updated student

Use async/await.
Return proper status codes.

---

## Data Table Enhancements

The student table must support sorting on all columns.

Sortable columns:
- district
- name
- fathername
- phone
- group
- collegename
- State

Sorting rules:
- Click column header toggles: ascending -> descending -> none
- Strings sort alphabetically
- Numbers sort numerically

---

## Filters

Add filters for:

1. district
2. collegename
3. State

Filter UI requirements:
- Dropdown or searchable select
- Include "All" option
- Filters combine with search and sorting

---

## Comments Rules (Important)

Comments are stored as an array inside each student document.

Never overwrite previous comments.

Each comment:

{
  text,
  createdAt,
  createdBy (optional)
}

Display format:

[YYYY-MM-DD HH:mm] text

Order:
- Show oldest → newest (default)
- New comments appended at end

---

## Frontend UI Rules

Main table must support:

- Sorting
- Filtering
- Search
- Loading state
- Error state
- Empty state
- Pagination

Actions column:
- Uses three-dot menu
- Opens dropdown

Menu:

1. View/Add Comment

---

## Actions Column UI

Use overflow icon (⋮)

No text buttons.

Dropdown menu:
- View/Add Comment

---

## Pagination Rules

- 25 rows per page
- Page numbers at bottom
- Previous / Next buttons
- Highlight current page

---

## Pagination Behavior

Pagination must work with:

- Sorting
- Filters
- Search

Rules:

- Reset to page 1 on filter change
- Preserve page on sort

---

## Add Comment UX

Do not inline edit.

On action click:

Open modal:

- Show student info
- Show comment history (scrollable)
- Textarea for new comment

On save:

- Append new comment to array
- Close modal
- Refresh data
- Show success message

---

## Preferred Libraries

- shadcn/ui
- Headless UI
- Radix UI

---

## Coding Standards

- Add comment at top of each file
- Use clear naming
- Avoid duplication
- Validate inputs
- Handle errors properly

---

## Security Rules

- Never expose MongoDB URI client-side
- DB access only in server code
- No DB calls in React components

---

## Deployment Notes

- Works on Vercel / Node server
- Set env variables in deployment

---

## When Making Changes

1. Preserve schema
2. Do not break comments array
3. Maintain append-only behavior
4. Keep UI stable

---

## Preferred Output Style

- Full file code
- Ready to paste
- Production ready

---

## Current Priority

1. MongoDB integration
2. Comment history (array-based)
3. Three-dot actions menu
4. Pagination (25 rows/page)
5. Sorting + filters
6. Responsive UI