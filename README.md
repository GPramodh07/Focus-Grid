# Focus Grid

Focus Grid is a full-stack student productivity app built with Node.js, Express, MySQL, and a responsive HTML/CSS/JS frontend.

It includes modules for:

- Authentication
- Dashboard overview
- Subject and attendance tracking
- Day planning with tasks and routines
- Timetable management
- Profile update modal across all header-enabled pages

## Tech Stack

- Backend: Node.js, Express
- Database: MySQL
- Frontend: HTML, CSS, JavaScript

## Project Structure

```text
task-manager/
├── backend/                 # Express API (MVC)
├── frontend/                # Static frontend pages + assets
├── database/                # SQL initialization script
├── .env.example             # Environment template
├── .gitignore
└── README.md
```

## Prerequisites

- Node.js 18+
- npm
- MySQL server

## Quick Start

1. Clone and enter the project:

```bash
git clone <your-repo-url>
cd task-manager
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Install backend dependencies:

```bash
cd backend
npm install
```

4. Initialize database:

```bash
npm run db:init
```

5. Start backend:

```bash
npm run test
```

Backend runs at:

- http://localhost:5000

6. Start frontend:

- Open `frontend/features/start/login.html` with a local static server (recommended: VS Code Live Server).

## Environment Variables

Create `.env` in repository root:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=task_manager_DB
```

## API Summary

Base URL: `http://localhost:5000`

- Auth: `POST /api/auth/register`, `POST /api/auth/login`
- User: `GET /api/user/profile`, `PATCH /api/user/update-profile`
- Subjects: `GET/POST/PUT/DELETE /api/subjects`
- Attendance: `GET /api/attendance/:subject_id`, `GET /api/attendance/percentage/:subject_id`, `POST/PUT/DELETE /api/attendance`
- Tasks: `GET /api/tasks`, `GET /api/tasks/:date`, `POST/PUT/PATCH/DELETE /api/tasks`
- Routines: `GET/POST/PUT/DELETE /api/routines`
- Timetable: `GET/POST/PUT/DELETE /api/timetable`
- Dashboard: `GET /api/dashboard/today-classes`, `GET /api/dashboard/today-tasks`, `GET /api/dashboard/attendance-summary`

## Authentication Behavior

Protected routes currently use middleware that reads `user_id` from query/body and injects it into `req.user.id`.

Examples:

- `GET /api/tasks?user_id=1`
- `PATCH /api/user/update-profile` with `{ "user_id": 1, ... }`

## GitHub Push Checklist

- `.env` is excluded from git
- `node_modules` is excluded from git
- README includes setup and run instructions
- `.env.example` is committed
- Backend dependencies installed and lockfile updated

## Troubleshooting

- If DB setup fails, confirm MySQL is running and credentials in `.env` are correct.
- If tables already exist, rerun `npm run db:init` (script is safe for repeat runs).
- If login fails for legacy users, verify existing records and re-save password via profile update to rehash.
