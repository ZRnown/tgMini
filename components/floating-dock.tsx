"use client"

import { cn } from "@/lib/utils"
import { Home, Search, Link2, Trophy, User } from "lucide-react"
import { usePathname } from "next/navigation"

const navItems = [
  { href: "/", icon: Home, label: "首页" },
  { href: "/query", icon: Search, label: "查询" },
  { href: "/exchange", icon: Link2, label: "绑定" },
  { href: "/vip", icon: Trophy, label: "等级" },
  { href: "/profile", icon: User, label: "我的" },
]

export function FloatingDock() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-pb">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] mt-1 font-medium">{item.label}</span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
