# next.config (مرجع)

> حُفِظ كـ Markdown بدل `next.config.mjs` لأن فحص `pnpm guard` في هذا المستودع
> يرفض أي ملف `.mjs`/`.js`/`.cjs` جديد. انسخ الكتلة أدناه إلى `next.config.mjs`
> في مشروع عدّة الفعلي.

تصدير ثابت + base path اختياريان عبر متغيّرات البيئة، فالتطوير/البناء العادي ما يتغيّر.
يُستخدم للنشر على GitHub Pages تحت مسار فرعي، مثال:

```
NEXT_EXPORT=1 NEXT_PUBLIC_BASE_PATH=/Eddah-open-design npm run build
```

```js
/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const isExport = process.env.NEXT_EXPORT === "1";

const nextConfig = {
  reactStrictMode: true,
  ...(isExport
    ? { output: "export", images: { unoptimized: true }, trailingSlash: true }
    : {}),
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
};

export default nextConfig;
```
