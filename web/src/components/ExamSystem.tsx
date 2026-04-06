'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Clock, AlertTriangle, Lock, Eye, EyeOff } from 'lucide-react'
import { announce } from '@/hooks/useAccessibility'

interface ExamSystemProps {
  examId: number
  sessionId: number
  duration: number // minutes
  questions: Array<{
    id: number
    question: string
    options: string[]
    image_url?: string
  }>
  onSubmit: (answers: Record<number, number>) => void
  onTimeUp: () => void
}

export default function ExamSystem({
  examId,
  sessionId,
  duration,
  questions,
  onSubmit,
  onTimeUp,
}: ExamSystemProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(duration * 60) // seconds
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [warnings, setWarnings] = useState<string[]>([])
  const [isLocked, setIsLocked] = useState(false)
  const [showWarningModal, setShowWarningModal] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0) {
      handleAutoSubmit('Süre doldu')
      return
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining])

  // Voice warnings at specific times
  useEffect(() => {
    if (timeRemaining === 300) {
      announce('5 dakika kaldı', 'assertive')
    } else if (timeRemaining === 60) {
      announce('1 dakika kaldı', 'assertive')
    }
  }, [timeRemaining])

  // Enter fullscreen on mount
  useEffect(() => {
    requestFullscreen()
    enableLockdown()

    return () => {
      disableLockdown()
    }
  }, [])

  const requestFullscreen = () => {
    if (containerRef.current) {
      containerRef.current.requestFullscreen?.()
        .then(() => setIsFullscreen(true))
        .catch(() => {
          addWarning('Tam ekran modu gereklidir')
          setShowWarningModal(true)
        })
    }
  }

  const enableLockdown = () => {
    // Prevent right-click
    document.addEventListener('contextmenu', preventContextMenu)
    
    // Detect tab switch
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Prevent keyboard shortcuts
    document.addEventListener('keydown', preventKeyboardShortcuts)
    
    // Detect copy/paste
    document.addEventListener('copy', handleCopy)
    document.addEventListener('paste', handlePaste)
    
    // Prevent text selection
    document.body.style.userSelect = 'none'
    
    // Track idle time
    startIdleTimer()
  }

  const disableLockdown = () => {
    document.removeEventListener('contextmenu', preventContextMenu)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    document.removeEventListener('keydown', preventKeyboardShortcuts)
    document.removeEventListener('copy', handleCopy)
    document.removeEventListener('paste', handlePaste)
    document.body.style.userSelect = ''
    
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
    }
  }

  const preventContextMenu = (e: MouseEvent) => {
    e.preventDefault()
    addWarning('Sağ tık devre dışı')
  }

  const handleVisibilityChange = () => {
    if (document.hidden) {
      const newCount = tabSwitchCount + 1
      setTabSwitchCount(newCount)
      addWarning(`Sekme değiştirme tespit edildi (${newCount}. kez)`)
      
      // Lock after 3 tab switches
      if (newCount >= 3) {
        lockExam('Çok fazla sekme değiştirme')
      }
    }
  }

  const preventKeyboardShortcuts = (e: KeyboardEvent) => {
    // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
      (e.ctrlKey && e.key === 'U')
    ) {
      e.preventDefault()
      addWarning('Geliştirici araçları kullanılamaz')
    }

    // Prevent Alt+Tab, Cmd+Tab
    if (e.altKey && e.key === 'Tab' || e.metaKey && e.key === 'Tab') {
      e.preventDefault()
    }
  }

  const handleCopy = (e: ClipboardEvent) => {
    e.preventDefault()
    addWarning('Kopyalama tespit edildi')
  }

  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault()
    addWarning('Yapıştırma tespit edildi')
  }

  const startIdleTimer = () => {
    const checkIdle = () => {
      const now = Date.now()
      const idleTime = now - lastActivityRef.current
      
      if (idleTime > 300000) { // 5 minutes
        addWarning('Uzun süredir hareketsizlik')
      }
      
      idleTimerRef.current = setTimeout(checkIdle, 60000) // Check every minute
    }
    
    checkIdle()
    
    // Track activity
    const trackActivity = () => {
      lastActivityRef.current = Date.now()
    }
    
    document.addEventListener('mousemove', trackActivity)
    document.addEventListener('keydown', trackActivity)
  }

  const addWarning = (message: string) => {
    setWarnings((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
    
    // Log to backend
    logSecurityEvent('warning', message)
  }

  const lockExam = (reason: string) => {
    setIsLocked(true)
    addWarning(`Sınav kilitlendi: ${reason}`)
    logSecurityEvent('lock', reason)
    
    // Auto-submit after lock
    setTimeout(() => {
      handleAutoSubmit(reason)
    }, 5000)
  }

  const logSecurityEvent = async (type: string, message: string) => {
    try {
      await fetch(`/api/v1/exams/sessions/${sessionId}/security-log`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: type,
          message,
          tab_switch_count: tabSwitchCount,
          timestamp: new Date().toISOString(),
        }),
      })
    } catch (err) {
      console.error('Security log failed:', err)
    }
  }

  const handleAnswerSelect = (questionId: number, optionIndex: number) => {
    if (isLocked) return
    
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }))
  }

  const handleAutoSubmit = (reason: string) => {
    announce('Sınav otomatik olarak gönderiliyor', 'assertive')
    logSecurityEvent('auto_submit', reason)
    onTimeUp()
    onSubmit(answers)
  }

  const handleManualSubmit = () => {
    if (confirm('Sınavı bitirmek istediğinizden emin misiniz?')) {
      onSubmit(answers)
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const answeredCount = Object.keys(answers).length
  const progress = (answeredCount / questions.length) * 100

  if (isLocked) {
    return (
      <div className="fixed inset-0 bg-red-900 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md text-center">
          <Lock className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sınav Kilitlendi</h2>
          <p className="text-gray-600 mb-4">
            Güvenlik ihlali nedeniyle sınav kilitlendi. Sınavınız otomatik olarak gönderilecek.
          </p>
          <div className="bg-red-100 rounded p-4 text-left text-sm">
            <strong>İhlaller:</strong>
            <ul className="list-disc list-inside mt-2">
              {warnings.map((warning, index) => (
                <li key={index} className="text-red-800">{warning}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gray-50 p-4"
    >
      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Uyarı</h3>
            <p className="text-gray-600 mb-4">
              Sınav tam ekran modunda olmalıdır. Lütfen tam ekrana geçin.
            </p>
            <button
              onClick={() => {
                requestFullscreen()
                setShowWarningModal(false)
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Tam Ekrana Geç
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-lg rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sınav</h1>
            <p className="text-sm text-gray-600">
              Soru {currentQuestion + 1} / {questions.length}
            </p>
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-2 px-6 py-3 rounded-lg ${
            timeRemaining < 300 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
          }`}>
            <Clock className="w-6 h-6" />
            <span className="text-2xl font-mono font-bold">
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{answeredCount} soru cevaplandı</span>
            <span>%{Math.round(progress)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Security Warnings */}
        {tabSwitchCount > 0 && (
          <div className="mt-4 bg-yellow-100 border border-yellow-400 rounded p-3">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">
                Güvenlik Uyarısı: {tabSwitchCount} sekme değişimi tespit edildi
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Question */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-4">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Soru {currentQuestion + 1}:
          </h2>
          <p className="text-gray-800 text-lg leading-relaxed">
            {questions[currentQuestion].question}
          </p>
          
          {questions[currentQuestion].image_url && (
            <img
              src={questions[currentQuestion].image_url}
              alt="Soru görseli"
              className="mt-4 max-w-full rounded-lg"
              onContextMenu={(e) => e.preventDefault()}
            />
          )}
        </div>

        {/* Options */}
        <div className="space-y-3">
          {questions[currentQuestion].options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(questions[currentQuestion].id, index)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                answers[questions[currentQuestion].id] === index
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  answers[questions[currentQuestion].id] === index
                    ? 'border-blue-600 bg-blue-600'
                    : 'border-gray-400'
                }`}>
                  {answers[questions[currentQuestion].id] === index && (
                    <div className="w-3 h-3 bg-white rounded-full" />
                  )}
                </div>
                <span className="text-gray-800">{String.fromCharCode(65 + index)}) {option}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-lg rounded-lg p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="px-6 py-2 bg-gray-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
          >
            ← Önceki
          </button>

          <div className="flex gap-2 overflow-x-auto max-w-md">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  index === currentQuestion
                    ? 'bg-blue-600 text-white'
                    : answers[questions[index].id] !== undefined
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={handleManualSubmit}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
            >
              Sınavı Bitir
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Sonraki →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
