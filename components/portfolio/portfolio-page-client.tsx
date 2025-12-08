"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { PortfolioHero } from "@/components/portfolio/portfolio-hero"
import { PortfolioFilter } from "@/components/portfolio/portfolio-filter"
import { PortfolioCard } from "@/components/portfolio/portfolio-card"
import { PortfolioModal } from "@/components/portfolio/portfolio-modal"
import { Sparkles } from "lucide-react"
import type { PortfolioProject } from "@/lib/data/portfolio"

interface PortfolioPageClientProps {
  projects: PortfolioProject[]
}

export function PortfolioPageClient({ projects }: PortfolioPageClientProps) {
  const [activeCategory, setActiveCategory] = useState("all")
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Filter projects based on category
  const filteredProjects = useMemo(() => {
    if (activeCategory === "all") return projects
    return projects.filter((project) => project.category === activeCategory)
  }, [activeCategory, projects])

  // Count projects per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: projects.length }
    projects.forEach((project) => {
      counts[project.category] = (counts[project.category] || 0) + 1
    })
    return counts
  }, [projects])

  const handleProjectClick = (project: PortfolioProject) => {
    setSelectedProject(project)
    setIsModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Hero Section */}
      <PortfolioHero />

      {/* Filter Section */}
      <PortfolioFilter
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        counts={categoryCounts}
      />

      {/* Projects Grid */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-gray-950 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-96 h-96 bg-emerald-400/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Projects */}
          {filteredProjects.length > 0 ? (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {filteredProjects.map((project, index) => (
                  <PortfolioCard
                    key={project.id}
                    project={project}
                    index={index}
                    onClick={() => handleProjectClick(project)}
                  />
                ))}
              </motion.div>

              {/* Results Count */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-16 text-center"
              >
                <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-full font-bold shadow-lg shadow-emerald-500/50">
                  <Sparkles className="w-5 h-5" />
                  <span>عرض {filteredProjects.length} مشروع</span>
                </div>
              </motion.div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-32 text-center"
            >
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  لا توجد مشاريع بعد
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  جاري العمل على إضافة مشاريع رائعة في هذه الفئة
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Project Modal */}
      <PortfolioModal
        project={selectedProject}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Call to Action */}
      <section className="py-32 bg-gradient-to-br from-black via-gray-950 to-black text-white relative overflow-hidden">
        {/* Animated Background */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 blur-3xl"
        />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
              جاهز لبدء مشروعك؟
            </h2>
            <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
              دعنا نحول فكرتك إلى واقع رقمي مميز يحقق أهدافك
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-12 py-5 bg-emerald-500 text-white rounded-full font-bold text-lg shadow-2xl hover:bg-emerald-600 transition-all"
            >
              ابدأ مشروعك الآن
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
