# نشر الموقع على Render

## إعدادات Render
- Runtime: Node
- Branch: main
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Plan: Free

## متغيرات البيئة المطلوبة
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

لا تضع قيم المفاتيح السرية داخل الملفات أو GitHub.

هذا الإصدار يستخدم `process.env.PORT` حتى يعمل مع منفذ Render، ويحمّل Vite بشكل ديناميكي حتى لا يحدث تعارض ESM/CJS في بيئة الإنتاج.
