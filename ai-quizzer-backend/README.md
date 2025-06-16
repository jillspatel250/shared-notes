# AI Quizzer Backend Microservice

A comprehensive AI-powered quiz generation and evaluation microservice built with Next.js, featuring JWT authentication, intelligent quiz creation, automated scoring, and advanced features like email notifications and caching.

## 🚀 Features

### Core Features
- **JWT Authentication**: Secure token-based authentication system
- **AI Quiz Generation**: Generate customized quizzes using Groq AI based on subject, grade level, and difficulty
- **Intelligent Evaluation**: AI-powered answer evaluation with detailed feedback
- **Quiz History**: Comprehensive quiz history with advanced filtering options
- **Quiz Retry**: Allow students to retry quizzes with score tracking

### Bonus Features
- **AI Hints**: Get intelligent hints for quiz questions
- **Email Notifications**: Automated email delivery of quiz results with improvement suggestions
- **Redis Caching**: Performance optimization with caching layer
- **Advanced Filtering**: Filter by grade, subject, marks, date ranges
- **Comprehensive API Documentation**: Complete Postman collection and Swagger docs

## 🏗️ Architecture

### Technology Stack
- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with JSONB for flexible quiz storage
- **Authentication**: JWT (JSON Web Tokens)
- **AI Integration**: Groq SDK for quiz generation and evaluation
- **Caching**: Redis for performance optimization
- **Email**: Nodemailer with SMTP support
- **Containerization**: Docker for easy deployment

### Database Design
```sql
Users Table:
- id (Primary Key)
- username (Unique)
- email
- password_hash
- created_at, updated_at

Quizzes Table:
- id (Primary Key)
- user_id (Foreign Key)
- title, subject, grade_level, difficulty
- questions (JSONB - flexible structure)
- created_at

Quiz Submissions Table:
- id (Primary Key)
- quiz_id, user_id (Foreign Keys)
- answers (JSONB)
- score, total_questions
- feedback (JSONB)
- completed_at

Quiz Hints Table:
- id (Primary Key)
- quiz_id, user_id (Foreign Keys)
- question_id, hint_text
- requested_at
