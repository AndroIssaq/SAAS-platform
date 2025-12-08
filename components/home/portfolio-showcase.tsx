"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Sparkles, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { demoProjects } from "@/lib/data/portfolio"

export function PortfolioShowcase() {
  // عرض أول 3 مشاريع فقط
  const featuredProjects = demoProjects.filter(p => p.featured).slice(0, 3)

  return (
    <section className="py-32 bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-gray-950 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm tracking-wider uppercase">
              معرض الأعمال
            </span>
          </div>
          <h2 className="text-5xl md:text-6xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-black via-emerald-600 to-black dark:from-white dark:via-emerald-400 dark:to-white">
            مشاريعنا المميزة
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            نفخر بتقديم حلول رقمية استثنائية لعملائنا في مختلف المجالات
          </p>
        </motion.div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {featuredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="group relative"
            >
              {/* Card */}
              <div className="relative h-[400px] rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10">
                {/* Background Color */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: `linear-gradient(135deg, ${project.color}, transparent)`,
                  }}
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />

                {/* Content */}
                <div className="relative z-20 h-full p-8 flex flex-col justify-between">
                  {/* Category Badge */}
                  <span
                    className="self-start px-4 py-2 rounded-full text-xs font-bold backdrop-blur-lg border"
                    style={{
                      backgroundColor: `${project.color}20`,
                      borderColor: `${project.color}40`,
                      color: project.color,
                    }}
                  >
                    {project.category}
                  </span>

                  {/* Bottom Info */}
                  <div>
                    <h3 className="text-2xl font-black text-white mb-2">
                      {project.title}
                    </h3>
                    <p className="text-white/80 text-sm mb-4 line-clamp-2">
                      {project.description}
                    </p>

                    {/* Technologies */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.technologies.slice(0, 3).map((tech, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-white/10 backdrop-blur-lg rounded-lg text-xs text-white border border-white/20"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-white/60 text-sm">
                      <span>{project.client}</span>
                      <span>{project.year}</span>
                    </div>
                  </div>
                </div>

                {/* Hover Effect */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                >
                  <Button
                    asChild
                    size="lg"
                    className="gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${project.color}, ${project.color}CC)`,
                    }}
                  >
                    <Link href="/portfolio">
                      عرض التفاصيل
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </Button>
                </motion.div>

                {/* Featured Badge */}
                <div className="absolute top-4 left-4 z-40">
                  <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full font-bold text-xs shadow-lg">
                    ⭐ مميز
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white gap-3 text-lg px-8 py-6"
          >
            <Link href="/portfolio">
              <Sparkles className="w-5 h-5" />
              استكشف جميع المشاريع
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
