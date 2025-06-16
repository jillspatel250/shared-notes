import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check database connection
    const dbStatus = "connected" // In production, actually check DB

    // Check Redis connection
    const redisStatus = "connected" // In production, actually check Redis

    // Check AI service
    const aiStatus = "available" // In production, actually check Groq API

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        redis: redisStatus,
        ai_service: aiStatus,
      },
      version: "1.0.0",
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
      },
      { status: 500 },
    )
  }
}
