import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { generateHintWithAI } from "@/lib/ai"
import { getQuizById, saveHintRequest } from "@/lib/database"
import { getFromCache, setCache } from "@/lib/cache"

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { quizId, questionId } = body

    // Validation
    if (!quizId || !questionId) {
      return NextResponse.json({ error: "Quiz ID and Question ID are required" }, { status: 400 })
    }

    if (typeof quizId !== "string" || typeof questionId !== "string") {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 })
    }

    // Get quiz and find question
    const quiz = await getQuizById(quizId)
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    const question = quiz.questions.find((q: any) => q.id === questionId)
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    // Check cache for existing hint
    const cacheKey = `hint:${quizId}:${questionId}`
    const cachedHint = await getFromCache(cacheKey)

    if (cachedHint) {
      return NextResponse.json({
        success: true,
        hint: {
          questionId,
          text: cachedHint,
          timestamp: new Date().toISOString(),
          cached: true,
        },
      })
    }

    // Generate hint using AI
    const hint = await generateHintWithAI({
      question: question.question,
      subject: quiz.subject,
      gradeLevel: quiz.gradeLevel,
      options: question.options,
    })

    // Cache the hint for 1 hour
    await setCache(cacheKey, hint, 3600)

    // Save hint request for analytics (optional)
    try {
      await saveHintRequest({
        quizId,
        questionId,
        userId: authResult.user.userId,
        hintText: hint,
      })
    } catch (saveError) {
      console.error("Failed to save hint request:", saveError)
      // Don't fail the request if saving fails
    }

    return NextResponse.json({
      success: true,
      hint: {
        questionId,
        text: hint,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Hint generation error:", error)
    return NextResponse.json({ error: "Failed to generate hint" }, { status: 500 })
  }
}
