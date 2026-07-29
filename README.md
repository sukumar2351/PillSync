# PillSync – Intelligent Medicine Reminder and Medication Tracking Platform

PillSync is an Intelligent Healthcare Management Platform designed to reduce medication non-adherence by connecting patients, caregivers, doctors, and administration. This repository contains the complete implementation for **Milestone 3** of the PillSync platform, featuring AI & Intelligent Medication Management, Medicine Master Database, Smart Validation, Prescription OCR, Drug Interaction Checker, Refill Prediction, Adherence Analytics, Smart Notification Center, Emergency Medical ID Cards, and Health Insights.

---

## Project Overview

PillSync provides an end-to-end medicine reminder workflow:
- **Medicine Management**: Full CRUD capabilities allowing patients to specify names, quantities, frequencies, dosage timeslots, and physical parameters.
- **Reminder & Dispatch Engine**: Dynamic local browser push notifications and real-time Email reminder dispatches powered by **Gmail SMTP**.
- **Medication Adherence History**: Automated patient taken/missed audit logs with weekly/daily compliance reports.
- **Linked Caregiver Viewports**: Interactive dashboards allowing caregivers to track medication histories and monitor adherence trends.
- **Premium User Interfaces**: Highly responsive visual design styled in premium Glassmorphism, 3D interactive tilt cards, and springy easing animations.
- **Relational Database Schema**: Structured database schema in PostgreSQL with strong foreign key integrity constraints.
- **Security & Authorization**: Strict JWT token-based authentication and role-based access control (RBAC).

---

## Technologies Used

### Frontend
- **React.js**: Modular reusable component architecture.
- **React Router**: Client-side route guarding and route redirection.
- **Axios**: HTTP communication with the backend APIs.
- **Framer Motion**: Premium 3D parallax, layout staggers, and easing transitions.
- **Lucide Icons**: Standard healthcare and dashboard layout symbols.
- **Vanilla CSS**: Clean, SaaS-style visual design with theme variables.

### Backend
- **Python FastAPI**: High-performance asynchronous API framework.
- **SQLAlchemy**: Relational Database ORM.
- **Pydantic**: Data parsing and schema validation rules.
- **Psycopg2**: PostgreSQL database driver adapter.
- **Jose & Passlib [Bcrypt]**: Secure password hashing and JWT signing.
- **smtplib / email**: Dispatch client for real-time Email reminders.

### Database
- **PostgreSQL**: Enterprise-grade relational database management system.

---

## Project Architecture Diagram

```mermaid
graph TD
    subgraph Frontend [React.js Client]
        UI[SaaS Interface]
        State[Auth State Manager]
        AxiosClient[Axios API Client]
        Local[Local Storage JWT]
        Framer[Framer Motion Animations]
    end

    subgraph Backend [FastAPI Service]
        App[main.py Entrypoint]
        Routers[API Routers auth/users/medicines/notifications]
        Services[Business Logic & Email Service]
        Security[security.py bcrypt & JWT]
        ORM[SQLAlchemy Models]
    end

    subgraph Database [PostgreSQL Engine]
        DB[(PostgreSQL Database)]
    end

    UI --> State
    State --> Local
    UI --> AxiosClient
    UI --> Framer
    AxiosClient -->|HTTP Requests + Bearer Token| App
    App --> Routers
    Routers --> Services
    Services --> Security
    Services --> ORM
    ORM -->|TCP/IP Connection| DB
```

---

# 🚀 Milestone 2 Features

## Medicine Management
- **Add Medicine**: Record new medications with name, category, dosage amount, scheduling slot, quantity, and specific instructions.
- **Edit & Update**: Modify active schedule attributes, dosage frequencies, or quantities.
- **Delete Medicine**: Remove medications securely with dynamic UI updates.
- **Medicine Directory**: Search, filter, and view a comprehensive table of active and archived medications.

## Reminder & Alert Systems
- **Browser Reminders**: Receive real-time audio and visual popups in the browser when doses are due.
- **Email Reminders**: Dispatches email reminder messages to patient-registered accounts via SMTP.
- **Notification Drawer**: An animated sliding right panel listing logs for reminders, Email status, and warnings.
- **Configurable Settings**: Toggle browser notifications, Email reminders, and configure notification timings.

## Adherence & Medication History
- **Taken/Missed Logging**: Patients record doses taken, missed, or snoozed.
- **Compliance Dashboards**: Displays weekly visual trends and percentage metrics.
- **Caregiver Linking**: Caregivers track linked patient compliance trends in real-time.

---

## Database Schema (PostgreSQL)

