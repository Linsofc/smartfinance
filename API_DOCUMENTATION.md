# SmartFinance AI Integration API Documentation

Dokumentasi ini ditujukan untuk mempermudah integrasi Asisten AI Pihak Ketiga (seperti Telegram Bot, Custom GPTs, atau agen otonom lainnya) dengan sistem SmartFinance.

## Informasi Umum
- **Base URL Produksi:** `https://smartfinance.linsofc.my.id/api/v1/ai`
- **Base URL Lokal:** `http://localhost:5000/api/v1/ai`
- **Header Autentikasi:** Semua request wajib menyertakan API Key yang valid pada header `X-API-KEY`.

---

## Ringkasan Endpoints

| No | Endpoint | Method | Deskripsi |
|---|---|---|---|
| 1 | `/context` | `GET` | Mendapatkan konteks finansial pengguna (daftar dompet, anggaran, kategori, transaksi terakhir, dan analisis ringkas). |
| 2 | `/transaction` | `POST` | Mencatat transaksi baru (Pengeluaran atau Pemasukan). |
| 3 | `/transfer` | `POST` | Melakukan transfer dana antar dompet. |
| 4 | `/balance` | `GET` | Melihat daftar saldo dari seluruh dompet yang aktif. |
| 5 | `/transactions` | `GET` | Mengambil riwayat daftar transaksi dengan filter tipe/kategori. |
| 6 | `/transaction/:id` | `PUT` | Memperbarui detail transaksi berdasarkan ID di path. |
| 7 | `/transaction` | `PUT` | Memperbarui detail transaksi (ID disertakan dalam request body atau query param). |
| 8 | `/transaction/:id` | `DELETE` | Menghapus transaksi berdasarkan ID di path. |
| 9 | `/transaction` | `DELETE` | Menghapus transaksi (ID disertakan dalam query param `?id=ID`). |
| 10| `/openapi.json` | `GET` | Mengambil spesifikasi standar OpenAPI 3.0 dalam format JSON. |
| 11| `/docs` | `GET` | Halaman dokumentasi HTML premium. |
| 12| `/action-instructions`| `GET` | Panduan instruksi sistem/prompt asisten AI dalam format Markdown. |

---

## Detail Endpoints & Contoh Request

### 1. Mengambil Konteks Finansial
- **Method:** `GET`
- **Path:** `/context`
- **Deskripsi:** Endpoint ini digunakan untuk inisialisasi sesi AI agar agen mengetahui daftar dompet dan kategori anggaran yang valid sebelum melakukan pencatatan.

#### Contoh Request:
```bash
curl -X GET "https://smartfinance.linsofc.my.id/api/v1/ai/context" \
  -H "X-API-KEY: sf_key_32df54724ea8012367c097de5e2306a8a88d34fd29c3d35a"
```

#### Contoh Response Sukses (200 OK):
```json
{
  "wallets": [
    { "id": "6a33ff806c7b...", "name": "Kas/Cash", "balance": 4390000, "color": "#22c55e", "icon": "cash", "type": "Tunai" }
  ],
  "categories": [],
  "budgets": [
    { "id": "6a33f0655a98...", "category": "Makanan", "amount": 10000, "icon": "🍛" }
  ],
  "recentTransactions": [],
  "analytics": {
    "thisMonth": {
      "totalIncome": 24550000,
      "totalExpense": 80000,
      "balance": 24470000,
      "expenseBreakdownByCategory": { "Makanan": 30000 }
    }
  }
}
```

---

### 2. Mencatat Transaksi (Pemasukan / Pengeluaran)
- **Method:** `POST`
- **Path:** `/transaction`
- **Request Body (JSON):**
  - `type` (String, Wajib): `EXPENSE` atau `INCOME`. Otomatis dikonversi ke uppercase.
  - `amount` (Number, Wajib): Jumlah transaksi. Harus bernilai positif (> 0).
  - `walletName` (String, Opsional): Nama dompet yang didebet/kredit. Jika salah atau kosong, sistem akan merespon dengan kode 400 beserta daftar dompet yang valid untuk membantu AI melakukan koreksi. Jika tidak ditentukan dan user memiliki dompet, akan otomatis menggunakan dompet pertama.
  - `categoryName` (String, Opsional): Kategori transaksi. Default ke `"Lainnya"` jika `INCOME` dan `"Lain-lain"` jika `EXPENSE`.
  - `description` (String, Opsional): Catatan atau detail transaksi.
  - `date` (String, Opsional): Tanggal transaksi dalam format ISO / `YYYY-MM-DD`. Default adalah waktu saat ini.

