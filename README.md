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

### Deploy on Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel`
4. Set environment variables:
   - `JWT_SECRET` = your secret
5. Vercel will build and deploy both frontend and backend.

**Note:** SQLite works for demo purposes, but for production consider using a cloud database like PlanetScale or Vercel Postgres.

### Alternative: Railway Deployment
1. Create a new Railway project.
2. Connect your GitHub repository.
3. Set the root folder to `server`.
4. Set environment variables:
   - `JWT_SECRET` = your secret
   - `PORT` = `4000`
5. Railway will run `npm install` and then `npm start`.

This app is configured so the backend can serve the built React frontend from `client/dist`.