```mermaid
erDiagram
    roles ||--o{ users : "has"
    users ||--o| patient_profiles : "has"
    users ||--o| caregiver_profiles : "has"
    users ||--o{ medicines : "schedules"
    users ||--o{ notifications : "receives"
    medicines ||--o{ medication_history : "logs"

    roles {
        int id PK
        string name UK
    }
    users {
        int id PK
        string email UK
        string hashed_password
        int role_id FK
        boolean is_active
        datetime created_at
    }
    patient_profiles {
        int id PK
        int user_id FK, UK
        string full_name
        string phone
        int age
        string gender
        string blood_group
        string address
        string emergency_contact
        string account_status
    }
    caregiver_profiles {
        int id PK
        int user_id FK, UK
        string full_name
        string phone
        int age
        string gender
        string address
        string account_status
    }
    medicines {
        int id PK
        int user_id FK
        string name
        string dosage
        string timing_slot
        int quantity
        string instructions
        boolean is_active
        datetime created_at
    }
    medication_history {
        int id PK
        int medicine_id FK
        string status
        datetime logged_at
    }
    notifications {
        int id PK
        int user_id FK
        string title
        string message
        string type
        boolean is_read
        datetime created_at
    }
```

### Table Dictionary
1. **`roles`**: Classifies users: `admin` (1), `patient` (2), `caregiver` (3).
2. **`users`**: Manages credentials and roles.
3. **`patient_profiles`**: Personal profile metadata linked to patient accounts.
4. **`caregiver_profiles`**: Personal profile metadata linked to caregiver accounts.
5. **`medicines`**: Tracks medication items, quantities, schedules, and active state.
6. **`medication_history`**: Audit trail of taken/missed statuses linked to medicines.
7. **`notifications`**: History log of system notices, browser notifications, and Email triggers.

---

## API Documentation

### Base URL: `http://localhost:8000/api`

### 1. Authentication Endpoints
- **POST `/auth/register/patient`**: Register new patients.
- **POST `/auth/register/caregiver`**: Register new caregivers.
- **POST `/auth/login`**: Validate credentials and return JWT bearer token.
- **GET `/auth/me`**: Return authenticated user info and nested profile schema.

### 2. Profile Management Endpoints
- **GET `/users/profile`**: Returns patient/caregiver profile metadata.
- **PUT `/users/profile`**: Update personal details (validations check age range [0-120], blood group O+, AB-).

### 3. Medicine Management Endpoints
- **POST `/medicines/`**: Create new medication item.
  - *Request JSON*: `{"name": "Aspirin", "dosage": "1 tablet", "timing_slot": "morning", "quantity": 30, "instructions": "After meal"}`
- **GET `/medicines/`**: Retrieve all active medicines for the patient.
- **PUT `/medicines/{id}`**: Update medicine details.
- **DELETE `/medicines/{id}`**: Delete medicine.

### 4. Notification Endpoints
- **GET `/notifications/`**: List system notification logs.
- **GET `/notifications/unread-count`**: Get unread count.
- **POST `/notifications/mark-read`**: Mark notifications as read.
- **POST `/users/profile/notifications/test-email`**: Send a real-time verification test email.

### 5. Intelligent Google Gemini Vision Prescription Recognition Endpoints
- **POST `/ocr/upload`**: Preprocesses prescription file (auto-rotate, deskew, contrast enhance, sharpen, compression) and saves upload record.
- **POST `/ocr/extract`**: Executes **Google Gemini Vision API** (`gemini-2.5-flash` / `gemini-1.5-flash`) intelligent recognition to extract structured medication JSON (`medicine_name`, `strength`, `dosage`, `frequency`, `duration`, `timing`, `food`, `instructions`), completely ignoring doctor/hospital/patient metadata noise. Performs **RapidFuzz** fuzzy matching against `MedicineMaster` for spelling auto-correction.
- **POST `/ocr/save-medicines`**: Batch saves validated medicines to active prescription list after user review.
- **GET `/ocr/history`**: Retrieves prescription scan archive history.

---

## 🤖 Intelligent Google Gemini Vision OCR Architecture

PillSync features a production-grade Prescription Recognition engine powered by **Google Gemini Vision API** (`google-genai` / `google-generativeai`) and **RapidFuzz**:

### 1. Image Preprocessing Pipeline
- **Auto-Rotation & Deskewing**: Automatically transposes image orientation using EXIF metadata.
- **Contrast & Sharpness Enhancement**: Enhances text legibility for handwritten and printed doctor notes.
- **Optimized Payload Encoding**: Resizes large images to max 1600px and converts to compressed JPEG payload.

### 2. Google Gemini Vision Understanding
- Instructs Gemini Vision to extract ONLY active medication items in structured JSON format.
- Automatically discards Doctor names, registration numbers, Hospital logos, addresses, phone numbers, Patient details, age, gender, and diagnosis notes.

