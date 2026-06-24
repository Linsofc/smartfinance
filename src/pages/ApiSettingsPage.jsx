import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Key, Cpu, Copy, Check, Trash2, Plus, 
  MessageSquare, Eye, EyeOff, Sparkles, Terminal, BookOpen, Code
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

export default function ApiSettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Guard access for non-premium users
  useEffect(() => {
    if (user && !user.isPremium) {
      navigate('/settings', { replace: true });
    }
  }, [user, navigate]);

  if (!user || !user.isPremium) {
    return null;
  }
  
  // States
  const [keys, setKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatingKey, setGeneratingKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Masked keys tracker
  const [visibleKeys, setVisibleKeys] = useState({});
  // Copied fields tracker
  const [copiedField, setCopiedField] = useState(null);

  const baseUrl = window.location.origin;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch active API Keys
      const keysRes = await api.get('/v1/ai/keys');
      setKeys(keysRes.data);
    } catch (err) {
      console.error("Gagal memuat data API & Automation:", err);
      setError(err.response?.data?.message || 'Gagal memuat data pengaturan.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setError('');
    setSuccess('');
    setGeneratingKey(true);
    try {
      const res = await api.post('/v1/ai/keys', { name: newKeyName });
      setKeys([res.data.apiKey, ...keys]);
      setNewKeyName('');
      setSuccess('API Key baru berhasil dibuat!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat API Key.');
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleToggleKey = async (id) => {
    setError('');
    try {
      const res = await api.put(`/v1/ai/keys/${id}/toggle`);
      setKeys(keys.map(k => k._id === id ? res.data.key : k));
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengubah status API Key.');
    }
  };

  const handleDeleteKey = async (id) => {
    Swal.fire({
      title: 'Hapus API Key?',
      text: 'Apakah Anda yakin ingin menghapus API Key ini? AI Agent eksternal yang terhubung dengan key ini tidak akan bisa mengakses data lagi.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      background: 'var(--color-surface-1)',
      color: 'var(--color-ink)',
      customClass: {
        popup: 'rounded-[24px] border border-hairline bg-surface-1 text-ink p-6',
        title: 'text-lg font-bold text-ink',
        htmlContainer: 'text-sm text-ink-muted mt-2',
        confirmButton: 'px-5 py-2.5 rounded-xl text-sm font-semibold bg-danger text-white transition-all active:scale-[0.98]',
        cancelButton: 'px-5 py-2.5 rounded-xl text-sm font-semibold bg-surface-2 border border-hairline text-ink transition-all active:scale-[0.98]'
      },
      buttonsStyling: false
    }).then(async (result) => {
      if (result.isConfirmed) {
        setError('');
        try {
          await api.delete(`/v1/ai/keys/${id}`);
          setKeys(keys.filter(k => k._id !== id));
          setSuccess('API Key berhasil dihapus.');
          setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
          setError(err.response?.data?.message || 'Gagal menghapus API Key.');
        }
      }
    });
  };

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const toggleKeyVisibility = (id) => {
    setVisibleKeys(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const systemPromptText = `Kamu asisten keuangan pribadi profesional yang terhubung ke API "Keuangan Pribadi" via X-API-Key.
Base URL: ${baseUrl}/api/v1/ai

═════════ PRINSIP UTAMA ═════════

1. KONFIRMASI DULU SEBELUM EKSEKUSI. Selalu bikin DRAFT, tunjukkan ke user, baru jalan.
2. JANGAN NGARANG. Pakai cuma data yang ada di context (dompet, kategori, dll).
3. Kalau ada field kurang lengkap → TANYA user dengan opsi yang relevan, bukan asal isi.
4. Setelah eksekusi sukses → kasih ringkasan + saldo akhir.

═════════ WORKFLOW WAJIB ═════════

1. Sesi pertama: PANGGIL DULUAN \`GET /context\`
   - Dapet: list dompet, list kategori (income & expense), ringkasan, status pro
   - SIMPAN data ini buat validasi semua input selanjutnya
2. Setiap kali user minta aksi → susun DRAFT → konfirmasi → eksekusi.

═════════ POLA "DRAFT → KONFIRMASI → EKSEKUSI" (WAJIB) ═════════

Pattern wajib untuk SEMUA aksi yang nulis data (create/update/transfer/loan/savings/budget/asset):

LANGKAH 1 — RANGKAI DRAFT
Dari pesan user, susun rencana lengkap. Cek field-field penting:
  • amount (wajib)
  • type (income/expense untuk transaksi, payable/receivable untuk loan)
  • wallet_name (wajib, harus ada di context.wallets)
  • category_name (untuk transaksi: harus ada di context.categories)
  • description, date (opsional, default: hari ini)

LANGKAH 2 — CEK KELENGKAPAN
Kalau ADA FIELD KOSONG / AMBIGU:
  ❌ JANGAN asal isi atau eksekusi.
  ✅ Tanya user dengan opsi konkret dari context.

  Contoh kategori gak disebut:
  "Beli kopi 5rb di Cash. Mau masuk kategori apa?
   📂 Pilihan kamu: Makanan, Belanja, Hiburan, Lainnya"

  Contoh dompet ambigu:
  "Saya catat 50rb. Dari dompet mana?
   💼 Dompet aktif: Cash (Rp 200rb), BCA (Rp 5jt), Dana (Rp 100rb)"

  Contoh kategori belum ada:
  "Kategori 'Servis Motor' belum ada di akun kamu.
   📂 Yang mirip: [list]
   ➕ Atau buat baru? Reply 'buat baru' kalau mau saya bikin."

LANGKAH 3 — TUNJUKKAN DRAFT
Begitu semua field lengkap, tampilkan ringkasan rapi:
  📝 Draft transaksi:
     • Tipe: Pengeluaran
     • Jumlah: Rp 5.000
     • Kategori: Makanan
     • Dompet: Cash (saldo: Rp 200.000)
     • Catatan: beli kopi di warung
     • Tanggal: hari ini

  Lanjut catat? (ya / edit / batal)

LANGKAH 4 — EKSEKUSI
Cuma kalau user reply "ya" / "lanjut" / "ok" / "iya" / dll. Setelah sukses:
  ✅ "Tercatat: Makanan Rp 5.000 di Cash. Saldo Cash sekarang Rp 195.000"

═════════ ATURAN KATEGORI & DOMPET ═════════

- Pakai \`wallet_name\` & \`category_name\` (string) — BUKAN UUID. API auto-resolve nama.
- WAJIB pakai kategori yang ADA di context.categories (income atau expense).
- Kalau API balikin error dengan \`available_categories\` / \`available_wallets\`:
  → Tampilkan list itu sebagai opsi ke user.
- Kalau user explicit minta "buat kategori baru: X" → tambahin \`create_category_if_missing: true\` di body create_transaction, atau panggil \`create_category\` dulu.

═════════ PARSING NATURAL ═════════

- Angka: "5rb"=5000, "50k"=50000, "200ribu"=200000, "1jt"=1000000, "2.5jt"=2500000, "1.5juta"=1500000
- Tanggal:
  • "hari ini" → today
  • "kemarin" → today - 1 hari
  • "tadi pagi" / "tadi" → today (tanpa jam)
  • "tanggal 5" / "5 bulan ini" → YYYY-MM-05
- Tipe transaksi:
  • "beli", "bayar", "keluar", "kasih" → expense
  • "terima", "dapet", "gajian", "masuk" → income
  • "pinjam dari" / "ngutang" → create_loan type=payable
  • "pinjamkan ke" / "kasih pinjam" → create_loan type=receivable
  • "setor tabungan" → savings_deposit (BUKAN create_transaction)
  • "tarik tabungan" → savings_withdraw

═════════ KAPAN PAKAI AKSI APA ═════════

TRANSAKSI:
❶ create_transaction — pengeluaran/pemasukan biasa (saldo auto-update)
❷ update_transaction — KOREKSI yang sudah ada. ⚠️ JANGAN delete + buat baru!
❸ transfer — pindah uang antar dompet user sendiri
❹ adjust_balance — top-up, koreksi saldo, set saldo ke nilai tertentu (kategori 'Penyesuaian')

DOMPET:
❺ create_wallet — buat dompet baru
❻ archive_wallet / hide_wallet — arsip atau sembunyikan dari total

HUTANG/PIUTANG (Pro):
❼ create_loan — type 'payable' (kita yang utang) atau 'receivable' (orang utang ke kita)
   • payable + wallet_name → wallet +amount (kita dapet uang)
   • receivable + wallet_name → wallet -amount (kita keluarin)
❽ pay_loan — bayar cicilan / terima bayaran. Saldo dompet auto-update.

TABUNGAN (Pro):
❾ create_savings — buat target tabungan
❿ savings_deposit — setor. Wallet -amount, tabungan +amount.
⓫ savings_withdraw — tarik. Wallet +amount, tabungan -amount.
   ⚠️ JANGAN pakai create_transaction untuk tabungan!

BUDGET & ASET (Pro):
⓬ manage_budget — POST /budget untuk atur limit, DELETE /budget untuk hapus, GET /budgets untuk list limit
⓭ create_asset / update_asset_value — track saham/emas/properti (fitur backend belum tersedia)

═════════ STATUS PRO USER ═════════

Cek context.user.subscription:
- "free" → batas 10 kategori, gak bisa loans/savings/budgets/assets.
- "trial" → akses penuh 7 hari trial
- "pro_1m" / "pro_12m" / "pro_lifetime" → akses penuh

User free coba fitur pro:
"Fitur ini cuma buat Pro. Coba upgrade dulu ke Pro mulai Rp 20rb/bulan, atau lifetime Rp 150rb."

═════════ POLA DELETE (WAJIB DUA STEP) ═════════

Step 1: DELETE /transaction?id=yyy (TANPA confirm)
   → API balik {"preview": true, "warning": "...", "transaction": {...}}
Step 2: Tunjukkan preview ke user, tanya konfirmasi.
Step 3: Kalau user setuju → DELETE /transaction?id=yyy&confirm=true

═════════ CONTOH PERCAKAPAN (FOLLOW POLA INI) ═════════

🟢 Contoh 1 — Field lengkap, langsung draft

User: "beli kopi 5rb di warung pake cash, masuk Makanan"
Bot:  📝 Draft transaksi:
        • Pengeluaran Rp 5.000
        • Dompet: Cash
        • Kategori: Makanan
        • Catatan: beli kopi di warung
      Lanjut catat? (ya / edit / batal)
User: "ya"
Bot:  → POST /transaction body: {"amount":5000,"type":"expense","wallet_name":"Cash","category_name":"Makanan","description":"beli kopi di warung"}
      ✅ Tercatat. Saldo Cash sekarang Rp 195.000

🟡 Contoh 2 — Kategori kosong → tanya dulu

User: "beli sayur 30rb cash"
Bot:  Saya catat sebagai pengeluaran Rp 30.000 dari Cash. Mau masuk kategori apa?
      📂 Pilihan kamu: Makanan, Belanja, Lainnya
User: "Makanan"
Bot:  📝 Draft transaksi:
        • Pengeluaran Rp 30.000
        • Dompet: Cash
        • Kategori: Makanan
        • Catatan: beli sayur
      Lanjut? (ya / edit / batal)

🟡 Contoh 3 — Dompet ambigu → tanya dulu

User: "kasih sedekah 20rb"
Bot:  Pengeluaran Rp 20.000 untuk sedekah. Dari dompet mana?
      💼 Dompet aktif:
       • Cash (Rp 200rb)
       • BCA (Rp 5jt)
       • Dana (Rp 100rb)
User: "Cash"
Bot:  Kategori sedekah masuk apa?
      📂 Pilihan: Lainnya, Hadiah... (atau mau saya buat kategori baru 'Sedekah'?)

🟡 Contoh 4 — Kategori gak ada di list → opsi buat baru

User: "bayar servis motor 100rb dari Cash"
Bot:  Kategori 'Servis Motor' belum ada di akun kamu.
      📂 Yang mirip: Transportasi
      ➕ Atau saya buatkan kategori baru 'Servis Motor'?
      Pilih: 'pakai Transportasi' / 'buat baru' / 'pilih lain'
User: "buat baru"
Bot:  📝 Draft:
        • Pengeluaran Rp 100.000
        • Dompet: Cash
        • Kategori: Servis Motor (baru)
      Lanjut? (ya/edit/batal)
User: "ya"
Bot:  → POST /transaction body: {"amount":100000,"type":"expense","wallet_name":"Cash","category_name":"Servis Motor","description":"bayar servis motor","create_category_if_missing":true}

🟢 Contoh 5 — Hutang masuk dompet

User: "saya pinjam 500rb dari Budi, masuk ke Cash"
Bot:  📝 Draft hutang baru:
        • Tipe: Hutang (saya yg utang ke Budi)
        • Jumlah: Rp 500.000
        • Dompet penerima: Cash (akan +Rp 500rb)
        • Pemberi pinjaman: Budi
      Catat? (ya/edit/batal)
User: "ya"
Bot:  → POST /loan body: {"type":"payable","amount":500000,"lender":"Budi","wallet_name":"Cash","description":"Pinjam dari Budi"}
      ✅ Hutang ke Budi tercatat. Cash sekarang Rp 700.000

🟢 Contoh 6 — Setor tabungan

User: "setor 500rb ke tabungan motor dari BCA"
Bot:  📝 Draft setor tabungan:
        • Tabungan: Beli Motor (current Rp 0 / target Rp 15jt)
        • Setor: Rp 500.000 dari BCA
        • Dampak: BCA -Rp 500rb, progress 3.3%
      Lanjut? (ya/edit/batal)
User: "ya"
Bot:  → POST /savings_deposit body: {"savings_id":"<id>","amount":500000,"wallet_name":"BCA"}

🟢 Contoh 7 — Transfer antar dompet

User: "transfer 200rb dari BCA ke Dana, admin 2500"
Bot:  📝 Draft transfer:
        • Dari: BCA (Rp 5jt) → Dana (Rp 100rb)
        • Jumlah: Rp 200.000
        • Biaya admin sumber: Rp 2.500
        • BCA setelah: Rp 4.797.500
        • Dana setelah: Rp 300.000
      Lanjut? (ya/edit/batal)

🟢 Contoh 8 — Hapus (selalu preview dulu)

User: "hapus transaksi kopi tadi"
Bot:  → DELETE /transaction?id=xxx (preview)
      ⚠️ Mau hapus:
        • Beli kopi Rp 7.500 (Makanan, Cash, hari ini)
      Saldo Cash akan dikembalikan +Rp 7.500.
      Yakin hapus? (ya/batal)
User: "ya"
Bot:  → DELETE /transaction?id=xxx&confirm=true ✅

🟢 Contoh 9 — Edit transaksi (JANGAN delete + buat baru)

User: "kopi tadi salah, harusnya 7500 bukan 5000"
Bot:  → GET /transactions?search=kopi&limit=3 → cari id
      📝 Draft koreksi:
        • Transaksi: 'beli kopi'
        • Amount: Rp 5.000 → Rp 7.500
      Update? (ya/batal)
User: "ya"
Bot:  → PATCH /transaction body: {"id":"xxx","amount":7500} ✅

🟢 Contoh 10 — Mengatur/Membuat Anggaran Kategori

User: "set budget makan jadi 1jt"
Bot:  → 📝 Draft anggaran baru:
         • Kategori: Makanan
         • Limit: Rp 1.000.000 / bulan
      Simpan anggaran? (ya/batal)
User: "ya"
Bot:  → POST /budget body: {"categoryName":"Makanan","amount":1000000} ✅
      Anggaran Makanan Rp 1.000.000 berhasil disimpan.`;

  const skillPackJsonText = JSON.stringify([
    {
      "name": "get_financial_context",
      "description": "Mengambil daftar dompet, kategori transaksi, dan anggaran aktif milik pengguna.",
      "parameters": { "type": "object", "properties": {} }
    },
    {
      "name": "add_transaction",
      "description": "Mencatat transaksi pemasukan (INCOME) atau pengeluaran (EXPENSE) baru.",
      "parameters": {
        "type": "object",
        "properties": {
          "type": { "type": "string", "enum": ["INCOME", "EXPENSE"] },
          "amount": { "type": "number" },
          "walletName": { "type": "string" },
          "categoryName": { "type": "string" },
          "description": { "type": "string" }
        },
        "required": ["type", "amount", "walletName"]
      }
    },
    {
      "name": "add_transfer",
      "description": "Melakukan transfer uang antar dompet keuangan.",
      "parameters": {
        "type": "object",
        "properties": {
          "amount": { "type": "number" },
          "sourceWalletName": { "type": "string" },
          "destinationWalletName": { "type": "string" },
          "description": { "type": "string" }
        },
        "required": ["amount", "sourceWalletName", "destinationWalletName"]
      }
    }
  ], null, 2);

  const endpointDocumentationUrl = `${baseUrl}/api/v1/ai/dokumentasi`;

  return (
    <div className="min-h-screen bg-canvas pb-24 sm:pb-12 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-surface-1/80 backdrop-blur-xl border-b border-hairline-soft px-4 py-4 flex items-center gap-4 shadow-sm">
        <button 
          onClick={() => navigate('/settings')}
          className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-ink hover:bg-surface-2/80 hover:scale-105 transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-ink">API & Automation</h1>
          <p className="text-xs text-ink-muted">Kelola kunci API untuk integrasi AI</p>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-3xl mx-auto mt-6">
        {/* Status Alerts */}
        <AnimatePresence mode="popLayout">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 rounded-2xl flex items-start gap-3 bg-danger/10 border border-danger/20 text-sm text-danger font-medium shadow-sm"
            >
              <span className="mt-0.5">⚠️</span>
              <p className="leading-relaxed">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 rounded-2xl flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-600 font-medium shadow-sm"
            >
              <span className="mt-0.5">✅</span>
              <p className="leading-relaxed">{success}</p>
            </motion.div>
          )}
        </AnimatePresence>
          
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 border-4 border-surface-2 border-t-accent-blue rounded-full animate-spin" />
            <p className="text-sm font-medium text-ink-muted animate-pulse">Memuat pengaturan...</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* API Keys Generator */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-surface-1 rounded-3xl border border-hairline-soft p-6 shadow-sm space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center text-accent-blue">
                  <Key size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">Generate API Key</h3>
                  <p className="text-xs text-ink-muted">Buat kunci baru untuk menghubungkan aplikasi eksternal.</p>
                </div>
              </div>

              <form onSubmit={handleGenerateKey} className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full px-4 py-3.5 bg-surface-2 border border-hairline-soft focus:bg-surface-1 focus:border-accent-blue focus:ring-4 focus:ring-accent-blue/10 rounded-xl text-sm font-medium text-ink transition-all outline-none placeholder:text-ink-muted/50"
                    placeholder="Contoh: Telegram Bot, OpenClaw Agent..."
                  />
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={generatingKey || !newKeyName.trim()}
                  className="px-6 bg-ink hover:bg-ink/80 text-canvas rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingKey ? (
                    <div className="w-5 h-5 border-2 border-canvas/30 border-t-canvas rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus size={16} />
                      Buat Key
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>

            {/* Active API Keys */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-surface-1 rounded-3xl border border-hairline-soft p-6 shadow-sm space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Terminal size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">API Keys Aktif</h3>
                  <p className="text-xs text-ink-muted">Kelola kunci API yang sedang digunakan.</p>
                </div>
              </div>

              {keys.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-hairline-soft rounded-2xl bg-surface-2/50">
                  <p className="text-sm font-medium text-ink-muted">Belum ada API Key yang dibuat.</p>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {keys.map((k) => (
                    <div 
                      key={k._id} 
                      className="p-4 border border-hairline-soft rounded-2xl bg-surface-2/50 hover:bg-surface-2 hover:border-ink/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-sm text-ink truncate block">{k.name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border ${k.isActive ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-surface-3 text-ink-muted border-hairline-soft'}`}>
                            {k.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 bg-surface-1 py-1.5 px-3 rounded-lg w-fit border border-hairline-soft">
                          <span className="font-mono text-xs text-ink-muted tracking-widest mt-0.5">
                            {visibleKeys[k._id] ? k.key : '••••••••••••••••••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleKeyVisibility(k._id)}
                            className="text-ink-muted hover:text-ink transition-colors ml-2"
                          >
                            {visibleKeys[k._id] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>

                        <span className="text-[10px] text-ink-muted/70 block mt-2 font-medium">
                          Terakhir dipakai: {k.lastUsed ? new Date(k.lastUsed).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Belum pernah'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 border-t border-hairline-soft sm:border-0 pt-3 sm:pt-0 mt-1 sm:mt-0">
                        {/* Copy key */}
                        <button
                          type="button"
                          onClick={() => handleCopy(k.key, k._id)}
                          className="flex-1 sm:flex-none h-9 px-3 bg-surface-1 border border-hairline-soft rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink hover:bg-surface-2 transition-all"
                        >
                          {copiedField === k._id ? (
                            <><Check size={14} className="text-emerald-500" /> <span className="sm:hidden">Tersalin</span></>
                          ) : (
                            <><Copy size={14} /> <span className="sm:hidden">Salin</span></>
                          )}
                        </button>

                        {/* Toggle active state */}
                        <button
                          type="button"
                          onClick={() => handleToggleKey(k._id)}
                          className="flex-1 sm:flex-none h-9 px-3 bg-surface-1 border border-hairline-soft rounded-xl flex items-center justify-center text-xs font-semibold hover:bg-surface-2 transition-all"
                        >
                          {k.isActive ? (
                            <span className="text-danger">Matikan</span>
                          ) : (
                            <span className="text-emerald-600">Aktifkan</span>
                          )}
                        </button>

                        {/* Delete key */}
                        <button
                          type="button"
                          onClick={() => handleDeleteKey(k._id)}
                          className="h-9 w-9 bg-danger/10 border border-danger/20 rounded-xl flex items-center justify-center text-danger hover:bg-danger/20 hover:text-danger-dark transition-all"
                          title="Hapus Key"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* AI Skill Pack integration details */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-surface-1 rounded-3xl border border-hairline-soft p-6 shadow-sm space-y-6"
            >
              <div className="flex items-center gap-3 pb-2 border-b border-hairline-soft">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">Konfigurasi Siap Pakai</h3>
                  <p className="text-xs text-ink-muted">Salin pengaturan ini ke AI Agent Anda (Prompt & Dokumentasi).</p>
                </div>
              </div>

              <div className="space-y-6 pt-2">
                
                {/* 1. System Prompt */}
                <div className="space-y-2">
                  <span className="font-bold text-sm text-ink block">1. System Prompt</span>
                  <div className="relative group">
                    <button
                      onClick={() => handleCopy(systemPromptText, 'prompt')}
                      className="absolute top-3 right-3 p-2 bg-surface-2/90 backdrop-blur border border-hairline-soft rounded-lg text-xs font-medium text-ink-muted hover:text-ink flex items-center gap-1.5 transition-all opacity-80 hover:opacity-100 z-10 shadow-sm"
                    >
                      {copiedField === 'prompt' ? <><Check size={14} className="text-emerald-500" /> Tersalin</> : <><Copy size={14} /> Salin</>}
                    </button>
                    <pre className="p-4 bg-[#0d1117] text-[#c9d1d9] font-mono text-xs rounded-2xl overflow-x-auto max-h-64 leading-relaxed whitespace-pre-wrap scrollbar-thin scrollbar-thumb-surface-3 scrollbar-track-transparent border border-[#30363d]">
                      {systemPromptText}
                    </pre>
                  </div>
                </div>

                {/* 2. Dokumentasi URL */}
                <div className="space-y-2">
                  <span className="font-bold text-sm text-ink block">2. Dokumentasi</span>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      readOnly
                      value={endpointDocumentationUrl}
                      className="flex-1 px-4 py-3 bg-surface-2 border border-hairline-soft rounded-xl font-mono text-xs text-ink-muted select-all outline-none"
                    />
                    <button
                      onClick={() => handleCopy(endpointDocumentationUrl, 'endpoint')}
                      className="px-4 bg-surface-2 border border-hairline-soft rounded-xl text-xs font-semibold text-ink hover:bg-surface-3 transition-colors flex items-center gap-2"
                    >
                      {copiedField === 'endpoint' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                      <span className="hidden sm:inline">{copiedField === 'endpoint' ? 'Tersalin' : 'Salin URL'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* RESTful API Documentation */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-surface-1 rounded-3xl border border-hairline-soft p-6 shadow-sm space-y-5"
            >
              <div className="flex items-center gap-3 pb-2 border-b border-hairline-soft">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Terminal size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">Dokumentasi RESTful API</h3>
                  <p className="text-xs text-ink-muted">Gunakan API Key di atas untuk mengakses endpoint berikut.</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* 1. GET /context */}
                <EndpointCard
                  method="GET" path="/context" color="emerald"
                  desc="Mengambil konteks finansial lengkap: daftar dompet, kategori, anggaran aktif, 10 transaksi terbaru, dan ringkasan bulan ini."
                  code={`import axios from 'axios';

const API_KEY = 'sf_key_your_api_key_here';
const BASE_URL = 'https://smartfinance.linsofc.my.id/api/v1/ai';

async function getContext() {
  const res = await axios.get(BASE_URL + '/context', {
    headers: { 'X-API-KEY': API_KEY }
  });
  console.log(res.data);
}`}
                  response={`{
  "wallets": [
    { "_id": "...", "name": "Cash", "balance": 200000, "type": "Tunai" },
    { "_id": "...", "name": "BCA", "balance": 5000000, "type": "E-Wallet" }
  ],
  "categories": [
    { "name": "Makanan", "type": "EXPENSE", "icon": "🍛" },
    { "name": "Gaji", "type": "INCOME", "icon": "💰" }
  ],
  "budgets": [
    { "_id": "...", "category": "Makanan", "amount": 1000000, "icon": "🍛" }
  ],
  "recentTransactions": [
    { "_id": "...", "date": "2026-06-21", "type": "EXPENSE", "category": "Makanan", "amount": 15000, "description": "Beli kopi", "walletName": "Cash" }
  ],
  "analytics": {
    "thisMonth": {
      "totalIncome": 25000000,
      "totalExpense": 15000,
      "balance": 24985000,
      "expenseBreakdownByCategory": { "Makanan": 15000 }
    }
  }
}`}
                />

                {/* 2. POST /transaction */}
                <EndpointCard
                  method="POST" path="/transaction" color="blue"
                  desc="Mencatat transaksi pemasukan atau pengeluaran baru. Saldo dompet akan otomatis ter-update."
                  body={`{
  "type": "EXPENSE",
  "amount": 25000,
  "wallet_name": "Cash",
  "category_name": "Makanan",
  "description": "Nasi goreng malam",
  "date": "2026-06-21"
}`}
                  code={`import axios from 'axios';

const API_KEY = 'sf_key_your_api_key_here';
const BASE_URL = 'https://smartfinance.linsofc.my.id/api/v1/ai';

async function createTransaction() {
  const res = await axios.post(BASE_URL + '/transaction', {
    type: 'EXPENSE',
    amount: 25000,
    wallet_name: 'Cash',
    category_name: 'Makanan',
    description: 'Nasi goreng malam'
  }, {
    headers: { 'X-API-KEY': API_KEY }
  });
  console.log(res.data);
}`}
                  response={`{
  "message": "Transaksi berhasil dicatat!",
  "transaction": {
    "_id": "...",
    "type": "EXPENSE",
    "category": "Makanan",
    "amount": 25000,
    "note": "Nasi goreng malam",
    "walletId": "..."
  },
  "walletBalance": 175000
}`}
                />

                {/* 3. POST /transfer */}
                <EndpointCard
                  method="POST" path="/transfer" color="blue"
                  desc="Transfer uang antar dompet. Saldo kedua dompet akan otomatis ter-update."
                  body={`{
  "amount": 200000,
  "sourceWalletName": "BCA",
  "destinationWalletName": "Cash",
  "description": "Tarik tunai"
}`}
                  code={`import axios from 'axios';

const API_KEY = 'sf_key_your_api_key_here';
const BASE_URL = 'https://smartfinance.linsofc.my.id/api/v1/ai';

async function transfer() {
  const res = await axios.post(BASE_URL + '/transfer', {
    amount: 200000,
    sourceWalletName: 'BCA',
    destinationWalletName: 'Cash',
    description: 'Tarik tunai'
  }, {
    headers: { 'X-API-KEY': API_KEY }
  });
  console.log(res.data);
}`}
                  response={`{
  "message": "Transfer berhasil dilakukan!",
  "transfer": {
    "_id": "...",
    "amount": 200000,
    "note": "Tarik tunai"
  },
  "sourceWalletBalance": 4800000,
  "destinationWalletBalance": 475000
}`}
                />

                {/* 4. POST /wallet */}
                <EndpointCard
                  method="POST" path="/wallet" color="blue"
                  desc="Membuat dompet baru untuk menyimpan uang."
                  body={`{
  "name": "Dana",
  "type": "E-Wallet",
  "balance": 0,
  "icon": "smartphone",
  "color": "#06b6d4"
}`}
                  code={`import axios from 'axios';

const API_KEY = 'sf_key_your_api_key_here';
const BASE_URL = 'https://smartfinance.linsofc.my.id/api/v1/ai';

async function createWallet() {
  const res = await axios.post(BASE_URL + '/wallet', {
    name: 'Dana',
    type: 'E-Wallet',
    balance: 0
  }, {
    headers: { 'X-API-KEY': API_KEY }
  });
  console.log(res.data);
}`}
                  response={`{
  "message": "Dompet berhasil ditambahkan!",
  "wallet": {
    "_id": "...",
    "name": "Dana",
    "balance": 0,
    "type": "E-Wallet"
  }
}`}
                />

                {/* 5. PUT /wallet */}
                <EndpointCard
                  method="PUT" path="/wallet" color="orange"
                  desc="Memperbarui nama, tipe, ikon, atau warna dompet yang sudah ada."
                  body={`{
  "id": "xxx_wallet_id_xxx",
  "name": "Cash Baru",
  "color": "#3b82f6"
}`}
                  code={`import axios from 'axios';

const API_KEY = 'sf_key_your_api_key_here';
const BASE_URL = 'https://smartfinance.linsofc.my.id/api/v1/ai';

async function updateWallet() {
  const res = await axios.put(BASE_URL + '/wallet', {
    id: 'xxx_wallet_id_xxx',
    name: 'Cash Baru',
    color: '#3b82f6'
  }, {
    headers: { 'X-API-KEY': API_KEY }
  });
  console.log(res.data);
}`}
                  response={`{
  "message": "Dompet berhasil diperbarui!",
  "wallet": {
    "_id": "xxx",
    "name": "Cash Baru",
    "color": "#3b82f6"
  }
}`}
                />

                {/* 6. DELETE /wallet */}
                <EndpointCard
                  method="DELETE" path="/wallet?id=xxx" color="red"
                  desc="Menghapus dompet berdasarkan ID. Transaksi terkait tidak ikut terhapus."
                  code={`import axios from 'axios';

const API_KEY = 'sf_key_your_api_key_here';
const BASE_URL = 'https://smartfinance.linsofc.my.id/api/v1/ai';

async function deleteWallet() {
  const res = await axios.delete(BASE_URL + '/wallet', {
    params: { id: 'xxx_wallet_id_xxx' },
    headers: { 'X-API-KEY': API_KEY }
  });
  console.log(res.data);
}`}
                  response={`{
  "message": "Dompet berhasil dihapus!"
}`}
                />

                {/* 7. POST /category */}
                <EndpointCard
                  method="POST" path="/category" color="blue"
                  desc="Membuat kategori transaksi kustom baru."
                  body={`{
  "name": "Servis Motor",
  "icon": "🔧",
  "color": "#f59e0b",
  "type": "EXPENSE"
}`}
                  code={`import axios from 'axios';

const API_KEY = 'sf_key_your_api_key_here';
const BASE_URL = 'https://smartfinance.linsofc.my.id/api/v1/ai';

async function createCategory() {
  const res = await axios.post(BASE_URL + '/category', {
    name: 'Servis Motor',
    icon: '🔧',
    color: '#f59e0b',
    type: 'EXPENSE'
  }, {
    headers: { 'X-API-KEY': API_KEY }
  });
  console.log(res.data);
}`}
                  response={`{
  "message": "Kategori berhasil ditambahkan!",
  "categories": [
    { "name": "Servis Motor", "icon": "🔧", "color": "#f59e0b", "type": "EXPENSE" }
  ]
}`}
                />

                {/* 8. GET /categories */}
                <EndpointCard
                  method="GET" path="/categories" color="emerald"
                  desc="Melihat semua kategori transaksi kustom yang telah dibuat pengguna."
                  code={`import axios from 'axios';

const API_KEY = 'sf_key_your_api_key_here';
const BASE_URL = 'https://smartfinance.linsofc.my.id/api/v1/ai';

async function getCategories() {
  const res = await axios.get(BASE_URL + '/categories', {
    headers: { 'X-API-KEY': API_KEY }
  });
  console.log(res.data);
}`}
                  response={`{
  "categories": [
    { "name": "Servis Motor", "icon": "🔧", "color": "#f59e0b", "type": "EXPENSE" }
  ]
}`}
                />

                {/* 9. GET /balance */}
                <EndpointCard
                  method="GET" path="/balance" color="emerald"
                  desc="Melihat saldo semua dompet yang dimiliki."
                  code={`import axios from 'axios';

const API_KEY = 'sf_key_your_api_key_here';
const BASE_URL = 'https://smartfinance.linsofc.my.id/api/v1/ai';

async function getBalance() {
  const res = await axios.get(BASE_URL + '/balance', {
    headers: { 'X-API-KEY': API_KEY }
  });
  console.log(res.data);
}`}
                  response={`{
  "wallets": [
    { "name": "Cash", "balance": 475000, "type": "Tunai" },
    { "name": "BCA", "balance": 4800000, "type": "E-Wallet" }
  ]
}`}
                />

                {/* 10. GET /transactions */}
                <EndpointCard
                  method="GET" path="/transactions" color="emerald"
                  desc="Mengambil riwayat transaksi dengan filter opsional."
                  code={`import axios from 'axios';

const API_KEY = 'sf_key_your_api_key_here';
const BASE_URL = 'https://smartfinance.linsofc.my.id/api/v1/ai';

async function getTransactions() {
  const res = await axios.get(BASE_URL + '/transactions', {
    params: { limit: 5, type: 'EXPENSE', category: 'Makanan' },
    headers: { 'X-API-KEY': API_KEY }
  });
  console.log(res.data);
}`}
                  response={`{
  "transactions": [
    {
      "_id": "...",
      "date": "2026-06-21T08:01:46.557Z",
      "type": "EXPENSE",
      "category": "Makanan",
      "amount": 25000,
      "description": "Nasi goreng",
      "walletName": "Cash"
    }
  ]
}`}
                />

                {/* 11. PUT /transaction */}
                <EndpointCard
                  method="PUT" path="/transaction" color="orange"
                  desc="Memperbarui transaksi yang sudah ada. Jangan hapus dan buat ulang."
                  body={`{
  "id": "xxx_transaction_id_xxx",
  "amount": 30000,
  "description": "Nasi goreng + telur"
}`}
                  code={`import axios from 'axios';

const API_KEY = 'sf_key_your_api_key_here';
const BASE_URL = 'https://smartfinance.linsofc.my.id/api/v1/ai';

async function updateTransaction() {
  const res = await axios.put(BASE_URL + '/transaction', {
    id: 'xxx_transaction_id_xxx',
    amount: 30000,
    description: 'Nasi goreng + telur'
  }, {
    headers: { 'X-API-KEY': API_KEY }
  });
  console.log(res.data);
}`}
                  response={`{
  "message": "Transaksi berhasil diperbarui!",
  "transaction": {
    "_id": "xxx",
    "amount": 30000,
    "type": "EXPENSE",
    "category": "Makanan",
    "description": "Nasi goreng + telur"
  }
}`}
                />

                {/* 12. DELETE /transaction */}
                <EndpointCard
                  method="DELETE" path="/transaction?id=xxx" color="red"
                  desc="Menghapus transaksi. Dua-step: panggil tanpa confirm untuk preview, lalu dengan &confirm=true untuk eksekusi."
                  code={`import axios from 'axios';

const API_KEY = 'sf_key_your_api_key_here';
const BASE_URL = 'https://smartfinance.linsofc.my.id/api/v1/ai';

// Step 1: Preview
async function previewDelete() {
  const res = await axios.delete(BASE_URL + '/transaction', {
    params: { id: 'xxx_transaction_id_xxx' },
    headers: { 'X-API-KEY': API_KEY }
  });
  console.log('Preview:', res.data);
}

// Step 2: Confirm
async function confirmDelete() {
  const res = await axios.delete(BASE_URL + '/transaction', {
    params: { id: 'xxx_transaction_id_xxx', confirm: true },
    headers: { 'X-API-KEY': API_KEY }
  });
  console.log('Deleted:', res.data);
}`}
                  response={`// Preview response:
{
  "preview": true,
  "warning": "Transaksi akan dihapus. Saldo Cash akan dikembalikan +Rp 25.000",
  "transaction": { "_id": "xxx", "amount": 25000, "category": "Makanan", "walletName": "Cash" }
}

// Confirm response:
{
  "message": "Transaksi berhasil dihapus!"
}`}
                />

                {/* 13. GET /budgets */}
                <EndpointCard
                  method="GET" path="/budgets" color="emerald"
                  desc="Mendapatkan daftar anggaran belanja yang aktif."
                  code={`import axios from 'axios';

const API_KEY = 'sf_key_your_api_key_here';
const BASE_URL = 'https://smartfinance.linsofc.my.id/api/v1/ai';

async function getBudgets() {
  const res = await axios.get(BASE_URL + '/budgets', {
    headers: { 'X-API-KEY': API_KEY }
  });
  console.log(res.data);
}`}
                  response={`{
  "budgets": [
    {
      "_id": "...",
      "category": "Makanan",
      "amount": 1000000,
      "icon": "🍔"
    }
  ]
}`}
                />

                {/* 14. POST /budget */}
                <EndpointCard
                  method="POST" path="/budget" color="blue"
                  desc="Membuat atau memperbarui anggaran belanja per kategori (upsert)."
                  body={`{
  "categoryName": "Makanan",
  "amount": 1000000,
  "icon": "🍔"
}`}
                  code={`import axios from 'axios';

const API_KEY = 'sf_key_your_api_key_here';
const BASE_URL = 'https://smartfinance.linsofc.my.id/api/v1/ai';

async function createBudget() {
  const res = await axios.post(BASE_URL + '/budget', {
    categoryName: 'Makanan',
    amount: 1000000,
    icon: '🍔'
  }, {
    headers: { 'X-API-KEY': API_KEY }
  });
  console.log(res.data);
}`}
                  response={`{
  "message": "Anggaran berhasil disimpan!",
  "budget": {
    "_id": "...",
    "category": "Makanan",
    "amount": 1000000
  }
}`}
                />

                {/* 15. DELETE /budget */}
                <EndpointCard
                  method="DELETE" path="/budget" color="red"
                  desc="Menghapus anggaran belanja berdasarkan nama kategori atau ID."
                  code={`import axios from 'axios';

const API_KEY = 'sf_key_your_api_key_here';
const BASE_URL = 'https://smartfinance.linsofc.my.id/api/v1/ai';

async function deleteBudget() {
  const res = await axios.delete(BASE_URL + '/budget', {
    params: { categoryName: 'Makanan' },
    headers: { 'X-API-KEY': API_KEY }
  });
  console.log(res.data);
}`}
                  response={`{
  "message": "Anggaran berhasil dihapus!"
}`}
                />
              </div>
            </motion.div>

            {/* Cara Kerja / Panduan UI Chat */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-surface-1 rounded-3xl border border-hairline-soft p-6 shadow-sm space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">Simulasi Cara Kerja</h3>
                  <p className="text-xs text-ink-muted">Contoh bagaimana AI merespon dan mencatat transaksi Anda.</p>
                </div>
              </div>

              {/* Chat Simulation bubbles */}
              <div className="p-5 rounded-2xl bg-[#f8fafc] dark:bg-[#0f172a] space-y-5 border border-hairline-soft shadow-inner">
                
                {/* Bubble 1: User request */}
                <div className="flex flex-col items-end space-y-1.5">
                  <div className="px-4 py-2.5 rounded-2xl bg-indigo-600 text-white text-xs sm:text-sm max-w-[85%] rounded-tr-sm shadow-sm">
                    beli kopi 5rb di warung pake cash, masuk Makanan
                  </div>
                </div>

                {/* Bubble 2: Bot draft response */}
                <div className="flex flex-col items-start space-y-1.5">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm max-w-[90%] rounded-tl-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans shadow-sm w-full sm:w-auto">
                    📝 <b className="text-slate-900 dark:text-white">Draft transaksi:</b><br/>
                    <div className="space-y-1 pl-2 mt-2 font-mono text-[11px] sm:text-xs">
                      <p>• <b>Tipe:</b> Pengeluaran</p>
                      <p>• <b>Jumlah:</b> Rp 5.000</p>
                      <p>• <b>Kategori:</b> Makanan</p>
                      <p>• <b>Dompet:</b> Cash (saldo: Rp 200.000)</p>
                      <p>• <b>Catatan:</b> beli kopi di warung</p>
                      <p>• <b>Tanggal:</b> hari ini</p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 font-semibold text-indigo-600 dark:text-indigo-400">
                      Lanjut catat? (ya / edit / batal)
                    </div>
                  </div>
                </div>

                {/* Bubble 3: User confirmation */}
                <div className="flex flex-col items-end space-y-1.5">
                  <div className="px-4 py-2.5 rounded-2xl bg-indigo-600 text-white text-xs sm:text-sm max-w-[85%] rounded-tr-sm shadow-sm">
                    ya
                  </div>
                </div>

                {/* Bubble 4: Bot success response */}
                <div className="flex flex-col items-start space-y-1.5">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm max-w-[90%] rounded-tl-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans shadow-sm">
                    ✅ <span className="font-semibold text-emerald-600 dark:text-emerald-400">Tercatat: Makanan Rp 5.000 di Cash. Saldo Cash sekarang Rp 195.000</span>
                  </div>
                </div>

              </div>

              {/* Automation List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                {[
                  "Saldo otomatis terupdate",
                  "Deteksi kategori cerdas",
                  "Support bahasa alami (15rb, 1jt)",
                  "Fitur transfer antar dompet"
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-2.5 bg-surface-2/50 p-3 rounded-xl border border-hairline-soft">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Check size={12} className="text-emerald-500" />
                    </div>
                    <span className="text-xs font-medium text-ink-muted">{text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        )}
      </div>
    </div>
  );
}

function EndpointCard({ method, path, color, desc, body, code, response }) {
  const colorMap = {
    GET: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20' },
    POST: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20' },
    PUT: { bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-500/20' },
    DELETE: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/20' }
  };
  const mc = colorMap[method] || colorMap.GET;
  return (
    <div className="border border-hairline-soft rounded-2xl overflow-hidden bg-surface-2/30 hover:bg-surface-2/50 transition-colors">
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={'text-[11px] font-bold px-2.5 py-1 rounded-lg border ' + mc.bg + ' ' + mc.text + ' ' + mc.border}>
            {method}
          </span>
          <code className="text-sm font-semibold text-ink font-mono">{path}</code>
          {desc && <p className="text-xs text-ink-muted w-full sm:w-auto sm:flex-1 sm:min-w-0 mt-1 sm:mt-0">{desc}</p>}
        </div>
        <div className="space-y-3">
          {body && (
            <div>
              <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Code size={12} /> Request Body
              </p>
              <pre className="p-3 bg-[#0d1117] text-[#c9d1d9] font-mono text-[11px] rounded-xl overflow-x-auto leading-relaxed border border-[#30363d] whitespace-pre-wrap">{body}</pre>
            </div>
          )}
          <div>
            <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Terminal size={12} /> Node.js (axios)
            </p>
            <pre className="p-3 bg-[#0d1117] text-[#c9d1d9] font-mono text-[11px] rounded-xl overflow-x-auto leading-relaxed border border-[#30363d] whitespace-pre-wrap">{code}</pre>
          </div>
          <div>
            <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Check size={12} /> Response
            </p>
            <pre className="p-3 bg-[#0d1117] text-[#c9d1d9] font-mono text-[11px] rounded-xl overflow-x-auto leading-relaxed border border-[#30363d] whitespace-pre-wrap">{response}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}