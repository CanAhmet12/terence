import type { PlanTemplatePack } from '@/lib/api'

/**
 * Öğretmen atama ekranı için hazır paketler (backend PlanTemplatePresets ile aynı içerik;
 * öğrenci API’si olmadan da seçilebilir).
 */
export const TEACHER_PLAN_TEMPLATE_PACKS: PlanTemplatePack[] = [
  {
    key: 'lgs_morning_block',
    label: 'LGS — Dengeli gün',
    description: 'Matematik + Türkçe + deneme tekrarı',
    tasks: [
      { title: 'Matematik — 20 soru pratik', type: 'question', subject: 'Matematik', planned_minutes: 40, priority: 'high' },
      { title: 'Türkçe — paragraf çalışması', type: 'read', subject: 'Türkçe', planned_minutes: 35, priority: 'normal' },
      { title: 'Fen — konu tekrarı (video)', type: 'video', subject: 'Fen Bilimleri', planned_minutes: 30, priority: 'normal' },
      { title: 'Mini deneme veya soru seti', type: 'exam', subject: 'Genel', planned_minutes: 45, priority: 'high' },
    ],
  },
  {
    key: 'lgs_exam_day',
    label: 'LGS — Deneme günü',
    description: 'Uzun deneme + net analizi',
    tasks: [
      { title: 'Branş denemesi veya platform denemesi', type: 'exam', subject: 'Genel', planned_minutes: 90, priority: 'high' },
      { title: 'Yanlışları tekrar et', type: 'repeat', subject: 'Genel', planned_minutes: 40, priority: 'high' },
    ],
  },
  {
    key: 'yks_tyt_block',
    label: 'TYT — Yoğun blok',
    description: 'Sayısal / sözel dengeli temel çalışma',
    tasks: [
      { title: 'TYT Matematik — soru seti', type: 'question', subject: 'Matematik', planned_minutes: 50, priority: 'high' },
      { title: 'TYT Türkçe / paragraf', type: 'question', subject: 'Türkçe', planned_minutes: 40, priority: 'normal' },
      { title: 'Fen bilimleri tekrar', type: 'read', subject: 'Fen', planned_minutes: 35, priority: 'normal' },
      { title: 'Konu videosu izle', type: 'video', subject: 'Genel', planned_minutes: 30, priority: 'low' },
    ],
  },
  {
    key: 'yks_exam_sim',
    label: 'YKS — Deneme & analiz',
    description: 'Tam deneme ve hata günlüğü',
    tasks: [
      { title: 'Genel deneme', type: 'exam', subject: 'Genel', planned_minutes: 100, priority: 'high' },
      { title: 'Hatalı soruları işaretle ve tekrarla', type: 'repeat', subject: 'Genel', planned_minutes: 45, priority: 'high' },
    ],
  },
  {
    key: 'primary_balanced',
    label: 'Okul — Dengeli gün',
    description: 'Okuma, pratik ve tekrar',
    tasks: [
      { title: 'Ders tekrarı (20 dk)', type: 'read', subject: 'Genel', planned_minutes: 20, priority: 'normal' },
      { title: 'Soru pratiği', type: 'question', subject: 'Genel', planned_minutes: 25, priority: 'normal' },
      { title: 'Ödev / proje çalışması', type: 'custom', subject: 'Genel', planned_minutes: 30, priority: 'low' },
    ],
  },
]
