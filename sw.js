// Service Worker untuk Sistem Jimpitan PWA
const CACHE_NAME = 'jimpitan-v1';
const urlsToCache = [
  './',
  './index.html',
  './android-chrome-192x192.png',
  './android-chrome-512x512.png',
  './apple-touch-icon.png',
  './favicon-16x16.png',
  './favicon-32x32.png',
  './favicon.ico',
  './site.webmanifest',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Strategy: Cache First, then Network
self.addEventListener('fetch', event => {
  // Skip Google Sheets API calls
  if (event.request.url.includes('script.google.com')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Return offline response for API calls
        return new Response(JSON.stringify({
          success: false,
          message: 'Anda sedang offline',
          offline: true
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }
  
  // Skip GitHub requests for live data
  if (event.request.url.includes('github.com')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      }).catch(() => {
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      })
  );
});

// Background Sync for offline data
self.addEventListener('sync', event => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncPendingTransactions());
  }
});

async function syncPendingTransactions() {
  try {
    const pendingData = await getPendingTransactions();
    
    for (const transaction of pendingData) {
      const response = await fetch('https://script.google.com/macros/s/AKfycbzCXGoLPuIgfty8x0ypUu61gY3T--pf_BtGNAxNqL9uFH5xWfpQFWptEIUzy-I-oqvgeA/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveTransaksi',
          data: transaction
        })
      });
      
      if (response.ok) {
        await removePendingTransaction(transaction.id);
      }
    }
    
    // Update badge
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'sync-complete',
        pendingCount: pendingData.length
      });
    });
    
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

async function getPendingTransactions() {
  // Get from IndexedDB or localStorage via client
  const clients = await self.clients.matchAll();
  for (const client of clients) {
    const response = await client.postMessage({ type: 'get-pending-data' });
    if (response) return response;
  }
  return [];
}

async function removePendingTransaction(id) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'remove-pending',
      id: id
    });
  });
}

// Push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data?.text() || 'Notifikasi dari Sistem Jimpitan',
    icon: './android-chrome-192x192.png',
    badge: './android-chrome-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 'jimpitan-notification'
    },
    actions: [
      {
        action: 'open',
        title: 'Buka Aplikasi'
      },
      {
        action: 'close',
        title: 'Tutup'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Sistem Jimpitan', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(windowClients => {
          if (windowClients.length > 0) {
            windowClients[0].focus();
          } else {
            clients.openWindow('./');
          }
        })
    );
  }
});