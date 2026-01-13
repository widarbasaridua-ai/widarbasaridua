// PWA Installation Handler
class PWAInstaller {
  constructor() {
    this.deferredPrompt = null;
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    this.init();
  }

  init() {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('ServiceWorker registered:', registration.scope);
            this.checkForUpdates(registration);
          })
          .catch(error => {
            console.error('ServiceWorker registration failed:', error);
          });
      });
    }

    // Before Install Prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });

    // App Installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed successfully');
      this.hideInstallButton();
      this.deferredPrompt = null;
      this.showToast('Aplikasi berhasil diinstall!', 'success');
    });

    // Online/Offline Detection
    window.addEventListener('online', this.updateOnlineStatus);
    window.addEventListener('offline', this.updateOnlineStatus);
    
    this.updateOnlineStatus();
  }

  showInstallButton() {
    let installBtn = document.getElementById('installBtn');
    if (!installBtn) {
      installBtn = document.createElement('button');
      installBtn.id = 'installBtn';
      installBtn.innerHTML = '📲 Install App';
      installBtn.className = 'install-btn';
      installBtn.onclick = () => this.promptInstallation();
      
      const style = document.createElement('style');
      style.textContent = `
        .install-btn {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #2e7d32;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 50px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 1000;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s;
        }
        .install-btn:hover {
          background: #1b5e20;
          transform: translateY(-2px);
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(installBtn);
    }
  }

  hideInstallButton() {
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
      installBtn.remove();
    }
  }

  promptInstallation() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      
      this.deferredPrompt.userChoice.then(choiceResult => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted install');
        } else {
          console.log('User dismissed install');
        }
        this.deferredPrompt = null;
        this.hideInstallButton();
      });
    }
  }

  updateOnlineStatus() {
    const isOnline = navigator.onLine;
    const statusElement = document.getElementById('onlineStatus') || this.createStatusElement();
    
    if (isOnline) {
      statusElement.textContent = '🟢 Online';
      statusElement.className = 'online-status online';
    } else {
      statusElement.textContent = '🔴 Offline - Data tersimpan lokal';
      statusElement.className = 'online-status offline';
      this.showToast('Anda sedang offline. Data akan disinkronkan saat online.', 'warning');
    }
  }

  createStatusElement() {
    const statusElement = document.createElement('div');
    statusElement.id = 'onlineStatus';
    statusElement.className = 'online-status';
    
    const style = document.createElement('style');
    style.textContent = `
      .online-status {
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        z-index: 1000;
        background: rgba(255,255,255,0.9);
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .online-status.online {
        color: #2e7d32;
        border: 1px solid #2e7d32;
      }
      .online-status.offline {
        color: #d32f2f;
        border: 1px solid #d32f2f;
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(statusElement);
    
    return statusElement;
  }

  checkForUpdates(registration) {
    // Check for updates every hour
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000);

    // Listen for updates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }

  showToast(message, type = 'info') {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    
    const style = document.createElement('style');
    style.textContent = `
      .toast {
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: #333;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 9999;
        animation: slideUp 0.3s ease;
      }
      .toast.success { background: #2e7d32; }
      .toast.warning { background: #f57c00; }
      .toast.error { background: #d32f2f; }
      @keyframes slideUp {
        from { transform: translate(-50%, 100%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
  }

  // Background Sync
  async function syncOfflineData() {
    if ('sync' in registration) {
      try {
        await registration.sync.register('sync-transactions');
        console.log('Background sync registered');
      } catch (error) {
        console.error('Background sync failed:', error);
      }
    }
  }

  // Request Notification Permission
  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Notification permission granted');
        }
      });
    }
  }
}

// Initialize PWA
document.addEventListener('DOMContentLoaded', () => {
  window.pwa = new PWAInstaller();
});
