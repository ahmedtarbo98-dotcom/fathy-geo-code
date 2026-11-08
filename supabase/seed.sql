-- ==============================================================================
-- FATHY GEO CODE — SEED DATA SCRIPT
-- ==============================================================================

-- 1. SITE SETTINGS
INSERT INTO public.site_settings (key, value, description)
VALUES 
(
  'platform_stats',
  '{
    "students": 1500,
    "courses": 14,
    "hours": 160,
    "projects": 45,
    "satisfaction": 99
  }'::jsonb,
  'Public platform statistics displayed on the hero stats strip'
),
(
  'social_links',
  '{
    "telegram": "https://t.me/Fathy772",
    "youtube": "https://www.youtube.com/channel/UCBrwWaq6E8lg0xEmDCLmekw",
    "facebook": "https://www.facebook.com/share/1NiKuCvtnM/",
    "linkedin": "https://www.linkedin.com/in/ahmed-fathy-57b168364",
    "whatsapp": "https://wa.me/201060683463"
  }'::jsonb,
  'Official social channels and communication endpoints'
),
(
  'instructor_profile',
  '{
    "name_ar": "م. أحمد فتحي",
    "name_en": "Eng. Ahmed Fathy",
    "title_ar": "محلل بيانات مكانية وأخصائي استشعار عن بعد",
    "title_en": "Spatial Data Analyst & GIS Specialist",
    "bio_ar": "خريج ليسانس آداب برنامج الجيوماتكس ونظم المعلومات الجغرافية، محلل بيانات مكانية متخصص في تحليلات نظم المعلومات الجغرافية المتقدمة، معالجة الصور الفضائية وتطبيقات الاستشعار عن بعد والمشاريع الكارتوغرافية باستخدام ArcGIS Pro وGoogle Earth Engine.",
    "bio_en": "Holder of a Bachelor of Arts in Geomatics and GIS Program. Spatial Data Analyst specialized in advanced GIS analytics, satellite remote sensing, and cartographic design with ArcGIS Pro and Google Earth Engine.",
    "whatsapp_phone": "201060683463",
    "avatar_url": "/logo.jpg"
  }'::jsonb,
  'Instructor and founder profile details for the About page'
),
(
  'security_policy',
  '{
    "max_concurrent_devices": 2,
    "pause_on_tab_hidden": true,
    "watermark_interval_seconds": 20
  }'::jsonb,
  'Video player security rules and watermark configuration'
)
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, updated_at = NOW();

-- 2. SAMPLE TESTIMONIALS
INSERT INTO public.testimonials (id, student_name_ar, student_name_en, student_title_ar, student_title_en, content_ar, content_en, rating, is_published, order_index)
VALUES
(
  'a1111111-1111-1111-1111-111111111111',
  'م. كريم عبد الرحمن',
  'Eng. Kareem Abdelrahman',
  'مهندس تخطيط ومساحة',
  'Surveying & Urban Planning Engineer',
  'شرح المهندس أحمد فتحي في ArcGIS Pro عملي جداً ومباشر. تعلمت كيفية بناء نموذج ملاءمة مكانية وفر عليّ أسابيع من التخبط في مشروعي الهندسي.',
  'Eng. Ahmed Fathy''s ArcGIS Pro tutorials are exceptionally practical. The spatial suitability modeling workflow saved me weeks on my engineering master''s project.',
  5,
  true,
  1
),
(
  'a2222222-2222-2222-2222-222222222222',
  'د. هبة الشامي',
  'Dr. Heba El-Shamy',
  'باحثة استشعار عن بعد وبيئة',
  'Environmental Remote Sensing Researcher',
  'أفضل مصدر عربي لتعلم معالجة الصور الفضائية وGoogle Earth Engine. الدقة العلمية والتطبيقات الواقعية جعلت الفهم أسهل بكثير.',
  'The best bilingual source for satellite image analysis and GEE. The scientific accuracy and hands-on case studies made complex algorithms easy to implement.',
  5,
  true,
  2
),
(
  'a3333333-3333-3333-3333-333333333333',
  'م. محمد السعيد',
  'Eng. Mohamed El-Saeed',
  'أخصائي نظم معلومات جغرافية',
  'GIS Specialist',
  'طريقة حل المشكلات الكارتوغرافية والجيوديسية فريدة جداً. أسلوب متميز وشهادات إتمام الدورة كانت إضافة قوية لسيرتي الذاتية.',
  'His methods for geodetic problem-solving and map automation are top-tier. The verified certificate added serious credibility to my professional portfolio.',
  5,
  true,
  3
)
ON CONFLICT (id) DO NOTHING;

