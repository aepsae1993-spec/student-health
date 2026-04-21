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
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📏 บันทึกน้ำหนัก-ส่วนสูง</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">ชั้นเรียน</label>
            <div className="flex flex-wrap gap-2">
              {classes.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClass(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${selectedClass === c.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">เดือน</label>
            <select
              className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
            >
              {THAI_MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">ปี (พ.ศ.)</label>
            <select
              className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
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
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">
              {classes.find(c => c.id === selectedClass)?.name} — {THAI_MONTHS[selectedMonth - 1]} {thaiYear(selectedYear)}
            </h2>
            {students.length > 0 && (
              <button
                onClick={saveAll}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                บันทึกทั้งหมด
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">กำลังโหลด...</div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-gray-400">ยังไม่มีนักเรียนในชั้นนี้ กรุณาเพิ่มนักเรียนก่อน</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="text-left px-3 py-2 w-10">ที่</th>
                    <th className="text-left px-3 py-2">ชื่อ-สกุล</th>
                    <th className="text-left px-3 py-2 w-16">เพศ</th>
                    <th className="text-left px-3 py-2 w-28">น้ำหนัก (กก.)</th>
                    <th className="text-left px-3 py-2 w-28">ส่วนสูง (ซม.)</th>
                    <th className="text-left px-3 py-2 w-24">BMI</th>
                    <th className="px-3 py-2 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => {
                    const inp = inputs[s.id] || { weight: '', height: '' }
                    const bmi = calcBMI(
                      inp.weight ? parseFloat(inp.weight) : null,
                      inp.height ? parseFloat(inp.height) : null
                    )
                    const status = bmiStatus(bmi)
                    const isSaved = saved[s.id]
                    const isSaving = saving[s.id]
                    return (
                      <tr key={s.id} className={`border-t ${isSaved ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                        <td className="px-3 py-2 text-gray-500">{s.student_number}</td>
                        <td className="px-3 py-2">{s.first_name} {s.last_name}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs ${s.gender === 'ชาย' ? 'text-blue-600' : 'text-pink-600'}`}>
                            {s.gender}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="200"
                            className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                            value={inp.weight}
                            onChange={e => setInputs(prev => ({
                              ...prev,
                              [s.id]: { ...prev[s.id], weight: e.target.value }
                            }))}
                            onKeyDown={e => e.key === 'Enter' && saveRow(s.id)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="250"
                            className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                            value={inp.height}
                            onChange={e => setInputs(prev => ({
                              ...prev,
                              [s.id]: { ...prev[s.id], height: e.target.value }
                            }))}
                            onKeyDown={e => e.key === 'Enter' && saveRow(s.id)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          {bmi && (
                            <span className={`font-medium ${status?.color}`}>
                              {bmi} <span className="text-xs">({status?.label})</span>
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {isSaved ? (
                            <span className="text-green-600 text-xs font-medium">✓ บันทึกแล้ว</span>
                          ) : (
                            <button
                              onClick={() => saveRow(s.id)}
                              disabled={isSaving}
                              className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 disabled:opacity-50"
                            >
                              {isSaving ? '...' : 'บันทึก'}
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
