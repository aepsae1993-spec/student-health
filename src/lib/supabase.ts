import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Class = {
  id: number
  name: string
  order_num: number
}

export type Student = {
  id: string
  class_id: number
  student_number: number
  first_name: string
  last_name: string
  gender: 'ชาย' | 'หญิง'
  birth_date: string | null
  created_at: string
  classes?: Class
}

export type Measurement = {
  id: string
  student_id: string
  month: number
  year: number
  weight: number | null
  height: number | null
  recorded_at: string
}

export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]

// WHO 2007 BMI-for-age reference (simplified): [age, m_p5, m_p85, m_p95, f_p5, f_p85, f_p95]
const BMI_AGE_REF: [number, number, number, number, number, number, number][] = [
  [4,  13.4, 16.3, 17.5, 13.1, 16.1, 17.4],
  [5,  13.1, 16.2, 17.6, 12.9, 16.2, 17.7],
  [6,  12.9, 16.4, 18.0, 12.7, 16.4, 18.1],
  [7,  12.9, 16.9, 18.8, 12.8, 17.1, 19.1],
  [8,  13.0, 17.6, 19.8, 12.9, 17.9, 20.3],
  [9,  13.3, 18.5, 21.0, 13.2, 18.8, 21.5],
  [10, 13.7, 19.4, 22.1, 13.5, 19.7, 22.7],
  [11, 14.2, 20.3, 23.2, 14.0, 20.7, 23.8],
  [12, 14.7, 21.2, 24.2, 14.6, 21.7, 24.9],
  [13, 15.4, 22.1, 25.2, 15.3, 22.6, 26.0],
  [14, 16.1, 22.9, 26.0, 16.0, 23.4, 26.9],
  [15, 16.7, 23.6, 26.8, 16.7, 24.2, 27.7],
]

export type BmiResult = { label: string; badge: string }

export function bmiStatusForAge(bmi: number, age: number | null, gender: 'ชาย' | 'หญิง'): BmiResult {
  if (age !== null) {
    const clampedAge = Math.min(15, Math.max(4, age))
    const ref = BMI_AGE_REF.find(r => r[0] === clampedAge)
    if (ref) {
      const isMale = gender === 'ชาย'
      const [, mp5, mp85, mp95, fp5, fp85, fp95] = ref
      const p5 = isMale ? mp5 : fp5
      const p85 = isMale ? mp85 : fp85
      const p95 = isMale ? mp95 : fp95
      if (bmi < p5)  return { label: 'ผอม',         badge: 'bg-yellow-100 text-yellow-700' }
      if (bmi < p85) return { label: 'สมส่วน',       badge: 'bg-green-100 text-green-700' }
      if (bmi < p95) return { label: 'น้ำหนักเกิน', badge: 'bg-orange-100 text-orange-700' }
      return           { label: 'อ้วน',            badge: 'bg-red-100 text-red-700' }
    }
  }
  // fallback adult BMI
  if (bmi < 18.5) return { label: 'ผอม',         badge: 'bg-yellow-100 text-yellow-700' }
  if (bmi < 25)   return { label: 'สมส่วน',       badge: 'bg-green-100 text-green-700' }
  if (bmi < 30)   return { label: 'น้ำหนักเกิน', badge: 'bg-orange-100 text-orange-700' }
  return             { label: 'อ้วน',            badge: 'bg-red-100 text-red-700' }
}

export function calcAge(birthDate: string | null, year: number, month: number): number | null {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  if (isNaN(birth.getTime())) return null
  const measure = new Date(year, month - 1, 15)
  let age = measure.getFullYear() - birth.getFullYear()
  const m = measure.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && measure.getDate() < birth.getDate())) age--
  return age
}

export function formatThaiDate(iso: string | null): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${parseInt(y) + 543}`
}

export function parseBirthDate(str: string): string | null {
  if (!str) return null
  str = str.trim()
  const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (dmy) {
    let d = parseInt(dmy[1]), m = parseInt(dmy[2]), y = parseInt(dmy[3])
    if (y < 100) y += 2000
    if (y > 2400) y -= 543
    return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  }
  const ymd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)
  if (ymd) {
    let y = parseInt(ymd[1]), m = parseInt(ymd[2]), d = parseInt(ymd[3])
    if (y > 2400) y -= 543
    return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  }
  return null
}

export function exportCSV(rows: Record<string, string | number | null>[], filename: string) {
  const keys = Object.keys(rows[0] || {})
  const escape = (v: string | number | null) => {
    const s = v === null || v === undefined ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = '\uFEFF' + [keys, ...rows.map(r => keys.map(k => escape(r[k])))].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
