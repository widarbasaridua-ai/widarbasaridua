// PWA Install Handler
class PWAInstallHandler {
  constructor() {
    this.deferredPrompt = null;
    this.installButton = null;
    this.init();
  }

  init() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA installed successfully');
      this.hideInstallButton();
      this.deferredPrompt = null;
    });
  }

  showInstallButton() {
    if (this.installButton) return;

    this.installButton = document.createElement('button');
    this.installButton.id = 'pwa-install-button';
    this.installButton.innerHTML = '📱 INSTALL APP';
    
    Object.assign(this.installButton.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      padding: '12px 20px',
      borderRadius: '25px',
      fontSize: '14px',
      fontWeight: 'bold',
      cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
      zIndex: '9999',
      animation: 'pulse 2s infinite'
    });

    // Add pulse animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); }
        50% { transform: scale(1.05); box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5); }
        100% { transform: scale(1); box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); }
      }
    `;
    document.head.appendChild(style);

    this.installButton.addEventListener('click', () => this.installApp());
    document.body.appendChild(this.installButton);

    // Auto hide after 30 seconds
    setTimeout(() => this.hideInstallButton(), 30000);
  }

  hideInstallButton() {
    if (this.installButton && this.installButton.parentNode) {
      this.installButton.style.opacity = '0';
      this.installButton.style.transition = 'opacity 0.5s';
      setTimeout(() => {
        if (this.installButton && this.installButton.parentNode) {
          this.installButton.style.display = 'none';
        }
      }, 500);
    }
  }

  async installApp() {
    if (!this.deferredPrompt) return;

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('✅ User accepted the install prompt');
      this.hideInstallButton();
      
      // Show success message
      const alert = document.createElement('div');
      alert.innerHTML = '✅ Aplikasi berhasil diinstall!';
      Object.assign(alert.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: '#27ae60',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '8px',
        zIndex: '10000'
      });
      document.body.appendChild(alert);
      setTimeout(() => alert.remove(), 3000);
    }
    
    this.deferredPrompt = null;
  }
}

// Initialize PWA Install Handler
document.addEventListener('DOMContentLoaded', () => {
  new PWAInstallHandler();
});