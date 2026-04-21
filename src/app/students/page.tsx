'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase, type Class, type Student } from '@/lib/supabase'

export default function StudentsPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<number | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)

  // Add single student
  const [form, setForm] = useState({ first_name: '', last_name: '', gender: 'ชาย' as 'ชาย' | 'หญิง' })
  const [saving, setSaving] = useState(false)

  // Paste from Excel
  const [pasteText, setPasteText] = useState('')
  const [pastePreview, setPastePreview] = useState<{ first_name: string; last_name: string; gender: string }[]>([])
  const [pasteError, setPasteError] = useState('')

  // Edit modal
  const [editStudent, setEditStudent] = useState<Student | null>(null)
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', gender: 'ชาย' as 'ชาย' | 'หญิง' })

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
    })
    setForm({ first_name: '', last_name: '', gender: 'ชาย' })
    await loadStudents()
    setSaving(false)
  }

  function parsePaste(text: string) {
    setPasteError('')
    const lines = text.trim().split('\n').filter(l => l.trim())
    const parsed = lines.map(line => {
      const parts = line.split('\t').map(p => p.trim())
      if (parts.length >= 2) {
        return { first_name: parts[0], last_name: parts[1], gender: parts[2] || 'ชาย' }
      }
      const spaceParts = line.trim().split(/\s+/)
      if (spaceParts.length >= 2) {
        return { first_name: spaceParts[0], last_name: spaceParts[1], gender: spaceParts[2] || 'ชาย' }
      }
      return null
    }).filter(Boolean) as { first_name: string; last_name: string; gender: string }[]

    if (parsed.length === 0) {
      setPasteError('ไม่พบข้อมูลที่สามารถแปลงได้ กรุณาตรวจสอบรูปแบบ')
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">👥 จัดการข้อมูลนักเรียน</h1>

      {/* Class selector */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <label className="text-sm font-medium text-gray-600 block mb-2">เลือกชั้นเรียน</label>
        <div className="flex flex-wrap gap-2">
          {classes.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedClass(c.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${selectedClass === c.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {selectedClass && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Add forms */}
          <div className="space-y-6">
            {/* Add single */}
            <div className="bg-white rounded-xl shadow p-4">
              <h2 className="font-semibold text-gray-700 mb-3">เพิ่มนักเรียนทีละคน</h2>
              <div className="space-y-2">
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="ชื่อ"
                  value={form.first_name}
                  onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                />
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="นามสกุล"
                  value={form.last_name}
                  onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                />
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={form.gender}
                  onChange={e => setForm(f => ({ ...f, gender: e.target.value as 'ชาย' | 'หญิง' }))}
                >
                  <option value="ชาย">ชาย</option>
                  <option value="หญิง">หญิง</option>
                </select>
                <button
                  onClick={addStudent}
                  disabled={saving || !form.first_name || !form.last_name}
                  className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  + เพิ่มนักเรียน
                </button>
              </div>
            </div>

            {/* Paste from Excel */}
            <div className="bg-white rounded-xl shadow p-4">
              <h2 className="font-semibold text-gray-700 mb-1">วางข้อมูลจาก Excel</h2>
              <p className="text-xs text-gray-400 mb-2">รูปแบบ: ชื่อ [Tab] นามสกุล [Tab] เพศ (ชาย/หญิง)</p>
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm h-32 focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder={'สมชาย\tใจดี\tชาย\nสมหญิง\tรักเรียน\tหญิง'}
                value={pasteText}
                onChange={e => {
                  setPasteText(e.target.value)
                  setPastePreview([])
                  setPasteError('')
                }}
              />
              {pasteError && <p className="text-red-500 text-xs mt-1">{pasteError}</p>}
              <button
                onClick={() => parsePaste(pasteText)}
                disabled={!pasteText.trim()}
                className="w-full mt-2 bg-gray-100 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
              >
                ตรวจสอบข้อมูล
              </button>

              {pastePreview.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-green-600 font-medium mb-1">พบ {pastePreview.length} รายการ:</p>
                  <div className="max-h-40 overflow-y-auto border rounded text-xs">
                    {pastePreview.map((p, i) => (
                      <div key={i} className="flex gap-2 px-2 py-1 odd:bg-gray-50">
                        <span className="text-gray-400 w-4">{i + 1}</span>
                        <span>{p.first_name} {p.last_name}</span>
                        <span className={`ml-auto ${p.gender === 'หญิง' || p.gender === 'ญ' ? 'text-pink-500' : 'text-blue-500'}`}>
                          {p.gender}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={importPaste}
                    disabled={saving}
                    className="w-full mt-2 bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    นำเข้าข้อมูล {pastePreview.length} คน
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Student list */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-700">
                รายชื่อนักเรียน ({students.length} คน)
              </h2>
              {students.length > 0 && (
                <button onClick={renumberStudents} className="text-xs text-gray-500 hover:text-blue-600 underline">
                  จัดเรียงเลขที่ใหม่
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-400">กำลังโหลด...</div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-gray-400">ยังไม่มีนักเรียนในชั้นนี้</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600">
                      <th className="text-left px-3 py-2 w-12">เลขที่</th>
                      <th className="text-left px-3 py-2">ชื่อ</th>
                      <th className="text-left px-3 py-2">นามสกุล</th>
                      <th className="text-left px-3 py-2">เพศ</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.id} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-500">{s.student_number}</td>
                        <td className="px-3 py-2">{s.first_name}</td>
                        <td className="px-3 py-2">{s.last_name}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                            ${s.gender === 'ชาย' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                            {s.gender}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => { setEditStudent(s); setEditForm({ first_name: s.first_name, last_name: s.last_name, gender: s.gender }) }}
                            className="text-blue-500 hover:text-blue-700 mr-3 text-xs"
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => deleteStudent(s.id)}
                            className="text-red-400 hover:text-red-600 text-xs"
                          >
                            ลบ
                          </button>
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-semibold text-gray-800 mb-4">แก้ไขข้อมูลนักเรียน</h3>
            <div className="space-y-3">
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="ชื่อ"
                value={editForm.first_name}
                onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))}
              />
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="นามสกุล"
                value={editForm.last_name}
                onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))}
              />
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={editForm.gender}
                onChange={e => setEditForm(f => ({ ...f, gender: e.target.value as 'ชาย' | 'หญิง' }))}
              >
                <option value="ชาย">ชาย</option>
                <option value="หญิง">หญิง</option>
              </select>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setEditStudent(null)}
                className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
