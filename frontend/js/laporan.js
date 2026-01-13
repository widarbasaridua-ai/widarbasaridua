const API_BASE_URL = 'http://localhost:3000/api';

class LaporanManager {
  constructor() {
    this.currentPage = 1;
    this.totalPages = 1;
    this.pageSize = 10;
    this.filters = {};
    
    this.init();
  }

  init() {
    this.setDefaultDates();
    this.loadLaporan();
    this.attachEventListeners();
  }

  setDefaultDates() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    document.getElementById('filterStartDate').value = firstDay.toISOString().split('T')[0];
    document.getElementById('filterEndDate').value = today.toISOString().split('T')[0];
  }

  attachEventListeners() {
    document.getElementById('filterStartDate').addEventListener('change', () => this.updateFilters());
    document.getElementById('filterEndDate').addEventListener('change', () => this.updateFilters());
    document.getElementById('filterNasabah').addEventListener('input', () => this.updateFilters());
    document.getElementById('filterJenis').addEventListener('change', () => this.updateFilters());
  }

  updateFilters() {
    this.filters = {
      startDate: document.getElementById('filterStartDate').value,
      endDate: document.getElementById('filterEndDate').value,
      nasabah: document.getElementById('filterNasabah').value,
      jenis: document.getElementById('filterJenis').value
    };
  }

  async loadLaporan() {
    this.showLoading(true);
    this.updateFilters();
    
    try {
      await Promise.all([
        this.loadSummary(),
        this.loadTransactions(),
        this.loadCharts()
      ]);
    } catch (error) {
      console.error('Error loading reports:', error);
      this.showMessage('Gagal memuat laporan', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  async loadSummary() {
    const params = new URLSearchParams({
      startDate: this.filters.startDate,
      endDate: this.filters.endDate
    });

    const response = await fetch(`${API_BASE_URL}/laporan/summary?${params}`);
    const data = await response.json();

    if (data.success) {
      this.updateSummary(data.data);
    }
  }

  updateSummary(data) {
    // Update total setoran
    document.getElementById('totalSetoran').textContent = 
      `Rp ${data.totalSetoran.toLocaleString()}`;
    
    // Update total transaksi
    document.getElementById('totalTransaksi').textContent = 
      data.totalTransaksi.toLocaleString();
    
    // Update rata-rata setoran
    const avgTransaction = data.totalTransaksi > 0 
      ? data.totalSetoran / data.totalTransaksi 
      : 0;
    document.getElementById('rataSetoran').textContent = 
      `Rp ${Math.round(avgTransaction).toLocaleString()}`;
    
    // Update top nasabah
    const topNasabahList = document.getElementById('topNasabahList');
    if (data.topNasabah.length > 0) {
      topNasabahList.innerHTML = data.topNasabah.map((item, index) => `
        <div style="margin-bottom: 10px; padding: 10px; background: #f9f9f9; border-radius: 4px;">
          <div><strong>${index + 1}. ${item.nasabah.namaLengkap}</strong></div>
          <div style="font-size: 12px; color: #666;">
            ${item.nasabah.kodeNasabah} | 
            Total: Rp ${item.totalSetoran.toLocaleString()} | 
            ${item.jumlahTransaksi} transaksi
          </div>
        </div>
      `).join('');
    } else {
      topNasabahList.innerHTML = '<div style="color: #999; text-align: center;">Tidak ada data</div>';
    }
    
    // Update chart data
    this.updateChart(data.transaksiPerHari);
  }

  async loadTransactions() {
    const params = new URLSearchParams({
      startDate: this.filters.startDate,
      endDate: this.filters.endDate,
      page: this.currentPage,
      limit: this.pageSize,
      ...(this.filters.jenis && { jenis: this.filters.jenis })
    });

    const response = await fetch(`${API_BASE_URL}/transaksi?${params}`);
    const data = await response.json();

    if (data.success) {
      this.updateTransactionsTable(data.data);
      this.updatePagination(data.pagination);
    }
  }

  updateTransactionsTable(transactions) {
    const tbody = document.getElementById('transactionsBody');
    
    if (transactions.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 40px; color: #999;">
            Tidak ada transaksi ditemukan
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = transactions.map(transaksi => `
      <tr>
        <td>${new Date(transaksi.createdAt).toLocaleDateString('id-ID')}</td>
        <td><code>${transaksi.kodeTransaksi}</code></td>
        <td>
          <strong>${transaksi.namaNasabah}</strong><br>
          <small>${transaksi.kodeNasabah}</small>
        </td>
        <td>
          ${new Date(transaksi.tanggalDari).toLocaleDateString('id-ID')}<br>
          <small>s/d</small><br>
          ${new Date(transaksi.tanggalSampai).toLocaleDateString('id-ID')}
        </td>
        <td style="font-weight: bold; color: #2e7d32;">
          Rp ${transaksi.nominal.toLocaleString()}
        </td>
        <td>
          <span class="badge ${transaksi.jenis === 'setoran' ? 'badge-success' : 'badge-pending'}">
            ${transaksi.jenis === 'setoran' ? '💰 Setoran' : '💸 Penarikan'}
          </span>
        </td>
        <td>
          <span class="badge badge-success">
            ${transaksi.status}
          </span>
        </td>
      </tr>
    `).join('');
  }

  updatePagination(pagination) {
    this.totalPages = pagination.pages;
    
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.querySelector('.page-btn:nth-child(1)');
    const nextBtn = document.querySelector('.page-btn:nth-child(3)');
    
    pageInfo.textContent = `Halaman ${this.currentPage} dari ${this.totalPages}`;
    prevBtn.disabled = this.currentPage <= 1;
    nextBtn.disabled = this.currentPage >= this.totalPages;
  }

  async loadCharts() {
    // Simple chart using HTML/CSS (could use Chart.js if added)
    // This is a placeholder for chart functionality
    const chartData = await this.getChartData();
    this.renderSimpleChart(chartData);
  }

  async getChartData() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const params = new URLSearchParams({
      startDate: sevenDaysAgo.toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    });

    const response = await fetch(`${API_BASE_URL}/laporan/summary?${params}`);
    const data = await response.json();
    
    return data.success ? data.data.transaksiPerHari : [];
  }

  updateChart(data) {
    const chartContainer = document.getElementById('chartContainer');
    
    if (data.length === 0) {
      chartContainer.innerHTML = '<div style="color: #999;">Tidak ada data untuk ditampilkan</div>';
      return;
    }

    const maxValue = Math.max(...data.map(d => d.total));
    
    chartContainer.innerHTML = `
      <div style="width: 100%; height: 100%; display: flex; align-items: flex-end; gap: 20px; padding: 20px;">
        ${data.map(item => {
          const height = maxValue > 0 ? (item.total / maxValue * 100) : 0;
          return `
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
              <div style="width: 30px; height: ${height}%; background: #2e7d32; border-radius: 4px 4px 0 0;"></div>
              <div style="margin-top: 10px; font-size: 12px; color: #666;">${item._id.split('-')[2]}/${item._id.split('-')[1]}</div>
              <div style="font-size: 10px; color: #999; margin-top: 5px;">Rp ${item.total.toLocaleString()}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  renderSimpleChart(data) {
    // This is a simplified chart renderer
    // For production, consider using Chart.js or similar
    this.updateChart(data);
  }

  changePage(delta) {
    const newPage = this.currentPage + delta;
    
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.currentPage = newPage;
      this.loadTransactions();
    }
  }

  resetFilter() {
    this.setDefaultDates();
    document.getElementById('filterNasabah').value = '';
    document.getElementById('filterJenis').value = '';
    this.currentPage = 1;
    this.loadLaporan();
  }

  async exportToExcel() {
    // Simple CSV export
    const response = await fetch(`${API_BASE_URL}/transaksi?startDate=${this.filters.startDate}&endDate=${this.filters.endDate}&limit=1000`);
    const data = await response.json();
    
    if (data.success) {
      const csv = this.convertToCSV(data.data);
      this.downloadCSV(csv, `laporan-jimpitan-${new Date().toISOString().split('T')[0]}.csv`);
    }
  }

  convertToCSV(data) {
    const headers = ['Tanggal', 'Kode Transaksi', 'Kode Nasabah', 'Nama Nasabah', 'Tanggal Dari', 'Tanggal Sampai', 'Nominal', 'Jenis', 'Status'];
    
    const rows = data.map(item => [
      new Date(item.createdAt).toLocaleDateString('id-ID'),
      item.kodeTransaksi,
      item.kodeNasabah,
      item.namaNasabah,
      new Date(item.tanggalDari).toLocaleDateString('id-ID'),
      new Date(item.tanggalSampai).toLocaleDateString('id-ID'),
      item.nominal,
      item.jenis,
      item.status
    ]);
    
    return [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
  }

  downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  showLoading(show) {
    const loadingElements = document.querySelectorAll('.loading');
    loadingElements.forEach(el => {
      el.style.display = show ? 'block' : 'none';
    });
  }

  showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 6px;
      color: white;
      z-index: 1000;
      animation: slideIn 0.3s ease;
      background: ${type === 'error' ? '#d32f2f' : type === 'success' ? '#2e7d32' : '#1976d2'};
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => messageDiv.remove(), 3000);
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  window.laporan = new LaporanManager();
});

// Global functions for HTML onclick handlers
function loadLaporan() {
  window.laporan.loadLaporan();
}

function resetFilter() {
  window.laporan.resetFilter();
}

function exportToExcel() {
  window.laporan.exportToExcel();
}

function changePage(delta) {
  window.laporan.changePage(delta);
}
