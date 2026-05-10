const OFFLINE_BANNER_ID = 'offline-banner';
const CACHE_VERSION = 'v1';
const APP_CACHE_NAME = `keepnote-cache-${CACHE_VERSION}`;

export function updateOfflineBanner() {
  const banner = document.getElementById(OFFLINE_BANNER_ID);
  if (!banner) return;
  banner.classList.toggle('hidden', navigator.onLine);
}

export function saveCache(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Gagal menyimpan cache', error);
  }
}

export function loadCache(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('Gagal memuat cache', error);
    return null;
  }
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    if (Notification.permission === 'default') {
      requestNotificationPermission();
    }
    return registration;
  } catch (error) {
    console.warn('Registrasi service worker gagal:', error);
    return null;
  }
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'default') return;

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      showLocalNotification('KeepNote', 'Notifikasi sudah diaktifkan.');
    }
  } catch (error) {
    console.warn('Permintaan notifikasi gagal:', error);
  }
}

export function showLocalNotification(title, body) {
  if (!('serviceWorker' in navigator) || !('Notification' in window) || Notification.permission !== 'granted') return;

  navigator.serviceWorker.ready.then((registration) => {
    registration.showNotification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
    });
  });
}

export async function queueSyncRequest(request) {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const message = { type: 'queue-request', request };

    if (registration.active) {
      registration.active.postMessage(message);
    } else if (registration.waiting) {
      registration.waiting.postMessage(message);
    } else if (registration.installing) {
      registration.installing.postMessage(message);
    }

    if ('sync' in registration) {
      await registration.sync.register('sync-requests');
    }

    return true;
  } catch (error) {
    console.warn('Gagal mengantri permintaan sync:', error);
    return false;
  }
}
