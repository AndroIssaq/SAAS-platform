"use client"

import { motion } from "framer-motion"
import { Grid, User, ShoppingCart, Globe, Smartphone, Palette } from "lucide-react"
import { categories } from "@/lib/data/portfolio"

interface PortfolioFilterProps {
  activeCategory: string
  onCategoryChange: (category: string) => void
  counts: Record<string, number>
}

const iconMap: Record<string, any> = {
  Grid,
  User,
  ShoppingCart,
  Globe,
  Smartphone,
  Palette,
}

export function PortfolioFilter({ activeCategory, onCategoryChange, counts }: PortfolioFilterProps) {
  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-gray-950">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-black to-emerald-600 dark:from-white dark:to-emerald-400">
            تصفح حسب الفئة
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            اختر الفئة التي تهمك لاستكشاف المشاريع
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-4">
          {categories.map((category, index) => {
            const Icon = iconMap[category.icon]
            const isActive = activeCategory === category.id
            const count = counts[category.id] || 0

            return (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onCategoryChange(category.id)}
                className={`
                  relative group px-8 py-4 rounded-2xl font-bold transition-all duration-300
                  ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-2xl shadow-emerald-500/50"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-200 dark:border-gray-700"
                  }
                `}
              >
                {/* Glow Effect */}
                {isActive && (
                  <motion.div
                    layoutId="activeGlow"
                    className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl blur-xl opacity-50"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}

                {/* Content */}
                <div className="relative flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-emerald-600 dark:text-emerald-400"}`} />
                  <span>{category.label}</span>
                  
                  {/* Count Badge */}
                  <span
                    className={`
                      px-2.5 py-0.5 rounded-full text-xs font-bold
                      ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                      }
                    `}
                  >
                    {count}
                  </span>
                </div>

                {/* Hover Effect Lines */}
                {!isActive && (
                  <>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-600 group-hover:w-full transition-all duration-300" />
                    <div className="absolute top-0 right-0 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-600 group-hover:w-full transition-all duration-300" />
                  </>
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Decorative Elements */}
        <div className="absolute left-0 top-1/2 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl -z-10" />
        <div className="absolute right-0 top-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-10" />
      </div>
    </section>
  )
}
