// ================================================
// SERVICE WORKER — Meu Estoque Inteligente v1.1.0
// ================================================

const CACHE_NAME = 'estoque-cache-v1';

// Arquivos para cache offline (núcleo do app)
const urlsToCache = [
  '/meu-estoque-app/',
  '/meu-estoque-app/index.html',
  '/meu-estoque-app/style.css?v=20',
  '/meu-estoque-app/manifest.json',
  '/meu-estoque-app/icons/icon-192.png',
  '/meu-estoque-app/icons/icon-512.png',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// INSTALL: salva o core no cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// ACTIVATE: limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// FETCH: Network First para Firebase/APIs, Cache First para assets estáticos
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Firebase e APIs externas: sempre buscar pela rede (dados sempre frescos)
  if (
    url.hostname.includes('firebaseapp.com') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebase.com')
  ) {
    return; // Deixa a rede lidar diretamente
  }

  // Assets estáticos: Cache First (se tiver no cache, usa; senão busca na rede)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Salva no cache para próximas visitas
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback offline: retorna a página principal
        if (event.request.destination === 'document') {
          return caches.match('/meu-estoque-app/index.html');
        }
      });
    })
  );
});
