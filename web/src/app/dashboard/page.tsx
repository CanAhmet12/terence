'use client'

import { useEffect, useState } from 'react'
import { 
  TrendingUp, TrendingDown, Book, Trophy, Clock, Target, 
  Flame, Award, BarChart3, Calendar 
} from 'lucide-react'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface DashboardData {
  overview: {
    total_questions: number
    total_correct: number
    overall_accuracy: number
    total_exams: number
    avg_exam_score: number
    total_study_hours: number
    current_level: number
    current_xp: number
    current_streak: number
  }
  subject_performance: Record<string, {
    total_questions: number
    correct_answers: number
    accuracy_rate: number
    avg_time_seconds: number
    trend: 'improving' | 'stable' | 'declining'
  }>
  study_time_analysis: {
    total_hours_30_days: number
    avg_daily_minutes: number
    study_days_count: number
    consistency_score: number
    by_activity_type: Record<string, number>
    peak_study_hours: Record<string, number>
  }
  progress_timeline: Array<{
    week_label: string
    questions_solved: number
    accuracy_rate: number
    study_minutes: number
  }>
}

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'subjects' | 'progress'>('overview')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/v1/analytics/user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      })

      if (!response.ok) throw new Error('Failed to fetch')

      const result = await response.json()
      setData(result.analytics)
      setLoading(false)
    } catch (err) {
      console.error('Dashboard fetch failed:', err)
      setLoading(false)
    }
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  const { overview, subject_performance, study_time_analysis, progress_timeline } = data

  // Güvenli dizi erişimi
  const safeTimeline = Array.isArray(progress_timeline) ? progress_timeline : []
  const safeSubjectPerf = (subject_performance && typeof subject_performance === 'object') ? subject_performance : {}
  const safeActivityType = (study_time_analysis?.by_activity_type && typeof study_time_analysis.by_activity_type === 'object') ? study_time_analysis.by_activity_type : {}

  // Chart data
  const progressChartData = {
    labels: safeTimeline.map((w) => w.week_label),
    datasets: [
      {
        label: 'Doğruluk Oranı (%)',
        data: safeTimeline.map((w) => w.accuracy_rate),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Çözülen Sorular',
        data: safeTimeline.map((w) => w.questions_solved),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  }

  const subjectChartData = {
    labels: Object.keys(safeSubjectPerf),
    datasets: [{
      label: 'Doğruluk Oranı',
      data: Object.values(safeSubjectPerf).map((s) => (s as Record<string, number>).accuracy_rate ?? 0),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(168, 85, 247, 0.8)',
      ],
    }],
  }

  const activityTypeData = {
    labels: Object.keys(safeActivityType).map((k) => {
      const labels: Record<string, string> = {
        'video_watch': 'Video İzleme',
        'question_solve': 'Soru Çözme',
        'exam': 'Sınav',
        'reading': 'Okuma',
      }
      return labels[k] || k
    }),
    datasets: [{
      data: Object.values(safeActivityType),
      backgroundColor: [
        '#3b82f6',
        '#10b981',
        '#f59e0b',
        '#8b5cf6',
      ],
    }],
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Panelim</h1>
          <p className="text-gray-600">Başarı yolculuğunu takip et</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Target className="w-8 h-8" />}
            title="Doğruluk Oranı"
            value={`%${overview.overall_accuracy.toFixed(1)}`}
            trend={overview.overall_accuracy >= 70 ? 'up' : 'down'}
            color="blue"
          />
          <StatCard
            icon={<Trophy className="w-8 h-8" />}
            title="Seviye"
            value={`${overview.current_level}`}
            subtitle={`${overview.current_xp} XP`}
            color="purple"
          />
          <StatCard
            icon={<Flame className="w-8 h-8" />}
            title="Streak"
            value={`${overview.current_streak} gün`}
            color="orange"
          />
          <StatCard
            icon={<Clock className="w-8 h-8" />}
            title="Çalışma Saati"
            value={`${overview.total_study_hours.toFixed(1)}h`}
            subtitle="Bu ay"
            color="green"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <div className="flex gap-4 p-4">
              <button
                onClick={() => setSelectedTab('overview')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedTab === 'overview'
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Genel Bakış
              </button>
              <button
                onClick={() => setSelectedTab('subjects')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedTab === 'subjects'
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Ders Analizi
              </button>
              <button
                onClick={() => setSelectedTab('progress')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedTab === 'progress'
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                İlerleme
              </button>
            </div>
          </div>

          <div className="p-6">
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Study Time by Activity */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Aktivite Dağılımı</h3>
                    <div className="h-64">
                      <Doughnut 
                        data={activityTypeData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                            },
                          },
                        }}
                      />
                    </div>
                  </div>

                  {/* Recent Performance */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Yakın Zamanda</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Book className="w-5 h-5 text-blue-600" />
                          <span className="text-gray-700">Çözülen Soru</span>
                        </div>
                        <span className="font-bold text-gray-900">{overview.total_questions}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Award className="w-5 h-5 text-green-600" />
                          <span className="text-gray-700">Doğru Cevap</span>
                        </div>
                        <span className="font-bold text-gray-900">{overview.total_correct}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <BarChart3 className="w-5 h-5 text-purple-600" />
                          <span className="text-gray-700">Sınav Ortalaması</span>
                        </div>
                        <span className="font-bold text-gray-900">{overview.avg_exam_score.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-orange-600" />
                          <span className="text-gray-700">Çalışma Günü</span>
                        </div>
                        <span className="font-bold text-gray-900">{study_time_analysis.study_days_count}/30</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'subjects' && (
              <div className="space-y-6">
                <div className="h-80">
                  <Bar
                    data={subjectChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                          title: {
                            display: true,
                            text: 'Doğruluk Oranı (%)',
                          },
                        },
                      },
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(subject_performance).map(([subject, perf]) => (
                    <div key={subject} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{subject}</h4>
                        <span className={`flex items-center gap-1 text-sm ${
                          perf.trend === 'improving' ? 'text-green-600' :
                          perf.trend === 'declining' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {perf.trend === 'improving' && <TrendingUp className="w-4 h-4" />}
                          {perf.trend === 'declining' && <TrendingDown className="w-4 h-4" />}
                          {perf.trend.charAt(0).toUpperCase() + perf.trend.slice(1)}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Doğruluk:</span>
                          <span className="font-medium">%{perf.accuracy_rate.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Soru Sayısı:</span>
                          <span className="font-medium">{perf.total_questions}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Ort. Süre:</span>
                          <span className="font-medium">{Math.round(perf.avg_time_seconds)}s</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTab === 'progress' && (
              <div>
                <div className="h-96">
                  <Line
                    data={progressChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: {
                        mode: 'index',
                        intersect: false,
                      },
                      scales: {
                        y: {
                          type: 'linear',
                          display: true,
                          position: 'left',
                          title: {
                            display: true,
                            text: 'Doğruluk Oranı (%)',
                          },
                        },
                        y1: {
                          type: 'linear',
                          display: true,
                          position: 'right',
                          title: {
                            display: true,
                            text: 'Soru Sayısı',
                          },
                          grid: {
                            drawOnChartArea: false,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({
  icon,
  title,
  value,
  subtitle,
  trend,
  color,
}: {
  icon: React.ReactNode
  title: string
  value: string
  subtitle?: string
  trend?: 'up' | 'down'
  color: 'blue' | 'purple' | 'orange' | 'green'
}) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    green: 'bg-green-100 text-green-600',
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          {icon}
        </div>
        {trend && (
          trend === 'up' ? (
            <TrendingUp className="w-5 h-5 text-green-600" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-600" />
          )
        )}
      </div>
      <h3 className="text-gray-600 text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  )
}
