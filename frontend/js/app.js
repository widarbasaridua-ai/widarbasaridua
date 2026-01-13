const API_BASE_URL = 'http://localhost:3000/api';
let nasabahList = [];

class JimpitanApp {
  constructor() {
    this.init();
  }

  async init() {
    this.setDefaultTanggal();
    this.attachEventListeners();
    await this.loadNasabah();
    this.updateDashboardStats();
  }

  setDefaultTanggal() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tglDari').value = today;
    document.getElementById('tglSampai').value = today;
  }

  attachEventListeners() {
    // Form validation
    document.getElementById('namaNasabah').addEventListener('input', () => this.cekKelengkapanData());
    document.getElementById('tglDari').addEventListener('change', () => this.cekKelengkapanData());
    document.getElementById('tglSampai').addEventListener('change', () => this.cekKelengkapanData());
    document.getElementById('nominal').addEventListener('input', () => this.cekKelengkapanData());
    
    // Save button
    document.getElementById('btnSimpan').addEventListener('click', () => this.simpanData());
    
    // Search nasabah
    document.getElementById('namaNasabah').addEventListener('input', (e) => this.searchNasabah(e.target.value));
    
    // Navigation
    document.getElementById('btnLaporan')?.addEventListener('click', () => this.navigateToLaporan());
  }

  async loadNasabah() {
    try {
      const response = await fetch(`${API_BASE_URL}/nasabah`);
      const data = await response.json();
      
      if (data.success) {
        nasabahList = data.data;
        this.populateNasabahDropdown();
      }
    } catch (error) {
      console.error('Gagal memuat data nasabah:', error);
      this.showMessage('Gagal memuat data nasabah', 'error');
    }
  }

  populateNasabahDropdown() {
    const datalist = document.getElementById('nasabahList') || this.createNasabahDatalist();
    datalist.innerHTML = '';
    
    nasabahList.forEach(nasabah => {
      const option = document.createElement('option');
      option.value = `${nasabah.kodeNasabah} - ${nasabah.namaLengkap}`;
      option.dataset.id = nasabah._id;
      datalist.appendChild(option);
    });
  }

  createNasabahDatalist() {
    const datalist = document.createElement('datalist');
    datalist.id = 'nasabahList';
    document.body.appendChild(datalist);
    
    const namaInput = document.getElementById('namaNasabah');
    namaInput.setAttribute('list', 'nasabahList');
    namaInput.setAttribute('autocomplete', 'on');
    
    return datalist;
  }

  searchNasabah(query) {
    if (query.length < 2) return;
    
    fetch(`${API_BASE_URL}/nasabah/search?q=${encodeURIComponent(query)}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          this.showSearchResults(data.data);
        }
      })
      .catch(error => console.error('Search error:', error));
  }

  showSearchResults(results) {
    const dropdown = document.getElementById('searchResults') || this.createSearchDropdown();
    dropdown.innerHTML = '';
    
    results.forEach(nasabah => {
      const item = document.createElement('div');
      item.className = 'search-item';
      item.innerHTML = `
        <strong>${nasabah.kodeNasabah}</strong> - ${nasabah.namaLengkap}
        <small>Saldo: Rp ${nasabah.totalSaldo.toLocaleString()}</small>
      `;
      item.onclick = () => this.selectNasabah(nasabah);
      dropdown.appendChild(item);
    });
    
    if (results.length > 0) {
      dropdown.style.display = 'block';
    }
  }

  createSearchDropdown() {
    const dropdown = document.createElement('div');
    dropdown.id = 'searchResults';
    dropdown.className = 'search-dropdown';
    
    const style = document.createElement('style');
    style.textContent = `
      .search-dropdown {
        position: absolute;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        max-height: 200px;
        overflow-y: auto;
        z-index: 1000;
        display: none;
        width: 100%;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
      .search-item {
        padding: 10px;
        border-bottom: 1px solid #eee;
        cursor: pointer;
      }
      .search-item:hover {
        background: #f5f5f5;
      }
      .search-item small {
        display: block;
        color: #666;
        font-size: 12px;
      }
    `;
    document.head.appendChild(style);
    
    const namaInput = document.getElementById('namaNasabah');
    namaInput.parentNode.appendChild(dropdown);
    
    return dropdown;
  }

  selectNasabah(nasabah) {
    document.getElementById('namaNasabah').value = `${nasabah.kodeNasabah} - ${nasabah.namaLengkap}`;
    document.getElementById('selectedNasabahId').value = nasabah._id;
    document.getElementById('searchResults').style.display = 'none';
    this.cekKelengkapanData();
  }

  cekKelengkapanData() {
    const nama = document.getElementById('namaNasabah').value.trim();
    const tglDari = document.getElementById('tglDari').value;
    const tglSampai = document.getElementById('tglSampai').value;
    const nominal = document.getElementById('nominal').value;
    const btnSimpan = document.getElementById('btnSimpan');
    const infoStatus = document.getElementById('infoStatus');

    if (nama && tglDari && tglSampai && nominal) {
      if (new Date(tglSampai) < new Date(tglDari)) {
        infoStatus.textContent = 'Tanggal "Sampai" harus lebih besar atau sama dengan tanggal "Dari"';
        infoStatus.className = 'info error';
        btnSimpan.disabled = true;
        return;
      }

      if (parseInt(nominal) <= 0) {
        infoStatus.textContent = 'Nominal harus lebih dari 0';
        infoStatus.className = 'info error';
        btnSimpan.disabled = true;
        return;
      }

      btnSimpan.disabled = false;
      infoStatus.textContent = 'Data lengkap, siap disimpan';
      infoStatus.className = 'info success';
    } else {
      btnSimpan.disabled = true;
      infoStatus.textContent = 'Lengkapi semua data untuk menyimpan';
      infoStatus.className = 'info';
    }
  }

  async simpanData() {
    const namaInput = document.getElementById('namaNasabah').value;
    const tglDari = document.getElementById('tglDari').value;
    const tglSampai = document.getElementById('tglSampai').value;
    const nominal = document.getElementById('nominal').value;
    const infoStatus = document.getElementById('infoStatus');

    // Extract nasabah ID from selection
    const nasabahMatch = namaInput.match(/^(\w+\d+) - (.+)$/);
    if (!nasabahMatch) {
      this.showMessage('Format nama nasabah tidak valid', 'error');
      return;
    }

    const kodeNasabah = nasabahMatch[1];
    const nasabah = nasabahList.find(n => n.kodeNasabah === kodeNasabah);
    
    if (!nasabah) {
      this.showMessage('Nasabah tidak ditemukan', 'error');
      return;
    }

    const transaksiData = {
      nasabahId: nasabah._id,
      tanggalDari: tglDari,
      tanggalSampai: tglSampai,
      nominal: parseInt(nominal),
      jenis: 'setoran',
      keterangan: 'Setoran jimpitan',
      dibuatOleh: 'admin'
    };

    try {
      const response = await fetch(`${API_BASE_URL}/transaksi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaksiData)
      });

      const result = await response.json();

      if (result.success) {
        this.showMessage('Transaksi berhasil disimpan!', 'success');
        this.resetForm();
        this.updateDashboardStats();
        
        // Trigger sync if offline
        if (!navigator.onLine) {
          this.saveOffline(transaksiData);
        }
      } else {
        this.showMessage(result.message || 'Gagal menyimpan transaksi', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      this.showMessage('Gagal menyimpan. Sedang offline?', 'warning');
      this.saveOffline(transaksiData);
    }
  }

  async saveOffline(data) {
    // Save to IndexedDB for offline sync
    const db = await this.openDatabase();
    const tx = db.transaction(['pendingTransactions'], 'readwrite');
    const store = tx.objectStore('pendingTransactions');
    
    const offlineData = {
      ...data,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      synced: false
    };
    
    await store.add(offlineData);
    
    this.showMessage('Data disimpan lokal. Akan disinkron saat online.', 'warning');
    
    // Register for background sync
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-transactions');
    }
  }

  async openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('JimpitanDB', 1);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('pendingTransactions')) {
          const store = db.createObjectStore('pendingTransactions', {
            keyPath: 'id',
            autoIncrement: false
          });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('synced', 'synced');
        }
      };
      
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  resetForm() {
    document.getElementById('tglDari').value = '';
    document.getElementById('tglSampai').value = '';
    document.getElementById('nominal').value = '';
    document.getElementById('btnSimpan').disabled = true;
    document.getElementById('infoStatus').textContent = 'Lengkapi semua data untuk menyimpan';
    document.getElementById('infoStatus').className = 'info';
  }

  async updateDashboardStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
      const data = await response.json();
      
      if (data.success) {
        this.updateStatsDisplay(data.data);
      }
    } catch (error) {
      console.error('Gagal memuat statistik:', error);
    }
  }

  updateStatsDisplay(stats) {
    // Create or update stats display
    let statsContainer = document.getElementById('dashboardStats');
    
    if (!statsContainer) {
      statsContainer = document.createElement('div');
      statsContainer.id = 'dashboardStats';
      statsContainer.className = 'dashboard-stats';
      document.querySelector('.container').prepend(statsContainer);
      
      const style = document.createElement('style');
      style.textContent = `
        .dashboard-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
          margin-bottom: 20px;
        }
        .stat-card {
          background: white;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #2e7d32;
          margin: 5px 0;
        }
        .stat-label {
          font-size: 12px;
          color: #666;
        }
      `;
      document.head.appendChild(style);
    }
    
    statsContainer.innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Total Nasabah</div>
        <div class="stat-value">${stats.totalNasabah}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Saldo</div>
        <div class="stat-value">Rp ${stats.totalSaldo.toLocaleString()}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Hari Ini</div>
        <div class="stat-value">Rp ${stats.setoranHariIni.toLocaleString()}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Bulan Ini</div>
        <div class="stat-value">Rp ${stats.setoranBulanIni.toLocaleString()}</div>
      </div>
    `;
  }

  showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    const style = document.createElement('style');
    style.textContent = `
      .message {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 6px;
        color: white;
        z-index: 1000;
        animation: slideIn 0.3s ease;
      }
      .message.success { background: #2e7d32; }
      .message.error { background: #d32f2f; }
      .message.warning { background: #f57c00; }
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(messageDiv);
    
    setTimeout(() => messageDiv.remove(), 3000);
  }

  navigateToLaporan() {
    window.location.href = '/pages/laporan.html';
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  window.app = new JimpitanApp();
});
