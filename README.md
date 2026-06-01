# 📋 Absensi Haflatul Imtihan
### YPP ASWAJ Ambunten

Sistem absensi digital berbasis QR Code untuk kegiatan Haflatul Imtihan.

## ✨ Fitur Utama

- Scan QR Code menggunakan kamera HP
- Absensi terpisah untuk Ayah dan Ibu
- Validasi QR Code otomatis
- Statistik kehadiran realtime
- Integrasi Google Sheets
- Mode Offline (Demo)
- Reset Kehadiran
- Responsive Android & Desktop
- Deploy gratis menggunakan GitHub Pages

---

# 🌐 Demo

https://kamalproyek19.github.io/absensi-imtihan/

---

# 🛠 Teknologi

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Google Sheets
- Google Apps Script
- GitHub Pages

---

# 📁 Struktur Data Google Sheets

Buat Spreadsheet baru dengan header:

| No | Nama Siswa | Kelas | Kode Unik Ayah | Kode Unik Ibu | Kehadiran Ayah | Kehadiran Ibu |
|----|------------|--------|----------------|---------------|----------------|---------------|

Contoh:

| 1 | Ahmad Mujtaba | V-A Ula | AYAH-AM819 | IBU-AM819 | | |

Nama Sheet:

```text
Data
```

---

# 🔗 Integrasi Google Apps Script

## 1. Buka Apps Script

Google Spreadsheet → Extensions → Apps Script

## 2. Hapus kode bawaan

Paste script yang ada pada menu Pengaturan aplikasi.

## 3. Deploy

Deploy → New Deployment

Pilih:

```text
Type         : Web App
Execute As   : Me
Who Has Access : Anyone
```

Salin URL yang dihasilkan.

Contoh:

```text
https://script.google.com/macros/s/AKfycbxxxxxx/exec
```

Masukkan ke menu Pengaturan aplikasi.

---

# ⚙️ Pengaturan Aplikasi

Masuk ke:

```text
Pengaturan
```

Password:

```text
Bismillah
```

Mode Database:

### Demo

Data tersimpan di browser.

### Google Sheets

Data tersimpan langsung ke Spreadsheet.

Isi:

```text
Spreadsheet ID
API Key
Sheet Name
Web App URL
```

---

# 🚀 Deploy ke GitHub Pages

## 1. Fork / Clone Repository

```bash
git clone https://github.com/kamalproyek19/absensi-imtihan.git
```

---

## 2. Install Dependency

```bash
npm install
```

---

## 3. Jalankan Lokal

```bash
npm run dev
```

Buka:

```text
http://localhost:3000
```

---

## 4. Build Production

```bash
npm run build
```

Jika berhasil akan muncul folder:

```text
dist/
```

---

# ⚡ Deploy Otomatis GitHub Pages

Repository sudah menggunakan GitHub Actions.

File:

```text
.github/workflows/deploy.yml
```

Setiap push ke branch:

```text
main
```

otomatis akan:

1. Install dependency
2. Build project
3. Upload artifact
4. Deploy ke GitHub Pages

---

# 🔧 Aktivasi GitHub Pages

Masuk:

```text
Repository
→ Settings
→ Pages
```

Source:

```text
GitHub Actions
```

Tunggu proses deploy selesai.

Website:

```text
https://kamalproyek19.github.io/absensi-imtihan/
```

---

# 🎨 Mengubah Logo Header

File:

```text
src/App.tsx
```

Cari:

```jsx
<img
  src="https://iili.io/C3rO9EX.png"
  alt="Logo"
/>
```

Ganti URL sesuai logo Anda.

---

# 🎨 Mengubah Favicon

Upload file:

```text
favicon.png
```

ke folder:

```text
public/
```

Struktur:

```text
public/
 └── favicon.png
```

Edit:

```html
index.html
```

Tambahkan:

```html
<link rel="icon" type="image/png" href="/favicon.png" />
```

di dalam tag:

```html
<head>
```

---

# 🌐 Preview WhatsApp & Facebook

Tambahkan pada:

```html
index.html
```

di dalam:

```html
<head>
```

```html
<meta property="og:title" content="Absensi Haflatul Imtihan YPP ASWAJ Ambunten">
<meta property="og:description" content="Sistem Absensi QR Code Haflatul Imtihan">
<meta property="og:image" content="/logo.png">
```

Simpan file:

```text
public/logo.png
```

---

# 🔒 Password Pengaturan

Default:

```text
Bismillah
```

Lokasi:

```text
src/App.tsx
```

Cari:

```javascript
if (passwordInput === "Bismillah")
```

Ganti sesuai kebutuhan.

---

# 📱 Rekomendasi Penggunaan

Untuk panitia:

- Gunakan Google Chrome Android
- Aktifkan izin kamera
- Gunakan jaringan WiFi yang stabil
- Mode Google Sheets untuk acara sebenarnya
- Mode Demo untuk simulasi

---

# 📝 Catatan Penting

Jika data tidak masuk ke Spreadsheet:

Periksa:

- URL Apps Script benar
- Sheet bernama "Data"
- Deployment Apps Script masih aktif
- Permission Apps Script = Anyone

---

# 👨‍💻 Developer

YPP ASWAJ Ambunten

Powered by:

- React
- Vite
- Google Sheets
- Google Apps Script
- GitHub Pages
- Google AI Studio

---

# 📄 Lisensi

Bebas digunakan untuk kebutuhan internal lembaga pendidikan.
