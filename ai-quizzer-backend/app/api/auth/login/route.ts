import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

// Mock user database - In production, use actual database
const mockUsers = [
  { id: 1, username: "student1", password: "$2a$10$rOzJqKqNqKqNqKqNqKqNqO", email: "student1@example.com" },
  { id: 2, username: "teacher1", password: "$2a$10$rOzJqKqNqKqNqKqNqKqNqO", email: "teacher1@example.com" },
  { id: 3, username: "admin", password: "$2a$10$rOzJqKqNqKqNqKqNqKqNqO", email: "admin@example.com" },
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    // Validation
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    if (username.length < 3 || password.length < 6) {
      return NextResponse.json({ error: "Invalid username or password format" }, { status: 400 })
    }

    // Mock authentication - accepts any username/password as per requirements
    // In production, verify against actual database with bcrypt
    const user = mockUsers.find((u) => u.username === username) || {
      id: Date.now(),
      username,
      email: `${username}@example.com`,
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
      },
      JWT_SECRET,
    )

    return NextResponse.json({
      success: true,
      message: "Authentication successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
