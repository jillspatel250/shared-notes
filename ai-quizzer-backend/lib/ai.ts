import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "your-groq-api-key",
})

export interface QuizGenerationParams {
  subject: string
  gradeLevel: string
  difficulty: string
  questionCount: number
}

export interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: string
  type: "multiple-choice" | "true-false"
  explanation?: string
}

export interface Quiz {
  id: string
  title: string
  subject: string
  gradeLevel: string
  difficulty: string
  questions: Question[]
}

export async function generateQuizWithAI(params: QuizGenerationParams): Promise<Quiz> {
  try {
    const prompt = `Generate a ${params.difficulty} level quiz for ${params.subject} suitable for grade ${params.gradeLevel} students. 
    Create exactly ${params.questionCount} multiple-choice questions.
    
    Requirements:
    - Questions should be educational and age-appropriate
    - Each question should have 4 options (A, B, C, D)
    - Include clear explanations for correct answers
    - Vary the difficulty within the specified level
    - Cover different aspects of the subject
    - Make distractors plausible but clearly incorrect
    
    Return the response in the following JSON format:
    {
      "title": "Descriptive quiz title",
      "questions": [
        {
          "id": "q1",
          "question": "Clear, specific question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "Option A",
          "type": "multiple-choice",
          "explanation": "Brief explanation of why this answer is correct"
        }
      ]
    }
    
    Ensure all questions are unique and educational.`

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are an expert educator who creates high-quality educational quizzes. Always respond with valid JSON only. Do not include any text outside the JSON structure.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama3-8b-8192",
      temperature: 0.7,
      max_tokens: 2000,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error("No response from AI service")
    }

    // Clean the response to ensure it's valid JSON
    const cleanedResponse = response.trim()
    let quizData: any

    try {
      quizData = JSON.parse(cleanedResponse)
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      console.error("Raw response:", response)
      throw new Error("Invalid JSON response from AI service")
    }

    // Validate the structure
    if (!quizData.title || !quizData.questions || !Array.isArray(quizData.questions)) {
      throw new Error("Invalid quiz structure from AI service")
    }

    // Ensure we have the right number of questions
    if (quizData.questions.length !== params.questionCount) {
      console.warn(`Expected ${params.questionCount} questions, got ${quizData.questions.length}`)
    }

    return {
      id: `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: quizData.title,
      subject: params.subject,
      gradeLevel: params.gradeLevel,
      difficulty: params.difficulty,
      questions: quizData.questions.map((q: any, index: number) => ({
        ...q,
        id: q.id || `q${index + 1}`,
        type: q.type || "multiple-choice",
      })),
    }
  } catch (error) {
    console.error("AI Quiz Generation Error:", error)
    // Fallback quiz if AI fails
    return generateFallbackQuiz(params)
  }
}

export async function evaluateQuizWithAI(
  quiz: Quiz,
  answers: string[],
): Promise<{
  score: number
  feedback: string[]
  suggestions: string[]
}> {
  try {
    const prompt = `Evaluate the following quiz answers and provide detailed feedback:
    
    Quiz: ${quiz.title} (${quiz.subject} - Grade ${quiz.gradeLevel})
    
    Questions and Answers:
    ${quiz.questions
      .map(
        (q, i) => `
    Q${i + 1}: ${q.question}
    Options: ${q.options.join(", ")}
    Correct Answer: ${q.correctAnswer}
    Student Answer: ${answers[i] || "No answer provided"}
    Explanation: ${q.explanation || "N/A"}
    `,
      )
      .join("\n")}
    
    Please provide:
    1. Calculate the total score (number of correct answers)
    2. Detailed feedback for each question (whether correct/incorrect and why)
    3. Two specific suggestions for improvement based on the mistakes made
    4. Encouraging and constructive tone throughout
    
    Return in JSON format:
    {
      "score": number,
      "feedback": ["detailed feedback for each question"],
      "suggestions": ["specific suggestion 1", "specific suggestion 2"]
    }`

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are an expert teacher who provides constructive feedback on student quiz performance. Always respond with valid JSON only. Be encouraging while being honest about areas for improvement.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama3-8b-8192",
      temperature: 0.3,
      max_tokens: 1500,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error("No response from AI evaluation service")
    }

    const cleanedResponse = response.trim()
    let evaluationData: any

    try {
      evaluationData = JSON.parse(cleanedResponse)
    } catch (parseError) {
      console.error("Evaluation JSON parse error:", parseError)
      throw new Error("Invalid JSON response from AI evaluation service")
    }

    // Validate the evaluation structure
    if (
      typeof evaluationData.score !== "number" ||
      !Array.isArray(evaluationData.feedback) ||
      !Array.isArray(evaluationData.suggestions)
    ) {
      throw new Error("Invalid evaluation structure from AI service")
    }

    return {
      score: Math.max(0, Math.min(evaluationData.score, quiz.questions.length)), // Ensure score is within valid range
      feedback: evaluationData.feedback,
      suggestions: evaluationData.suggestions,
    }
  } catch (error) {
    console.error("AI Evaluation Error:", error)
    // Fallback evaluation
    return evaluateFallback(quiz, answers)
  }
}

export async function generateHintWithAI(params: {
  question: string
  subject: string
  gradeLevel: string
  options: string[]
}): Promise<string> {
  try {
    const prompt = `Provide a helpful hint for this ${params.subject} question for grade ${params.gradeLevel} students:
    
    Question: ${params.question}
    Options: ${params.options.join(", ")}
    
    Guidelines for the hint:
    - Guide the student toward the correct answer without giving it away directly
    - Help them think through the problem logically
    - Use age-appropriate language for grade ${params.gradeLevel}
    - Focus on the key concept or strategy needed
    - Be encouraging and supportive
    - Keep it concise (1-2 sentences)
    
    Provide only the hint text, no additional formatting or explanation.`

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a helpful tutor who provides educational hints that guide students to discover answers themselves. Always provide just the hint text without any additional formatting.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama3-8b-8192",
      temperature: 0.5,
      max_tokens: 200,
    })

    const hint = completion.choices[0]?.message?.content?.trim()

    if (!hint) {
      throw new Error("No hint generated")
    }

    return hint
  } catch (error) {
    console.error("AI Hint Generation Error:", error)
    return generateFallbackHint(params)
  }
}

function generateFallbackQuiz(params: QuizGenerationParams): Quiz {
  const fallbackQuestions: Question[] = [
    {
      id: "q1",
      question: `What is a fundamental concept in ${params.subject}?`,
      options: ["Understanding basic principles", "Memorizing facts only", "Ignoring the subject", "Avoiding practice"],
      correctAnswer: "Understanding basic principles",
      type: "multiple-choice",
      explanation: "Understanding basic principles is essential for mastering any subject.",
    },
  ]

  // Add more fallback questions based on question count
  for (let i = 2; i <= params.questionCount; i++) {
    fallbackQuestions.push({
      id: `q${i}`,
      question: `Which approach is most effective for learning ${params.subject}?`,
      options: [
        "Regular practice and review",
        "Cramming before tests",
        "Passive reading only",
        "Avoiding difficult topics",
      ],
      correctAnswer: "Regular practice and review",
      type: "multiple-choice",
      explanation: "Regular practice and review help build understanding and retention.",
    })
  }

  return {
    id: `fallback_quiz_${Date.now()}`,
    title: `${params.subject} Quiz - Grade ${params.gradeLevel}`,
    subject: params.subject,
    gradeLevel: params.gradeLevel,
    difficulty: params.difficulty,
    questions: fallbackQuestions.slice(0, params.questionCount),
  }
}

function evaluateFallback(
  quiz: Quiz,
  answers: string[],
): {
  score: number
  feedback: string[]
  suggestions: string[]
} {
  let score = 0
  const feedback: string[] = []

  quiz.questions.forEach((question, index) => {
    const studentAnswer = answers[index]
    const isCorrect = studentAnswer === question.correctAnswer

    if (isCorrect) {
      score++
      feedback.push(`Question ${index + 1}: Correct! ${question.explanation || "Well done!"}`)
    } else {
      feedback.push(
        `Question ${index + 1}: Incorrect. The correct answer is "${question.correctAnswer}". ${question.explanation || ""}`,
      )
    }
  })

  const percentage = Math.round((score / quiz.questions.length) * 100)
  const suggestions = [
    percentage < 50
      ? `Focus on reviewing the fundamental concepts in ${quiz.subject}. Consider studying the topics covered in the questions you missed.`
      : percentage < 80
        ? `Good effort! Review the specific topics where you made mistakes and practice similar problems.`
        : "Excellent work! Continue practicing to maintain your strong understanding of the subject.",

    `Practice more questions in ${quiz.subject} for grade ${quiz.gradeLevel} to strengthen your knowledge and build confidence.`,
  ]

  return {
    score,
    feedback,
    suggestions,
  }
}

function generateFallbackHint(params: {
  question: string
  subject: string
  gradeLevel: string
  options: string[]
}): string {
  const subjectHints: { [key: string]: string } = {
    mathematics: "Think about the mathematical operations or formulas that apply to this problem.",
    science: "Consider the scientific principles and natural laws related to this topic.",
    history: "Think about the time period, key figures, and cause-and-effect relationships.",
    english: "Focus on the main idea, context clues, and literary elements.",
    geography: "Consider location, climate, physical features, and human activities.",
  }

  const subjectKey = params.subject.toLowerCase()
  const specificHint = subjectHints[subjectKey] || "Think about the key concepts related to this topic."

  return `${specificHint} Try to eliminate the options that seem obviously incorrect first.`
}
