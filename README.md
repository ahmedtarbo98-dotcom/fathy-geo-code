# FATHY GEO CODE — منصة تعليم وتطبيقات الجيوماتكس ونظم المعلومات الجغرافية
**Bilingual (Arabic/English) GIS, Surveying & Remote Sensing Learning Platform**  
*Owner: Eng. Ahmed Fathy, Spatial Data Analyst (م. أحمد فتحي)*

---

## 🌟 نظرة عامة على المنصة (Platform Overview)
منصة تعليمية واستشارية متقدمة متخصصة في نظم المعلومات الجغرافية (GIS)، الاستشعار عن بعد (Remote Sensing)، النمذجة المكانية (Spatial Modeling)، و Google Earth Engine.

- **الواجهة:** ثنائية اللغة بالكامل (عربي/إنجليزي) مع دعم كامل للـ RTL/LTR.
- **الهوية البصرية:** مستخرجة من شعار المنصة الرسمي (الكحلي العميق `#0B1F4B`، الأزرق الملكي `#1E6FD9`، والتدرج الفيروزي `#14B8C4`).
- **حماية الفيديو:** مشغل فيديو تجريدي بعلامة مائية متحركة تحمل بريد ومعرّف الطالب، وتعطيل التنزيل والنقر الأيمن، و Edge Function آمنة لاستخراج معرّفات الفيديو المحمية.
- **نظام الشهادات:** توليد فوري للشهادات المعتمدة برمز QR ورابط تحقق إلكتروني رسمي `/verify/[id]`.
- **لوحة تحكم الإدارة:** 11 وحدة تحكم لإدارة الدورات، المنهاج، الطلاب، طلبات الواتساب، والتحليلات.

---

## 🛠 المتطلبات والتقنيات (Tech Stack)
- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS + Lucide Icons + next-themes (Light/Dark mode)
- **i18n:** next-intl (مسارات `/ar` و `/en`)
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security, Edge Functions)
- **Deployment:** Vercel

---

## 🔑 قائمة المتغيرات البيئية (Environment Variables)
قم بإنشاء ملف `.env.local` في مسار المشروع الرئيسي:

```env
# رابط مشروع Supabase ومفتاح العميل العام
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# مفتاح الصلاحيات الكاملة للخدمة (يستخدم في الخادم فقط - لا يُكشف للمتصفح أبداً)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# رابط المنصة (محلياً أو رابط النطاق في Vercel)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# البريد الإلكتروني للمدير الأساسي (م. أحمد فتحي)
ADMIN_EMAIL=ahmedfathy@example.com

# رقم واتساب الرسمي لتلقي طلبات الدورات والمشاريع
NEXT_PUBLIC_WHATSAPP_PHONE=201060683463
```

---

## 🗄️ إعداد قاعدة بيانات Supabase (Database Setup)