#### Contoh Request:
```bash
curl -X POST "https://smartfinance.linsofc.my.id/api/v1/ai/transaction" \
  -H "X-API-KEY: sf_key_32df54724ea8012367c097de5e2306a8a88d34fd29c3d35a" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "EXPENSE",
    "amount": 15000,
    "walletName": "Kas/Cash",
    "categoryName": "Makanan",
    "description": "Beli kopi susu"
  }'
```

#### Contoh Response Sukses (201 Created):
```json
{
  "message": "Transaksi berhasil dicatat!",
  "transaction": {
    "userId": "6a33ee52...",
    "date": "2026-06-21T08:01:46.557Z",
    "type": "EXPENSE",
    "category": "Makanan",
    "amount": 15000,
    "note": "Beli kopi susu",
    "walletId": "6a33ff806c7b...",
    "_id": "6a379a6a52447a4aab04fb6f",
    "createdAt": "2026-06-21T08:01:46.558Z",
    "updatedAt": "2026-06-21T08:01:46.558Z"
  },
  "walletBalance": 4375000
}
```

#### Contoh Response Error (400 Bad Request - Nama Dompet Salah):
```json
{
  "message": "Dompet dengan nama \"E-Wallet\" tidak ditemukan.",
  "availableWallets": ["Kas/Cash", "DANA", "BCA"]
}
```

---

### 3. Melakukan Transfer Dana
- **Method:** `POST`
- **Path:** `/transfer`
- **Request Body (JSON):**
  - `amount` (Number, Wajib): Jumlah dana yang ditransfer. Harus bernilai positif (> 0).
  - `sourceWalletName` (String, Wajib): Nama dompet asal (sumber dana).
  - `destinationWalletName` (String, Wajib): Nama dompet tujuan.
  - `description` (String, Opsional): Catatan deskripsi transfer.

#### Contoh Request:
```bash
curl -X POST "https://smartfinance.linsofc.my.id/api/v1/ai/transfer" \
  -H "X-API-KEY: sf_key_32df54724ea8012367c097de5e2306a8a88d34fd29c3d35a" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "sourceWalletName": "BCA",
    "destinationWalletName": "DANA",
    "description": "Top-up saldo e-wallet"
  }'
```

#### Contoh Response Sukses (201 Created):
```json
{
  "message": "Transfer berhasil dilakukan!",
  "transfer": {
    "userId": "6a33ee52...",
    "fromWalletId": "6a34351b...",
    "toWalletId": "6a3434f0...",
    "amount": 50000,
    "note": "Top-up saldo e-wallet",
    "date": "2026-06-21T08:05:00.000Z",
    "_id": "6a379c1152447a4aab04fb99"
  },
  "sourceWalletBalance": 14950000,
  "destinationWalletBalance": 130000
}
```

---

### 4. Melihat Daftar Transaksi
- **Method:** `GET`
- **Path:** `/transactions`
- **Query Parameters (Opsional):**
  - `limit`: Batas jumlah transaksi yang ditampilkan (Default: 50).
  - `type`: Tipe transaksi (`EXPENSE` / `INCOME`).
  - `category`: Kategori transaksi (contoh: `Makanan`).

#### Contoh Request:
```bash
curl -X GET "https://smartfinance.linsofc.my.id/api/v1/ai/transactions?limit=5&type=EXPENSE" \
  -H "X-API-KEY: sf_key_32df54724ea8012367c097de5e2306a8a88d34fd29c3d35a"
```

---

### 5. Menghapus Transaksi
- **Method:** `DELETE`
- **Path:** `/transaction/:id` (atau `/transaction?id=ID_TRANSAKSI`)

#### Contoh Request:
```bash
curl -X DELETE "https://smartfinance.linsofc.my.id/api/v1/ai/transaction/6a379a6a52447a4aab04fb6f" \
  -H "X-API-KEY: sf_key_32df54724ea8012367c097de5e2306a8a88d34fd29c3d35a"
```

#### Contoh Response Sukses (200 OK):
```json
{
  "message": "Transaksi berhasil dihapus!"
}
```

---

## Cara AI Menangani Error

Setiap kali terjadi kesalahan request data (misal: format tanggal salah, tipe tidak didukung, atau nama dompet salah), API akan merespon dengan status **400 Bad Request** disertai pesan JSON berstruktur:

```json
{
  "message": "Pesan deskripsi kesalahan utama.",
  "errors": ["Detail spesifik error 1", "Detail spesifik error 2"],
  "availableWallets": ["Kas/Cash", "DANA", "BCA"] // Hanya jika kesalahan terkait nama dompet
}
```

Jika AI Agent menerima response dengan kode `4xx`, harap baca detail properti `message`, `errors`, atau `availableWallets` untuk memperbaiki data body request secara otomatis dan mengulangi request (self-correction).
