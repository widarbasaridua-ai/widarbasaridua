const mongoose = require('mongoose');

const transaksiSchema = new mongoose.Schema({
  kodeTransaksi: {
    type: String,
    required: true,
    unique: true
  },
  nasabahId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Nasabah',
    required: true
  },
  kodeNasabah: {
    type: String,
    required: true
  },
  namaNasabah: {
    type: String,
    required: true
  },
  tanggalDari: {
    type: Date,
    required: true
  },
  tanggalSampai: {
    type: Date,
    required: true
  },
  nominal: {
    type: Number,
    required: true,
    min: 0
  },
  jenis: {
    type: String,
    enum: ['setoran', 'penarikan'],
    default: 'setoran'
  },
  keterangan: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'sukses', 'batal'],
    default: 'sukses'
  },
  dibuatOleh: {
    type: String,
    default: 'admin'
  }
}, {
  timestamps: true
});

// Update saldo nasabah setelah transaksi sukses
transaksiSchema.post('save', async function(doc) {
  if (doc.jenis === 'setoran' && doc.status === 'sukses') {
    const Nasabah = mongoose.model('Nasabah');
    await Nasabah.findByIdAndUpdate(
      doc.nasabahId,
      { $inc: { totalSaldo: doc.nominal } }
    );
  }
});

module.exports = mongoose.model('Transaksi', transaksiSchema);
