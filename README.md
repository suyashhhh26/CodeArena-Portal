# 🏟️ CodeArena

A full-stack competitive coding platform built with **Node.js**, **Express**, **MySQL**, and vanilla **HTML / CSS / JavaScript**.

---

## 📁 Project Structure

```
CodeArenaa/
├── server.js                  # Express entry point
├── package.json               # Dependencies & scripts
├── .env                       # Environment variables
├── .gitignore
│
├── backend/
│   ├── config/
│   │   ├── config.js          # Centralised app config
│   │   └── db.js              # MySQL connection pool
│   ├── middleware/
│   │   ├── auth.js            # JWT protect & authorise
│   │   └── errorHandler.js    # Global error middleware
│   ├── models/
│   │   ├── User.js            # User data-access layer
│   │   ├── Problem.js         # Problem data-access layer
│   │   └── Submission.js      # Submission data-access layer
│   ├── controllers/
│   │   ├── authController.js  # Register / Login / Me
│   │   ├── problemController.js  # CRUD for problems
│   │   └── submissionController.js  # Submit & retrieve
│   └── routes/
│       ├── authRoutes.js
│       ├── problemRoutes.js
│       └── submissionRoutes.js
│
├── database/
│   ├── schema.sql             # Table definitions
│   └── seed.sql               # Sample data
│
└── frontend/
    ├── pages/
    │   ├── index.html         # Landing page
    │   ├── login.html         # Login form
    │   ├── register.html      # Registration form
    │   ├── problems.html      # Problem listing
    │   ├── editor.html        # Code editor + problem view
    │   └── leaderboard.html   # Leaderboard
    ├── css/
    │   ├── style.css          # Global styles & design system
    │   ├── auth.css           # Auth page styles
    │   └── editor.css         # Editor page styles
    └── js/
        ├── app.js             # Shared utilities & API wrapper
        ├── auth.js            # Login / Register logic
        ├── problems.js        # Problem list + filtering
        ├── editor.js          # Editor + submission logic
        └── leaderboard.js     # Leaderboard rendering
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **MySQL** 8.0+

### 1. Install dependencies
```bash
npm install
```

### 2. Set up the database
```sql
-- Run in MySQL shell or client:
source database/schema.sql;
source database/seed.sql;
```

### 3. Configure environment
Edit `.env` with your MySQL credentials and a strong JWT secret.

### 4. Start the server
```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Visit **http://localhost:3000/pages/index.html**

---

## 🔌 API Endpoints

| Method | Endpoint              | Auth     | Description             |
|--------|-----------------------|----------|--------------------------|
| POST   | `/api/auth/register`  | Public   | Create a new account     |
| POST   | `/api/auth/login`     | Public   | Log in & receive JWT     |
| GET    | `/api/auth/me`        | Bearer   | Get current user profile |
| GET    | `/api/problems`       | Public   | List all problems        |
| GET    | `/api/problems/:id`   | Public   | Get problem details      |
| POST   | `/api/problems`       | Admin    | Create a problem         |
| PUT    | `/api/problems/:id`   | Admin    | Update a problem         |
| DELETE | `/api/problems/:id`   | Admin    | Delete a problem         |
| POST   | `/api/submissions`    | Bearer   | Submit a solution        |
| GET    | `/api/submissions/my` | Bearer   | List my submissions      |
| GET    | `/api/submissions/:id`| Bearer   | Get submission details   |

---

## 🛠️ Tech Stack

| Layer      | Technology                |
|------------|---------------------------|
| Runtime    | Node.js                   |
| Framework  | Express 4                 |
| Database   | MySQL 8 (mysql2 driver)   |
| Auth       | JWT (jsonwebtoken + bcryptjs) |
| Frontend   | HTML5, CSS3, Vanilla JS   |

---

## 📄 License

ISC
