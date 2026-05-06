# Team Task Manager

A full-stack team task manager with authentication, role-based access, project management, task assignment, and status tracking.

## Features
- Signup / login with JWT-based authentication
- Admin / Member roles
- Project creation and assignment
- Task creation, assignment, status updates, overdue detection
- Dashboard summaries for tasks and projects
- REST API backed by SQLite

## Setup

### Backend

1. Open `server` folder
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env`
4. Start server:
   ```bash
   npm run dev
   ```

### Frontend

1. Open `client` folder
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start dev server:
   ```bash
   npm run dev
   ```

## Notes
- Backend runs on `http://localhost:4000`
- Frontend runs on `http://localhost:5173`
- Default admin user is created automatically if none exists
