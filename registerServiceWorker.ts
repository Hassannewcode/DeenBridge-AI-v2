export default function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Construct an absolute URL for the service worker to prevent same-origin policy
      // issues when the app is hosted in a sandboxed or complex environment.
      const swUrl = `${window.location.origin}/sw.js`;
      navigator.serviceWorker.register(swUrl, { scope: '/' })
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch(error => {
          console.error('ServiceWorker registration failed: ', error);
        });
    });
  }
}
