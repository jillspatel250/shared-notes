import Joi from "joi"

// Quiz generation validation schema
const quizGenerationSchema = Joi.object({
  subject: Joi.string().min(2).max(50).required().messages({
    "string.empty": "Subject is required",
    "string.min": "Subject must be at least 2 characters long",
    "string.max": "Subject must not exceed 50 characters",
  }),
  gradeLevel: Joi.string().min(1).max(10).required().messages({
    "string.empty": "Grade level is required",
    "string.min": "Grade level must be at least 1 character",
    "string.max": "Grade level must not exceed 10 characters",
  }),
  difficulty: Joi.string().valid("easy", "medium", "hard").default("medium").messages({
    "any.only": "Difficulty must be one of: easy, medium, hard",
  }),
  questionCount: Joi.number().integer().min(1).max(20).default(5).messages({
    "number.base": "Question count must be a number",
    "number.integer": "Question count must be an integer",
    "number.min": "Question count must be at least 1",
    "number.max": "Question count must not exceed 20",
  }),
})

// Quiz submission validation schema
const quizSubmissionSchema = Joi.object({
  quizId: Joi.string().min(1).required().messages({
    "string.empty": "Quiz ID is required",
    "string.min": "Quiz ID cannot be empty",
  }),
  answers: Joi.array().items(Joi.string().allow("")).min(1).required().messages({
    "array.base": "Answers must be an array",
    "array.min": "At least one answer is required",
    "any.required": "Answers array is required",
  }),
  studentEmail: Joi.string().email().optional().messages({
    "string.email": "Student email must be a valid email address",
  }),
})

// Login validation schema
const loginSchema = Joi.object({
  username: Joi.string().min(3).max(50).required().messages({
    "string.empty": "Username is required",
    "string.min": "Username must be at least 3 characters long",
    "string.max": "Username must not exceed 50 characters",
  }),
  password: Joi.string().min(6).max(100).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 6 characters long",
    "string.max": "Password must not exceed 100 characters",
  }),
})

// Hint request validation schema
const hintRequestSchema = Joi.object({
  quizId: Joi.string().min(1).required().messages({
    "string.empty": "Quiz ID is required",
  }),
  questionId: Joi.string().min(1).required().messages({
    "string.empty": "Question ID is required",
  }),
})

// Quiz retry validation schema
const quizRetrySchema = Joi.object({
  quizId: Joi.string().min(1).required().messages({
    "string.empty": "Quiz ID is required",
  }),
})

// Validation functions
export function validateQuizGeneration(data: any): { success: boolean; error?: string; data?: any } {
  const { error, value } = quizGenerationSchema.validate(data, { abortEarly: false })

  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join(", ")
    return { success: false, error: errorMessage }
  }

  return { success: true, data: value }
}

export function validateQuizSubmission(data: any): { success: boolean; error?: string; data?: any } {
  const { error, value } = quizSubmissionSchema.validate(data, { abortEarly: false })

  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join(", ")
    return { success: false, error: errorMessage }
  }

  return { success: true, data: value }
}

export function validateLogin(data: any): { success: boolean; error?: string; data?: any } {
  const { error, value } = loginSchema.validate(data, { abortEarly: false })

  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join(", ")
    return { success: false, error: errorMessage }
  }

  return { success: true, data: value }
}

export function validateHintRequest(data: any): { success: boolean; error?: string; data?: any } {
  const { error, value } = hintRequestSchema.validate(data, { abortEarly: false })

  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join(", ")
    return { success: false, error: errorMessage }
  }

  return { success: true, data: value }
}

export function validateQuizRetry(data: any): { success: boolean; error?: string; data?: any } {
  const { error, value } = quizRetrySchema.validate(data, { abortEarly: false })

  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join(", ")
    return { success: false, error: errorMessage }
  }

  return { success: true, data: value }
}

// Email validation utility
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Date validation utility (DD/MM/YYYY format)
export function isValidDateFormat(dateString: string): boolean {
  const regex = /^\d{2}\/\d{2}\/\d{4}$/
  if (!regex.test(dateString)) return false

  const [day, month, year] = dateString.split("/").map(Number)
  const date = new Date(year, month - 1, day)

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove < and > characters
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim()
}

// Validate pagination parameters
export function validatePagination(
  page?: string,
  limit?: string,
): {
  page: number
  limit: number
  error?: string
} {
  const pageNum = page ? Number.parseInt(page) : 1
  const limitNum = limit ? Number.parseInt(limit) : 10

  if (isNaN(pageNum) || pageNum < 1) {
    return { page: 1, limit: 10, error: "Page must be a positive integer" }
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
    return { page: pageNum, limit: 10, error: "Limit must be between 1 and 50" }
  }

  return { page: pageNum, limit: limitNum }
}
