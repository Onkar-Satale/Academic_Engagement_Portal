# 🎓 Academic Engagement Portal – Campus Club, Event & Multi-Tier Permission Ecosystem

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://academic-engagement-portal-kappa.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![NodeJS](https://img.shields.io/badge/Node.js-Express-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

**Academic Engagement Portal** is an enterprise-grade, full-stack campus engagement and institutional governance platform. Tailored for colleges and universities, it streamlines student club ecosystems, event lifecycle administration, and a **4-tier sequential permission approval pipeline** across campus leadership, accompanied by cryptographically secured role activations, real-time in-app notifications, and granular role-based access control (RBAC).

---

## 🌐 Live Deployments

| Service | Platform | Live URL |
| :--- | :--- | :--- |
| **Frontend Application** | Vercel | [https://academic-engagement-portal-kappa.vercel.app/](https://academic-engagement-portal-kappa.vercel.app/) |
| **Backend API Gateway** | Render | [https://academic-engagement-portal-backend.onrender.com/](https://academic-engagement-portal-backend.onrender.com/) |

---

## 🚀 Key System Features

### 🏛️ 1. 4-Tier Sequential Permission & Approval Pipeline
- **Hierarchical Review Routing:** Event permission requests automatically progress through four verified levels:
  1. **Level 1:** Club Mentor *(Initial review & academic alignment)*
  2. **Level 2:** Estate Manager *(Venue & campus facility clearance)*
  3. **Level 3:** Principal *(Institutional sanction & security review)*
  4. **Level 4:** Director *(Final executive approval & automatic event publication)*
- **Automatic Event Publishing:** Upon Level 4 approval, the event is automatically published to the live public Events catalog, and a campus-wide notification is broadcast.
- **Remarks & Feedback History:** Every level records reviewer remarks and timestamps. Higher authorities and Club Heads can inspect prior approval comments at each stage.
- **Edit Details & Resubmit:** If a request is rejected at any level (e.g. venue clash), the Club Head can click **"🔄 Edit Details"** to modify and resubmit, which seamlessly cleans up the rejected entry and initiates a fresh review.
- **Request Withdrawal with Authority Broadcast:** If a Club Head withdraws/cancels an active request in the middle of the pipeline, all involved authorities up to that review stage receive an instant cancellation warning notification.

### 🔐 2. Cryptographic Secret Keys & Role Elevation
- **CSPRNG Key Generation:** Uses cryptographically secure random bytes (`crypto.randomBytes` / `window.crypto.getRandomValues`) to generate unguessable secret keys for Club Mentors, Club Heads, Estate Managers, Principals, and Directors.
- **In-App Role Upgrading:** Registered users can activate their secret keys directly on their **Account Profile** page to instantly elevate their role and permissions.
- **Key Management & Revocation:** Administrators have full controls to auto-generate, copy, or revoke secret keys per club and authority tier.

### 👥 3. Granular Role-Based Access Control (RBAC) & Strict UI Gating
- **8 Distinct User Tiers:**
  1. `Student` (Role ID: 1)
  2. `Teacher` (Role ID: 2)
  3. `Admin` (Role ID: 3)
  4. `Club Head` (Role ID: 4)
  5. `Club Mentor` (Role ID: 5)
  6. `Estate Manager` (Role ID: 6)
  7. `Principal` (Role ID: 7)
  8. `Director` (Role ID: 8)
- **Strict Student Action Isolation:** Action buttons such as **"Join Club"** and **"Register for Event"** are exclusively rendered for verified Students. Leadership and authorities are presented only with management, review, and details views across all pages.
- **Duplicate Prevention:** Prevents duplicate applications to the same club or duplicate event registrations at both database and API layers.

### 🔔 4. Real-Time Notification Center
- Instant alerts for membership applications, approval pipeline updates, reviewer remarks, request withdrawals, and newly announced campus events.
- Read/Unread state tracking with notification badges and direct deep-linking to relevant approval cards or event details.

### 🛡️ 5. Robust Security & Data Integrity
- **JWT Bearer Authentication:** Secure access and refresh tokens with bcrypt-hashed credentials.
- **Validation & Typo Detection:** Strict RFC email validation with automatic detection for common typos (e.g., `@gail.com` ➔ `@gmail.com`).
- **Autofill Protection:** Explicit autocomplete disabling to prevent browser credential overwriting in administrative forms.
- **SQL Sanitization:** Parameterized SQL queries and foreign key sanitization preventing data corruption or SQL injection.

---

## 🧠 System Architecture & Workflow

```mermaid
flowchart TD
    subgraph Client [Client Tier (React 18 SPA)]
        UI[Tailored Glassmorphism UI]
        AuthUI[JWT Auth & Profile Manager]
        PipelineUI[Interactive 4-Stage Stepper]
    end

    subgraph Server [Backend REST API (Node.js & Express)]
        MW[JWT Auth & RBAC Middleware]
        PermService[Permission Pipeline Engine]
        ClubService[Club & Member Management]
        NotifService[Real-Time Notification Dispatcher]
    end

    subgraph Database [Database Tier (MySQL)]
        Users[(user & role)]
        Clubs[(club & club_member)]
        Permissions[(permission_request & permission_approval)]
        Events[(event & event_registration)]
        Notifs[(notification)]
    end

    UI -->|REST Requests + JWT| MW
    MW --> PermService
    MW --> ClubService
    PermService --> Permissions
    PermService --> NotifService
    NotifService --> Notifs
    PermService -->|On Level 4 Approval| Events
    ClubService --> Clubs
    AuthUI --> Users
```

---

## 📂 Repository Structure

```
Academic-Engagement-Portal/
├── assets/                     # Architecture diagrams and UI screenshots
├── backend/                    # Node.js + Express REST API Server
│   ├── config/                 # Database connection pool (db.js)
│   ├── controllers/            # Auth, Club, Event, Permission, User & Feedback controllers
│   ├── database/               # Relational SQL schema (schema.sql)
│   ├── middlewares/            # JWT verification, RBAC auth, rate limiting & error handling
│   ├── models/                 # MySQL data access layer (Club, Event, Permission, User models)
│   ├── routes/                 # API endpoint routing definitions
│   ├── services/               # Core business services (Permission pipeline, Club & Event services)
│   ├── utils/                  # ApiError helper, logger, and utility functions
│   ├── validators/             # Request payload validation rules (express-validator)
│   ├── app.js                  # Express middleware setup & route mounts
│   └── server.js               # HTTP server entrypoint
└── frontend/                   # React.js Single Page Application
    ├── public/                 # Static assets & index.html
    └── src/
        ├── api/                # Axios instance configuration & JWT interceptors
        ├── auth/               # Login & Register components with email typo validation
        ├── components/         # ApprovalDashboard, MyRequestsList, PermissionRequestForm, Navbar, etc.
        ├── pages/              # HomePage, Clubs, ClubDetails, Events, EventDetails, Account, etc.
        ├── App.js              # React Router routing & global notification toast wrapper
        └── index.css           # Global dark purple/glassmorphic design system
```

---

## 🛠️ Tech Stack

| Tier | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, React Router v7, Axios, React Toastify, Modern CSS3 | Responsive Single Page Application, Multi-Role Dashboards & Interactive Steppers |
| **Backend** | Node.js, Express.js, Express Validator | REST API Gateway, Permission Pipeline Execution & Notification Dispatching |
| **Database** | MySQL Server 8.0+ | Relational data persistence with foreign key constraints & cascading actions |
| **Authentication** | JWT (JSON Web Tokens), bcryptjs | Secure stateless authentication & password hashing |
| **Cryptography** | Node `crypto` / Web Crypto API | CSPRNG random key generation for authority elevation |
| **Hosting** | Vercel (Frontend), Render (Backend) | Production continuous deployment |

---

## ⚙️ Environment Configuration

Set up `.env` files in both `backend` and `frontend` before running the project locally.

### 1. Backend Configuration (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=college_db
JWT_ACCESS_SECRET=your_jwt_secret_key_here
JWT_ACCESS_EXPIRES_IN=7d
```

### 2. Frontend Configuration (`frontend/.env`)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WEB3FORMS_KEY=your_optional_web3forms_key
```

---

## 🚀 Local Installation & Setup

### Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **MySQL Server**: v8.0 or higher running on port `3306`

---

### Step-by-Step Setup

#### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Onkar-Satale/Academic_Engagement_Portal.git
cd Academic_Engagement_Portal
```

#### 2️⃣ Initialize Database Schema
Import the relational schema into your MySQL instance:
```bash
mysql -u root -p < backend/database/schema.sql
```

#### 3️⃣ Setup & Run Backend Server
```bash
cd backend
npm install
npm start
```
> *Backend API server will run at:* `http://localhost:5000`

#### 4️⃣ Setup & Run Frontend Client
In a separate terminal:
```bash
cd frontend
npm install
npm start
```
> *Frontend React application will open at:* `http://localhost:3000`

---

## 📡 API Endpoints Summary

### 🔐 Authentication & Accounts
- `POST /api/auth/register` — Register a new student or faculty account.
- `POST /api/auth/login` — Authenticate credentials and receive JWT.
- `POST /api/users/generate-role-key` — Generate administrative role secret keys (Admin only).
- `POST /api/users/elevate-role` — Elevate user role via valid cryptographic secret key.

### 🏛️ Campus Clubs & Memberships
- `GET /api/clubs` — Retrieve list of all campus clubs.
- `GET /api/clubs/:id` — Retrieve detailed club profile, active members, and mentor information.
- `POST /api/clubs` — Create a new campus club entity (Admin only).
- `PUT /api/clubs/:id` — Update club description, activities, or leadership (Club Leadership/Admin).
- `POST /api/clubs/:id/join` — Submit a club membership application (Students only).
- `GET /api/clubs/my/enrolled` — Retrieve all clubs the active student is enrolled in or applied to.

### 📋 Multi-Tier Permissions & Approvals
- `POST /api/permissions` — Submit a new event permission request (Club Head only).
- `GET /api/permissions/my-requests` — Retrieve real-time permission status, progress stepper, and remarks history.
- `GET /api/permissions/pending` — Fetch pending requests matching the current authority's review level.
- `POST /api/permissions/:requestId/action` — Approve or Reject a permission request with written remarks.
- `DELETE /api/permissions/:requestId` — Cancel/withdraw a permission request and notify involved authorities.

### 📅 Events & Registrations
- `GET /api/events` — Retrieve published upcoming and past campus events.
- `GET /api/events/:id` — Retrieve event details and registered student counts.
- `POST /api/event-registrations/register` — Register student attendance for an event (Students only).
- `GET /api/event-registrations/my` — Fetch events registered by the active student.

### 🔔 Notifications
- `GET /api/notifications` — Retrieve all user notifications.
- `PUT /api/notifications/:id/read` — Mark a notification as read.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing new feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 👨‍💻 Author & Maintainer

- **Onkar Satale**
- **GitHub:** [@Onkar-Satale](https://github.com/Onkar-Satale)
- **Repository:** [Academic_Engagement_Portal](https://github.com/Onkar-Satale/Academic_Engagement_Portal)