1. افتح لوحة تحكم مشروعك في [Supabase](https://supabase.com).
2. انتقل إلى **SQL Editor**.
3. افتح ملف المخطط وسياسات الأمان [`supabase/migrations/00001_initial_schema.sql`](./supabase/migrations/00001_initial_schema.sql)، انسخ الكود بالكامل ونفذه بالضغط على **Run**.
4. افتح ملف البيانات الأولية [`supabase/seed.sql`](./supabase/seed.sql) ونفذه بالضغط على **Run** لإدراج الدورات التجريبية الثلاث والإعدادات الأولية.

---

## 👑 كيفية تعيين حساب المدير الأول (Adding Your First Admin)

هناك طريقتان لجعل حسابك مديراً (Admin):

### الطريقة الأولى (تلقائياً):
1. في ملف `.env.local`، اكتب بريدك الإلكتروني في خانة `ADMIN_EMAIL`.
2. سجّل حساباً جديداً في المنصة عبر صفحة `/register` بنفس البريد الإلكتروني.
3. التريجر التلقائي `handle_new_user()` في قاعدة البيانات سيقوم بتعيين `role = 'admin'` لحسابك مباشرة.

### الطريقة الثانية (من لوحة Supabase):
1. بعد تسجيل الدخول بحسابك، افتح **Table Editor** في Supabase.
2. اختر جدول `profiles`.
3. ابحث عن صف بريدك الإلكتروني، وغيّر قيمة عمود `role` من `'student'` إلى `'admin'`.
4. يمكنك الآن الدخول مباشرة إلى لوحة التحكم عبر الرابط: `http://localhost:3000/ar/admin`.

---

## 🌐 إعداد تسجيل الدخول عبر Google (Google OAuth Setup)

1. افتح [Google Cloud Console](https://console.cloud.google.com).
2. أنشئ مشروعاً جديداً ثم انتقل إلى **APIs & Services > Credentials**.
3. اضغط على **Create Credentials > OAuth Client ID** واختر **Web application**.
4. في خانة **Authorized redirect URIs** أضف رابط الـ Callback الخاص بـ Supabase:
   `https://<your-project-id>.supabase.co/auth/v1/callback`
5. انسخ **Client ID** و **Client Secret**.
6. افتح لوحة تحكم Supabase وانتقل إلى **Authentication > Providers > Google**.
7. فعّل Google وألصق الـ Client ID والـ Secret واضغط **Save**.

---

## 📹 دليل رفع وإضافة دورة جديدة (Uploading a New Course Guide)

### الخطوة 1: رفع الفيديو كـ "غير مدرج" على YouTube (Unlisted)
1. افتح [YouTube Studio](https://studio.youtube.com).
2. اضغط على **Create > Upload videos** واختر مقطع الدرس المسجل.
3. اكتب عنوان الدرس ووصفه وتأكد من اختيار الإعدادات المناسبة للأطفال (No, it's not made for kids).
4. في خطوة **Visibility (مستوى العرض)**، اختر **Unlisted (غير مدرج)**.
   > **ملاحظة:** الفيديو غير المدرج لا يظهر في نتائج البحث ولا في قناتك العامة، ويستطيع مشاهدته فقط من يحمل الرابط أو من خلال مشغل المنصة المحمي.
5. بعد اكتمال المعالجة، انسخ رابط الفيديو (مثال: `https://youtu.be/dQw4w9WgXcQ`).

### الخطوة 2: إضافة الدورة في لوحة تحكم المنصة (`/admin`)
1. ادخل إلى لوحة التحكم: `/admin`.
2. انتقل إلى قسم **إدارة الدورات (Courses)** واضغط على **إضافة دورة جديدة**.
3. أدخل عنوان الدورة باللغتين العربية والإنجليزية، والتصنيف، والمستوى، والسعر (أو ضع علامة على "دورة مجانية").
4. اضغط **حفظ ونشر الدورة**.

### الخطوة 3: إضافة الأقسام والدروس واستخراج الرابط (Curriculum Builder)
1. انتقل إلى قسم **بناء المنهاج (Curriculum Builder)** في لوحة التحكم.
2. اختر الدورة التي أنشأتها من القائمة المنسدلة.
3. أضف قسماً جديداً (مثال: *القسم الأول: مقدمة ونظم الإسقاط*).
4. في خانة إضافة درس:
   - اكتب عنوان الدرس بالعربية والإنجليزية.
   - الصق رابط يوتيوب الذي نسخته (أو معرّف الفيديو المكون من 11 رمزاً). يقوم النظام تلقائياً باستخراج المعرّف النظيف وتخزينه في جدول الفيديوهات المحمي `lesson_videos`.
   - حدد مدة الدرس وخيار المعاينة المجانية (Free Preview) إن رغبت.
   - اضغط **إضافة درس**.

---

## 🚀 النشر على Vercel (Deployment)

1. ارفع المشروع إلى حسابك على GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial production release of FATHY GEO CODE"
   git branch -M main
   git remote add origin https://github.com/<your-username>/fathy-geo-code.git
   git push -u origin main
   ```
2. ادخل إلى [Vercel](https://vercel.com) واضغط **Add New Project** واختر المستودع.
3. في إعدادات البيئة (Environment Variables)، أضف نفس المتغيرات الموجودة في ملف `.env.local` مع تغيير `NEXT_PUBLIC_SITE_URL` إلى نطاقك الحقيقي (مثال: `https://fathygeocode.com`).
4. اضغط **Deploy**.
5. بعد النشر، أضف نطاقك المخصص (Custom Domain) من إعدادات Vercel ثم اربط سجلات الـ DNS (A Record / CNAME).

---

## 🛡️ مميزات الحماية والأمان المدمجة
1. **العلامة المائية المتحركة (Moving Watermark):** تتحرك تلقائياً كل 20 ثانية لتظهر بريد الطالب ومعرفه الشخصي على الفيديو.
2. **عزل المعرّفات (Token Isolation):** لا تُرسل معرّفات الفيديو المحمية في استعلامات المتصفح العامة، بل تُجلب عبر نقطة فحص خادومية آمنة.
3. **حظر الاختصارات:** تعطيل الزر الأيمن، وأوامر الفحص (F12, Inspect, Ctrl+U).
4. **تعدد الأجهزة (Device Concurrency):** المنصة تتيح للمدير تحديد حد أقصى للأجهزة المتزامنة لكل حساب (جهازان كحد أقصى لمنع مشاركة الحسابات).
5. **التحقق من الشهادات:** كل شهادة تصدر بكود مشفر فريد ورابط فحص فوري ومجاني للجمهور لمنع التزوير.

---

**جميع الحقوق محفوظة لمنصة FATHY GEO CODE © 2026 — إشراف م. أحمد فتحي**
