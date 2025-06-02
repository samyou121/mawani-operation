// عمليات المواني - ملف خدمة العامل (Service Worker)
const CACHE_NAME = 'mawani-operations-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/admin.html',
  '/user.html',
  '/css/style.css',
  '/js/auth.js',
  '/js/admin.js',
  '/js/user.js',
  '/images/orthopedic.svg',
  '/images/icon-192x192.png',
  '/images/icon-512x512.png',
  '/manifest.json'
];

// تثبيت خدمة العامل
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('تم فتح ذاكرة التخزين المؤقت');
        return cache.addAll(urlsToCache);
      })
  );
});

// تنشيط خدمة العامل
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// استراتيجية الشبكة أولاً، ثم التخزين المؤقت
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // نسخ الاستجابة
        const responseToCache = response.clone();
        
        // تخزين الاستجابة في التخزين المؤقت
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });
          
        return response;
      })
      .catch(() => {
        // إذا فشل الاتصال بالشبكة، استخدم التخزين المؤقت
        return caches.match(event.request);
      })
  );
});
