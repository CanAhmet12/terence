'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Lightbulb, Target, BookOpen } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Recommendation {
  type: 'study' | 'practice' | 'review'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
}

export default function AICoachInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loadingRec, setLoadingRec] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchRecommendations()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchRecommendations = async () => {
    setLoadingRec(true)
    try {
      const response = await fetch('/api/v1/ai-coach/recommendations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      })

      if (!response.ok) throw new Error('Failed')

      const data = await response.json()
      setRecommendations(data.recommendations || [])
    } catch (err) {
      console.error('Failed to fetch recommendations:', err)
    } finally {
      setLoadingRec(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/v1/ai-coach/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          conversation_history: messages.slice(-5), // Last 5 messages for context
        }),
      })

      if (!response.ok) throw new Error('Failed')

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      console.error('Chat failed:', err)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Üzgünüm, şu anda bir sorun yaşıyorum. Lütfen daha sonra tekrar deneyin.',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAction = async (action: 'explain' | 'practice' | 'review') => {
    const prompts = {
      explain: 'Son yaptığım hataları açıkla ve nasıl düzeltebileceğimi anlat.',
      practice: 'Zayıf olduğum konularda pratik sorular öner.',
      review: 'Bugün neler çalışmalıyım?',
    }

    setInput(prompts[action])
    setTimeout(handleSend, 100)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-[700px]">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white bg-opacity-20 rounded-full">
                    <Bot className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">AI Mentor</h2>
                    <p className="text-blue-100 text-sm">7/24 senin yanında</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 mt-12">
                    <Bot className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">Merhaba! Ben senin AI mentorunum.</p>
                    <p className="text-sm">Çalışma konusunda sana yardımcı olmak için buradayım.</p>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="bg-gray-100 rounded-2xl px-4 py-3">
                      <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => handleQuickAction('explain')}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    📖 Hatalarımı Açıkla
                  </button>
                  <button
                    onClick={() => handleQuickAction('practice')}
                    className="px-3 py-1 text-sm bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-colors"
                  >
                    🎯 Pratik Öner
                  </button>
                  <button
                    onClick={() => handleQuickAction('review')}
                    className="px-3 py-1 text-sm bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
                  >
                    📅 Bugün Ne Çalışayım?
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Mesajını yaz..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations Sidebar */}
          <div className="space-y-6">
            {/* AI Recommendations */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                AI Önerileri
              </h3>

              {loadingRec ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-l-4 ${
                        rec.priority === 'high'
                          ? 'bg-red-50 border-red-500'
                          : rec.priority === 'medium'
                          ? 'bg-yellow-50 border-yellow-500'
                          : 'bg-blue-50 border-blue-500'
                      }`}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        {rec.type === 'study' && <BookOpen className="w-4 h-4 mt-0.5" />}
                        {rec.type === 'practice' && <Target className="w-4 h-4 mt-0.5" />}
                        {rec.type === 'review' && <Lightbulb className="w-4 h-4 mt-0.5" />}
                        <h4 className="font-semibold text-sm">{rec.title}</h4>
                      </div>
                      <p className="text-xs text-gray-600">{rec.description}</p>
                    </div>
                  ))}

                  {recommendations.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Henüz öneri yok. Biraz daha çalış!
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={fetchRecommendations}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Yenile
              </button>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4">💡 Bilgin Olsun</h3>
              <div className="space-y-3 text-sm">
                <p>• AI Coach sana özel çalışma planı hazırlıyor</p>
                <p>• Her gün en az 30 dakika çalışmalısın</p>
                <p>• Zayıf konularına odaklan</p>
                <p>• Düzenli tekrar başarının anahtarı</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
