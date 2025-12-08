"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface PortfolioItem {
  id: string
  title: string
  slug: string
  category: string
  description: string
  thumbnail_url: string
  tags: string[]
  projects?: {
    clients?: {
      company_name: string
    }
  }
}

interface PortfolioGridProps {
  items: PortfolioItem[]
  categories: string[]
}

export function PortfolioGrid({ items, categories }: PortfolioGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("الكل")

  const filteredItems = selectedCategory === "الكل" ? items : items.filter((item) => item.category === selectedCategory)

  return (
    <div className="space-y-8">
      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          variant={selectedCategory === "الكل" ? "default" : "outline"}
          onClick={() => setSelectedCategory("الكل")}
          className="font-sans"
        >
          الكل
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            onClick={() => setSelectedCategory(category)}
            className="font-sans"
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Portfolio Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <Link key={item.id} href={`/portfolio/${item.slug}`}>
            <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-video overflow-hidden bg-muted">
                <Image
                  src={item.thumbnail_url || "/placeholder.svg?height=400&width=600"}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-lg line-clamp-1">{item.title}</h3>
                  <Badge variant="secondary" className="shrink-0">
                    {item.category}
                  </Badge>
                </div>
                {item.projects?.clients?.company_name && (
                  <p className="text-sm text-muted-foreground">{item.projects.clients.company_name}</p>
                )}
                <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">لا توجد مشاريع في هذه الفئة</p>
        </div>
      )}
    </div>
  )
}
