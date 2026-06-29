self.addEventListener('install', (event) => {
  console.log('Service worker installed');
});

self.addEventListener('fetch', (event) => {
  // A dummy fetch event handler is required for PWA installability in Chrome
});
