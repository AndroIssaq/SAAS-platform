 'use client'

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Sparkles,
  TrendingUp,
  FileText,
  Users,
  Bell,
  Layers,
  Menu,
  X,
} from "lucide-react"
import { motion } from "framer-motion"

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
}

export default function HomePage() {
  const featureBlocks = [
    {
      title: "كل دورة حياة العقد في مكان واحد",
      description:
        "من إنشاء العقد، إرسال رابط التوقيع للعميل، التوقيع المزدوج، وحتى إثبات الدفع – كل خطوة موثقة داخل عَقدي.",
      icon: FileText,
      badge: "إدارة العقود",
    },
    {
      title: "مساحة عمل لكل حساب، وعملاء بلا حدود",
      description:
        "أنشئ مساحة عمل خاصة لفريقك، أضف أعضاءك، وادعُ عملاءك للتوقيع والمتابعة من خلال بوابة عميل بسيطة وواضحة.",
      icon: Users,
      badge: "Multi‑Tenant Workspace",
    },
    {
      title: "إشعارات وتحديثات في الوقت الحقيقي",
      description:
        "عميلك يعرف دائمًا أين وصل العقد أو المشروع، وأنت تتابع كل حركة من لوحة تحكم واحدة.",
      icon: Bell,
      badge: "تجربة عميل راقية",
    },
    {
      title: "نظام عمولات لشركائك والمسوّقين",
      description:
        "تابع الإحالات والعمولات بشكل آلي وشفاف، مع سجلات دقيقة لكل عملية إحالة أو سحب أرباح.",
      icon: TrendingUp,
      badge: "Affiliates & Referrals",
    },
  ]

  const audienceCards = [
    {
      title: "وكالات التسويق والخدمات",
      body: "حوّل فوضى العقود والواتساب إلى عمليات منظمة، بروابط توقيع ولوحة تحكم لكل عميل.",
    },
    {
      title: "الاستشاريون والمستقلون",
      body: "احمِ وقتك وأموالك بعقود واضحة، توقيع إلكتروني موثّق، وإثبات دفع قبل بدء العمل.",
    },
    {
      title: "الشركات الصغيرة والمتوسطة",
      body: "منصة واحدة تجمع العقود، العملاء، المشاريع، والدفعات، ويفهمها فريقك من أول يوم.",
    },
    {
      title: "الفرق القانونية والإدارية",
      body: "تابع التزامات العملاء، حالة العقود، والأرشيف الكامل لكل ما تم الاتفاق عليه.",
    },
  ]

  const faqItems = [
    {
      q: "ما هي عَقدي؟",
      a: "عَقدي هي منصة SaaS عربية لإدارة العقود، التوقيع الإلكتروني، العملاء والمشاريع، مع مساحة عمل خاصة لكل حساب ونظام عمولات للشركاء.",
    },
    {
      q: "هل المنصة تدعم أكثر من عميل داخل نفس الحساب؟",
      a: "نعم، كل حساب في عَقدي يمتلك مساحة عمل مستقلة يمكنك من خلالها إدارة عدد غير محدود من العملاء والعقود والمشاريع.",
    },
    {
      q: "هل التوقيع الإلكتروني قانوني؟",
      a: "التوقيع الإلكتروني في عَقدي يوثّق هوية الأطراف وتاريخ ووقت التوقيع وسجلّ الإجراءات، مما يعزز موقفك القانوني وفق أفضل الممارسات المتّبعة.",
    },
    {
      q: "هل أحتاج إلى إعدادات تقنية معقدة؟",
      a: "لا تحتاج لأي خبرة تقنية. أنشئ حسابك، أضف فريقك، وابدأ في إنشاء عقودك خلال دقائق.",
    },
    {
      q: "هل أستطيع الإلغاء في أي وقت؟",
      a: "نعم، يمكنك إيقاف اشتراكك في أي وقت بدون التزام طويل، مع إمكانية تصدير بياناتك الأساسية.",
    },
  ]

  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY > 20
      setIsScrolled(scrolled)
      if (window.scrollY > 0) {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const handleNavClick = (id: string) => (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
    setIsMenuOpen(false)
  }

  return (
    <>
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center"
      >
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className={`pointer-events-auto mx-auto flex flex-col gap-1 rounded-3xl border backdrop-blur-2xl shadow-md shadow-black/30 ${
            isScrolled
              ? "w-[60%] border-slate-800/80 bg-slate-950/90 py-2"
              : "w-[90%] border-slate-800/50 bg-slate-950/70 py-3"
          }`}
        >
          <div className="flex items-center justify-between gap-3 px-3 sm:px-4">
            <button
              type="button"
              onClick={handleNavClick("hero")}
              className="flex items-center gap-3 rounded-full border border-slate-700/70 bg-slate-900/80 px-3 py-1 text-start text-xs text-slate-100 shadow-sm shadow-black/40 hover:border-emerald-500/70 hover:text-emerald-100"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-[0.8rem] font-bold text-emerald-300">
                ع
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-bold">عَقدي</span>
                <span className="block text-[0.7rem] text-slate-300/80">الاتفاق كما يجب أن يكون</span>
              </span>
            </button>

            <div className="hidden items-center gap-3 text-[0.8rem] text-slate-200/90 md:flex">
              <button
                type="button"
                onClick={handleNavClick("features")}
                className="rounded-full px-3 py-1 hover:bg-slate-900/70 hover:text-emerald-200"
              >
                المميزات
              </button>
              <button
                type="button"
                onClick={handleNavClick("audience")}
                className="rounded-full px-3 py-1 hover:bg-slate-900/70 hover:text-emerald-200"
              >
                لمن صُممت
              </button>
              <button
                type="button"
                onClick={handleNavClick("journey")}
                className="rounded-full px-3 py-1 hover:bg-slate-900/70 hover:text-emerald-200"
              >
                كيف تعمل
              </button>
              <button
                type="button"
                onClick={handleNavClick("pricing")}
                className="rounded-full px-3 py-1 hover:bg-slate-900/70 hover:text-emerald-200"
              >
                التسعير
              </button>
              <button
                type="button"
                onClick={handleNavClick("faq")}
                className="rounded-full px-3 py-1 hover:bg-slate-900/70 hover:text-emerald-200"
              >
                الأسئلة الشائعة
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/70 bg-slate-900/80 text-slate-100 shadow-sm shadow-black/40 hover:border-emerald-500/70 hover:text-emerald-100 md:hidden"
                aria-label="فتح قائمة الموبايل"
              >
                {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="hidden rounded-full border-slate-600 bg-slate-950/70 px-4 text-xs text-slate-100 hover:bg-slate-900 md:inline-flex"
              >
                <Link href="/auth/login">تسجيل الدخول</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="hidden rounded-full bg-gradient-to-l from-emerald-500 to-emerald-600 px-5 text-xs font-semibold shadow-md shadow-emerald-500/40 hover:from-emerald-600 hover:to-emerald-700 md:inline-flex"
              >
                <Link href="/auth/sign-up">ابدأ الآن</Link>
              </Button>
            </div>
          </div>

          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="mt-1 flex flex-col gap-1 rounded-2xl border-t border-slate-800 bg-slate-950/95 px-3 py-3 text-xs text-slate-100 md:hidden"
            >
              <button
                type="button"
                onClick={handleNavClick("features")}
                className="rounded-xl px-2 py-2 text-start hover:bg-slate-900/90"
              >
                المميزات
              </button>
              <button
                type="button"
                onClick={handleNavClick("audience")}
                className="rounded-xl px-2 py-2 text-start hover:bg-slate-900/90"
              >
                لمن صُممت
              </button>
              <button
                type="button"
                onClick={handleNavClick("journey")}
                className="rounded-xl px-2 py-2 text-start hover:bg-slate-900/90"
              >
                كيف تعمل
              </button>
              <button
                type="button"
                onClick={handleNavClick("pricing")}
                className="rounded-xl px-2 py-2 text-start hover:bg-slate-900/90"
              >
                التسعير
              </button>
              <button
                type="button"
                onClick={handleNavClick("faq")}
                className="rounded-xl px-2 py-2 text-start hover:bg-slate-900/90"
              >
                الأسئلة الشائعة
              </button>
              <div className="mt-2 flex gap-2 pt-1">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="flex-1 rounded-xl border-slate-600 bg-slate-950/80 text-[0.75rem] text-slate-100 hover:bg-slate-900"
                >
                  <Link href="/auth/login">تسجيل الدخول</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="flex-1 rounded-xl bg-gradient-to-l from-emerald-500 to-emerald-600 text-[0.75rem] font-semibold text-white shadow-md shadow-emerald-500/40 hover:from-emerald-600 hover:to-emerald-700"
                >
                  <Link href="/auth/sign-up">ابدأ الآن</Link>
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.nav>

      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-950 text-white">
      {/* Hero */}
      <motion.section
        id="hero"
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative overflow-hidden scroll-mt-24 pt-28 pb-28 md:scroll-mt-32 md:pt-32 md:pb-32"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 end-10 h-72 w-72 rounded-full bg-emerald-500/25 blur-3xl" />
          <div className="absolute -bottom-40 start-0 h-80 w-80 rounded-full bg-emerald-700/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_55%)]" />
        </div>

        <div className="relative z-10 container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center md:max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-1 text-sm font-medium text-emerald-200">
              <Sparkles className="h-4 w-4" />
              <span>عَقدي – الاتفاق كما يجب أن يكون</span>
            </div>

            <h1 className="mb-4 text-4xl font-black leading-tight md:text-6xl">
              منصة إدارة العقود والعملاء
              <span className="block bg-gradient-to-l from-emerald-300 via-emerald-500 to-emerald-200 bg-clip-text text-transparent">
                التي تجمع كل الاتفاق في مساحة واحدة
              </span>
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-balance text-lg text-slate-200/80 md:text-xl">
              أنشئ مساحة عملك الخاصة، جهّز عقودك، أرسلها للتوقيع، تابع المشاريع والدفعات، وامنح عملاءك تجربة احترافية – بدون ملفات متفرقة أو محادثات ضائعة.
            </p>

            <div className="mb-10 flex flex-wrap items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="group flex items-center gap-2 rounded-full bg-gradient-to-l from-emerald-500 to-emerald-600 px-10 py-6 text-lg font-semibold shadow-lg shadow-emerald-500/30 hover:from-emerald-600 hover:to-emerald-700"
              >
                <Link href="/auth/sign-up">
                  ابدأ تجربتك المجانية الآن
                  <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-slate-600 bg-slate-900/60 px-8 py-6 text-lg text-slate-100 hover:bg-slate-900"
              >
                <Link href="#features">شاهد كيف تعمل عَقدي</Link>
              </Button>
            </div>

            <div className="grid gap-4 text-sm text-slate-300/90 md:grid-cols-3">
              <div className="rounded-2xl border border-emerald-500/40 bg-slate-900/60 p-4">
                <p className="mb-1 text-xs text-emerald-300/90">استبدل الفوضى بالوضوح</p>
                <p>جميع العقود، العملاء، المشاريع وإثباتات الدفع في لوحة واحدة.</p>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                <p className="mb-1 text-xs text-emerald-300/90">مساحة عمل لكل حساب</p>
                <p>لكل فريق مساحة مستقلة بالكامل مع صلاحيات للأعضاء وعملاء بلا حدود.</p>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                <p className="mb-1 text-xs text-emerald-300/90">تجربة عربية بالكامل</p>
                <p>واجهة عربية، نصوص عقود عربية، وتدفق عمل مصمم لسوقنا المحلي.</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Encryption Proof */}
      <section className="border-y border-slate-900 bg-slate-950/80 py-16" id="security">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-emerald-300/80">الحماية</p>
              <h2 className="text-3xl font-black text-white">
                تشفير طرف-لطرف + Cloudflare TLS 1.3 = صفر وصول لغير المالك
              </h2>
              <p className="text-slate-300/90 text-lg">
                كل عقد يتم تشفير محتواه داخل متصفحك باستخدام مكتبة <strong>libsodium</strong>، ويتم حفظ النص المشفّر فقط في قاعدة البيانات.
                لا يستطيع فريق عَقدي أو أي طرف وسيط قراءة محتوى العقد دون مفتاحك الخاص.
              </p>
              <ul className="space-y-3 text-sm text-slate-200/80">
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 font-semibold">1</span>
                  <div>
                    <p className="font-semibold text-white">مفاتيح تولَّد محليًا وتُدار لكل Workspace</p>
                    <p>المفتاح العام فقط يُرسل للخادم، بينما يُخزَّن المفتاح الخاص مشفّرًا عند الأعضاء مع إمكانية مزامنة مشفرة.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 font-semibold">2</span>
                  <div>
                    <p className="font-semibold text-white">إثباتات Cloudflare TLS 1.3 + HSTS</p>
                    <p>كل جلسة تُسجّل بصمة <code>cf-ray</code>، ونفرض بروتوكول TLS 1.3 مع HSTS لحماية طبقة النقل.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 font-semibold">3</span>
                  <div>
                    <p className="font-semibold text-white">دليل واضح في لوحة التحكم</p>
                    <p>يمكنك زيارة إعدادات التشفير لأي Workspace لرؤية حالة المفتاح، إعادة تدويره، ومشاركة النسخة المشفرة مع الأعضاء.</p>
                  </div>
                </li>
              </ul>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild size="lg" className="rounded-full bg-emerald-600/80 px-8">
                  <Link href="/admin/settings#encryption">تفعيل التشفير الآن</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full border-slate-600 text-slate-100">
                  <Link href="#faq">اقرأ المزيد عن الحماية</Link>
                </Button>
              </div>
            </div>
            <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/60 p-6 shadow-lg shadow-emerald-500/10">
              <div className="rounded-2xl border border-emerald-500/30 bg-slate-950/70 p-4">
                <p className="text-xs text-emerald-300/80">حالة التشفير</p>
                <p className="text-2xl font-semibold text-white">مفعل لكل العقود</p>
                <p className="text-sm text-slate-400 mt-1">نسخة المفتاح العام لا تغادر مساحة العمل.</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-xs text-slate-400">Cloudflare TLS 1.3</p>
                <p className="text-lg text-white">HSTS + cf-ray audit trail</p>
                <p className="text-sm text-slate-400 mt-1">كل زيارة يتم توقيعها وتدقيقها عبر شبكة Cloudflare.</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-xs text-slate-400">Zero-Knowledge</p>
                <p className="text-lg text-white">فك التشفير في متصفحك فقط</p>
                <p className="text-sm text-slate-400 mt-1">دون إدخال كلمة مرورك الخاصة بالمفتاح لا يمكن لأي موظف رؤية العقد.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key stats */}
      <section className="border-y border-slate-800 bg-slate-950/60 py-10">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 text-center md:grid-cols-3">
            <div className="rounded-2xl bg-slate-900/70 p-6 shadow-inner shadow-emerald-500/10">
              <div className="mb-1 text-xs text-emerald-300/80">سرعة التوقيع</div>
              <p className="text-4xl font-extrabold text-emerald-300">3x</p>
              <p className="mt-1 text-sm text-slate-300/80">أسرع في إغلاق العقود مقارنة بالطريقة التقليدية.</p>
            </div>
            <div className="rounded-2xl bg-slate-900/70 p-6 shadow-inner shadow-emerald-500/10">
              <div className="mb-1 text-xs text-emerald-300/80">تقليل الفوضى</div>
              <p className="text-4xl font-extrabold text-emerald-300">90%</p>
              <p className="mt-1 text-sm text-slate-300/80">أقل اعتمادًا على رسائل واتساب وسجلات متفرقة.</p>
            </div>
            <div className="rounded-2xl bg-slate-900/70 p-6 shadow-inner shadow-emerald-500/10">
              <div className="mb-1 text-xs text-emerald-300/80">رضا العملاء</div>
              <p className="text-4xl font-extrabold text-emerald-300">+95%</p>
              <p className="mt-1 text-sm text-slate-300/80">تجربة توقيع وتتبع واضحة ترفع ثقة عملائك بك.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <motion.section
        id="features"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeInUp}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="scroll-mt-24 py-20 md:scroll-mt-32 md:py-24"
      >
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300/80">
              الميزات الرئيسية
            </p>
            <h2 className="mb-4 text-3xl font-black md:text-4xl">
              كل ما تحتاجه لإدارة الاتفاق
              <span className="block text-emerald-300">من أول رسالة حتى آخر دفعة</span>
            </h2>
            <p className="text-balance text-slate-300/90">
              عَقدي لا تجمع لك العقود فقط، بل تبني حولها تجربة عمل كاملة: عميل يعرف أين وصل، وفريق يعرف ماذا يفعل، وسجل
              واضح لكل خطوة.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {featureBlocks.map((block) => {
              const Icon = block.icon
              return (
                <motion.div
                  key={block.title}
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="group flex h-full flex-col rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-5 shadow-lg shadow-black/40"
                >
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
                      <Sparkles className="ms-1 h-3 w-3" />
                      {block.badge}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-white">{block.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-300/90">{block.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.section>

      {/* Horizontal slider: who is it for */}
      <section id="audience" className="border-y border-slate-800 bg-slate-950/70 py-16 scroll-mt-24 md:scroll-mt-32">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold md:text-3xl">لمن صُممت منصة عَقدي؟</h2>
              <p className="mt-1 max-w-xl text-sm text-slate-300/90">
                عَقدي تناسب أي فريق أو عمل يعتمد على اتفاق واضح مع عملائه: عقود، دفعات، تسليمات، وتحديثات مستمرة.
              </p>
            </div>
            <div className="text-xs text-slate-400">اسحب لليمين واليسار لاستكشاف الحالات المختلفة</div>
          </div>

          <div className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2">
            {audienceCards.map((card) => (
              <div
                key={card.title}
                className="min-w-[260px] max-w-xs snap-center rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-black/40"
              >
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                  <Layers className="h-3 w-3" />
                  <span>Use Case</span>
                </div>
                <h3 className="mb-2 text-base font-bold text-white">{card.title}</h3>
                <p className="text-sm leading-relaxed text-slate-300/90">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <motion.section
        id="journey"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeInUp}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="py-20 md:py-24"
      >
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-black md:text-4xl">رحلة العقد داخل عَقدي</h2>
            <p className="text-sm text-slate-300/90 md:text-base">
              خطوات واضحة من أول إدخال بيانات العميل وحتى توثيق إثبات الدفع وإغلاق العقد، مع سجل كامل لكل ما حدث.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <div className="relative flex flex-col rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
              <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-200">
                1
              </span>
              <h3 className="mb-2 text-base font-bold">إنشاء مساحة عملك وحسابك</h3>
              <p className="text-sm text-slate-300/90">
                سجّل في عَقدي خلال دقائق، وابدأ بتنظيم فريقك وأعضاء حسابك في مساحة عمل واحدة.
              </p>
            </div>
            <div className="relative flex flex-col rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
              <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-200">
                2
              </span>
              <h3 className="mb-2 text-base font-bold">إضافة العميل وإنشاء العقد</h3>
              <p className="text-sm text-slate-300/90">
                أضف بيانات العميل، اختر الخدمة والبند المالي، ودع عَقدي يبني لك عقدًا واضحًا جاهزًا للإرسال.
              </p>
            </div>
            <div className="relative flex flex-col rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
              <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-200">
                3
              </span>
              <h3 className="mb-2 text-base font-bold">التوقيع الإلكتروني وتتبع التنفيذ</h3>
              <p className="text-sm text-slate-300/90">
                يقرأ العميل العقد عبر رابط خاص، يوقّع إلكترونيًا، وتتابع أنت مرحلة العمل، التسليمات، والتحديثات من لوحة التحكم.
              </p>
            </div>
            <div className="relative flex flex-col rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
              <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-200">
                4
              </span>
              <h3 className="mb-2 text-base font-bold">إثبات الدفع وإغلاق العقد بثقة</h3>
              <p className="text-sm text-slate-300/90">
                استقبل إثبات الدفع، وثّقه داخل العقد، واغلق العملية مع أرشيف كامل يمكن الرجوع إليه في أي وقت.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Pricing */}
      <motion.section
        id="pricing"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        variants={fadeInUp}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="border-y border-slate-800 bg-slate-950 py-20 scroll-mt-24 md:scroll-mt-32"
      >
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <h2 className="mb-3 text-3xl font-black md:text-4xl">خطط تسعير تناسب حجم عملك</h2>
            <p className="text-sm text-slate-300/90 md:text-base">
              ابدأ بـ14 يوم تجربة مجانية، ثم اختر الخطة التي تناسب مكتبك أو شركتك. يمكنك الترقية أو الإلغاء في أي وقت.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Small Offices - Monthly / Yearly */}
            <div className="flex flex-col rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-black/40">
              <div className="mb-3 text-xs font-semibold text-emerald-300">الاشتراك الشهري</div>
              <h3 className="mb-1 text-lg font-bold">خطة المكاتب الصغيرة</h3>
              <p className="mb-2 text-xs text-slate-400">مناسبة للمكاتب الفردية والشركات الصغيرة.</p>
              <p className="mb-4 text-3xl font-extrabold text-emerald-300">
                999<span className="ms-1 text-sm font-normal text-slate-300">جنيه / شهر</span>
              </p>
              <div className="mb-3 rounded-2xl bg-slate-950/70 p-3 text-xs text-slate-300/95">
                <p className="mb-1 font-semibold text-emerald-200">السنوي</p>
                <p>
                  <span className="font-bold">9,990 جنيه / السنة</span>
                  <span className="ms-2 text-[0.7rem] text-emerald-300">بدل 11,988 جنيه</span>
                </p>
              </div>
              <ul className="mb-5 space-y-1 text-xs text-slate-200/95">
                <li>إنشاء عدد غير محدود من العقود</li>
                <li>توقيع إلكتروني للطرفين</li>
                <li>رفع بطاقات الهوية</li>
                <li>رفع وإدارة إثباتات الدفع</li>
                <li>إشعارات عبر البريد الإلكتروني</li>
                <li>قوالب عقود جاهزة</li>
                <li>سجل نشاط كامل Activity Log</li>
                <li>دعم أساسي عبر الشات</li>
                <li>أرشفة ذكية للملفات</li>
              </ul>
              <Button asChild size="lg" className="mt-auto rounded-full bg-emerald-500 px-6 py-5 text-sm font-semibold hover:bg-emerald-600">
                <Link href="/auth/sign-up?plan=small_office_monthly">ابدأ بالخطة للمكاتب الصغيرة</Link>
              </Button>
            </div>

            {/* Larger Companies */}
            <div className="flex flex-col rounded-3xl border border-emerald-500/70 bg-gradient-to-b from-emerald-600/15 via-slate-900 to-slate-950 p-6 shadow-xl shadow-emerald-500/25">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-[0.7rem] font-semibold text-emerald-200">
                الخطة الأكثر اختيارًا
              </div>
              <div className="mb-1 text-xs font-semibold text-emerald-300">الاشتراك الشهري</div>
              <h3 className="mb-1 text-lg font-bold">خطة الشركات الكبيرة</h3>
              <p className="mb-2 text-xs text-slate-300">للشركات المتوسطة والكبيرة التي تستخدم عقودًا كثيرة يوميًا.</p>
              <p className="mb-4 text-3xl font-extrabold text-emerald-300">
                1,999<span className="ms-1 text-sm font-normal text-slate-300">جنيه / شهر</span>
              </p>
              <div className="mb-3 rounded-2xl bg-slate-950/70 p-3 text-xs text-slate-200/95">
                <p className="mb-1 font-semibold text-emerald-200">السنوي</p>
                <p>
                  <span className="font-bold">19,990 جنيه / السنة</span>
                  <span className="ms-2 text-[0.7rem] text-emerald-300">بدل 23,988 جنيه</span>
                </p>
              </div>
              <ul className="mb-5 space-y-1 text-xs text-slate-100/95">
                <li>كل ما في خطة المكاتب الصغيرة +</li>
                <li>AI Contract Assistant لصياغة ومراجعة العقود</li>
                <li>التحقق عبر OTP</li>
                <li>عدد مستخدمين غير محدود</li>
                <li>إدارة مدفوعات متقدمة (رفع – مراجعة – اعتماد)</li>
                <li>تخصيص العلامة التجارية (Logo + ألوان)</li>
                <li>ربط Google Drive</li>
                <li>ربط Google Calendar</li>
                <li>دعم متقدم</li>
              </ul>
              <Button
                asChild
                size="lg"
                className="mt-auto rounded-full bg-gradient-to-l from-emerald-500 to-emerald-600 px-6 py-5 text-sm font-semibold shadow-lg shadow-emerald-500/40 hover:from-emerald-600 hover:to-emerald-700"
              >
                <Link href="/auth/sign-up?plan=company_monthly">ابدأ بالخطة للشركات الكبيرة</Link>
              </Button>
            </div>

            {/* Enterprise */}
            <div className="flex flex-col rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-black/40">
              <div className="mb-3 text-xs font-semibold text-slate-300">Enterprise – بدون سعر ثابت</div>
              <h3 className="mb-1 text-lg font-bold">للشركات والمؤسسات الضخمة</h3>
              <p className="mb-3 text-xs text-slate-400">تسعير مخصص حسب حجم الشركة وعدد المستخدمين والعمليات المطلوبة.</p>
              <p className="mb-4 text-2xl font-extrabold text-emerald-300">حسب الاتفاق</p>
              <ul className="mb-5 space-y-1 text-xs text-slate-200/95">
                <li>API Integration كامل</li>
                <li>Workflows مخصصة</li>
                <li>أذونات وصلاحيات متقدمة</li>
                <li>SSO</li>
                <li>دعم 24/7</li>
                <li>حلول حسب القطاع</li>
              </ul>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="mt-auto rounded-full border-slate-500 bg-slate-950 px-6 py-5 text-sm font-semibold text-slate-100 hover:bg-slate-900"
              >
                <Link href="/auth/sign-up?plan=enterprise">تحدث معنا عن خطة Enterprise</Link>
              </Button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* FAQ */}
      <motion.section
        id="faq"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        variants={fadeInUp}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="scroll-mt-24 py-20 md:scroll-mt-32 md:py-24"
      >
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <h2 className="mb-3 text-3xl font-black md:text-4xl">أسئلة يطرحها من يشبهونك قبل الاشتراك</h2>
            <p className="text-sm text-slate-300/90 md:text-base">
              حاولنا أن نجيب عن أكثر الأسئلة تكرارًا. إن كان لديك شيء إضافي لا تتردد في مراسلتنا من داخل المنصة.
            </p>
          </div>

          <div className="mx-auto max-w-3xl space-y-4">
            {faqItems.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-emerald-500/60"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold md:text-base">{item.q}</h3>
                  </div>
                  <div className="ms-3 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs text-emerald-300 group-open:rotate-180">
                    ↓
                  </div>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-300/90 md:text-[0.93rem]">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Final CTA */}
      <section className="relative overflow-hidden border-t border-slate-800 bg-gradient-to-b from-emerald-600/15 via-slate-950 to-slate-950 py-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -bottom-32 end-10 h-80 w-80 rounded-full bg-emerald-500/25 blur-3xl" />
        </div>
        <div className="relative z-10 container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-black md:text-4xl">ابدأ الآن، واجعل كل اتفاق كما يجب أن يكون</h2>
            <p className="mx-auto mb-8 max-w-2xl text-sm text-slate-200/90 md:text-base">
              سجّل في عَقدي، أنشئ مساحة عملك، وابدأ أول عقد لك اليوم. لا حاجة لجدول إكسل إضافي، ولا لوثيقة ضائعة، ولا
              لرسائل مشتتة عبر أكثر من مكان.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-gradient-to-l from-emerald-500 to-emerald-600 px-10 py-6 text-lg font-semibold shadow-lg shadow-emerald-500/30 hover:from-emerald-600 hover:to-emerald-700"
              >
                <Link href="/auth/sign-up">أنشئ مساحتك المجانية الآن</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-slate-600 bg-slate-950/80 px-8 py-6 text-lg text-slate-100 hover:bg-slate-900"
              >
                <Link href="/auth/login">أنا مشترك بالفعل</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      </main>
    </>
  )
}
