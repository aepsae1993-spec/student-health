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
