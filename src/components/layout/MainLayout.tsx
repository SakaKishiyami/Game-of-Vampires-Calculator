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
    <div className="min-h-screen bg-[#0c0a0b] text-gray-100 flex">
      {/* Sidebar - overlay when open, hidden when closed (all screen sizes) */}
      <>
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0c0a0b] border-r border-red-950/50 shadow-2xl transform transition-transform duration-200 ease-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-red-950/50">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-red-400/90">Game of Vampires</p>
                <p className="text-sm font-semibold text-gray-100">Calculator Hub</p>
              </div>
              <button
                className="rounded-md p-1.5 text-gray-400 hover:text-white hover:bg-red-950/50 transition-colors"
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
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                      ${
                        isActive
                          ? "bg-red-900/50 text-red-100 border border-red-800/50"
                          : "text-gray-300 hover:bg-gray-800/60 hover:text-white border border-transparent"
                      }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="px-4 py-3 border-t border-red-950/50 text-xs text-gray-500">
              <p>Open or close this menu anytime to switch sections. Each section uses the full page.</p>
            </div>
          </div>
        </aside>
      </>

      {/* Main content - full width, no max-width box */}
      <div className="flex-1 flex flex-col min-h-screen w-full min-w-0">
        <CalculatorSettingsContext.Provider value={settingsValue}>
          {/* Top bar - vampire styling, sidebar toggle always visible */}
          <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 md:px-6 bg-[#0c0a0b]/95 backdrop-blur-md border-b border-red-950/50">
            <button
              className="rounded-md p-1.5 text-gray-400 hover:text-white hover:bg-red-950/50 transition-colors"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <p className="text-xs uppercase tracking-[0.3em] text-red-500">Game of Vampires</p>
              <p className="text-lg md:text-xl font-semibold text-red-100 leading-tight">
                Game of Vampires Calculator
              </p>
              <p className="text-xs text-gray-500">
                {pathname === "/"
                  ? "Main Menu"
                  : navItems.find((item) => pathname.startsWith(item.href))?.label ?? "Calculator"}
              </p>
            </div>
          </header>

          <main className="flex-1 w-full min-w-0 px-4 py-4 md:px-6 md:py-6">
            {children}
          </main>
        </CalculatorSettingsContext.Provider>
      </div>
    </div>
  )
}

