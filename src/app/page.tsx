import Link from 'next/link'

const cards = [
  {
    href: '/record',
    title: 'บันทึกน้ำหนัก-ส่วนสูง',
    desc: 'บันทึกข้อมูลน้ำหนักและส่วนสูงของนักเรียนรายเดือน คำนวณ BMI อัตโนมัติ',
    gradient: 'from-blue-600 to-indigo-600',
    lightBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    href: '/students',
    title: 'จัดการข้อมูลนักเรียน',
    desc: 'เพิ่ม แก้ไข ลบข้อมูลนักเรียน รองรับการวางข้อมูลจาก Excel ได้โดยตรง',
    gradient: 'from-emerald-500 to-teal-600',
    lightBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: '/report',
    title: 'รายงานประจำเดือน',
    desc: 'ดูสถิติรายชั้นเรียน ตรวจสอบว่าชั้นไหนยังไม่ได้บันทึกข้อมูลประจำเดือน',
    gradient: 'from-violet-600 to-purple-600',
    lightBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
]

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-700 rounded-2xl p-8 mb-8 overflow-hidden shadow-xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-8 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-8 left-12 w-40 h-40 rounded-full bg-blue-300 blur-2xl" />
        </div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-blue-200 text-sm px-3 py-1 rounded-full mb-4">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            ระบบจัดการสุขภาพนักเรียน
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">ระบบบันทึกน้ำหนัก-ส่วนสูง</h1>
          <p className="text-indigo-200 text-base">จัดการข้อมูลสุขภาพนักเรียน ชั้น อ.2 ถึง ป.6 ครบวงจรในระบบเดียว</p>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="group">
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 h-full border border-slate-100 group-hover:-translate-y-1 group-hover:border-slate-200">
              <div className={`w-14 h-14 ${card.lightBg} rounded-xl flex items-center justify-center mb-4 ${card.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                {card.icon}
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-2">{card.title}</h2>
              <p className="text-slate-500 text-sm leading-relaxed">{card.desc}</p>
              <div className={`mt-4 inline-flex items-center gap-1.5 text-sm font-semibold bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}>
                เริ่มใช้งาน
                <svg className="w-4 h-4" style={{color: 'inherit', stroke: 'currentColor'}} fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
