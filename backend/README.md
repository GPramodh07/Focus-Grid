# Backend (Focus Grid)

This folder contains the Express + MySQL backend for Focus Grid.

## Run

```bash
npm install
npm run db:init
npm run test
```

Server starts on `http://localhost:5000`.

## Required Environment

The backend reads `.env` from the repository root (`../.env`):

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=task_manager_DB
```

## Architecture

- `controllers/` request handling
- `models/` database queries
- `routes/` endpoint registration
- `middleware/` auth middleware
- `db.js` MySQL connection
- `db_init.js` SQL bootstrap runner
