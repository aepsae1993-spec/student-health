'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase, type Class, type Student, formatThaiDate, parseBirthDate } from '@/lib/supabase'

type FormState = { first_name: string; last_name: string; gender: 'ชาย' | 'หญิง'; birth_date: string }
const emptyForm: FormState = { first_name: '', last_name: '', gender: 'ชาย', birth_date: '' }

export default function StudentsPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<number | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  const [pasteText, setPasteText] = useState('')
  const [pastePreview, setPastePreview] = useState<{ first_name: string; last_name: string; gender: string; birth_date: string }[]>([])
  const [pasteError, setPasteError] = useState('')

  const [editStudent, setEditStudent] = useState<Student | null>(null)
  const [editForm, setEditForm] = useState<FormState>(emptyForm)

  useEffect(() => {
    supabase.from('classes').select('*').order('order_num').then(({ data }) => {
      if (data) setClasses(data)
    })
  }, [])

  useEffect(() => {
    if (!selectedClass) return
    loadStudents()
  }, [selectedClass])

  async function loadStudents() {
    if (!selectedClass) return
    setLoading(true)
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', selectedClass)
      .order('student_number')
    setStudents(data || [])
    setLoading(false)
  }

  async function addStudent() {
    if (!selectedClass || !form.first_name || !form.last_name) return
    setSaving(true)
    const nextNum = students.length > 0 ? Math.max(...students.map(s => s.student_number)) + 1 : 1
    await supabase.from('students').insert({
      class_id: selectedClass,
      student_number: nextNum,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      gender: form.gender,
      birth_date: form.birth_date || null,
    })
    setForm(emptyForm)
    await loadStudents()
    setSaving(false)
  }

  async function deleteWholeClass() {
    const cls = classes.find(c => c.id === selectedClass)
    if (!cls) return
    if (!confirm(`ยืนยันการลบนักเรียนทั้งหมดในชั้น ${cls.name}?\n\nข้อมูลน้ำหนัก-ส่วนสูงทั้งหมดของชั้นนี้จะถูกลบด้วย`)) return
    setSaving(true)
    await supabase.from('students').delete().eq('class_id', selectedClass)
    await loadStudents()
    setSaving(false)
  }

  function parsePaste(text: string) {
    setPasteError('')
    const lines = text.trim().split('\n').filter(l => l.trim())
    const parsed = lines.map(line => {
      const parts = line.split('\t').map(p => p.trim())
      if (parts.length >= 2) {
        return {
          first_name: parts[0],
          last_name: parts[1],
          gender: parts[2] || 'ชาย',
          birth_date: parseBirthDate(parts[3] || '') || '',
        }
      }
      return null
    }).filter(Boolean) as { first_name: string; last_name: string; gender: string; birth_date: string }[]

    if (parsed.length === 0) {
      setPasteError('ไม่พบข้อมูล กรุณาตรวจสอบรูปแบบ')
      return
    }
    setPastePreview(parsed)
  }

  async function importPaste() {
    if (!selectedClass || pastePreview.length === 0) return
    setSaving(true)
    const startNum = students.length > 0 ? Math.max(...students.map(s => s.student_number)) + 1 : 1
    const rows = pastePreview.map((p, i) => ({
      class_id: selectedClass,
      student_number: startNum + i,
      first_name: p.first_name,
      last_name: p.last_name,
      gender: (p.gender === 'หญิง' || p.gender === 'ญ' || p.gender.toLowerCase() === 'f') ? 'หญิง' : 'ชาย',
      birth_date: p.birth_date || null,
    }))
    await supabase.from('students').insert(rows)
    setPasteText('')
    setPastePreview([])
    await loadStudents()
    setSaving(false)
  }

  async function deleteStudent(id: string) {
    if (!confirm('ยืนยันการลบนักเรียนคนนี้?')) return
    await supabase.from('students').delete().eq('id', id)
    await loadStudents()
  }

  async function saveEdit() {
    if (!editStudent) return
    setSaving(true)
    await supabase.from('students').update({
      first_name: editForm.first_name.trim(),
      last_name: editForm.last_name.trim(),
      gender: editForm.gender,
      birth_date: editForm.birth_date || null,
    }).eq('id', editStudent.id)
    setEditStudent(null)
    await loadStudents()
    setSaving(false)
  }

  async function renumberStudents() {
    if (!selectedClass || students.length === 0) return
    if (!confirm('จัดเรียงเลขที่นักเรียนใหม่ตามลำดับ?')) return
    setSaving(true)
    for (let i = 0; i < students.length; i++) {
      await supabase.from('students').update({ student_number: i + 1 }).eq('id', students[i].id)
    }
    await loadStudents()
    setSaving(false)
  }

  const inputCls = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white placeholder:text-slate-400"

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">จัดการข้อมูลนักเรียน</h1>
          <p className="text-slate-500 text-sm">เพิ่ม แก้ไข ลบ หรือนำเข้าจาก Excel</p>
        </div>
      </div>

      {/* Class selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-3">เลือกชั้นเรียน</label>
        <div className="flex flex-wrap gap-2">
          {classes.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedClass(c.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                ${selectedClass === c.id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {selectedClass && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Forms */}
          <div className="space-y-5">
            {/* Add single */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="font-bold text-slate-700 text-base mb-4 flex items-center gap-2">
                <span className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </span>
                เพิ่มทีละคน
              </h2>
              <div className="space-y-2.5">
                <input className={inputCls} placeholder="ชื่อ" value={form.first_name}
                  onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
                <input className={inputCls} placeholder="นามสกุล" value={form.last_name}
                  onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
                <select className={inputCls} value={form.gender}
                  onChange={e => setForm(f => ({ ...f, gender: e.target.value as 'ชาย' | 'หญิง' }))}>
                  <option value="ชาย">ชาย</option>
                  <option value="หญิง">หญิง</option>
                </select>
                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1">วันเดือนปีเกิด (ค.ศ.)</label>
                  <input type="date" className={inputCls} value={form.birth_date}
                    onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))} />
                </div>
                <button onClick={addStudent} disabled={saving || !form.first_name || !form.last_name}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 shadow-md shadow-blue-200 transition-all">
                  + เพิ่มนักเรียน
                </button>
              </div>
            </div>

            {/* Paste from Excel */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="font-bold text-slate-700 text-base mb-1 flex items-center gap-2">
                <span className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
                วางข้อมูลจาก Excel
              </h2>
              <p className="text-xs text-slate-400 mb-3 ml-9">รูปแบบ: ชื่อ [Tab] นามสกุล [Tab] เพศ [Tab] วันเกิด</p>
              <textarea
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 h-28 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent resize-none bg-slate-50"
                placeholder={'สมชาย	ใจดี	ชาย\nสมหญิง	รักเรียน	หญิง'}
                value={pasteText}
                onChange={e => { setPasteText(e.target.value); setPastePreview([]); setPasteError('') }}
              />
              {pasteError && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {pasteError}
                </p>
              )}
              <button onClick={() => parsePaste(pasteText)} disabled={!pasteText.trim()}
                className="w-full mt-2 bg-slate-100 text-slate-700 rounded-xl py-2 text-sm font-semibold hover:bg-slate-200 disabled:opacity-50 transition-colors">
                ตรวจสอบข้อมูล
              </button>

              {pastePreview.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-emerald-600 font-semibold mb-2">พบ {pastePreview.length} รายการ</p>
                  <div className="max-h-40 overflow-y-auto border border-slate-100 rounded-xl text-xs divide-y divide-slate-100">
                    {pastePreview.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50">
                        <span className="text-slate-400 w-5 font-medium">{i + 1}</span>
                        <span className="text-slate-700 font-medium">{p.first_name} {p.last_name}</span>
                        <span className={`ml-auto text-xs font-semibold px-1.5 py-0.5 rounded
                          ${p.gender === 'หญิง' || p.gender === 'ญ' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                          {p.gender === 'หญิง' || p.gender === 'ญ' ? 'ญ' : 'ช'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button onClick={importPaste} disabled={saving}
                    className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 shadow-md shadow-emerald-200 transition-all">
                    นำเข้าข้อมูล {pastePreview.length} คน
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Student list */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <span className="font-bold text-slate-800">รายชื่อนักเรียน</span>
                <span className="ml-2 bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">{students.length} คน</span>
              </div>
              <div className="flex items-center gap-3">
                {students.length > 0 && (
                  <button onClick={renumberStudents}
                    className="text-xs text-slate-500 hover:text-blue-600 font-medium flex items-center gap-1 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                    จัดเรียงเลขที่ใหม่
                  </button>
                )}
                {students.length > 0 && (
                  <button onClick={deleteWholeClass} disabled={saving}
                    className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    ลบทั้งชั้น
                  </button>
                )}
              </div>
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
              <div className="text-center py-16 text-slate-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="font-medium text-slate-500">ยังไม่มีนักเรียนในชั้นนี้</p>
                <p className="text-sm mt-1">เพิ่มนักเรียนจากฟอร์มด้านซ้าย</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                      <th className="text-center px-4 py-3 w-14">เลขที่</th>
                      <th className="text-left px-4 py-3">ชื่อ</th>
                      <th className="text-left px-4 py-3">นามสกุล</th>
                      <th className="text-center px-4 py-3 w-16">เพศ</th>
                      <th className="text-left px-4 py-3 w-32">วันเกิด</th>
                      <th className="px-4 py-3 w-24"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, idx) => (
                      <tr key={s.id} className={`border-t border-slate-100 transition-colors
                        ${idx % 2 === 1 ? 'bg-slate-50/50 hover:bg-slate-50' : 'hover:bg-slate-50'}`}>
                        <td className="px-4 py-3 text-center">
                          <span className="w-7 h-7 bg-slate-100 text-slate-600 text-xs font-bold rounded-full flex items-center justify-center mx-auto">
                            {s.student_number}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{s.first_name}</td>
                        <td className="px-4 py-3 text-slate-600">{s.last_name}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block w-8 h-8 rounded-full text-xs font-bold leading-8 text-center
                            ${s.gender === 'ชาย' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                            {s.gender === 'ชาย' ? 'ช' : 'ญ'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">{formatThaiDate(s.birth_date)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => { setEditStudent(s); setEditForm({ first_name: s.first_name, last_name: s.last_name, gender: s.gender, birth_date: s.birth_date || '' }) }}
                            className="text-blue-500 hover:text-blue-700 font-semibold text-xs mr-3 hover:underline transition-colors"
                          >แก้ไข</button>
                          <button
                            onClick={() => deleteStudent(s.id)}
                            className="text-red-400 hover:text-red-600 font-semibold text-xs hover:underline transition-colors"
                          >ลบ</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-800 text-lg">แก้ไขข้อมูลนักเรียน</h3>
            </div>
            <div className="space-y-3">
              <input className={inputCls} placeholder="ชื่อ" value={editForm.first_name}
                onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} />
              <input className={inputCls} placeholder="นามสกุล" value={editForm.last_name}
                onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))} />
              <select className={inputCls} value={editForm.gender}
                onChange={e => setEditForm(f => ({ ...f, gender: e.target.value as 'ชาย' | 'หญิง' }))}>
                <option value="ชาย">ชาย</option>
                <option value="หญิง">หญิง</option>
              </select>
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1">วันเดือนปีเกิด (ค.ศ.)</label>
                <input type="date" className={inputCls} value={editForm.birth_date}
                  onChange={e => setEditForm(f => ({ ...f, birth_date: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditStudent(null)}
                className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                ยกเลิก
              </button>
              <button onClick={saveEdit} disabled={saving}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 shadow-md shadow-blue-200 transition-all">
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