-- 3. COURSES SEED
-- Course 1: ArcGIS Pro Fundamentals (FREE)
INSERT INTO public.courses (
  id, slug, title_ar, title_en, short_description_ar, short_description_en,
  description_ar, description_en, what_you_will_learn_ar, what_you_will_learn_en,
  requirements_ar, requirements_en, thumbnail_url, category, level, is_free, price, status, is_featured, order_index
) VALUES (
  'c1111111-1111-1111-1111-111111111111',
  'arcgis-pro-fundamentals',
  'أساسيات وتطبيقات ArcGIS Pro من البداية للاحتراف',
  'ArcGIS Pro Fundamentals & Applied Spatial Analysis',
  'دورة شاملة تغطي واجهة البرنامج، إدارة الجيوداتابيس، التحليلات المكانية المتقدمة والإخراج الكارتوغرافي الاحترافي.',
  'Comprehensive guide covering Esri ArcGIS Pro interface, geodatabase management, spatial analysis tools and professional cartography.',
  'هذه الدورة صممت خصيصاً لتأخذ بيدك خطوة بخطوة في بيئة ArcGIS Pro الحديثة. ستتعلم كيفية إدارة البيانات المكانية النقطية والخطية والمساحية، وإنشاء قواعد البيانات الجغرافية (File Geodatabase)، وتطبيق أدوات التحليل المكاني مثل Buffering, Overlay, Spatial Join، بالإضافة إلى التصميم والإخراج الكارتوغرافي عالي الجودة للخرائط وفق المعايير العالمية.',
  'This course is specifically structured to transition your GIS skills into modern ArcGIS Pro workflows. You will master vector and raster data handling, File Geodatabase topology, spatial analysis toolsets (Overlay, Proximity, Network), and produce high-impact cartographic outputs.',
  '["التعامل الاحترافي مع واجهة ArcGIS Pro", "إنشاء وإدارة قواعد البيانات الجغرافية Geodatabase", "إجراء التحليلات الطوبولوجية والمكانية المتكاملة", "تصميم وطباعة الخرائط الكارتوغرافية بمعايير هندسية"]'::jsonb,
  '["Mastering ArcGIS Pro interface and ribbon", "Creating and managing File Geodatabases", "Executing core spatial analysis workflows", "Professional cartographic map design and export"]'::jsonb,
  '["معرفة أساسية بمفاهيم الجغرافيا ونظم الإحداثيات", "جهاز حاسوب بنظام ويندوز يدعم تشغيل ArcGIS Pro"]'::jsonb,
  '["Basic knowledge of coordinate reference systems", "Windows PC capable of running ArcGIS Pro"]'::jsonb,
  '/images/course-arcgis.jpg',
  'GIS & Mapping',
  'beginner',
  true,
  0.00,
  'published',
  true,
  1
) ON CONFLICT (slug) DO NOTHING;

