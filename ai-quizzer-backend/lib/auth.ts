import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export interface AuthUser {
  userId: number
  username: string
}

export interface AuthResult {
  success: boolean
  user?: AuthUser
  error?: string
}

export async function verifyToken(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { success: false, error: "No token provided" }
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    if (!token || token.trim().length === 0) {
      return { success: false, error: "Invalid token format" }
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any

    // Validate token payload
    if (!decoded.userId || !decoded.username) {
      return { success: false, error: "Invalid token payload" }
    }

    return {
      success: true,
      user: {
        userId: decoded.userId,
        username: decoded.username,
      },
    }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { success: false, error: "Token expired" }
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return { success: false, error: "Invalid token" }
    }
    console.error("Token verification error:", error)
    return { success: false, error: "Authentication failed" }
  }
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      userId: user.userId,
      username: user.username,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    },
    JWT_SECRET,
  )
}

export function decodeToken(token: string): any {
  try {
    return jwt.decode(token)
  } catch (error) {
    console.error("Token decode error:", error)
    return null
  }
}
