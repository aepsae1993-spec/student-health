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

// กรมอนามัย / WHO 2007 BMI-for-age: [age, ชาย_P5, ชาย_P85, ชาย_P95, หญิง_P5, หญิง_P85, หญิง_P95]
// อ้างอิง: กรมอนามัย กระทรวงสาธารณสุข ใช้ WHO 2006 (อายุ 4 ปี) และ WHO 2007 (อายุ 5-18 ปี)
// ผอม = <P5 | สมส่วน = P5-<P85 | เริ่มอ้วน = P85-<P95 | อ้วน = ≥P95
const BMI_AGE_REF: [number, number, number, number, number, number, number][] = [
  // อายุ  ช_P5   ช_P85  ช_P95  ญ_P5   ญ_P85  ญ_P95
  [4,  13.40, 16.40, 17.80, 13.00, 16.20, 17.60], // WHO 2006
  [5,  12.77, 16.12, 17.47, 12.53, 16.17, 17.72], // WHO 2007
  [6,  12.56, 16.28, 17.83, 12.41, 16.56, 18.29],
  [7,  12.53, 16.68, 18.53, 12.45, 17.16, 19.10],
  [8,  12.69, 17.30, 19.48, 12.60, 17.87, 20.04],
  [9,  13.00, 18.04, 20.52, 12.83, 18.59, 21.01],
  [10, 13.40, 18.82, 21.59, 13.11, 19.29, 21.99],
  [11, 13.87, 19.64, 22.62, 13.45, 19.97, 22.94],
  [12, 14.36, 20.45, 23.61, 13.84, 20.63, 23.84],
  [13, 14.85, 21.24, 24.54, 14.28, 21.28, 24.71],
  [14, 15.31, 21.99, 25.39, 14.79, 21.93, 25.54],
  [15, 15.76, 22.69, 26.16, 15.31, 22.54, 26.30],
  [16, 16.19, 23.34, 26.87, 15.80, 23.09, 27.00],
  [17, 16.59, 23.94, 27.52, 16.22, 23.58, 27.62],
  [18, 16.98, 24.50, 28.14, 16.56, 24.02, 28.16],
]

export type BmiResult = { label: string; badge: string }

export function bmiStatusForAge(bmi: number, age: number | null, gender: 'ชาย' | 'หญิง'): BmiResult {
  if (age !== null) {
    const clampedAge = Math.min(18, Math.max(4, age))
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
