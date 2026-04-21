import Link from 'next/link'

const cards = [
  {
    href: '/record',
    icon: '📏',
    title: 'บันทึกน้ำหนัก-ส่วนสูง',
    desc: 'บันทึกข้อมูลน้ำหนักและส่วนสูงของนักเรียนในแต่ละเดือน',
    color: 'bg-blue-500',
  },
  {
    href: '/students',
    icon: '👥',
    title: 'จัดการข้อมูลนักเรียน',
    desc: 'เพิ่ม แก้ไข หรือลบข้อมูลนักเรียน รองรับการวางข้อมูลจาก Excel',
    color: 'bg-green-500',
  },
  {
    href: '/report',
    icon: '📊',
    title: 'รายงานประจำเดือน',
    desc: 'ดูสถิติและตรวจสอบว่าชั้นไหนยังไม่ได้บันทึกข้อมูล',
    color: 'bg-purple-500',
  },
]

export default function Home() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">ระบบบันทึกน้ำหนัก-ส่วนสูงนักเรียน</h1>
        <p className="text-gray-500 mt-1">จัดการข้อมูลสุขภาพนักเรียน ชั้น อ.2 - ป.6</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <div className="bg-white rounded-xl shadow hover:shadow-md transition-shadow p-6 flex flex-col gap-3 h-full border border-gray-100 hover:border-blue-200 cursor-pointer">
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center text-2xl`}>
                {card.icon}
              </div>
              <h2 className="text-lg font-semibold text-gray-800">{card.title}</h2>
              <p className="text-gray-500 text-sm">{card.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
