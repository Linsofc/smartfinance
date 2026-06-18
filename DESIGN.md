# Design System & Brand Guidelines

Dokumen ini berisi panduan konsistensi desain untuk antarmuka website, disesuaikan dengan identitas visual dari logo utama. Mengingat aplikasi ini berfokus pada sistem keuangan, tampilan harus tetap bersih (clean), modern, dan memiliki tingkat keterbacaan data yang tinggi.

## 🎨 Palet Warna (Color Palette)

Logo menggunakan perpaduan gradasi biru dan hijau yang melambangkan teknologi, keamanan, dan pertumbuhan finansial.

### 1. Warna Utama (Primary Brand Colors)
Warna ini diambil langsung dari ekstraksi logo dan digunakan untuk elemen utama seperti Header, Sidebar, Tombol Primary, dan aksen visual.

*   **Brand Blue Dark**: `#1155CC` (Kiri/Awal Gradasi Biru)
*   **Brand Blue Light**: `#1890FF` (Kanan/Akhir Gradasi Biru)
*   **Brand Green Dark**: `#1E9045` (Kiri/Awal Gradasi Hijau)
*   **Brand Green Light**: `#63C737` (Kanan/Akhir Gradasi Hijau)

*Tip Penggunaan: Gunakan gradasi linier dari `Brand Blue Dark` ke `Brand Blue Light` untuk tombol atau elemen hero.*

### 2. Warna Dasar (Neutral & Background)
Warna latar belakang dari gambar logo agak *off-white* atau abu-abu sangat terang. Ini sangat baik untuk mengurangi kelelahan mata pada dashboard keuangan.

*   **Background App**: `#F4F6F9` (Diambil dari warna latar logo)
*   **Surface / Cards**: `#FFFFFF` (Putih bersih untuk card grafik dan tabel)
*   **Text Primary**: `#1E293B` (Untuk judul dan angka saldo utama)
*   **Text Secondary**: `#64748B` (Untuk label, deskripsi, dan teks berukuran kecil)

### 3. Warna Semantik (Khusus Website Keuangan)
Karena ini adalah website keuangan, penggunaan warna untuk status transaksi sangat penting.

*   **Success / Pemasukan (Income)**: Gunakan **Brand Green Dark** (`#1E9045`) agar selaras dengan identitas.
*   **Info / Saldo**: Gunakan **Brand Blue Light** (`#1890FF`).
*   **Danger / Pengeluaran (Expense)**: `#EF4444` (Merah tajam standar UI, diperlukan sebagai kontras dari warna brand).

---

## 🔤 Tipografi (Typography)

Logo menampilkan *font* sans-serif yang tebal, geometris, dan bernuansa teknologi modern. Untuk menerjemahkannya ke dalam UI website:

### 1. Heading Font (Judul & Angka Saldo)
Gunakan *font* dengan karakter teknikal namun tetap bersih.
*   **Font Family**: `Rajdhani`, `Space Grotesk`, atau `Outfit` (Tersedia di Google Fonts).
*   **Penggunaan**: Nama halaman, nominal uang besar (contoh: `Rp 15.000.000`), dan elemen *branding*.
*   **Weight**: Bold (700) atau Semi-Bold (600).

### 2. Body Font (Tabel, Form, & Paragraf)
Tabel laporan keuangan membutuhkan angka yang sejajar dan mudah dibaca secara cepat.
*   **Font Family**: `Inter` atau `Plus Jakarta Sans`.
*   **Penggunaan**: Isi tabel transaksi, label form input, riwayat aktivitas.
*   **Weight**: Regular (400) dan Medium (500).

---

## 📏 Ukuran & Spacing (Sizing System)

Gunakan sistem kelipatan 4px atau 8px agar tata letak dashboard rapi.

*   **Border Radius (Kelengkungan)**:
    *   `sm` (4px): Untuk input form dan *badge* status.
    *   `md` (8px): Untuk tombol (*button*).
    *   `lg` (16px): Untuk *Card* grafik dan tabel data.
    *(Bentuk huruf pada logo memiliki kombinasi sudut tajam dan melengkung, namun untuk UI dashboard, sudut melengkung moderat / 8px-16px sangat disarankan)*

*   **Spacing (Margin/Padding)**:
    *   `8px` / `16px` untuk jarak antar komponen dalam satu *Card*.
    *   `24px` / `32px` untuk jarak antar bagian utama halaman.

---

## 💻 Implementasi Konfigurasi (Tailwind CSS)

Jika Anda menggunakan Tailwind CSS (misalnya dengan React/Next.js), Anda dapat menambahkan konfigurasi warna ini langsung ke dalam `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1155CC',
          bluelight: '#1890FF',
          green: '#1E9045',
          greenlight: '#63C737',
        },
        surface: {
          bg: '#F4F6F9',
          card: '#FFFFFF',
        }
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
}