import nodemailer from "nodemailer"

// Email transporter configuration
const transporter = nodemailer.createTransport({
  // Fixed: removed 'er' from createTransporter
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number.parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // Use TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // For development only
  },
})

export async function sendResultEmail(params: {
  email: string
  quiz: any
  submission: any
  evaluation: any
}) {
  try {
    const { email, quiz, submission, evaluation } = params

    // Validate email address
    if (!isValidEmail(email)) {
      throw new Error("Invalid email address")
    }

    const percentage = Math.round((evaluation.score / quiz.questions.length) * 100)
    const grade = getGrade(percentage)
    const encouragement = getEncouragementMessage(percentage)

    const htmlContent = generateEmailHTML({
      quiz,
      submission,
      evaluation,
      percentage,
      grade,
      encouragement,
    })

    const textContent = generateEmailText({
      quiz,
      submission,
      evaluation,
      percentage,
      grade,
    })

    const mailOptions = {
      from: process.env.SMTP_FROM || "AI Quizzer <noreply@aiquizzer.com>",
      to: email,
      subject: `Quiz Results: ${quiz.title} - ${percentage}% (${grade})`,
      html: htmlContent,
      text: textContent,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Email sent successfully:", info.messageId)

    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error) {
    console.error("Email sending error:", error)
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

function generateEmailHTML(params: {
  quiz: any
  submission: any
  evaluation: any
  percentage: number
  grade: string
  encouragement: string
}): string {
  const { quiz, submission, evaluation, percentage, grade, encouragement } = params

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Quiz Results</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .score-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #667eea; }
        .feedback-section { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .suggestions { background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #2196F3; }
        .grade { font-size: 2em; font-weight: bold; color: ${getGradeColor(grade)}; }
        .percentage { font-size: 1.5em; margin: 10px 0; }
        .question-feedback { margin: 15px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎓 Quiz Results</h1>
        <h2>${quiz.title}</h2>
      </div>
      
      <div class="content">
        <div class="score-card">
          <h3>Your Performance</h3>
          <div class="grade">${grade}</div>
          <div class="percentage">${percentage}%</div>
          <p><strong>Score:</strong> ${evaluation.score}/${quiz.questions.length}</p>
          <p><strong>Subject:</strong> ${quiz.subject}</p>
          <p><strong>Grade Level:</strong> ${quiz.gradeLevel}</p>
          <p><strong>Difficulty:</strong> ${quiz.difficulty}</p>
          <p><strong>Completed:</strong> ${new Date(submission.completedAt).toLocaleString()}</p>
        </div>
        
        <div class="feedback-section">
          <h3>📝 Detailed Feedback</h3>
          ${evaluation.feedback
            .map(
              (fb: string, i: number) => `
              <div class="question-feedback">
                <strong>Question ${i + 1}:</strong> ${fb}
              </div>
            `,
            )
            .join("")}
        </div>
        
        <div class="suggestions">
          <h3>💡 Suggestions for Improvement</h3>
          ${evaluation.suggestions.map((suggestion: string) => `<p>• ${suggestion}</p>`).join("")}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="font-size: 18px; color: #667eea;">${encouragement}</p>
        </div>
      </div>
      
      <div class="footer">
        <p>Keep practicing and learning! 📚✨</p>
        <p style="font-size: 12px; color: #999;">
          This email was sent by AI Quizzer. If you have any questions, please contact support.
        </p>
      </div>
    </body>
    </html>
  `
}

function generateEmailText(params: {
  quiz: any
  submission: any
  evaluation: any
  percentage: number
  grade: string
}): string {
  const { quiz, submission, evaluation, percentage, grade } = params

  return `
QUIZ RESULTS - ${quiz.title}

Your Performance:
- Grade: ${grade}
- Score: ${evaluation.score}/${quiz.questions.length} (${percentage}%)
- Subject: ${quiz.subject}
- Grade Level: ${quiz.gradeLevel}
- Difficulty: ${quiz.difficulty}
- Completed: ${new Date(submission.completedAt).toLocaleString()}

Detailed Feedback:
${evaluation.feedback.map((fb: string, i: number) => `Question ${i + 1}: ${fb}`).join("\n")}

Suggestions for Improvement:
${evaluation.suggestions.map((suggestion: string) => `• ${suggestion}`).join("\n")}

Keep practicing and learning!

---
This email was sent by AI Quizzer.
  `.trim()
}

function getGrade(percentage: number): string {
  if (percentage >= 95) return "A+"
  if (percentage >= 90) return "A"
  if (percentage >= 85) return "A-"
  if (percentage >= 80) return "B+"
  if (percentage >= 75) return "B"
  if (percentage >= 70) return "B-"
  if (percentage >= 65) return "C+"
  if (percentage >= 60) return "C"
  if (percentage >= 55) return "C-"
  if (percentage >= 50) return "D"
  return "F"
}

function getGradeColor(grade: string): string {
  if (grade.startsWith("A")) return "#4CAF50" // Green
  if (grade.startsWith("B")) return "#2196F3" // Blue
  if (grade.startsWith("C")) return "#FF9800" // Orange
  if (grade.startsWith("D")) return "#FF5722" // Deep Orange
  return "#F44336" // Red
}

function getEncouragementMessage(percentage: number): string {
  if (percentage >= 90) return "Outstanding work! You've mastered this topic! 🌟"
  if (percentage >= 80) return "Great job! You're doing really well! 👏"
  if (percentage >= 70) return "Good effort! You're on the right track! 💪"
  if (percentage >= 60) return "Nice try! Keep practicing and you'll improve! 📈"
  if (percentage >= 50) return "Don't give up! Every mistake is a learning opportunity! 🎯"
  return "Keep going! Learning takes time and practice! 🚀"
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Test email configuration
export async function testEmailConfiguration(): Promise<boolean> {
  try {
    await transporter.verify()
    return true
  } catch (error) {
    console.error("Email configuration test failed:", error)
    return false
  }
}

// Send test email
export async function sendTestEmail(toEmail: string): Promise<void> {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || "AI Quizzer <noreply@aiquizzer.com>",
      to: toEmail,
      subject: "AI Quizzer - Email Configuration Test",
      html: `
        <h2>Email Configuration Test</h2>
        <p>If you're reading this, your email configuration is working correctly!</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
      text: `
        Email Configuration Test
        
        If you're reading this, your email configuration is working correctly!
        Timestamp: ${new Date().toISOString()}
      `,
    }

    await transporter.sendMail(mailOptions)
    console.log("Test email sent successfully")
  } catch (error) {
    console.error("Test email failed:", error)
    throw error
  }
}
