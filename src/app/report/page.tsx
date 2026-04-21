'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useCallback } from 'react'
import { supabase, type Class, THAI_MONTHS } from '@/lib/supabase'

type ClassStatus = {
  class: Class
  totalStudents: number
  recorded: number
  notRecorded: number
}

export default function ReportPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [statuses, setStatuses] = useState<ClassStatus[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('classes').select('*').order('order_num').then(({ data }) => {
      if (data) setClasses(data)
    })
  }, [])

  const loadReport = useCallback(async () => {
    if (classes.length === 0) return
    setLoading(true)

    const result: ClassStatus[] = []
    for (const cls of classes) {
      const { data: studs } = await supabase
        .from('students')
        .select('id')
        .eq('class_id', cls.id)

      const totalStudents = studs?.length || 0
      if (totalStudents === 0) {
        result.push({ class: cls, totalStudents: 0, recorded: 0, notRecorded: 0 })
        continue
      }

      const ids = studs!.map(s => s.id)
      const { data: measData } = await supabase
        .from('measurements')
        .select('student_id')
        .in('student_id', ids)
        .eq('month', selectedMonth)
        .eq('year', selectedYear)

      const recordedIds = new Set((measData || []).map(m => m.student_id))
      const recorded = recordedIds.size
      result.push({ class: cls, totalStudents, recorded, notRecorded: totalStudents - recorded })
    }

    setStatuses(result)
    setLoading(false)
  }, [classes, selectedMonth, selectedYear])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)
  const thaiYear = (y: number) => y + 543

  const totalAll = statuses.reduce((a, s) => a + s.totalStudents, 0)
  const recordedAll = statuses.reduce((a, s) => a + s.recorded, 0)
  const notRecordedAll = statuses.reduce((a, s) => a + s.notRecorded, 0)
  const notRecordedClasses = statuses.filter(s => s.notRecorded > 0)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📊 รายงานประจำเดือน</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
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

      {/* Summary cards */}
      {!loading && statuses.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-3xl font-bold text-gray-700">{totalAll}</div>
            <div className="text-sm text-gray-500 mt-1">นักเรียนทั้งหมด</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{recordedAll}</div>
            <div className="text-sm text-gray-500 mt-1">บันทึกแล้ว</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-3xl font-bold text-red-500">{notRecordedAll}</div>
            <div className="text-sm text-gray-500 mt-1">ยังไม่บันทึก</div>
          </div>
        </div>
      )}

      {/* Alert: classes not recorded */}
      {!loading && notRecordedClasses.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-red-700 mb-2">⚠️ ชั้นที่ยังไม่ได้บันทึกข้อมูล</h3>
          <div className="flex flex-wrap gap-2">
            {notRecordedClasses.map(s => (
              <span key={s.class.id} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                {s.class.name} (ขาด {s.notRecorded}/{s.totalStudents} คน)
              </span>
            ))}
          </div>
        </div>
      )}

      {!loading && notRecordedClasses.length === 0 && statuses.length > 0 && totalAll > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <p className="text-green-700 font-semibold">✅ บันทึกข้อมูลครบทุกชั้นเรียนแล้ว!</p>
        </div>
      )}

      {/* Detail table */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="font-semibold text-gray-700 mb-3">
          สรุปรายชั้น — {THAI_MONTHS[selectedMonth - 1]} {thaiYear(selectedYear)}
        </h2>

        {loading ? (
          <div className="text-center py-8 text-gray-400">กำลังโหลด...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="text-left px-4 py-2">ชั้น</th>
                  <th className="text-right px-4 py-2">จำนวนนักเรียน</th>
                  <th className="text-right px-4 py-2">บันทึกแล้ว</th>
                  <th className="text-right px-4 py-2">ยังไม่บันทึก</th>
                  <th className="text-left px-4 py-2">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {statuses.map(s => {
                  const pct = s.totalStudents > 0 ? Math.round((s.recorded / s.totalStudents) * 100) : 0
                  const isDone = s.totalStudents > 0 && s.notRecorded === 0
                  const isEmpty = s.totalStudents === 0
                  return (
                    <tr key={s.class.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{s.class.name}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{s.totalStudents}</td>
                      <td className="px-4 py-3 text-right text-green-600 font-medium">{s.recorded}</td>
                      <td className="px-4 py-3 text-right text-red-500 font-medium">{s.notRecorded}</td>
                      <td className="px-4 py-3">
                        {isEmpty ? (
                          <span className="text-gray-400 text-xs">ยังไม่มีนักเรียน</span>
                        ) : isDone ? (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                            ✅ ครบแล้ว
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{pct}%</span>
                          </div>
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
    </div>
  )
}
