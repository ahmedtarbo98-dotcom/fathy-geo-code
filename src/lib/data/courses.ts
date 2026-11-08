export interface LessonData {
  id: string;
  title_ar: string;
  title_en: string;
  duration_seconds: number;
  is_free_preview: boolean;
  order_index: number;
}

export interface SectionData {
  id: string;
  title_ar: string;
  title_en: string;
  order_index: number;
  lessons: LessonData[];
}

export interface CourseDetailData {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  short_description_ar: string;
  short_description_en: string;
  description_ar: string;
  description_en: string;
  what_you_will_learn_ar: string[];
  what_you_will_learn_en: string[];
  requirements_ar: string[];
  requirements_en: string[];
  thumbnail_url: string;
  thumbnailGradient: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced" | "all_levels";
  level_ar: string;
  level_en: string;
  is_free: boolean;
  price: number;
  currency: string;
  status: "published" | "draft" | "archived";
  sections: SectionData[];
}

export const staticCourses: CourseDetailData[] = [
  {
    id: "c1111111-1111-1111-1111-111111111111",
    slug: "arcgis-pro-fundamentals",
    title_ar: "أساسيات وتطبيقات ArcGIS Pro من البداية للاحتراف",
    title_en: "ArcGIS Pro Fundamentals & Applied Spatial Analysis",
    short_description_ar:
      "دورة شاملة تغطي واجهة البرنامج، إدارة الجيوداتابيس، التحليلات المكانية المتقدمة والإخراج الكارتوغرافي الاحترافي.",
    short_description_en:
      "Comprehensive guide covering Esri ArcGIS Pro interface, geodatabase management, spatial analysis tools and professional cartography.",
    description_ar:
      "هذه الدورة صممت خصيصاً لتأخذ بيدك خطوة بخطوة في بيئة ArcGIS Pro الحديثة. ستتعلم كيفية إدارة البيانات المكانية النقطية والخطية والمساحية، وإنشاء قواعد البيانات الجغرافية (File Geodatabase)، وتطبيق أدوات التحليل المكاني مثل Buffering, Overlay, Spatial Join، بالإضافة إلى التصميم والإخراج الكارتوغرافي عالي الجودة للخرائط وفق المعايير العالمية.",
    description_en:
      "This course is specifically structured to transition your GIS skills into modern ArcGIS Pro workflows. You will master vector and raster data handling, File Geodatabase topology, spatial analysis toolsets (Overlay, Proximity, Network), and produce high-impact cartographic outputs ready for publication.",
    what_you_will_learn_ar: [
      "التعامل الاحترافي مع واجهة ArcGIS Pro وأشرطة الأدوات Ribbon",
      "إنشاء وإدارة قواعد البيانات الجغرافية File Geodatabase وضبط الطوبولوجيا",
      "إجراء التحليلات الطوبولوجية والمكانية المتكاملة (Overlay, Buffer, Spatial Join)",
      "التصميم الكارتوغرافي المتقدم وإعداد القوالب للطباعة والنشر الهندسي",
    ],
    what_you_will_learn_en: [
      "Mastering modern ArcGIS Pro interface, ribbon and contextual menus",
      "Creating and structuring enterprise and File Geodatabases with topology rules",
      "Executing core spatial analysis workflows (Buffer, Intersect, Spatial Join)",
      "Advanced cartographic map production and print-ready publishing",
    ],
    requirements_ar: [
      "معرفة أساسية بمفاهيم الجغرافيا ونظم الإحداثيات",
      "جهاز حاسوب بنظام ويندوز يدعم تشغيل برنامج ArcGIS Pro",
    ],
    requirements_en: [
      "Basic understanding of geography and coordinate reference systems",
      "Windows PC capable of running Esri ArcGIS Pro",
    ],
    thumbnail_url: "/logo.jpg",
    thumbnailGradient: "from-blue-600 via-indigo-700 to-brand-navy",
    category: "GIS & Mapping",
    level: "beginner",
    level_ar: "مبتدئ إلى متوسط",
    level_en: "Beginner to Intermediate",
    is_free: true,
    price: 0,
    currency: "USD",
    status: "published",
    sections: [
      {
        id: "s1",
        title_ar: "القسم الأول: مقدمة وتأسيس نظم الإحداثيات",
        title_en: "Section 1: Foundations & Coordinate Reference Systems",
        order_index: 1,
        lessons: [
          {
            id: "l1",
            title_ar: "نظرة عامة على واجهة ArcGIS Pro ومفاهيم الجيوماتكس",
            title_en: "Overview of ArcGIS Pro Interface & Geomatics Concepts",
            duration_seconds: 720,
            is_free_preview: true,
            order_index: 1,
          },
          {
            id: "l2",
            title_ar: "نظم الإسقاط والتحويل بين المساقط الجغرافية (WGS84 و UTM)",
            title_en: "Map Projections & Datum Transformations (WGS84 & UTM)",
            duration_seconds: 980,
            is_free_preview: true,
            order_index: 2,
          },
        ],
      },
      {
        id: "s2",
        title_ar: "القسم الثاني: إدارة البيانات والجيوداتابيس",
        title_en: "Section 2: Data Management & File Geodatabase",
        order_index: 2,
        lessons: [
          {
            id: "l3",
            title_ar: "بناء وإدارة File Geodatabase وقواعد الطوبولوجيا",
            title_en: "Building File Geodatabase & Topology Quality Rules",
            duration_seconds: 1240,
            is_free_preview: false,
            order_index: 3,
          },
          {
            id: "l4",
            title_ar: "الربط المكاني Spatial Join والتعامل مع الجداول الوصفية",
            title_en: "Spatial Join and Attribute Table Workflows",
            duration_seconds: 1100,
            is_free_preview: false,
            order_index: 4,
          },
        ],
      },
      {
        id: "s3",
        title_ar: "القسم الثالث: التحليلات المكانية والإخراج النهائي",
        title_en: "Section 3: Spatial Analysis & Cartographic Design",
        order_index: 3,
        lessons: [
          {
            id: "l5",
            title_ar: "تحليلات التقارب والملاءمة (Buffer & Proximity)",
            title_en: "Proximity & Buffer Analysis Toolsets",
            duration_seconds: 1450,
            is_free_preview: false,
            order_index: 5,
          },
          {
            id: "l6",
            title_ar: "التصميم الكارتوغرافي النهائي وإعداد Layout الطباعة",
            title_en: "Final Cartographic Layout Automation and Export",
            duration_seconds: 1600,
            is_free_preview: false,
            order_index: 6,
          },
        ],
      },
    ],
  },
  {
    id: "c2222222-2222-2222-2222-222222222222",
    slug: "fathy-geo-code-tricks",
    title_ar: "أسرار وحيل FATHY GEO CODE في الجيوماتكس",
    title_en: "FATHY GEO CODE Practical Geomatics Tricks & Workflows",
    short_description_ar:
      "مجموعة من أقوى التكنيكات السريعة لاختصار ساعات العمل في معالجة البيانات، التحويل بين المساقط، وحل المشكلات المكانية الشائعة.",
    short_description_en:
      "Essential shortcuts and techniques to save hours in spatial data cleaning, datum conversions, and solving typical GIS bottlenecks.",
    description_ar:
      "ورشة عمل تطبيقية مركزة تستعرض أسرار وخفايا العمل الجيومكاني اليومي. تشمل حل مشاكل الإرجاع الجغرافي الخاطئ، إصلاح أخطاء الطوبولوجيا الشائعة، وتسريع معالجة الجداول المكانية الكبيرة، والتحويل السلس بين ملفات CAD و GIS بدون فقدان البيانات الوصفية.",
    description_en:
      "A laser-focused practical workshop showcasing field-tested geospatial tricks: fixing projection offsets, repairing geometry anomalies, accelerating massive spatial joins, and converting CAD to GIS seamlessly.",
    what_you_will_learn_ar: [
      "أسرار إصلاح أخطاء الإسقاط والإرجاع الجغرافي الشائعة",
      "حيل تسريع التحليلات المكانية الضخمة دون استهلاك الذاكرة",
      "أدوات مخصصة لتنظيف بيانات الـ CAD و Shapefiles وتحويلها إلى GDB",
      "اختصارات سريعة لإنتاج خرائط جذابة في دقائق معدودة",
    ],
    what_you_will_learn_en: [
      "Diagnosing and correcting projection datum shifts instantly",
      "Memory-optimized spatial operations for large datasets",
      "Clean CAD drawing conversion to topologically sound GIS layers",
      "Rapid cartographic styling tips for immediate presentation",
    ],
    requirements_ar: [
      "معرفة سابقة ببرامج GIS (ArcGIS أو QGIS)",
      "الرغبة في تسريع إنتاجيتك في العمل اليومي",
    ],
    requirements_en: [
      "Prior basic familiarity with ArcGIS or QGIS",
      "Desire to optimize daily spatial workflow efficiency",
    ],
    thumbnail_url: "/logo.jpg",
    thumbnailGradient: "from-brand-cyan via-teal-600 to-brand-navy",
    category: "Tips & Automation",
    level: "all_levels",
    level_ar: "جميع المستويات",
    level_en: "All Levels",
    is_free: true,
    price: 0,
    currency: "USD",
    status: "published",
    sections: [
      {
        id: "s21",
        title_ar: "القسم الأول: حيل البيانات والإسقاطات",
        title_en: "Section 1: Data Cleaning & Projection Hacks",
        order_index: 1,
        lessons: [
          {
            id: "l21",
            title_ar: "حل مشكلة إزاحة الخرائط واختلاف Datum بين المساقط",
            title_en: "Fixing Map Displacement & Datum Shift Anomaly",
            duration_seconds: 840,
            is_free_preview: true,
            order_index: 1,
          },
          {
            id: "l22",
            title_ar: "تحويل ملفات الـ AutoCAD إلى طبقات GIS بدقة متناهية",
            title_en: "AutoCAD to GIS Layer Conversion Without Geometry Loss",
            duration_seconds: 1120,
            is_free_preview: true,
            order_index: 2,
          },
        ],
      },
    ],
  },
  {
    id: "c3333333-3333-3333-3333-333333333333",
    slug: "spatial-modeling-mce",
    title_ar: "النمذجة المكانية والملاءمة البيئية المتقدمة (MCE)",
    title_en: "Advanced Spatial Modeling & Multi-Criteria Evaluation",
    short_description_ar:
      "بناء نماذج اتخاذ القرار المكاني وتحديد أنسب المواقع للمشاريع الاستثمارية والبيئية باستخدام ModelBuilder وSpatial Analyst.",
    short_description_en:
      "Constructing multi-criteria decision models (AHP/MCE) for environmental risk and site suitability using ModelBuilder.",
    description_ar:
      "مسار تخصصي متقدم للمحللين والمهندسين. يركز على نمذجة الملاءمة المكانية Multi-Criteria Evaluation (MCE) وحساب أوزان العوامل باستخدام Analytic Hierarchy Process (AHP). ستتعلم أتمتة النماذج عبر ModelBuilder وتحليل المخاطر الطبيعية وتحديد أفضل المواقع الاستثمارية والبيئية وفق معايير علمية دقيقة.",
    description_en:
      "An advanced specialization track for GIS professionals and environmental engineers. Master Multi-Criteria Evaluation (MCE), Analytic Hierarchy Process (AHP) matrix calculations, fuzzy logic, and automated visual spatial modeling using ArcGIS ModelBuilder.",
    what_you_will_learn_ar: [
      "المنهجية العلمية لتقييم الملاءمة متعددة المعايير (MCE)",
      "تطبيق مصفوفات AHP وحساب الأوزان النسبية بدقة إحصائية",
      "بناء نماذج معقدة وأتمتتها خطوة بخطوة عبر ModelBuilder",
      "إعداد دراسات الأثر البيئي واختيار المواقع للمشاريع الكبرى",
    ],
    what_you_will_learn_en: [
      "Rigorous Multi-Criteria Evaluation (MCE) framework and theory",
      "Analytic Hierarchy Process (AHP) matrix math and consistency checks",
      "Building reusable, automated visual models in ModelBuilder",
      "Applied environmental hazard and commercial site suitability projects",
    ],
    requirements_ar: [
      "إتقان أساسيات ArcGIS Pro أو ArcGIS Desktop",
      "فهم مبادئ البيانات الراستر (Raster) والتحليل الإحصائي",
    ],
    requirements_en: [
      "Solid working knowledge of ArcGIS Pro or Desktop",
      "Understanding raster data and spatial statistics concepts",
    ],
    thumbnail_url: "/logo.jpg",
    thumbnailGradient: "from-brand-navy via-blue-900 to-indigo-950",
    category: "Spatial Modeling",
    level: "advanced",
    level_ar: "متقدم",
    level_en: "Advanced",
    is_free: false,
    price: 49,
    currency: "USD",
    status: "published",
    sections: [
      {
        id: "s31",
        title_ar: "القسم الأول: نظرية القرار المكاني ومصفوفات AHP",
        title_en: "Section 1: Spatial Decision Theory & AHP Matrices",
        order_index: 1,
        lessons: [
          {
            id: "l31",
            title_ar: "مبادئ تقييم الملاءمة متعددة المعايير MCE",
            title_en: "Principles of Multi-Criteria Spatial Evaluation",
            duration_seconds: 960,
            is_free_preview: true,
            order_index: 1,
          },
          {
            id: "l32",
            title_ar: "حساب أوزان العوامل عبر Analytic Hierarchy Process (AHP)",
            title_en: "Calculating Factor Weights via AHP Matrix & Consistency Ratio",
            duration_seconds: 1350,
            is_free_preview: false,
            order_index: 2,
          },
        ],
      },
      {
        id: "s32",
        title_ar: "القسم الثاني: التطبيق العملي عبر ModelBuilder",
        title_en: "Section 2: Hands-On Implementation with ModelBuilder",
        order_index: 2,
        lessons: [
          {
            id: "l33",
            title_ar: "توحيد مقاييس الطبقات (Reclassification & Fuzzy Membership)",
            title_en: "Layer Standardization (Reclassification & Fuzzy Membership)",
            duration_seconds: 1540,
            is_free_preview: false,
            order_index: 3,
          },
          {
            id: "l34",
            title_ar: "تطبيق التراكب المرجح Weighted Overlay وإنتاج الخريطة النهائية",
            title_en: "Weighted Overlay Execution & Final Suitability Synthesis",
            duration_seconds: 1820,
            is_free_preview: false,
            order_index: 4,
          },
        ],
      },
    ],
  },
];

export function getCourses(): CourseDetailData[] {
  return staticCourses;
}

export function getCourseBySlug(slug: string): CourseDetailData | undefined {
  return staticCourses.find((c) => c.slug === slug);
}
