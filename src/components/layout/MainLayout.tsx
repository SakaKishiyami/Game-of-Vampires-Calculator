"use client"

import React, { createContext, useContext, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Home, Calculator, Map, Sparkles, BarChart2, User, Database, Settings } from "lucide-react"

interface MainLayoutProps {
  children: React.ReactNode
}

type Density = "compact" | "comfortable"
type Theme = "dark" | "light"

interface CalculatorSettings {
  density: Density
  toggleDensity: () => void
  theme: Theme
  toggleTheme: () => void
}

const CalculatorSettingsContext = createContext<CalculatorSettings | undefined>(undefined)

export function useCalculatorSettings(): CalculatorSettings {
  const ctx = useContext(CalculatorSettingsContext)
  if (!ctx) {
    throw new Error("useCalculatorSettings must be used within MainLayout")
  }
  return ctx
}

const navItems = [
  { href: "/", label: "Main Menu", icon: Home },
  { href: "/calculator", label: "Main Calculator", icon: Calculator },
  { href: "/familiars", label: "Familiar Tracker", icon: Sparkles },
  { href: "/sinistra", label: "Sinistra Tools", icon: Map },
  { href: "/events", label: "Event Tracker", icon: BarChart2 },
  { href: "/account", label: "Accounts", icon: User },
  { href: "/data", label: "Data & Import", icon: Database },
  { href: "/settings", label: "Calculator Settings", icon: Settings },
]

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [density, setDensity] = useState<Density>("compact")
  const [theme, setTheme] = useState<Theme>("dark")
  const pathname = usePathname()

  const settingsValue: CalculatorSettings = {
    density,
    toggleDensity: () => setDensity((prev) => (prev === "compact" ? "comfortable" : "compact")),
    theme,
    toggleTheme: () => setTheme((prev) => (prev === "dark" ? "light" : "dark")),
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950 text-gray-100 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-black/70 border-r border-purple-900/60 backdrop-blur-xl transform transition-transform duration-200 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:static md:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between px-4 py-4 border-b border-purple-900/60">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-purple-400">Game of Vampires</p>
              <p className="text-sm font-semibold text-gray-100">Calculator Hub</p>
            </div>
            <button
              className="md:hidden rounded-md p-1.5 text-gray-400 hover:text-white hover:bg-purple-900/40 transition-colors"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                    ${
                      isActive
                        ? "bg-purple-700/70 text-white shadow-md shadow-purple-900/40"
                        : "text-gray-300 hover:bg-purple-900/40 hover:text-white"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="px-4 py-3 border-t border-purple-900/60 text-xs text-gray-500">
            <p>Tip: Use this sidebar to swap between calculators, account settings, and data tools without losing your place.</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-0">
        <CalculatorSettingsContext.Provider value={settingsValue}>
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 md:px-6 bg-black/60 backdrop-blur-xl border-b border-purple-900/60">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden rounded-md p-1.5 text-gray-300 hover:text-white hover:bg-purple-900/40 transition-colors"
                onClick={() => setSidebarOpen((v) => !v)}
                aria-label="Toggle navigation"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-purple-400">Vampire Toolkit</p>
                <p className="text-sm text-gray-200">
                  {pathname === "/"
                    ? "Main Menu"
                    : navItems.find((item) => pathname.startsWith(item.href))?.label ?? "Calculator"}
                </p>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-4 md:px-8 md:py-6">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </main>
        </CalculatorSettingsContext.Provider>
      </div>
    </div>
  )
}

