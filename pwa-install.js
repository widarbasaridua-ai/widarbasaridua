// PWA Installation Prompt
let deferredPrompt;
const installBtn = document.createElement('button');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Show install button
  installBtn.innerHTML = '📱 INSTALL APP';
  installBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 25px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    z-index: 9999;
    display: block;
  `;
  
  document.body.appendChild(installBtn);
  
  installBtn.addEventListener('click', () => {
    installBtn.style.display = 'none';
    deferredPrompt.prompt();
    
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User installed the PWA');
      }
      deferredPrompt = null;
    });
  });
});

// Auto-hide after 10 seconds
setTimeout(() => {
  if (installBtn.parentNode) {
    installBtn.style.display = 'none';
  }
}, 10000);