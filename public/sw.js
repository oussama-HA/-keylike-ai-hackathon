// Keylike AI Service Worker
// Provides offline functionality and caching for PWA

const CACHE_NAME = 'keylike-ai-v1';
const STATIC_CACHE = 'keylike-static-v1';
const DYNAMIC_CACHE = 'keylike-dynamic-v1';
const MODEL_CACHE = 'keylike-models-v1';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('📦 Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== MODEL_CACHE) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      self.clients.claim();
    })
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip ngrok requests to avoid interference
  if (url.hostname.includes('ngrok')) {
    return;
  }
  
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// Handle static assets (cache-first)
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    const response = await fetch(request);
    
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('❌ Static asset request failed:', error);
    const cache = await caches.open(STATIC_CACHE);
    return await cache.match(request) || new Response('Asset unavailable', { status: 503 });
  }
}

// Handle navigation requests (app shell pattern)
async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.log('📱 Serving app shell for navigation:', request.url);
    const cache = await caches.open(STATIC_CACHE);
    return await cache.match('/index.html') || 
           new Response('App unavailable offline', { status: 503 });
  }
}

// Handle other dynamic requests (network-first)
async function handleDynamicRequest(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    if (request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      const cached = await cache.match(request);
      if (cached) {
        return cached;
      }
    }
    
    return new Response('Resource unavailable', { status: 503 });
  }
}

// Helper functions
function isStaticAsset(url) {
  return url.pathname.startsWith('/icons/') ||
         url.pathname.startsWith('/images/') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg') ||
         url.pathname.endsWith('.svg') ||
         url.pathname === '/manifest.json';
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && 
          request.headers.get('accept')?.includes('text/html'));
}

console.log('🚀 Keylike AI Service Worker loaded');