# 🚀 Panduan Deploy Absensi Haflatul Imtihan

Panduan lengkap mulai dari Google AI Studio hingga aplikasi online menggunakan GitHub Pages dan Google Sheets.

---

# Tahap 1 - Export dari Google AI Studio

Di Google AI Studio:

1. Klik menu Export
2. Pilih Export Code
3. Download source code
4. Extract file ZIP

Contoh hasil:

```text
absensi-imtihan/
├── src/
├── public/
├── package.json
├── vite.config.ts
├── tsconfig.json
└── index.html
```

---

# Tahap 2 - Upload ke GitHub

## A. Install GitHub Desktop

Download:

https://desktop.github.com

Install sampai selesai.

---

## B. Login GitHub Desktop

Login menggunakan akun GitHub.

---

## C. Clone Repository

Pilih:

```text
File
→ Clone Repository
```

Pilih repository:

```text
kamalproyek19/absensi-imtihan
```

Lokasi:

```text
Documents/GitHub
```

Klik:

```text
Clone
```

---

## D. Copy Source Code

Salin seluruh isi project hasil export AI Studio ke folder:

```text
Documents/GitHub/absensi-imtihan
```

---

## E. Commit

GitHub Desktop akan mendeteksi perubahan.

Isi:

```text
Summary:
Initial Upload
```

Klik:

```text
Commit to main
```

---

## F. Push ke GitHub

Klik:

```text
Push Origin
```

Tunggu sampai selesai.

---

# Tahap 3 - Konfigurasi GitHub Pages

Masuk repository:

```text
Settings
→ Pages
```

Pada:

```text
Build and deployment
```

Pilih:

```text
Source:
GitHub Actions
```

Simpan.

---

# Tahap 4 - Membuat Workflow Deploy

Buat folder:

```text
.github/workflows
```

Buat file:

```text
deploy.yml
```

Isi:

```yaml
name: Deploy Vite to GitHub Pages

on:
  push:
    branches:
      - main

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Upload Artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest

    permissions:
      pages: write
      id-token: write

    environment:
      name: github-pages

    steps:
      - name: Deploy
        uses: actions/deploy-pages@v4
```

Commit lalu Push.

---

# Tahap 5 - Menunggu Build

Masuk:

```text
Actions
```

Tunggu hingga muncul:

```text
✅ Deploy Vite to GitHub Pages
```

Jika sukses:

```text
Build
Deploy
```

berwarna hijau.

---

# Tahap 6 - Akses Website

Alamat website:

```text
https://kamalproyek19.github.io/absensi-imtihan/
```

---

# Tahap 7 - Mengganti Judul Website

Edit:

```text
index.html
```

Cari:

```html
<title>Absensi Imtihan</title>
```

Ganti:

```html
<title>Absensi Haflatul Imtihan YPP ASWAJ Ambunten</title>
```

Commit dan Push.

---

# Tahap 8 - Mengganti Favicon

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
<link rel="icon" type="image/png" href="/favicon.png">
```

di dalam:

```html
<head>
```

Commit dan Push.

---

# Tahap 9 - Mengganti Logo Header

Edit:

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

Ganti:

```jsx
<img
  src="/logo.png"
  alt="Logo"
/>
```

Upload:

```text
public/logo.png
```

Commit dan Push.

---

# Tahap 10 - Integrasi Google Sheets

Buat spreadsheet baru.

Header:

| No | Nama Siswa | Kelas | Kode Unik Ayah | Kode Unik Ibu | Kehadiran Ayah | Kehadiran Ibu |
|----|------------|--------|----------------|---------------|----------------|---------------|

Nama sheet:

```text
Data
```

---

# Tahap 11 - Membuat Apps Script

Spreadsheet:

```text
Extensions
→ Apps Script
```

Paste script API yang tersedia pada aplikasi.

---

# Tahap 12 - Deploy Apps Script

Klik:

```text
Deploy
→ New Deployment
```

Pilih:

```text
Type:
Web App
```

Pengaturan:

```text
Execute As:
Me

Who Has Access:
Anyone
```

Klik:

```text
Deploy
```

Salin URL:

```text
https://script.google.com/macros/s/xxxxx/exec
```

---

# Tahap 13 - Konfigurasi Aplikasi

Masuk menu:

```text
Pengaturan
```

Password:

```text
Bismillah
```

Isi:

```text
Mode           : Google Sheets
Spreadsheet ID : xxxx
API Key        : xxxx
Sheet Name     : Data
Web App URL    : xxxx
```

Klik:

```text
Simpan
```

---

# Tahap 14 - Uji Coba

1. Scan QR Ayah
2. Scan QR Ibu
3. Cek Spreadsheet
4. Pastikan data masuk realtime

---

# Troubleshooting

## Website 404

Periksa:

```text
Settings
→ Pages
→ Source
```

Harus:

```text
GitHub Actions
```

---

## Build Failed

Periksa:

```text
Actions
```

Klik workflow merah.

Lihat error pada:

```text
Build
```

---

## QR Tidak Terdeteksi

Periksa:

```text
Izin Kamera Browser
```

Harus:

```text
Allow
```

---

## Data Tidak Masuk Spreadsheet

Periksa:

- Apps Script aktif
- URL benar
- Sheet bernama Data
- Permission = Anyone

---

## Logo Tidak Muncul

Pastikan:

```text
public/logo.png
```

dan

```jsx
src="/logo.png"
```

---

## Favicon Tidak Muncul

Pastikan:

```text
public/favicon.png
```

dan

```html
<link rel="icon" href="/favicon.png">
```

Lalu refresh:

```text
CTRL + F5
```

---

# Selesai

Setiap kali mengubah file:

GitHub Desktop:

```text
Commit to main
↓
Push Origin
```

GitHub akan otomatis:

```text
Build
↓
Deploy
↓
Update Website
```

tanpa perlu menjalankan server sendiri.
