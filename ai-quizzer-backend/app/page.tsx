import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Database, Shield, Zap, Mail, CloudIcon as Cache } from "lucide-react"

export default function HomePage() {
  const features = [
    { icon: Shield, title: "JWT Authentication", description: "Secure token-based authentication" },
    { icon: Zap, title: "AI Quiz Generation", description: "Generate quizzes using AI based on grade level" },
    { icon: Database, title: "Quiz Management", description: "Store and retrieve quiz history with filters" },
    { icon: CheckCircle, title: "Auto Evaluation", description: "AI-powered answer evaluation and scoring" },
    { icon: Mail, title: "Email Notifications", description: "Send quiz results via email" },
    { icon: Cache, title: "Redis Caching", description: "Optimized performance with caching layer" },
  ]

  const endpoints = [
    { method: "POST", path: "/api/auth/login", description: "User authentication" },
    { method: "POST", path: "/api/quiz/generate", description: "Generate new quiz" },
    { method: "POST", path: "/api/quiz/submit", description: "Submit quiz answers" },
    { method: "GET", path: "/api/quiz/history", description: "Get quiz history with filters" },
    { method: "POST", path: "/api/quiz/retry", description: "Retry existing quiz" },
    { method: "POST", path: "/api/quiz/hint", description: "Get hints for questions" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Quizzer Backend</h1>
          <p className="text-xl text-gray-600 mb-6">Intelligent quiz generation and evaluation microservice</p>
          <Badge variant="secondary" className="text-sm px-4 py-2">
            RESTful API • JWT Auth • AI Powered
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <feature.icon className="h-8 w-8 text-blue-600" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">API Endpoints</CardTitle>
            <CardDescription>Available REST API endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {endpoints.map((endpoint, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Badge variant={endpoint.method === "GET" ? "secondary" : "default"} className="font-mono">
                      {endpoint.method}
                    </Badge>
                    <code className="text-sm font-mono text-gray-700">{endpoint.path}</code>
                  </div>
                  <span className="text-sm text-gray-600">{endpoint.description}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Technology Stack</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>
                  • <strong>Framework:</strong> Next.js 15 with App Router
                </li>
                <li>
                  • <strong>Database:</strong> PostgreSQL with SQL scripts
                </li>
                <li>
                  • <strong>Authentication:</strong> JWT tokens
                </li>
                <li>
                  • <strong>AI Integration:</strong> Groq AI for quiz generation
                </li>
                <li>
                  • <strong>Caching:</strong> Redis for performance
                </li>
                <li>
                  • <strong>Email:</strong> Nodemailer for notifications
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deployment Ready</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>
                  • <strong>Docker:</strong> Containerized application
                </li>
                <li>
                  • <strong>Documentation:</strong> Complete API docs
                </li>
                <li>
                  • <strong>Database:</strong> Migration scripts included
                </li>
                <li>
                  • <strong>Testing:</strong> Postman collection provided
                </li>
                <li>
                  • <strong>Monitoring:</strong> Error handling & logging
                </li>
                <li>
                  • <strong>Security:</strong> Input validation & sanitization
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
