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
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">รายงานประจำเดือน</h1>
          <p className="text-slate-500 text-sm">ตรวจสอบสถานะการบันทึกข้อมูลแต่ละชั้นเรียน</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
        <div className="flex flex-wrap gap-5 items-end">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">เดือน</label>
            <select
              className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
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
              className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
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
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-center">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="text-3xl font-extrabold text-slate-700">{totalAll}</div>
            <div className="text-sm text-slate-500 mt-1 font-medium">นักเรียนทั้งหมด</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-5 text-center">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-3xl font-extrabold text-emerald-600">{recordedAll}</div>
            <div className="text-sm text-slate-500 mt-1 font-medium">บันทึกแล้ว</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-5 text-center">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-3xl font-extrabold text-red-500">{notRecordedAll}</div>
            <div className="text-sm text-slate-500 mt-1 font-medium">ยังไม่บันทึก</div>
          </div>
        </div>
      )}

      {/* Alert */}
      {!loading && notRecordedClasses.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="font-bold text-red-700">ชั้นที่ยังไม่ได้บันทึกข้อมูล</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {notRecordedClasses.map(s => (
              <span key={s.class.id} className="bg-red-100 text-red-700 px-3 py-1.5 rounded-xl text-sm font-semibold border border-red-200">
                {s.class.name}
                <span className="text-red-500 font-normal ml-1">(ขาด {s.notRecorded}/{s.totalStudents} คน)</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {!loading && notRecordedClasses.length === 0 && statuses.length > 0 && totalAll > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-emerald-700 font-bold text-base">บันทึกข้อมูลครบทุกชั้นเรียนแล้ว!</p>
        </div>
      )}

      {/* Detail table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">
            สรุปรายชั้นเรียน
            <span className="text-slate-400 font-normal ml-2 text-sm">— {THAI_MONTHS[selectedMonth - 1]} {thaiYear(selectedYear)}</span>
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            กำลังโหลด...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                  <th className="text-left px-6 py-3 w-20">ชั้น</th>
                  <th className="text-right px-6 py-3">จำนวนนักเรียน</th>
                  <th className="text-right px-6 py-3">บันทึกแล้ว</th>
                  <th className="text-right px-6 py-3">ยังไม่บันทึก</th>
                  <th className="text-left px-6 py-3">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {statuses.map((s, idx) => {
                  const pct = s.totalStudents > 0 ? Math.round((s.recorded / s.totalStudents) * 100) : 0
                  const isDone = s.totalStudents > 0 && s.notRecorded === 0
                  const isEmpty = s.totalStudents === 0
                  return (
                    <tr key={s.class.id} className={`border-t border-slate-100 transition-colors
                      ${idx % 2 === 1 ? 'bg-slate-50/50 hover:bg-slate-50' : 'hover:bg-slate-50'}`}>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800 text-base">{s.class.name}</span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600 font-medium">{s.totalStudents}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-emerald-600 font-bold">{s.recorded}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={s.notRecorded > 0 ? 'text-red-500 font-bold' : 'text-slate-400'}>
                          {s.notRecorded}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isEmpty ? (
                          <span className="text-slate-400 text-xs font-medium">ยังไม่มีนักเรียน</span>
                        ) : isDone ? (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-xl text-xs font-bold">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            ครบแล้ว
                          </span>
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <div className="w-28 bg-slate-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-slate-500">{pct}%</span>
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
