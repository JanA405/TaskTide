# TaskTide

TaskTide is a modern task and project management web application.

## Tech Stack

- **Backend:** Spring Boot, Spring Security, JWT, Spring Data JPA, MySQL
- **Frontend:** React, Redux Toolkit, React Router, Axios

## Project Structure

```
├── backend/       # Spring Boot backend application
├── frontend/      # React frontend application
└── README.md
```

## Getting Started

### Prerequisites
- Java 17+
- Node.js 18+
- MySQL Server

### Backend Setup
1. Configure database settings in `backend/src/main/resources/application.properties` or provide environment variables (`DB_PASSWORD`).
2. Run backend:
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

### Frontend Setup
1. Create `.env` from `.env.example`:
   ```bash
   cd frontend
   cp .env.example .env
   ```
2. Install dependencies and start development server:
   ```bash
   npm install
   npm start
   ```
