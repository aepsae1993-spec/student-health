'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useCallback } from 'react'
import { supabase, type Class, type Student, type Measurement, THAI_MONTHS } from '@/lib/supabase'

export default function RecordPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [students, setStudents] = useState<Student[]>([])
  const [measurements, setMeasurements] = useState<Record<string, Measurement>>({})
  const [inputs, setInputs] = useState<Record<string, { weight: string; height: string }>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  useEffect(() => {
    supabase.from('classes').select('*').order('order_num').then(({ data }) => {
      if (data) setClasses(data)
    })
  }, [])

  const loadData = useCallback(async () => {
    if (!selectedClass) return
    setLoading(true)

    const { data: studs } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', selectedClass)
      .order('student_number')

    const studentList = studs || []
    setStudents(studentList)

    if (studentList.length > 0) {
      const ids = studentList.map(s => s.id)
      const { data: measData } = await supabase
        .from('measurements')
        .select('*')
        .in('student_id', ids)
        .eq('month', selectedMonth)
        .eq('year', selectedYear)

      const measMap: Record<string, Measurement> = {}
      const inputMap: Record<string, { weight: string; height: string }> = {}
      for (const m of measData || []) {
        measMap[m.student_id] = m
        inputMap[m.student_id] = {
          weight: m.weight?.toString() || '',
          height: m.height?.toString() || '',
        }
      }
      for (const s of studentList) {
        if (!inputMap[s.id]) inputMap[s.id] = { weight: '', height: '' }
      }
      setMeasurements(measMap)
      setInputs(inputMap)
    }
    setLoading(false)
  }, [selectedClass, selectedMonth, selectedYear])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function saveRow(studentId: string) {
    const inp = inputs[studentId]
    if (!inp) return
    setSaving(s => ({ ...s, [studentId]: true }))

    const weight = inp.weight ? parseFloat(inp.weight) : null
    const height = inp.height ? parseFloat(inp.height) : null

    const existing = measurements[studentId]
    if (existing) {
      await supabase.from('measurements').update({ weight, height }).eq('id', existing.id)
    } else {
      await supabase.from('measurements').insert({
        student_id: studentId,
        month: selectedMonth,
        year: selectedYear,
        weight,
        height,
      })
    }

    setSaving(s => ({ ...s, [studentId]: false }))
    setSaved(s => ({ ...s, [studentId]: true }))
    setTimeout(() => setSaved(s => ({ ...s, [studentId]: false })), 1500)
    await loadData()
  }

  async function saveAll() {
    for (const student of students) {
      const inp = inputs[student.id]
      if (inp?.weight || inp?.height) {
        await saveRow(student.id)
      }
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)
  const thaiYear = (y: number) => y + 543

  function calcBMI(weight: number | null, height: number | null) {
    if (!weight || !height || height === 0) return null
    const bmi = weight / Math.pow(height / 100, 2)
    return bmi.toFixed(1)
  }

  function bmiStatus(bmi: string | null) {
    if (!bmi) return null
    const b = parseFloat(bmi)
    if (b < 18.5) return { label: 'ผอม', color: 'text-yellow-600' }
    if (b < 25) return { label: 'ปกติ', color: 'text-green-600' }
    if (b < 30) return { label: 'น้ำหนักเกิน', color: 'text-orange-500' }
    return { label: 'อ้วน', color: 'text-red-600' }
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">บันทึกน้ำหนัก-ส่วนสูง</h1>
          <p className="text-slate-500 text-sm">กรอกข้อมูลรายเดือนของนักเรียนแต่ละชั้น</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
        <div className="flex flex-wrap gap-6">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">ชั้นเรียน</label>
            <div className="flex flex-wrap gap-2">
              {classes.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClass(c.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                    ${selectedClass === c.id
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">เดือน</label>
            <select
              className="border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
            >
              {THAI_MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">ปี (พ.ศ.)</label>
            <select
              className="border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
            >
              {years.map(y => (
                <option key={y} value={y}>{thaiYear(y)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedClass && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Table header bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <span className="font-bold text-slate-800 text-base">
                {classes.find(c => c.id === selectedClass)?.name}
              </span>
              <span className="text-slate-400 mx-2">—</span>
              <span className="text-slate-600 text-sm">{THAI_MONTHS[selectedMonth - 1]} {thaiYear(selectedYear)}</span>
            </div>
            {students.length > 0 && (
              <button
                onClick={saveAll}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-200 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                บันทึกทั้งหมด
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              กำลังโหลด...
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-slate-500 font-medium">ยังไม่มีนักเรียนในชั้นนี้</p>
              <p className="text-slate-400 text-sm mt-1">กรุณาเพิ่มนักเรียนก่อนในหน้าจัดการนักเรียน</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                    <th className="text-center px-4 py-3 w-12">ที่</th>
                    <th className="text-left px-4 py-3">ชื่อ-นามสกุล</th>
                    <th className="text-center px-4 py-3 w-16">เพศ</th>
                    <th className="text-left px-4 py-3 w-32">น้ำหนัก (กก.)</th>
                    <th className="text-left px-4 py-3 w-32">ส่วนสูง (ซม.)</th>
                    <th className="text-left px-4 py-3 w-32">BMI</th>
                    <th className="px-4 py-3 w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, idx) => {
                    const inp = inputs[s.id] || { weight: '', height: '' }
                    const bmi = calcBMI(
                      inp.weight ? parseFloat(inp.weight) : null,
                      inp.height ? parseFloat(inp.height) : null
                    )
                    const status = bmiStatus(bmi)
                    const isSaved = saved[s.id]
                    const isSaving = saving[s.id]
                    const bmiBadge: Record<string, string> = {
                      'ผอม': 'bg-yellow-100 text-yellow-700',
                      'ปกติ': 'bg-green-100 text-green-700',
                      'น้ำหนักเกิน': 'bg-orange-100 text-orange-700',
                      'อ้วน': 'bg-red-100 text-red-700',
                    }
                    return (
                      <tr key={s.id} className={`border-t border-slate-100 transition-colors
                        ${isSaved ? 'bg-green-50' : idx % 2 === 1 ? 'bg-slate-50/50 hover:bg-slate-50' : 'hover:bg-slate-50'}`}>
                        <td className="px-4 py-3 text-center text-slate-400 font-medium">{s.student_number}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{s.first_name} {s.last_name}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block w-8 h-8 rounded-full text-xs font-bold leading-8 text-center
                            ${s.gender === 'ชาย' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                            {s.gender === 'ชาย' ? 'ช' : 'ญ'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="200"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white"
                            value={inp.weight}
                            onChange={e => setInputs(prev => ({ ...prev, [s.id]: { ...prev[s.id], weight: e.target.value } }))}
                            onKeyDown={e => e.key === 'Enter' && saveRow(s.id)}
                            placeholder="0.0"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="250"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white"
                            value={inp.height}
                            onChange={e => setInputs(prev => ({ ...prev, [s.id]: { ...prev[s.id], height: e.target.value } }))}
                            onKeyDown={e => e.key === 'Enter' && saveRow(s.id)}
                            placeholder="0.0"
                          />
                        </td>
                        <td className="px-4 py-3">
                          {bmi && status && (
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-700">{bmi}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${bmiBadge[status.label] || ''}`}>
                                {status.label}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isSaved ? (
                            <span className="inline-flex items-center gap-1 text-green-600 text-xs font-semibold">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                              บันทึกแล้ว
                            </span>
                          ) : (
                            <button
                              onClick={() => saveRow(s.id)}
                              disabled={isSaving}
                              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                              {isSaving ? (
                                <span className="flex items-center gap-1">
                                  <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                  </svg>
                                </span>
                              ) : 'บันทึก'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
