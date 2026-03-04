# Caissa Backend API Reference

This document is written for the **frontend developer**. It covers every endpoint, how authentication works, what every request and response looks like, and what to do when something goes wrong.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Base URL](#2-base-url)
3. [Authentication](#3-authentication)
4. [Rate Limiting](#4-rate-limiting)
5. [CORS](#5-cors)
6. [Response Format](#6-response-format)
7. [Endpoints](#7-endpoints)
   - [GET /](#get-)
   - [GET /modules](#get-modules)
   - [GET /modules/:id](#get-modulesid)
   - [GET /lessons/:id](#get-lessonsid)
   - [GET /progress](#get-progress)
   - [POST /progress](#post-progress)
8. [Error Reference](#8-error-reference)
9. [Full Auth Flow Example](#9-full-auth-flow-example)
10. [Common Problems & Fixes](#10-common-problems--fixes)

---

## 1. Overview

The Caissa backend is a REST API built with Node.js and Express. It serves data from a PostgreSQL database and protects user-specific routes using Supabase-issued JWTs.

**Public routes** (no login required):
- Reading modules and lessons

**Protected routes** (must be logged in):
- Reading and writing user progress

All request bodies must be JSON. All responses are JSON.

---

## 2. Base URL

| Environment | URL |
|---|---|
| Local development | `http://localhost:3000` |
| Production | TBD |

---

## 3. Authentication

### How it works

1. The user logs in through Supabase Auth on the frontend (using `supabase.auth.signInWithPassword()` or similar).
2. Supabase returns an **access token** (a JWT).
3. For every request to a **protected** backend route, the frontend must include that token in the `Authorization` header.
4. The backend verifies the token, extracts the user's UUID, and uses it to scope the query to that user's data.

### How to get the token

```js
// After the user logs in, get the current session
const { data: { session } } = await supabase.auth.getSession();
const token = session.access_token;
```

Or listen for auth state changes:

```js
supabase.auth.onAuthStateChange((_event, session) => {
  const token = session?.access_token;
  // store this token for use in API calls
});
```

### How to send the token

Include it in every request to a protected route as a `Bearer` token:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token expiry

Supabase tokens expire after **1 hour**. When a token expires you will get a `401` response. Call `supabase.auth.refreshSession()` to get a new token, then retry the request.

---

## 4. Rate Limiting

The API limits each IP address to **100 requests per 15 minutes**.

If you exceed the limit, all further requests will receive a `429 Too Many Requests` response until the window resets.

```json
{ "error": "Too many requests — please try again later" }
```

During normal development this limit will never be hit. It only matters if you are running automated scripts or tests that fire many requests quickly.

---

## 5. CORS

The API only accepts requests from `http://localhost:5173` (the Vite dev server) in development. Requests from any other origin will be blocked by the browser with a CORS error.

If you are running the frontend on a different port, ask the backend developer to update the `CORS_ORIGIN` value in `backend/.env`.

---

## 6. Response Format

### Success

All successful responses return JSON. The shape depends on the endpoint — see each endpoint section below.

### Error

All error responses return a JSON object with a single `error` field:

```json
{ "error": "Human-readable description of what went wrong" }
```

---

## 7. Endpoints

---

### GET /

**Auth required:** No

Health check. Use this to confirm the backend server is running before making other calls.

#### Request

```
GET http://localhost:3000/
```

No headers or body needed.

#### Success Response — `200 OK`

```json
{
  "message": "Caissa API is running"
}
```

#### Example

```js
const res  = await fetch('http://localhost:3000/');
const data = await res.json();
console.log(data.message); // "Caissa API is running"
```

---

### GET /modules

**Auth required:** No

Returns all chess learning modules in course order (Fundamentals first, then Tactics, then Endgames, etc.). Does **not** include lesson content — just the module metadata and a count of lessons.

Use this to render the module list on the home/dashboard page.

#### Request

```
GET http://localhost:3000/modules
```

No headers or body needed.

#### Success Response — `200 OK`

An array of module objects, sorted by `order_index` ascending.

```json
[
  {
    "id": 1,
    "title": "Fundamentals",
    "description": "Basics of chess: pieces, moves, rules",
    "order_index": 1,
    "created_at": "2025-01-01T00:00:00.000Z"
  },
  {
    "id": 2,
    "title": "Tactics",
    "description": "Common tactical motifs and puzzles",
    "order_index": 2,
    "created_at": "2025-01-01T00:00:00.000Z"
  },
  {
    "id": 3,
    "title": "Endgames",
    "description": "Basic endgame principles and techniques",
    "order_index": 3,
    "created_at": "2025-01-01T00:00:00.000Z"
  }
]
```

| Field | Type | Description |
|---|---|---|
| `id` | number | Unique module ID — use this for `GET /modules/:id` |
| `title` | string | Display name of the module |
| `description` | string or null | Short description of the module |
| `order_index` | number | Position in the course sequence (1 = first) |
| `created_at` | string (ISO 8601) | When the module was created |

#### Example

```js
const res     = await fetch('http://localhost:3000/modules');
const modules = await res.json();

modules.forEach(module => {
  console.log(`${module.order_index}. ${module.title}`);
});
```

---

### GET /modules/:id

**Auth required:** No

Returns a single module by its ID, including a list of all lessons inside it. Lesson content is **not** included here — only the lesson title and order. To get the full content of a lesson, call `GET /lessons/:id`.

Use this to render a module's detail page showing the list of lessons.

#### Request

```
GET http://localhost:3000/modules/1
```

| URL Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | number | Yes | The module's numeric ID |

#### Success Response — `200 OK`

A module object with a `lessons` array attached.

```json
{
  "id": 1,
  "title": "Fundamentals",
  "description": "Basics of chess: pieces, moves, rules",
  "order_index": 1,
  "created_at": "2025-01-01T00:00:00.000Z",
  "lessons": [
    {
      "id": 1,
      "title": "Pieces and Moves",
      "order_index": 1,
      "created_at": "2025-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "title": "Basic Checkmates",
      "order_index": 2,
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `id` | number | Unique module ID |
| `title` | string | Display name of the module |
| `description` | string or null | Short description |
| `order_index` | number | Position in the course (1 = first) |
| `created_at` | string (ISO 8601) | When the module was created |
| `lessons` | array | All lessons in this module, sorted by `order_index` |
| `lessons[].id` | number | Use this for `GET /lessons/:id` to load full content |
| `lessons[].title` | string | Display name of the lesson |
| `lessons[].order_index` | number | Position within the module (1 = first) |

#### Error Responses

| Status | Condition | Body |
|---|---|---|
| `400 Bad Request` | `:id` is not a number (e.g., `/modules/abc`) | `{ "error": "Module ID must be a number" }` |
| `404 Not Found` | No module exists with that ID | `{ "error": "Module not found" }` |

#### Example

```js
const moduleId = 1;
const res    = await fetch(`http://localhost:3000/modules/${moduleId}`);

if (res.status === 404) {
  console.log('Module not found');
  return;
}

const module = await res.json();
console.log(module.title);              // "Fundamentals"
console.log(module.lessons.length);    // 2
module.lessons.forEach(lesson => {
  console.log(`  ${lesson.order_index}. ${lesson.title}`);
});
```

---

### GET /lessons/:id

**Auth required:** No

Returns a single lesson by its ID, including the full lesson content. This is what you call when the user actually opens and reads a lesson.

#### Request

```
GET http://localhost:3000/lessons/1
```

| URL Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | number | Yes | The lesson's numeric ID |

#### Success Response — `200 OK`

```json
{
  "id": 1,
  "module_id": 1,
  "title": "Pieces and Moves",
  "content": "Overview of pieces and legal moves",
  "order_index": 1,
  "created_at": "2025-01-01T00:00:00.000Z"
}
```

| Field | Type | Description |
|---|---|---|
| `id` | number | Unique lesson ID |
| `module_id` | number | ID of the module this lesson belongs to |
| `title` | string | Display name of the lesson |
| `content` | string or null | The full lesson content/text |
| `order_index` | number | Position within its module (1 = first) |
| `created_at` | string (ISO 8601) | When the lesson was created |

#### Error Responses

| Status | Condition | Body |
|---|---|---|
| `400 Bad Request` | `:id` is not a number | `{ "error": "Lesson ID must be a number" }` |
| `404 Not Found` | No lesson exists with that ID | `{ "error": "Lesson not found" }` |

#### Example

```js
const lessonId = 1;
const res    = await fetch(`http://localhost:3000/lessons/${lessonId}`);

if (res.status === 404) {
  console.log('Lesson not found');
  return;
}

const lesson = await res.json();
console.log(lesson.title);    // "Pieces and Moves"
console.log(lesson.content);  // "Overview of pieces and legal moves"
```

---

### GET /progress

**Auth required:** Yes — include `Authorization: Bearer <token>` header

Returns all lessons the currently logged-in user has completed, along with the title and module each lesson belongs to. Sorted by completion time (oldest first).

Use this to show checkmarks on completed lessons, determine which lessons are unlocked, or display a progress summary.

#### Request

```
GET http://localhost:3000/progress
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

No body needed.

#### Success Response — `200 OK`

An array of progress records. Returns an empty array `[]` if the user has not completed any lessons yet.

```json
[
  {
    "id": 1,
    "lesson_id": 1,
    "lesson_title": "Pieces and Moves",
    "module_id": 1,
    "module_title": "Fundamentals",
    "completed_at": "2025-06-01T14:23:00.000Z"
  },
  {
    "id": 2,
    "lesson_id": 2,
    "lesson_title": "Basic Checkmates",
    "module_id": 1,
    "module_title": "Fundamentals",
    "completed_at": "2025-06-01T15:00:00.000Z"
  }
]
```

| Field | Type | Description |
|---|---|---|
| `id` | number | Unique progress record ID |
| `lesson_id` | number | The ID of the completed lesson |
| `lesson_title` | string | Title of the completed lesson |
| `module_id` | number | ID of the module the lesson belongs to |
| `module_title` | string | Title of that module |
| `completed_at` | string (ISO 8601) | When the user completed the lesson |

#### Error Responses

| Status | Condition | Body |
|---|---|---|
| `401 Unauthorized` | No token provided | `{ "error": "Authorization header is required. Format: Bearer <token>" }` |
| `401 Unauthorized` | Token is invalid or expired | `{ "error": "Invalid or expired token" }` |

#### Example

```js
const { data: { session } } = await supabase.auth.getSession();

const res      = await fetch('http://localhost:3000/progress', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
  },
});

if (res.status === 401) {
  // Token expired — refresh and retry
  await supabase.auth.refreshSession();
  return;
}

const progress = await res.json(); // array of completed lessons
const completedIds = progress.map(p => p.lesson_id);
// use completedIds to mark lessons as done in the UI
```

---

### POST /progress

**Auth required:** Yes — include `Authorization: Bearer <token>` header

Marks a specific lesson as completed for the currently logged-in user. Safe to call multiple times for the same lesson — it will not create duplicate records.

Call this when the user finishes a lesson and you want to save their progress.

#### Request

```
POST http://localhost:3000/progress
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "lesson_id": 1
}
```

| Header | Value | Required |
|---|---|---|
| `Authorization` | `Bearer <token>` | Yes |
| `Content-Type` | `application/json` | Yes |

| Body Field | Type | Required | Description |
|---|---|---|---|
| `lesson_id` | number (integer) | Yes | The ID of the lesson the user just completed. Must be a positive whole number. |

#### Success Response — `201 Created` (first time completing this lesson)

```json
{
  "id": 5,
  "user_id": "c3d4e5f6-1234-4abc-8def-000000000000",
  "lesson_id": 1,
  "completed_at": "2025-06-01T14:23:00.000Z"
}
```

#### Success Response — `200 OK` (lesson was already completed)

```json
{
  "message": "Lesson already marked as completed"
}
```

You can treat both `200` and `201` as success — both mean the lesson is recorded as complete.

#### Error Responses

| Status | Condition | Body |
|---|---|---|
| `400 Bad Request` | `lesson_id` is missing, not a number, a float, zero, or negative | `{ "error": "lesson_id is required and must be a positive integer" }` |
| `401 Unauthorized` | No token provided | `{ "error": "Authorization header is required. Format: Bearer <token>" }` |
| `401 Unauthorized` | Token is invalid or expired | `{ "error": "Invalid or expired token" }` |
| `404 Not Found` | The `lesson_id` does not exist in the database | `{ "error": "Lesson not found" }` |

#### Example

```js
const { data: { session } } = await supabase.auth.getSession();

const res = await fetch('http://localhost:3000/progress', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ lesson_id: 1 }),
});

if (res.status === 401) {
  // Token expired — refresh and retry
  await supabase.auth.refreshSession();
  return;
}

if (res.status === 404) {
  console.error('Lesson does not exist');
  return;
}

// Both 200 and 201 mean success
const data = await res.json();
console.log('Progress saved:', data);
```

---

## 8. Error Reference

| HTTP Status | Meaning | When you will see it |
|---|---|---|
| `200 OK` | Success | Standard success, or lesson already completed |
| `201 Created` | Resource created | New progress record saved |
| `400 Bad Request` | You sent invalid input | Non-numeric ID in URL, or bad `lesson_id` in body |
| `401 Unauthorized` | Auth failed | Missing token, expired token, or invalid token |
| `404 Not Found` | Resource does not exist | Module/lesson ID does not exist in DB, or unknown URL route |
| `429 Too Many Requests` | Rate limit hit | More than 100 requests from one IP in 15 minutes |
| `500 Internal Server Error` | Server-side bug | Database error or unexpected crash — report to backend dev |

---

## 9. Full Auth Flow Example

This is a complete example showing how to log in a user and then call a protected route.

```js
import { supabase } from './supabaseClient';

async function loginAndFetchProgress(email, password) {

  // Step 1 — Log in with Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Login failed:', error.message);
    return;
  }

  // Step 2 — Get the access token from the session
  const token = data.session.access_token;

  // Step 3 — Call the protected backend route with the token
  const res = await fetch('http://localhost:3000/progress', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    console.error('API call failed:', res.status);
    return;
  }

  const progress = await res.json();
  console.log('Completed lessons:', progress);
}
```

### Tip: keep the token fresh

Supabase tokens expire after 1 hour. The Supabase client automatically refreshes them in the background, but you should always get the latest token from the session at the time of each request rather than storing it once:

```js
// DO THIS — get fresh token per request
const { data: { session } } = await supabase.auth.getSession();
const token = session.access_token;

// NOT THIS — token may have expired
const token = tokenYouStoredHoursAgo;
```

---

## 10. Common Problems & Fixes

### I'm getting `401 Unauthorized`

1. **Did you include the header?** The header must be exactly `Authorization: Bearer <token>` — note the capital `A` and the space after `Bearer`.
2. **Is the token expired?** Tokens last 1 hour. Call `supabase.auth.refreshSession()` to get a new one.
3. **Is the user actually logged in?** Check `supabase.auth.getSession()` and confirm `session` is not `null`.

---

### I'm getting a CORS error in the browser

The backend only allows requests from `http://localhost:5173`. Make sure:
- Your frontend is running on port `5173` (Vite's default)
- You are not calling the API from a different port or file://

If you need a different port, ask the backend dev to update `CORS_ORIGIN` in `backend/.env`.

---

### I'm getting `404 Not Found` on a valid-looking URL

- Double-check the URL. All routes are lowercase: `/modules`, `/lessons`, `/progress`.
- Make sure the backend server is actually running (`npm run dev` from the `backend/` folder).
- If the backend is not running you will get a network error, not a 404 — a 404 means the server is up but the path doesn't exist.

---

### I'm getting `400 Bad Request` on POST /progress

Make sure:
- The request has `Content-Type: application/json` header
- The body is `{ "lesson_id": 1 }` where `1` is a **number**, not a string
- The `lesson_id` is a positive whole number (no floats, no negatives, no zero)

```js
// Correct
body: JSON.stringify({ lesson_id: 1 })

// Wrong — lesson_id is a string
body: JSON.stringify({ lesson_id: "1" })

// Wrong — lesson_id is a float
body: JSON.stringify({ lesson_id: 1.5 })
```

---

### The server is not starting / crashes immediately

The backend will refuse to start if `SUPABASE_JWT_SECRET` or `DATABASE_URL` are missing or still contain the placeholder value. Check `backend/.env` and make sure both are filled in with real values.

---

### I need to test protected routes without a real frontend

You can test using `curl` or an API client like Postman/Insomnia.

First get a token by logging in through Supabase (you can use the Supabase Dashboard → Authentication → Users to create a test user), then:

```bash
# Test GET /progress
curl http://localhost:3000/progress \
  -H "Authorization: Bearer <your-token-here>"

# Test POST /progress
curl -X POST http://localhost:3000/progress \
  -H "Authorization: Bearer <your-token-here>" \
  -H "Content-Type: application/json" \
  -d '{"lesson_id": 1}'
```
