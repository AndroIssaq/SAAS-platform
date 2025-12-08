"use client"

import { useState } from "react"
import { PackageCard } from "./package-card"
import { Package, getAllPackages } from "@/lib/data/packages"

interface PackagesListProps {
  onSelectPackage?: (pkg: Package) => void
  selectedPackageId?: string
}

export function PackagesList({ onSelectPackage, selectedPackageId }: PackagesListProps) {
  const packages = getAllPackages()
  const [selectedId, setSelectedId] = useState<string | undefined>(selectedPackageId)

  const handleSelect = (pkg: Package) => {
    setSelectedId(pkg.id)
    onSelectPackage?.(pkg)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">اختر الباقة المناسبة لك</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          باقات احترافية مصممة خصيصاً لتلبية احتياجاتك، مع دعم فني متواصل واستضافة ودومين مجاني لمدة سنة كاملة
        </p>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {packages.map((pkg) => (
          <PackageCard
            key={pkg.id}
            package={pkg}
            onSelect={handleSelect}
            isSelected={selectedId === pkg.id}
          />
        ))}
      </div>

      {/* Additional Info */}
      <div className="bg-muted rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-lg">💡 معلومات مهمة:</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span>•</span>
            <span>جميع الباقات تشمل <strong>استضافة ودومين مجاني</strong> لمدة سنة كاملة</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>تحسين محركات البحث (SEO) بنسبة تفوق <strong>90%</strong> لضمان ظهورك في النتائج الأولى</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>تصميمات <strong>عصرية وأنيقة</strong> متجاوبة مع جميع الأجهزة</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>الدفعة المقدمة <strong>50% من سعر الباقة</strong> (مقفول - غير قابل للتعديل)</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>دعم فني متواصل وتدريب مجاني على إدارة موقعك</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