-- Course 2: FATHY GEO CODE Tricks (FREE)
INSERT INTO public.courses (
  id, slug, title_ar, title_en, short_description_ar, short_description_en,
  description_ar, description_en, what_you_will_learn_ar, what_you_will_learn_en,
  requirements_ar, requirements_en, thumbnail_url, category, level, is_free, price, status, is_featured, order_index
) VALUES (
  'c2222222-2222-2222-2222-222222222222',
  'fathy-geo-code-tricks',
  'أسرار وحيل FATHY GEO CODE في الجيوماتكس',
  'FATHY GEO CODE Practical Geomatics Tricks & Workflows',
  'مجموعة من أقوى التكنيكات السريعة لاختصار ساعات العمل في معالجة البيانات، التحويل بين المساقط، وحل المشكلات المكانية الشائعة.',
  'Essential shortcuts and techniques to save hours in spatial data cleaning, datum conversions, and solving typical GIS bottlenecks.',
  'ورشة عمل تطبيقية مركزة تستعرض أسرار وخفايا العمل الجيومكاني اليومي. تشمل حل مشاكل الإرجاع الجغرافي الخاطئ، إصلاح أخطاء الطوبولوجيا الشائعة، وتسريع معالجة الجداول المكانية الكبيرة.',
  'A focused practical workshop showcasing real-world geospatial tips: fixing projection offsets, repairing geometry anomalies, and automating tabular spatial joins.',
  '["أسرار إصلاح أخطاء الإسقاط والإرجاع الجغرافي", "حيل تسريع التحليلات المكانية الضخمة", "أدوات مخصصة لتنظيف بيانات الـ CAD و Shapefiles"]'::jsonb,
  '["Fixing projection shifts and coordinate datum mismatches", "Speed optimizations for spatial joins", "CAD to GIS geometry cleaning workflows"]'::jsonb,
  '["معرفة سابقة ببرامج GIS (ArcGIS أو QGIS)"]'::jsonb,
  '["Prior familiarity with any GIS software"]'::jsonb,
  '/images/course-tricks.jpg',
  'Tips & Automation',
  'all_levels',
  true,
  0.00,
  'published',
  true,
  2
) ON CONFLICT (slug) DO NOTHING;

-- Course 3: Spatial Modeling & MCE (PAID)
INSERT INTO public.courses (
  id, slug, title_ar, title_en, short_description_ar, short_description_en,
  description_ar, description_en, what_you_will_learn_ar, what_you_will_learn_en,
  requirements_ar, requirements_en, thumbnail_url, category, level, is_free, price, status, is_featured, order_index
) VALUES (
  'c3333333-3333-3333-3333-333333333333',
  'spatial-modeling-mce',
  'النمذجة المكانية والملاءمة البيئية المتقدمة (MCE)',
  'Advanced Spatial Modeling & Multi-Criteria Evaluation',
  'بناء نماذج اتخاذ القرار المكاني وتحديد أنسب المواقع للمشاريع الاستثمارية والبيئية باستخدام ModelBuilder وSpatial Analyst.',
  'Constructing multi-criteria decision models (AHP/MCE) for environmental risk and site suitability using ModelBuilder.',
  'مسار تخصصي متقدم للمحللين والمهندسين. يركز على نمذجة الملاءمة المكانية Multi-Criteria Evaluation (MCE) وحساب أوزان العوامل باستخدام Analytic Hierarchy Process (AHP). ستتعلم أتمتة النماذج عبر ModelBuilder وتحليل المخاطر الطبيعية.',
  'Advanced training program dedicated to spatial decision support systems. Covers Analytic Hierarchy Process (AHP), raster reclassification, Weighted Overlay, and building reusable enterprise models.',
  '["منهجية تقييم الملاءمة متعددة المعايير (MCE)", "تطبيق مصفوفات AHP وحساب الأوزان النسبية", "بناء نماذج معقدة وأتمتتها عبر ModelBuilder", "إعداد دراسات الأثر البيئي واختيار المواقع"]'::jsonb,
  '["Multi-Criteria Evaluation (MCE) methodologies", "AHP matrix weighting calculations", "Building automated spatial workflows in ModelBuilder", "Environmental impact and site selection case studies"]'::jsonb,
  '["إتقان أساسيات ArcGIS Pro أو ArcGIS Desktop", "فهم مبادئ البيانات الراستر والتحليل الإحصائي"]'::jsonb,
  '["Solid foundation in ArcGIS Pro", "Understanding raster data and spatial statistics"]'::jsonb,
  '/images/course-modeling.jpg',
  'Spatial Modeling',
  'advanced',
  false,
  49.00,
  'published',
  true,
  3
) ON CONFLICT (slug) DO NOTHING;

