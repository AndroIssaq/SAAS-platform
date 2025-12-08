"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, ExternalLink, Github, Calendar, User, CheckCircle, Quote } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import type { PortfolioProject } from "@/lib/data/portfolio"
import { Button } from "@/components/ui/button"

interface PortfolioModalProps {
  project: PortfolioProject | null
  isOpen: boolean
  onClose: () => void
}

export function PortfolioModal({ project, isOpen, onClose }: PortfolioModalProps) {
  if (!project) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0 bg-gradient-to-br from-gray-900 to-gray-800 border-0">
        <VisuallyHidden>
          <DialogTitle>{project.title}</DialogTitle>
        </VisuallyHidden>
        <div className="relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 left-6 z-50 p-3 rounded-full bg-black/50 backdrop-blur-lg text-white hover:bg-black/70 transition-all hover:scale-110"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Hero Section */}
          <div className="relative h-[400px] overflow-hidden">
            {/* Background */}
            <motion.div
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${project.color}80, ${project.color}40)`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />

            {/* Content */}
            <div className="relative h-full flex flex-col justify-end p-12">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="px-4 py-2 rounded-full text-sm font-bold backdrop-blur-lg border"
                    style={{
                      backgroundColor: `${project.color}40`,
                      borderColor: `${project.color}60`,
                      color: "white",
                    }}
                  >
                    {project.category}
                  </span>
                  {project.featured && (
                    <span className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-sm font-bold">
                      ⭐ مميز
                    </span>
                  )}
                </div>

                <h2 className="text-5xl font-black text-white mb-4 leading-tight">
                  {project.title}
                </h2>

                <div className="flex items-center gap-6 text-white/80 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{project.client}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{project.year}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-12 space-y-12">
            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-2xl font-bold text-white mb-4">عن المشروع</h3>
              <p className="text-gray-300 text-lg leading-relaxed">
                {project.description}
              </p>
            </motion.div>

            {/* Stats */}
            {project.stats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-3 gap-6"
              >
                {project.stats.map((stat, index) => (
                  <div
                    key={index}
                    className="p-6 rounded-2xl backdrop-blur-lg border border-white/10"
                    style={{
                      background: `linear-gradient(135deg, ${project.color}20, ${project.color}10)`,
                    }}
                  >
                    <div className="text-4xl font-black mb-2" style={{ color: project.color }}>
                      {stat.value}
                    </div>
                    <div className="text-gray-400 text-sm">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Technologies */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-2xl font-bold text-white mb-6">التقنيات المستخدمة</h3>
              <div className="flex flex-wrap gap-3">
                {project.technologies.map((tech, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className="px-6 py-3 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 text-white font-semibold hover:scale-105 transition-transform"
                  >
                    {tech}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h3 className="text-2xl font-bold text-white mb-6">المميزات الرئيسية</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {project.features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: project.color }} />
                    <span className="text-gray-300">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Testimonial */}
            {project.testimonial && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="relative p-8 rounded-2xl backdrop-blur-lg border border-white/10"
                style={{
                  background: `linear-gradient(135deg, ${project.color}20, ${project.color}10)`,
                }}
              >
                <Quote className="w-12 h-12 mb-4 opacity-30" style={{ color: project.color }} />
                <p className="text-white text-xl italic mb-6 leading-relaxed">
                  "{project.testimonial.text}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full" style={{ backgroundColor: project.color }} />
                  <div>
                    <div className="font-bold text-white">{project.testimonial.author}</div>
                    <div className="text-gray-400 text-sm">{project.testimonial.position}</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex gap-4"
            >
              {project.liveUrl && (
                <Button
                  asChild
                  size="lg"
                  className="flex-1 text-lg font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${project.color}, ${project.color}CC)`,
                  }}
                >
                  <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-5 h-5 ml-2" />
                    زيارة الموقع
                  </a>
                </Button>
              )}
              {project.githubUrl && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="px-8 text-lg font-bold border-2 border-white/20 hover:border-white/40"
                >
                  <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                    <Github className="w-5 h-5 ml-2" />
                    GitHub
                  </a>
                </Button>
              )}
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
