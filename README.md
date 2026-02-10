# Caissa

A guided chess learning application that transforms scattered chess resources into a structured, goal-oriented learning journey. Users follow an ordered sequence of instructional modules and lessons that progress from foundational chess concepts to intermediate skill development, with lessons unlocking sequentially based on completion.

## Tech Stack

- **Frontend:** React, Tailwind CSS
- **Backend:** Node.js (Express)
- **Database:** PostgreSQL
- **Authentication:** Supabase Auth
- **Version Control:** GitHub
- **Project Management:** Notion

## Getting Started

### Prerequisites

Install the following before starting:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) (v18+) — npm comes with it
- [PostgreSQL](https://www.postgresql.org/)

### 1. Clone and Install

```bash
git clone https://github.com/<your-username>/SWE_Term_Project.git
cd SWE_Term_Project
```

Install dependencies for both frontend and backend:

```bash
cd frontend && npm install
cd ../backend && npm install
```

### 2. Configure Environment Variables

Create a `.env` file in `frontend/`:

```
VITE_SUPABASE_URL=<ask project manager for this>
VITE_SUPABASE_ANON_KEY=<ask project manager for this>
```

Create a `.env` file in `backend/`:

```
PORT=3000
DATABASE_URL=postgresql://postgres:<your-postgres-password>@localhost:5432/caissa
```

Replace `<your-postgres-password>` with the password you set during PostgreSQL installation.

### 3. Create the Database

```bash
psql -U postgres
```

```sql
CREATE DATABASE caissa;
\q
```

### 4. Run the App

**Frontend** (from `frontend/`):

```bash
npm run dev
```

**Backend** (from `backend/`):

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

## How to Contribute

1. **Create a branch** for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and commit them:
   ```bash
   git add .
   git commit -m "Add: description of your changes"
   ```

3. **Push your branch** and open a pull request:
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Request a review** from a team member before merging.

### Branch Naming

- `feature/` — new features
- `fix/` — bug fixes
- `docs/` — documentation updates

### Commit Messages

Use a short prefix to describe the type of change:

- `Add:` — new feature or file
- `Fix:` — bug fix
- `Update:` — improvement to existing code
- `Docs:` — documentation only

## Team

| Name | Role |
|------|------|
| Aaron Bezi Cordero | Project Manager |
| Nathan Waisserberg | Backend Developer |
| Connor Eaton | Frontend Developer |
| Ricardo Bezi Cordero | Database Engineer |
