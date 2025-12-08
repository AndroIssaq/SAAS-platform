"use client"

import { Button } from "@/components/ui/button"

interface DeleteSignupButtonProps {
  label?: string
}

export function DeleteSignupButton({ label = "حذف الـ signup" }: DeleteSignupButtonProps) {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const confirmed = window.confirm(
      "هل أنت متأكد من حذف هذا الـ signup؟\n\nتنبيه: تحتوي هذه البيانات على معلومات عملاء، ولن يمكن استرجاعها بعد الحذف.",
    )
    if (!confirmed) {
      event.preventDefault()
    }
  }

  return (
    <Button type="submit" variant="outline" size="sm" className="text-destructive border-destructive/40" onClick={handleClick}>
      {label}
    </Button>
  )
}
