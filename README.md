# Task Manager

A full-stack, fully responsive student productivity website that works smoothly across desktop, tablet, and mobile devices.

The app includes modules for:

- Authentication
- Subject management
- Attendance tracking
- Daily task planning
- Routine planning
- Timetable management

## Project Structure

```text
task-manager/
├── backend/        # Express + MySQL API
├── frontend/       # Static frontend pages (HTML/CSS/JS)
├── database/       # SQL bootstrap scripts
├── .env            # Environment variables (not committed)
└── README.md
```

## Tech Stack

- Backend: Node.js, Express
- Database: MySQL
- Frontend: HTML, CSS, JavaScript

## Prerequisites

- Node.js (v18+ recommended)
- MySQL Server
- npm

## Environment Variables

Create a root `.env` file:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=task_manager_DB
```

## Installation

1. Install backend dependencies:

```bash
cd backend
npm install
```

## Database Setup

Initialize the database and all required tables:

```bash
cd backend
node db_init.js
```

Or use npm script:

```bash
npm run db:init
```

This creates:

- users
- subjects
- attendance
- tasks
- routines
- timetable

## Run the Backend

Start the backend server with:

```bash
cd backend
npm run test
```

Server starts at:

- http://localhost:5000

## API Routes

Base URL: http://localhost:5000

### Auth

- POST /api/auth/register
- POST /api/auth/login

### Subjects

- GET /api/subjects
- POST /api/subjects
- PUT /api/subjects/:id
- DELETE /api/subjects/:id

### Attendance

- GET /api/attendance/:subject_id
- GET /api/attendance/percentage/:subject_id
- POST /api/attendance
- PUT /api/attendance/:id
- DELETE /api/attendance/:id

### Tasks

- GET /api/tasks
- GET /api/tasks/:date
- POST /api/tasks
- PUT /api/tasks/:id
- DELETE /api/tasks/:id

### Routines

- GET /api/routines
- POST /api/routines
- PUT /api/routines/:id
- DELETE /api/routines/:id

### Timetable

- GET /api/timetable
- POST /api/timetable
- PUT /api/timetable/:id
- DELETE /api/timetable/:id

## Authentication Note

Current protected routes use a simple middleware that expects `user_id` in the request body or query parameters.

Examples:

- GET /api/tasks?user_id=1
- POST /api/routines with { "user_id": 1, ... }

## .gitignore

The project ignores:

- node_modules/
- backend/node_modules/
- .env

## Troubleshooting

- If database init fails on repeat runs, rerun db_init.js (it is idempotent now).
- If MySQL connection fails, verify .env values and MySQL service status.