### 3. RapidFuzz Medicine Master Validation
- Matches extracted medicine names against the PostgreSQL `MedicineMaster` database using `RapidFuzz` string similarity.
- Similarity >= 80%: Automatically corrects spelling mistakes (e.g. `Dolo650` ➔ `Dolo 650`, `Azithromvcin` ➔ `Azithromycin`).
- Similarity < 80%: Flags item as `Needs Review`.

### 🔑 Environment Variables Setup
Create a `.env` file in the `backend/` directory:
```env
# Database
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/pillsync

# Google Gemini API Key for Vision Recognition
GEMINI_API_KEY=your_gemini_api_key_here

# Gmail SMTP Email Reminders
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

---

# 🎨 UI Enhancements
- **Interactive 3D Elements**: The Login and Profile cards support dynamic coordinate perspective mouse-parallax hover effects.
- **Snappy Navigations**: Transitions between public routes are tuned to a snappy `0.5s` easing curve.
- **Smooth Letter Staggers**: Header titles fade up letter-by-letter on viewport mounts.
- **Glassmorphism Theme**: Translucent sticky headers, side drawers, and widgets styled using HSL-based Tailwind and CSS variables.

---

# 🧪 Testing
- **Backend Testing**: Verification scripts check SQLAlchemy model migrations, relational foreign key constraints, and Uvicorn route dispatches.
- **Frontend Testing**: Build stability verified using Vite client compilers under production configurations.
- **Email System Verification**: SMTP delivery logs and account variables validated.

---

# 📝 Milestone 2 Development Summary
Milestone 2 successfully implements the medication tracking and reminder engine. The backend routes are completed using FastAPI and SQLAlchemy relationships, enabling real-time Postgres persistence for notification logs and taken compliance events. The user interface has been upgraded with Framer Motion animations, a sticky glassmorphic navigation header, a search widget, and a right-sliding notifications drawer. The Twilio SMS reminder engine has been fully migrated to a secure Gmail SMTP Email dispatch system featuring editable primary account emails and custom reminder toggles.

---

## Folder Structure

```text
PillSync/
├── database/
│   └── schema.sql              # Database schema definition file
├── backend/
│   ├── app/
│   │   ├── models/             # SQLAlchemy ORM models
│   │   │   ├── user_models.py
│   │   │   ├── medicine_models.py
│   │   │   └── notification_models.py
│   │   ├── schemas/            # Pydantic validation schemas
│   │   │   ├── user_schemas.py
│   │   │   ├── medicine_schemas.py
│   │   │   └── notification_schemas.py
│   │   ├── routers/            # API routers
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── admin.py
│   │   │   ├── medicines.py
│   │   │   └── notifications.py
│   │   ├── services/           # Business logic layer
│   │   │   ├── auth_service.py
│   │   │   ├── user_service.py
│   │   │   ├── medicine_service.py
│   │   │   └── email_service.py
│   │   ├── utils/              # JWT and hashing utils
│   │   │   └── security.py
│   │   ├── config.py           # Configuration loading
│   │   ├── database.py         # SQLAlchemy engine and sessions
│   │   └── main.py             # FastAPI App initiator and lifespan seeding
│   ├── requirements.txt        # Backend dependencies list
│   └── .env                    # System environment properties
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI parts
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Footer.jsx
│   │   ├── pages/              # View pages
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── PatientDashboard.jsx
│   │   │   ├── CaregiverDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── NotificationSettings.jsx
│   │   │   ├── About.jsx
│   │   │   ├── Contact.jsx
│   │   │   ├── Features.jsx
│   │   │   └── NotFound.jsx
│   │   ├── services/           # Axios client wrappers
│   │   │   └── api.js
│   │   ├── App.jsx             # React routing
│   │   ├── index.css           # Global custom stylesheet
│   │   └── main.jsx            # DOM attachment root
│   ├── package.json            # Node.js dependencies list
│   └── vite.config.js          # Vite config properties
└── README.md
```

---

## Professional Git Flow & Sync Guidelines

Ensure the following commands are followed:
```bash
# Check current status
git status

# Create feature/milestone backup branch
git branch milestone-2-backup

# Add files
git add README.md

# Commit
git commit -m "docs: upgrade README for Milestone 2"

# Push changes securely
git push origin milestone-2
```

---

# ✅ Milestone 2 Completion Status

- [x] JWT Authentication & RBAC (Milestone 1 foundation)
- [x] Patient & Caregiver Profiles (Milestone 1 foundation)
- [x] Medicine Management CRUD APIs
- [x] Dosage Timelines & Scheduling (Morning/Afternoon/Night)
- [x] Browser Push Reminders & Settings UI
- [x] Gmail SMTP Email Notification Services
- [x] Postgres Medication History Logs
- [x] Patient Dashboard Compliance Trends
- [x] Caregiver linked viewports
- [x] Responsive 3D Parallax React UI
- [x] Production Build Validation
