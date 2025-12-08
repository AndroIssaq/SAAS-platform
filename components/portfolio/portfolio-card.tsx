"use client"

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { ArrowUpRight, Eye, ExternalLink } from "lucide-react"
import { useState } from "react"
import Image from "next/image"
import type { PortfolioProject } from "@/lib/data/portfolio"

interface PortfolioCardProps {
  project: PortfolioProject
  index: number
  onClick: () => void
}

export function PortfolioCard({ project, index, onClick }: PortfolioCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  // 3D Tilt Effect
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x)
  const mouseYSpring = useSpring(y)

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7.5deg", "-7.5deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7.5deg", "7.5deg"])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
    setIsHovered(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className="group relative cursor-pointer"
    >
      {/* Card Container */}
      <div className="relative h-[500px] rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10">
        {/* Background Image */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
          <motion.div
            animate={{
              scale: isHovered ? 1.1 : 1,
            }}
            transition={{ duration: 0.6 }}
            className="relative w-full h-full"
          >
            <div 
              className="w-full h-full bg-cover bg-center"
              style={{ 
                backgroundColor: project.color,
                backgroundImage: `linear-gradient(45deg, ${project.color}40, ${project.color}20)`
              }}
            />
          </motion.div>
        </div>

        {/* Animated Gradient Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="absolute inset-0 z-20"
          style={{
            background: `linear-gradient(135deg, ${project.color}40, transparent)`,
          }}
        />

        {/* Content */}
        <div className="relative z-30 h-full p-8 flex flex-col justify-between">
          {/* Top Section - Category Badge */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -20 }}
            transition={{ duration: 0.3 }}
          >
            <span 
              className="inline-block px-4 py-2 rounded-full text-xs font-bold backdrop-blur-lg border"
              style={{
                backgroundColor: `${project.color}20`,
                borderColor: `${project.color}40`,
                color: project.color,
              }}
            >
              {project.category}
            </span>
          </motion.div>

          {/* Bottom Section - Project Info */}
          <div>
            {/* Technologies */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex flex-wrap gap-2 mb-4"
            >
              {project.technologies.slice(0, 3).map((tech, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-white/10 backdrop-blur-lg rounded-lg text-xs text-white border border-white/20"
                >
                  {tech}
                </span>
              ))}
              {project.technologies.length > 3 && (
                <span className="px-3 py-1 bg-white/10 backdrop-blur-lg rounded-lg text-xs text-white/60 border border-white/20">
                  +{project.technologies.length - 3}
                </span>
              )}
            </motion.div>

            {/* Title */}
            <motion.h3
              animate={{
                y: isHovered ? 0 : 10,
              }}
              className="text-3xl font-black text-white mb-2 leading-tight"
            >
              {project.title}
            </motion.h3>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="text-white/80 text-sm mb-4 line-clamp-2"
            >
              {project.description}
            </motion.p>

            {/* Client & Year */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/60 text-sm">{project.client}</span>
              <span className="text-white/60 text-sm">{project.year}</span>
            </div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="flex gap-3"
            >
              <button
                onClick={onClick}
                className="flex-1 px-6 py-3 rounded-xl font-bold transition-all backdrop-blur-lg border border-white/20 hover:border-white/40 text-white hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${project.color}40, ${project.color}20)`,
                }}
              >
                <Eye className="w-4 h-4 inline ml-2" />
                عرض التفاصيل
              </button>
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-3 rounded-xl backdrop-blur-lg border border-white/20 hover:border-white/40 hover:scale-110 transition-all"
                  style={{
                    background: `${project.color}20`,
                  }}
                >
                  <ExternalLink className="w-5 h-5 text-white" />
                </a>
              )}
            </motion.div>
          </div>
        </div>

        {/* Shine Effect */}
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: isHovered ? "100%" : "-100%" }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 z-40 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
        />

        {/* Corner Accent */}
        <div
          className="absolute top-0 right-0 w-32 h-32 opacity-20"
          style={{
            background: `radial-gradient(circle at top right, ${project.color}, transparent)`,
          }}
        />
      </div>

      {/* Featured Badge */}
      {project.featured && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="absolute -top-3 -right-3 z-50"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full blur-md" />
            <div className="relative bg-gradient-to-br from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full font-bold text-xs shadow-lg">
              ⭐ مميز
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
