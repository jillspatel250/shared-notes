import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { generateQuizWithAI } from "@/lib/ai"
import { saveQuiz } from "@/lib/database"
import { validateQuizGeneration } from "@/lib/validation"

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validation = validateQuizGeneration(body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { subject, gradeLevel, difficulty, questionCount = 5 } = body

    // Generate quiz using AI
    const quiz = await generateQuizWithAI({
      subject,
      gradeLevel,
      difficulty: difficulty || "medium",
      questionCount,
    })

    // Save quiz to database
    const savedQuiz = await saveQuiz({
      ...quiz,
      userId: authResult.user.userId,
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: "Quiz generated successfully",
      quiz: {
        id: savedQuiz.id,
        title: savedQuiz.title,
        subject: savedQuiz.subject,
        gradeLevel: savedQuiz.gradeLevel,
        difficulty: savedQuiz.difficulty,
        questions: savedQuiz.questions.map((q: any) => ({
          id: q.id,
          question: q.question,
          options: q.options,
          type: q.type,
        })), // Remove correct answers from response
        createdAt: savedQuiz.createdAt,
      },
    })
  } catch (error) {
    console.error("Quiz generation error:", error)
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 })
  }
}
