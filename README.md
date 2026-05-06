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

## GitHub and Deployment

### Push to GitHub
If you already created a repo on GitHub, add it as remote and push:

```bash
cd "c:\Users\soura\OneDrive\Desktop\task manager"
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```

### Deploy on Render (Free)
Render is a better choice for your app because it supports persistent disk and a Node backend with SQLite.

1. Go to `https://render.com` and sign up or log in.
2. Click `New` → `Web Service`.
3. Connect your GitHub account and select `sourabhnagar70/task-manager`.
4. Set the root directory to `server`.
5. Set the runtime to `Node`.
6. Set the build command to:
   ```bash
   npm install
   ```
7. Set the start command to:
   ```bash
   npm start
   ```
8. Add environment variables:
   - `JWT_SECRET` = your secret
9. Deploy.

Render will install dependencies, build the client from `server/postinstall`, and run your app.

### Vercel (Not Recommended for SQLite)
Vercel can host the frontend and serverless functions, but SQLite is not ideal there because the filesystem is ephemeral.
If you still want Vercel, you must move to a cloud database like PlanetScale or Vercel Postgres first.

This app is configured so the backend can serve the built React frontend from `client/dist` when deployed from `server`.
