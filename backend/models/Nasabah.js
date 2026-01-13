const mongoose = require('mongoose');

const nasabahSchema = new mongoose.Schema({
  kodeNasabah: {
    type: String,
    required: true,
    unique: true
  },
  namaLengkap: {
    type: String,
    required: true,
    trim: true
  },
  alamat: {
    type: String,
    default: ''
  },
  noTelepon: {
    type: String,
    default: ''
  },
  tanggalDaftar: {
    type: Date,
    default: Date.now
  },
  totalSaldo: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['aktif', 'nonaktif'],
    default: 'aktif'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Nasabah', nasabahSchema);
