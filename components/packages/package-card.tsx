"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Star, Clock, Zap } from "lucide-react"
import { Package } from "@/lib/data/packages"

interface PackageCardProps {
  package: Package
  onSelect?: (pkg: Package) => void
  isSelected?: boolean
}

export function PackageCard({ package: pkg, onSelect, isSelected }: PackageCardProps) {
  const formatPrice = (amount: number) => `${amount.toLocaleString("ar-EG")} ج.م`

  return (
    <Card className={`relative overflow-hidden transition-all hover:shadow-lg ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      {/* Recommended Badge for E-commerce */}
      {pkg.id === "ecommerce" && (
        <div className="absolute top-4 left-4 z-10">
          <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold gap-1">
            <Star className="h-3 w-3 fill-current" />
            الأكثر مبيعاً
          </Badge>
        </div>
      )}

      <CardHeader className="space-y-4">
        <div className="space-y-2">
          <CardTitle className="text-2xl">{pkg.name}</CardTitle>
          <CardDescription>{pkg.description}</CardDescription>
        </div>

        {/* Pricing */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-primary">{formatPrice(pkg.price)}</span>
          </div>
          <div className="flex gap-2 text-sm">
            <Badge variant="outline" className="gap-1">
              <Zap className="h-3 w-3" />
              دفعة مقدمة: {formatPrice(pkg.deposit)}
            </Badge>
            <Badge variant="secondary">
              المتبقي: {formatPrice(pkg.remaining)}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>مدة التسليم: {pkg.deliveryTime}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Highlights */}
        <div className="space-y-3">
          <p className="font-semibold text-sm">✨ أهم المميزات:</p>
          <div className="space-y-2">
            {pkg.highlights.map((highlight, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <span className="text-sm">{highlight}</span>
              </div>
            ))}
          </div>
        </div>

        {/* All Features */}
        <div className="space-y-3">
          <p className="font-semibold text-sm">📋 كل المميزات:</p>
          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-2">
            {pkg.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-2 text-xs">
                <Check className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Important Note */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-2">
            ⚠️ تنبيه مهم:
          </p>
          <p className="text-xs text-amber-800 dark:text-amber-300">
            الدفعة المقدمة (50%) <strong>مقفولة وغير قابلة للتعديل أو الاسترجاع</strong> بعد بدء العمل على المشروع.
          </p>
        </div>
      </CardContent>

      <CardFooter>
        {onSelect && (
          <Button 
            onClick={() => onSelect(pkg)} 
            className="w-full gap-2"
            variant={isSelected ? "secondary" : "default"}
            size="lg"
          >
            {isSelected ? "✓ تم الاختيار" : "اختر هذه الباقة"}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
