'use client'

import { useMemo } from 'react'
import { useTheme } from 'next-themes'
import { Monitor, Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'

const THEME_OPTIONS = [
  { value: 'system', label: 'حسب النظام', icon: Monitor },
  { value: 'light', label: 'وضع فاتح', icon: Sun },
  { value: 'dark', label: 'وضع داكن', icon: Moon },
] as const

type ThemeOptionValue = (typeof THEME_OPTIONS)[number]['value']

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const activeTheme = useMemo<ThemeOptionValue>(() => {
    if (!theme || theme === 'system') {
      return 'system'
    }
    return theme as ThemeOptionValue
  }, [theme])

  const currentLabel = useMemo(() => {
    if (activeTheme === 'system') {
      return resolvedTheme === 'dark' ? 'النظام حالياً: داكن' : 'النظام حالياً: فاتح'
    }
    return activeTheme === 'dark' ? 'الوضع المفعّل: داكن' : 'الوضع المفعّل: فاتح'
  }, [activeTheme, resolvedTheme])

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">{currentLabel}</div>
      <div className="grid gap-2 sm:flex sm:items-center sm:gap-3">
        {THEME_OPTIONS.map((option) => {
          const Icon = option.icon
          const isActive = activeTheme === option.value

          return (
            <Button
              key={option.value}
              type="button"
              variant={isActive ? 'default' : 'outline'}
              className="flex-1 justify-center gap-2"
              onClick={() => setTheme(option.value)}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm font-medium">{option.label}</span>
            </Button>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        يتم تفعيل الوضع الداكن أو الفاتح تلقائياً بناءً على تفضيل نظام التشغيل في حال اخترت "حسب النظام". يمكن تجاوز
        هذا السلوك باختيار وضع محدد أعلاه.
      </p>
    </div>
  )
}
