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

// BMI-for-age WHO 2007 (กรมอนามัย)
// [age, ช_P5, ช_P85, ช_P95, ญ_P5, ญ_P85, ญ_P95]
const BMI_AGE_REF: [number, number, number, number, number, number, number][] = [
  [4,  13.40, 16.40, 17.80, 13.00, 16.20, 17.60],
  [5,  12.77, 16.12, 17.47, 12.53, 16.17, 17.72],
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

// Weight-for-Age WHO 2006/2007
// [age, ช_-2SD, ช_+2SD, ญ_-2SD, ญ_+2SD]
const WEIGHT_AGE_REF: [number, number, number, number, number][] = [
  [4,  13.8, 19.5, 13.3, 19.0],
  [5,  14.1, 23.9, 13.7, 23.4],
  [6,  15.9, 27.1, 15.3, 26.2],
  [7,  17.8, 30.5, 17.0, 29.1],
  [8,  20.0, 34.4, 18.9, 32.6],
  [9,  22.3, 38.6, 21.1, 36.9],
  [10, 24.8, 43.2, 23.5, 42.0],
  [11, 27.6, 48.4, 26.3, 47.7],
  [12, 30.7, 54.0, 29.3, 53.4],
  [13, 34.2, 59.8, 32.4, 58.5],
  [14, 38.0, 65.5, 35.4, 63.1],
  [15, 42.1, 71.3, 37.9, 66.8],
  [16, 45.9, 76.1, 39.8, 69.3],
  [17, 49.1, 80.0, 41.1, 70.8],
  [18, 51.3, 83.6, 41.7, 71.5],
]

// Height-for-Age WHO 2006/2007
// [age, ช_-2SD, ช_+2SD, ญ_-2SD, ญ_+2SD]
const HEIGHT_AGE_REF: [number, number, number, number, number][] = [
  [4,   96.5, 110.4,  95.0, 110.3],
  [5,  101.4, 118.3,  99.9, 116.9],
  [6,  107.1, 124.9, 105.5, 123.4],
  [7,  112.5, 131.0, 110.8, 129.7],
  [8,  117.9, 136.8, 115.9, 135.6],
  [9,  123.0, 142.3, 120.7, 141.2],
  [10, 127.8, 147.8, 125.2, 146.7],
  [11, 132.5, 153.7, 129.6, 152.4],
  [12, 137.4, 160.1, 134.4, 158.3],
  [13, 142.7, 167.1, 138.7, 163.8],
  [14, 148.1, 174.0, 142.1, 167.1],
  [15, 153.0, 179.5, 144.5, 169.4],
  [16, 156.6, 183.6, 146.0, 170.7],
  [17, 159.1, 186.8, 146.9, 171.4],
  [18, 160.6, 188.6, 147.2, 172.1],
]

export type AssessResult = { label: string; badge: string; short: string }

export function weightStatus(weight: number, age: number | null, gender: 'ชาย' | 'หญิง'): AssessResult | null {
  if (age === null) return null
  const clampedAge = Math.min(18, Math.max(4, age))
  const ref = WEIGHT_AGE_REF.find(r => r[0] === clampedAge)
  if (!ref) return null
  const isMale = gender === 'ชาย'
  const low  = isMale ? ref[1] : ref[3]
  const high = isMale ? ref[2] : ref[4]
  if (weight < low)   return { label: 'น้ำหนักน้อยกว่าเกณฑ์', short: 'น้อยกว่าเกณฑ์', badge: 'bg-yellow-100 text-yellow-700' }
  if (weight <= high) return { label: 'น้ำหนักตามเกณฑ์',      short: 'ตามเกณฑ์',      badge: 'bg-green-100 text-green-700' }
  return                     { label: 'น้ำหนักมากกว่าเกณฑ์',  short: 'มากกว่าเกณฑ์',  badge: 'bg-orange-100 text-orange-700' }
}

export function heightStatus(height: number, age: number | null, gender: 'ชาย' | 'หญิง'): AssessResult | null {
  if (age === null) return null
  const clampedAge = Math.min(18, Math.max(4, age))
  const ref = HEIGHT_AGE_REF.find(r => r[0] === clampedAge)
  if (!ref) return null
  const isMale = gender === 'ชาย'
  const low  = isMale ? ref[1] : ref[3]
  const high = isMale ? ref[2] : ref[4]
  if (height < low)   return { label: 'ส่วนสูงต่ำกว่าเกณฑ์', short: 'ต่ำกว่าเกณฑ์', badge: 'bg-yellow-100 text-yellow-700' }
  if (height <= high) return { label: 'ส่วนสูงตามเกณฑ์',     short: 'ตามเกณฑ์',     badge: 'bg-green-100 text-green-700' }
  return                     { label: 'ส่วนสูงสูงกว่าเกณฑ์',  short: 'สูงกว่าเกณฑ์',  badge: 'bg-blue-100 text-blue-700' }
}

export type BmiResult = { label: string; badge: string }

export function bmiStatusForAge(bmi: number, age: number | null, gender: 'ชาย' | 'หญิง'): BmiResult {
  if (age !== null) {
    const clampedAge = Math.min(18, Math.max(4, age))
    const ref = BMI_AGE_REF.find(r => r[0] === clampedAge)
    if (ref) {
      const isMale = gender === 'ชาย'
      const [, mp5, mp85, mp95, fp5, fp85, fp95] = ref
      const p5  = isMale ? mp5  : fp5
      const p85 = isMale ? mp85 : fp85
      const p95 = isMale ? mp95 : fp95
      if (bmi < p5)  return { label: 'ผอม',         badge: 'bg-yellow-100 text-yellow-700' }
      if (bmi < p85) return { label: 'สมส่วน',       badge: 'bg-green-100 text-green-700' }
      if (bmi < p95) return { label: 'น้ำหนักเกิน', badge: 'bg-orange-100 text-orange-700' }
      return           { label: 'อ้วน',            badge: 'bg-red-100 text-red-700' }
    }
  }
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