-- 4. SECTIONS & LESSONS SEED FOR COURSE 1
INSERT INTO public.course_sections (id, course_id, title_ar, title_en, order_index)
VALUES
  ('s1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'القسم الأول: مقدمة ونظم الإحداثيات', 'Section 1: Introduction & Coordinate Systems', 1),
  ('s1111111-1111-1111-1111-111111111112', 'c1111111-1111-1111-1111-111111111111', 'القسم الثاني: إدارة البيانات والجيوداتابيس', 'Section 2: Data Management & Geodatabase', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lessons (id, section_id, course_id, title_ar, title_en, duration_seconds, is_free_preview, order_index)
VALUES
  ('l1111111-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'نظرة عامة على واجهة ArcGIS Pro ومفاهيم الجيوماتكس', 'Overview of ArcGIS Pro Interface & Geomatics Concepts', 720, true, 1),
  ('l1111111-1111-1111-1111-111111111112', 's1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'نظم الإسقاط والتحويل بين المساقط المكانية', 'Map Projections & Datum Transformations', 980, true, 2),
  ('l1111111-1111-1111-1111-111111111113', 's1111111-1111-1111-1111-111111111112', 'c1111111-1111-1111-1111-111111111111', 'بناء وإدارة File Geodatabase وقواعد الطوبولوجيا', 'Building File Geodatabase & Topology Rules', 1240, false, 3)
ON CONFLICT (id) DO NOTHING;

-- PROTECTED VIDEO IDS (Unlisted YouTube video ID placeholders)
INSERT INTO public.lesson_videos (lesson_id, provider, video_id)
VALUES
  ('l1111111-1111-1111-1111-111111111111', 'youtube', 'dQw4w9WgXcQ'),
  ('l1111111-1111-1111-1111-111111111112', 'youtube', 'dQw4w9WgXcQ'),
  ('l1111111-1111-1111-1111-111111111113', 'youtube', 'dQw4w9WgXcQ')
ON CONFLICT (lesson_id) DO UPDATE SET video_id = EXCLUDED.video_id;

-- SAMPLE QUIZ FOR COURSE 1
INSERT INTO public.quizzes (id, course_id, title_ar, title_en, passing_score, is_active)
VALUES (
  'q1111111-1111-1111-1111-111111111111',
  'c1111111-1111-1111-1111-111111111111',
  'اختبار إتقان أساسيات ArcGIS Pro',
  'ArcGIS Pro Fundamentals Assessment Quiz',
  70,
  true
) ON CONFLICT (course_id) DO NOTHING;

INSERT INTO public.quiz_questions (id, quiz_id, question_ar, question_en, options, correct_option_index, order_index)
VALUES
  (
    'qq111111-1111-1111-1111-111111111111',
    'q1111111-1111-1111-1111-111111111111',
    'ما هو المرجع الجيوديسي المعتمد عالمياً في نظام تحديد المواقع GPS؟',
    'What is the standard global geodetic datum used in GPS?',
    '["WGS 84", "NAD 27", "ED 50", "Pulkovo 1942"]'::jsonb,
    0,
    1
  ),
  (
    'qq111111-1111-1111-1111-111111111112',
    'q1111111-1111-1111-1111-111111111111',
    'أي من الصيغ التالية تمثل قاعدة بيانات مكانية متكاملة تدعم قواعد الطوبولوجيا في Esri؟',
    'Which format represents an enterprise/desktop geodatabase supporting topology in Esri?',
    '["Shapefile (.shp)", "File Geodatabase (.gdb)", "KML/KMZ", "GeoJSON"]'::jsonb,
    1,
    2
  )
ON CONFLICT (id) DO NOTHING;
