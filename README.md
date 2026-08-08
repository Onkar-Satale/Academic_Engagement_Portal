# 🎓 Academic Engagement Portal – Campus Club, Event & Multi-Tier Permission System

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://academic-engagement-portal.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![NodeJS](https://img.shields.io/badge/Node.js-Express-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

**Academic Engagement Portal** is an enterprise-grade, full-stack campus management and student engagement platform. Designed as an integrated digital ecosystem for universities and educational institutions, it streamlines club administration, event lifecycle management, multi-tier hierarchical permission request approvals, role-based access control across 8 distinct user tiers, volunteer management, real-time notifications, and security audit logging.

---

## 🌐 Live Demos

| Service | Host Platform | Live URL |
| :--- | :--- | :--- |
| **Frontend Application** | Vercel | [https://academic-engagement-portal.vercel.app/](https://academic-engagement-portal.vercel.app/) |
| **Express Backend API** | Render | [https://academic-portal-backend.onrender.com/](https://academic-portal-backend.onrender.com/) |

---

## ✨ Key Features

- 🏛️ **Multi-Tier Hierarchical Approval Workflow:** Multi-stage permission request routing across Club Head, Club Mentor, Estate Manager, Principal, and Director with interactive status updates and audit logs.
- 🎪 **Campus Club Administration & Recruitment:** Centralized directory for campus clubs with secret-key registration for mentors and heads, member application reviews, and open/closed recruitment toggles.
- 📅 **Event Lifecycle Management:** Full CRUD operations for academic and cultural events, including venue assignment, schedule tracking, and detailed event registration forms.
- 🙋‍♂️ **Volunteer & Capacity Management:** Integrated volunteer enrollment system for event organizers with task assignment and attendance tracking.
- 🔔 **Real-Time Notification Engine:** Automated target notifications delivered to users upon permission approval updates, club applications, and event registrations.
- 🛡️ **Granular Role-Based Access Control (RBAC):** Custom authorization rules across 8 distinct roles: *Student, Club Head, Admin, System Admin, Club Mentor, Estate Manager, Principal,* and *Director*.
- 📜 **Security & Activity Audit Logging:** Detailed logging of administrative events, IP address capture, system updates, and user action tracebacks.
- 🔒 **Enterprise Security Architecture:** Secure JWT Bearer authentication, bcrypt password hashing, IP rate limiting, input validation sanitization, and centralized API error handling (`ApiError`).

---

## 🧠 System Architecture & Design

Academic Engagement Portal follows a modern decoupled architecture separating the client-side single page application (SPA) from the RESTful API Gateway and relational database tier.

<div align="center">

![System Design Architecture](frontend/public/logo.svg)

*High-Level System Design Architecture illustrating React SPA, Node.js REST API Gateway, Express Authorization & Validation Middlewares, and MySQL Relational Engine.*

</div>

---

## 📂 Repository Structure

```
Academic-Engagement-Portal-main/
├── backend/                    # Node.js + Express REST API Server
│   ├── controllers/            # Auth, Club, Event, Permission, Approval & Notification controllers
│   ├── database/               # Relational database schemas & seed data (schema.sql, 3.sql)
│   ├── middlewares/            # JWT auth, role authorization, rate limiting, error handling
│   ├── models/                 # Database queries & data access layer schemas
│   ├── routes/                 # Express API endpoint definitions
│   ├── services/               # Core business logic services (approval, auth, club, event, etc.)
│   ├── utils/                  # ApiError helper, Winston logger, and utility functions
│   └── validators/             # Request payload validation rules (express-validator)
└── frontend/                   # React.js Single Page Application
    ├── public/                 # Static public assets & index.html
    ├── src/                    # Source code directory
    │   ├── api/                # Axios instance configuration & JWT request interceptors
    │   ├── auth/               # User authentication components (Login.js, Register.js)
    │   ├── components/         # Reusable UI modules (Navbar, ApprovalDashboard, PermissionRequestForm, etc.)
    │   ├── pages/              # Main route views (HomePage, Clubs, ClubDetails, Events, Account, etc.)
    │   ├── App.js              # React Router v7 setup & ToastContainer notification wrapper
    │   └── index.css           # Global CSS design system, typography & glassmorphism layout
```

---

## 🛠️ Tech Stack

| Tier | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, React Router v7, Axios, React Toastify, CSS3 | Interactive UI, Multi-Role Dashboards & Form Submissions |
| **Primary Backend** | Node.js, Express.js, Winston, Express Validator | Core REST API Gateway, Routing & Controller Logic |
| **Database** | MySQL Server / MariaDB | Relational storage for users, roles, clubs, events & approvals |
| **Security** | JWT (JSON Web Tokens), bcryptjs, Express Rate Limit | User Authentication, Password Hashing & API Protection |
| **Logging & Audit** | Winston Logger, Custom Audit Table | Application diagnostics, security logs & IP tracking |
| **DevOps & Hosting** | Vercel, Render | Continuous deployment for Client SPA & API Gateway |

---

## ⚙️ Environment Configuration

Set up environment variables for both the backend server and frontend client before starting the project locally.

### 1. Backend Configuration (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=college_db
JWT_SECRET=your_super_secret_jwt_access_key
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:3000
```

### 2. Frontend Configuration (`frontend/.env`)
```env
REACT_APP_API_URL=http://localhost:5000/api
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
git clone https://github.com/Onkar-Satale/Academic-Engagement-Portal.git
cd Academic-Engagement-Portal
```

#### 2️⃣ Initialize Database Schema
Import the relational SQL schema into your MySQL database server:
```bash
mysql -u root -p < backend/database/schema.sql
```

#### 3️⃣ Setup & Start Express Backend
```bash
cd backend
npm install
npm run dev
```
> *Backend API server runs at:* `http://localhost:5000`

#### 4️⃣ Setup & Start React Frontend
Open a new terminal window:
```bash
cd frontend
npm install
npm start
```
> *Frontend React application runs at:* `http://localhost:3000`

---

## 📡 API Reference Overview

| Endpoint | Method | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | No | Register a new student or faculty account |
| `/api/auth/login` | `POST` | No | Authenticate credentials & issue JWT token |
| `/api/clubs` | `GET` | No | Fetch directory of all campus clubs |
| `/api/clubs/:id` | `GET` | No | Get detailed profile of a specific club |
| `/api/clubs` | `POST` | Yes (Admin) | Create a new campus club entity |
| `/api/clubs/:id/join` | `POST` | Yes | Submit a membership application for a club |
| `/api/events` | `GET` | No | Fetch list of upcoming and past campus events |
| `/api/events` | `POST` | Yes (Mentor/Head) | Create and schedule a new event |
| `/api/events/:id/register` | `POST` | Yes | Register student attendance for an event |
| `/api/permissions` | `POST` | Yes (Club Head) | Create a multi-tier permission request |
| `/api/permissions/my-requests` | `GET` | Yes | Fetch status of submitted permission requests |
| `/api/approvals` | `POST` | Yes (Authority) | Approve/Reject permission request with remarks |
| `/api/notifications` | `GET` | Yes | Retrieve unread notifications for active user |
| `/api/volunteers` | `POST` | Yes | Apply for volunteer position for an event |

---

## 📸 Screenshots & Visual Walkthrough

<div align="center">

### 🏛️ Multi-Tier Approval Dashboard
![Approval Dashboard](frontend/public/logo.svg)
*Interactive authority panel for reviewing and approving multi-level permission requests with detailed audit trails.*

### 📋 Club Directory & Event Management
| Campus Club Directory | Event Detail & Registration |
| :---: | :---: |
| ![Clubs Page](frontend/public/logo.svg) | ![Event Registration](frontend/public/logo.svg) |
| *Explore active campus clubs, recruitment status, and activities.* | *View event schedules, venues, and submit registration forms.* |

</div>

---

## 🤝 Contributing

Contributions are always welcome! Follow these steps to contribute:

1. **Fork** the repository
2. **Create** your feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add some amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 👨‍💻 Author & Maintainer

- **Onkar Satale**
- **GitHub:** [@Onkar-Satale](https://github.com/Onkar-Satale)
- **Project Repo:** [Academic Engagement Portal Repository](https://github.com/Onkar-Satale/Academic-Engagement-Portal)
