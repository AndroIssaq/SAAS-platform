import { getPublishedPortfolioProjects } from "@/lib/actions/portfolio"
import { PortfolioPageClient } from "@/components/portfolio/portfolio-page-client"

export default async function PortfolioPage() {
  const projects = await getPublishedPortfolioProjects()

  // Transform Supabase data to match PortfolioProject interface
  const formattedProjects = projects.map((p: any) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    category: p.category,
    description: p.description,
    client: p.client_name,
    year: p.year,
    image: p.thumbnail_url || "/placeholder.jpg",
    technologies: p.technologies || [],
    color: p.color || "#10b981",
    featured: p.featured || false,
    stats: p.stats || [],
    features: p.features || [],
    testimonial: p.testimonial || null,
    liveUrl: p.live_url,
    githubUrl: p.github_url,
  }))

  return <PortfolioPageClient projects={formattedProjects} />
}
