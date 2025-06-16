import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { getQuizHistory } from "@/lib/database"
import { getFromCache, setCache, CACHE_KEYS } from "@/lib/cache"

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Extract filters
    const filters = {
      userId: authResult.user.userId,
      grade: searchParams.get("grade"),
      subject: searchParams.get("subject"),
      minMarks: searchParams.get("minMarks") ? Number.parseInt(searchParams.get("minMarks")!) : undefined,
      maxMarks: searchParams.get("maxMarks") ? Number.parseInt(searchParams.get("maxMarks")!) : undefined,
      from: searchParams.get("from"),
      to: searchParams.get("to"),
      page: Number.parseInt(searchParams.get("page") || "1"),
      limit: Math.min(Number.parseInt(searchParams.get("limit") || "10"), 50), // Max 50 items per page
    }

    // Validate pagination
    if (filters.page < 1) {
      return NextResponse.json({ error: "Page must be greater than 0" }, { status: 400 })
    }

    if (filters.limit < 1) {
      return NextResponse.json({ error: "Limit must be greater than 0" }, { status: 400 })
    }

    // Validate date format if provided
    if (filters.from && !isValidDate(filters.from)) {
      return NextResponse.json({ error: "Invalid from date format. Use DD/MM/YYYY" }, { status: 400 })
    }

    if (filters.to && !isValidDate(filters.to)) {
      return NextResponse.json({ error: "Invalid to date format. Use DD/MM/YYYY" }, { status: 400 })
    }

    // Validate marks range
    if (filters.minMarks !== undefined && filters.minMarks < 0) {
      return NextResponse.json({ error: "Minimum marks cannot be negative" }, { status: 400 })
    }

    if (filters.maxMarks !== undefined && filters.maxMarks < 0) {
      return NextResponse.json({ error: "Maximum marks cannot be negative" }, { status: 400 })
    }

    if (filters.minMarks !== undefined && filters.maxMarks !== undefined && filters.minMarks > filters.maxMarks) {
      return NextResponse.json({ error: "Minimum marks cannot be greater than maximum marks" }, { status: 400 })
    }

    // Check cache first
    const cacheKey = CACHE_KEYS.USER_HISTORY(filters.userId, JSON.stringify(filters))
    const cachedResult = await getFromCache(cacheKey)

    if (cachedResult) {
      return NextResponse.json({
        success: true,
        data: cachedResult.data,
        pagination: cachedResult.pagination,
        cached: true,
      })
    }

    // Get history from database
    const history = await getQuizHistory(filters)

    const result = {
      data: history.data,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: history.total,
        totalPages: Math.ceil(history.total / filters.limit),
        hasNext: filters.page < Math.ceil(history.total / filters.limit),
        hasPrev: filters.page > 1,
      },
    }

    // Cache the result for 2 minutes
    await setCache(cacheKey, result, 120)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error("Quiz history error:", error)
    return NextResponse.json({ error: "Failed to fetch quiz history" }, { status: 500 })
  }
}

function isValidDate(dateString: string): boolean {
  const regex = /^\d{2}\/\d{2}\/\d{4}$/
  if (!regex.test(dateString)) return false

  const [day, month, year] = dateString.split("/").map(Number)
  const date = new Date(year, month - 1, day)

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}
