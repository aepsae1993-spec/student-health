'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'หน้าหลัก', icon: '🏠' },
  { href: '/record', label: 'บันทึกน้ำหนัก-ส่วนสูง', icon: '📏' },
  { href: '/students', label: 'จัดการนักเรียน', icon: '👥' },
  { href: '/report', label: 'รายงานประจำเดือน', icon: '📊' },
]

export default function Navbar() {
  const pathname = usePathname()
  return (
    <nav className="bg-blue-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          <div className="py-3 pr-4 font-bold text-lg whitespace-nowrap border-r border-blue-500 mr-2">
            ⚖️ สุขภาพนักเรียน
          </div>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm whitespace-nowrap transition-colors rounded-t
                ${pathname === item.href
                  ? 'bg-white text-blue-700 font-semibold'
                  : 'hover:bg-blue-600'
                }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
