// Portfolio Projects Data Structure

export interface PortfolioProject {
  id: string
  title: string
  titleEn: string
  category: string
  description: string
  client: string
  year: number
  thumbnail: string
  images: string[]
  technologies: string[]
  features: string[]
  liveUrl?: string
  githubUrl?: string
  featured: boolean
  color: string // Primary color for the project
  stats?: {
    label: string
    value: string
  }[]
  testimonial?: {
    text: string
    author: string
    position: string
  }
}

export const categories = [
  { id: "all", label: "الكل", icon: "Grid" },
  { id: "portfolio", label: "بورتفوليو", icon: "User" },
  { id: "ecommerce", label: "متاجر إلكترونية", icon: "ShoppingCart" },
  { id: "webapp", label: "تطبيقات ويب", icon: "Globe" },
  { id: "mobile", label: "تطبيقات موبايل", icon: "Smartphone" },
  { id: "branding", label: "هوية بصرية", icon: "Palette" },
]

// Demo Projects - سيتم استبدالها بمشاريع حقيقية من Supabase
export const demoProjects: PortfolioProject[] = [
  {
    id: "1",
    title: "متجر الأزياء العصري",
    titleEn: "Modern Fashion Store",
    category: "ecommerce",
    description: "متجر إلكتروني متكامل لبيع الأزياء العصرية مع نظام دفع متقدم وإدارة مخزون ذكية",
    client: "شركة الموضة الحديثة",
    year: 2024,
    thumbnail: "/projects/fashion-store.jpg",
    images: [
      "/projects/fashion-store-1.jpg",
      "/projects/fashion-store-2.jpg",
      "/projects/fashion-store-3.jpg",
    ],
    technologies: ["Next.js", "Tailwind CSS", "Stripe", "Supabase"],
    features: [
      "تصميم متجاوب مع جميع الأجهزة",
      "نظام دفع آمن متعدد الخيارات",
      "لوحة تحكم لإدارة المنتجات",
      "نظام مراجعات وتقييمات",
      "تكامل مع شركات الشحن",
    ],
    liveUrl: "https://example.com",
    featured: true,
    color: "#FF6B9D",
    stats: [
      { label: "زيادة المبيعات", value: "+250%" },
      { label: "سرعة التحميل", value: "95/100" },
      { label: "معدل التحويل", value: "4.2%" },
    ],
    testimonial: {
      text: "تجربة رائعة! الموقع سريع وسهل الاستخدام، زادت مبيعاتنا بشكل ملحوظ",
      author: "أحمد محمد",
      position: "مدير التسويق",
    },
  },
  {
    id: "2",
    title: "منصة التعليم الإلكتروني",
    titleEn: "E-Learning Platform",
    category: "webapp",
    description: "منصة تعليمية شاملة مع فيديوهات تفاعلية واختبارات ذكية وتتبع تقدم الطلاب",
    client: "أكاديمية المستقبل",
    year: 2024,
    thumbnail: "/projects/elearning.jpg",
    images: [
      "/projects/elearning-1.jpg",
      "/projects/elearning-2.jpg",
    ],
    technologies: ["React", "Node.js", "MongoDB", "WebRTC"],
    features: [
      "بث مباشر للدروس",
      "نظام اختبارات ذكي",
      "تتبع تقدم الطلاب",
      "شهادات تلقائية",
      "غرف دردشة تفاعلية",
    ],
    featured: true,
    color: "#4F46E5",
    stats: [
      { label: "عدد الطلاب", value: "5,000+" },
      { label: "معدل الرضا", value: "98%" },
      { label: "الدورات المتاحة", value: "150+" },
    ],
  },
  {
    id: "3",
    title: "بورتفوليو مصور محترف",
    titleEn: "Professional Photographer Portfolio",
    category: "portfolio",
    description: "موقع بورتفوليو أنيق لعرض الأعمال الفوتوغرافية مع معرض صور متقدم",
    client: "استوديو الضوء",
    year: 2024,
    thumbnail: "/projects/photographer.jpg",
    images: ["/projects/photographer-1.jpg"],
    technologies: ["Next.js", "Framer Motion", "Cloudinary"],
    features: [
      "معرض صور احترافي",
      "تأثيرات حركية سلسة",
      "تحسين تلقائي للصور",
      "نموذج تواصل مباشر",
    ],
    color: "#F59E0B",
    featured: false,
  },
]
