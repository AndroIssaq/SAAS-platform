import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Calendar, ExternalLink } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getPortfolioItemBySlug } from "@/lib/actions/portfolio"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ProjectGallery } from "@/components/portfolio/project-gallery"
import { formatDate } from "@/lib/utils/date"

interface PortfolioDetailPageProps {
  params: Promise<{ slug: string }>
}

export default async function PortfolioDetailPage({ params }: PortfolioDetailPageProps) {
  const { slug } = await params
  const item = await getPortfolioItemBySlug(slug)

  if (!item) {
    notFound()
  }

  const project = item.projects
  const client = project?.clients

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        <Image
          src={item.thumbnail_url || "/placeholder.svg?height=800&width=1600"}
          alt={item.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-4 pb-12">
            <div className="max-w-4xl space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-base">
                  {item.category}
                </Badge>
                {item.tags?.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-white border-white/30">
                    {tag}
                  </Badge>
                ))}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white text-balance">{item.title}</h1>
              {client?.company_name && <p className="text-xl text-white/90">{client.company_name}</p>}
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Project Overview */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-2xl font-bold">نظرة عامة</h2>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>

              {/* Challenge */}
              {item.challenge && (
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h2 className="text-2xl font-bold">التحدي</h2>
                    <p className="text-muted-foreground leading-relaxed">{item.challenge}</p>
                  </CardContent>
                </Card>
              )}

              {/* Solution */}
              {item.solution && (
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h2 className="text-2xl font-bold">الحل</h2>
                    <p className="text-muted-foreground leading-relaxed">{item.solution}</p>
                  </CardContent>
                </Card>
              )}

              {/* Results */}
              {item.results && item.results.length > 0 && (
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h2 className="text-2xl font-bold">النتائج</h2>
                    <ul className="space-y-2">
                      {item.results.map((result: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span className="text-muted-foreground">{result}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Gallery */}
              {item.images && item.images.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">معرض الصور</h2>
                  <ProjectGallery images={item.images} />
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Project Info */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-bold text-lg">معلومات المشروع</h3>
                  <Separator />

                  {client?.company_name && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">العميل</p>
                      <p className="font-medium">{client.company_name}</p>
                    </div>
                  )}

                  {client?.industry && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">المجال</p>
                      <p className="font-medium">{client.industry}</p>
                    </div>
                  )}

                  {project?.start_date && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">تاريخ البدء</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{formatDate(project.start_date)}</p>
                      </div>
                    </div>
                  )}

                  {project?.end_date && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">تاريخ الانتهاء</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{formatDate(project.end_date)}</p>
                      </div>
                    </div>
                  )}

                  {item.technologies && item.technologies.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">التقنيات المستخدمة</p>
                      <div className="flex flex-wrap gap-1">
                        {item.technologies.map((tech: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.live_url && (
                    <>
                      <Separator />
                      <Button asChild className="w-full">
                        <a href={item.live_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="ml-2 h-4 w-4" />
                          زيارة الموقع
                        </a>
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* CTA */}
              <Card className="bg-primary text-primary-foreground">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-bold text-lg">هل لديك مشروع مشابه؟</h3>
                  <p className="text-sm opacity-90">دعنا نساعدك في تحقيق أهدافك الرقمية</p>
                  <Button asChild variant="secondary" className="w-full">
                    <Link href="/contact">
                      تواصل معنا
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-12">
            <Button asChild variant="outline">
              <Link href="/portfolio">
                <ArrowRight className="ml-2 h-4 w-4" />
                العودة إلى المعرض
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
