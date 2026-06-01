import { StudentData } from "./types";

export const INITIAL_DEMO_DATA: StudentData[] = [
  {
    no: 1,
    namaSiswa: "Ahmad Mujtaba",
    kelas: "V-A Ula",
    kodeUnikAyah: "AYAH-AM819",
    kodeUnikIbu: "IBU-AM819",
    kehadiranAyah: "",
    kehadiranIbu: "",
  },
  {
    no: 2,
    namaSiswa: "Siti Fatimah Azzahra",
    kelas: "VI-B Wustha",
    kodeUnikAyah: "AYAH-SF102",
    kodeUnikIbu: "IBU-SF102",
    kehadiranAyah: "Hadir - 2026-06-01 07:15:32",
    kehadiranIbu: "",
  },
  {
    no: 3,
    namaSiswa: "Muhammad Rizky",
    kelas: "V-A Ula",
    kodeUnikAyah: "AYAH-MR304",
    kodeUnikIbu: "IBU-MR304",
    kehadiranAyah: "",
    kehadiranIbu: "Hadir - 2026-06-01 07:22:11",
  },
  {
    no: 4,
    namaSiswa: "Lukman Bashori",
    kelas: "III-A Ula",
    kodeUnikAyah: "AYAH-LB550",
    kodeUnikIbu: "IBU-LB550",
    kehadiranAyah: "",
    kehadiranIbu: "",
  },
  {
    no: 5,
    namaSiswa: "Annisa Shofia",
    kelas: "I-B Wustha",
    kodeUnikAyah: "AYAH-AS912",
    kodeUnikIbu: "IBU-AS912",
    kehadiranAyah: "Hadir - 2026-06-01 07:44:02",
    kehadiranIbu: "Hadir - 2026-06-01 07:45:10",
  },
  {
    no: 6,
    namaSiswa: "Zainuddin Al-Ghazali",
    kelas: "VI-A Wustha",
    kodeUnikAyah: "AYAH-ZG777",
    kodeUnikIbu: "IBU-ZG777",
    kehadiranAyah: "",
    kehadiranIbu: "",
  },
  {
    no: 7,
    namaSiswa: "Aisyah Humaira",
    kelas: "IV-B Ula",
    kodeUnikAyah: "AYAH-AH411",
    kodeUnikIbu: "IBU-AH411",
    kehadiranAyah: "",
    kehadiranIbu: "",
  }
];

export const INSTRUCTIONS_ID = `
### Panduan Integrasi Google Sheets

Aplikasi ini mendukung sinkronisasi dua arah dengan Google Sheets. Kehadiran akan disimpan langsung ke baris spreadsheet yang bersangkutan.

#### 1. Buat Google Spreadsheet
Buat spreadsheet baru di Google Drive dengan struktur kolom persis berikut di baris pertama (Header):
| No | Nama Siswa | Kelas | Kode Unik Ayah | Kode Unik Ibu | Kehadiran Ayah | Kehadiran Ibu |
|----|------------|-------|----------------|---------------|----------------|---------------|

*Pastikan nama sheet Anda sesuai (misal: "Data").*

#### 2. Dapatkan API Key Google (Opsional untuk Membaca Cepat)
* Buka [Google Cloud Console](https://console.cloud.google.com).
* Buat atau pilih proyek, buka **API & Services > Credentials** dan buat **API Key**.
* Aktifkan **Google Sheets API** pada proyek Anda.
* Bagikan Google Spreadsheet Anda dengan akses **"Siapa saja yang memiliki link sebagai Penglihat"** (Anyone with the link can view).

#### 3. Dapatkan Google Apps Script Web App (Direkomendasikan untuk Baca & Tulis Realtime)
Untuk memungkinkan aplikasi web ini menulis kehadiran ke Google Sheets tanpa perlu login akun Google yang rumit, kita menggunakan Google Apps Script sebagai micro-API.

⚠️ **PENTING (PERBAIKAN FITUR RESET KEHADIRAN):** Jika sebelumnya tombol "Reset Kehadiran" Anda menolak memperbarui data, itu karena skrip versi lama memblokir penulisan ulang. Silakan salin ulang kode di bawah ini, tempel di Google Apps Script Anda, lalu simpan dan **Deploy Ulang (Terapkan Baru > Aplikasi Web > Pilih Akses: Siapa Saja/Anyone)** agar fitur reset dapat menghapus kolom di spreadsheet secara realtime!

* Di Google Spreadsheet Anda, klik menu **Ekstensi > Apps Script** (Extensions > Apps Script).
* Hapus kode bawaan, lalu paste kode berikut:

\`\`\`javascript
function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data");
  var rows = sheet.getDataRange().getValues();
  var data = [];
  
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    data.push({
      no: row[0],
      namaSiswa: row[1],
      kelas: row[2],
      kodeUnikAyah: row[3],
      kodeUnikIbu: row[4],
      kehadiranAyah: row[5] ? row[5].toString() : "",
      kehadiranIbu: row[6] ? row[6].toString() : ""
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: "success", data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var result = { status: "error", message: "Invalid parameters" };
  try {
    var params = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data");
    var rows = sheet.getDataRange().getValues();
    
    var searchCode = params.code;
    var mode = params.mode; // "ayah" atau "ibu"
    var timestamp = params.timestamp; // "Hadir - YYYY-MM-DD HH:mm:ss"
    
    var colToFind = mode === "ayah" ? 3 : 4; // Kode Unik Ayah (kolom D) atau Ibu (kolom E)
    var colToUpdate = mode === "ayah" ? 5 : 6; // Kehadiran Ayah (kolom F) atau Ibu (kolom G)
    
    var foundIndex = -1;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][colToFind].toString().trim() === searchCode.trim()) {
        foundIndex = i + 1; // 1-indexed for sheets
        // Cek jika sudah hadir untuk mencegah overwrite tidak sengaja (lewati jika mengosongkan/reset dengan "")
        if (timestamp !== "" && rows[i][colToUpdate].toString().trim() !== "") {
          return ContentService.createTextOutput(JSON.stringify({ 
            status: "already_present", 
            message: "Undangan sudah tercatat hadir", 
            timestamp: rows[i][colToUpdate]
          }))
          .setMimeType(ContentService.MimeType.JSON);
        }
        break;
      }
    }
    
    if (foundIndex !== -1) {
      sheet.getRange(foundIndex, colToUpdate + 1).setValue(timestamp);
      result = { status: "success", message: "Kehadiran berhasil disimpan!" };
    } else {
      result = { status: "not_found", message: "Kode QR tidak valid!" };
    }
  } catch (error) {
    result = { status: "error", message: error.toString() };
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
\`\`\`

#### 4. Deploy Apps Script Sebagai Web App
* Klik tombol **Deploy > New Deployment** di bagian kanan atas Apps Script Editor.
* Pilih tipe deployment **Web app** (ikon roda gigi).
* Ubah konfigurasi:
  * **Execute as:** "Me" (Email Anda)
  * **Who has access:** "Anyone" (Siapa saja - ini wajib agar aplikasi web ini bisa mengaksesnya tanpa login)
* Klik **Deploy**, beri izin akses akun jika diminta Google, lalu **salin URL Web App** yang dihasilkan (formatnya: \`https://script.google.com/macros/s/.../exec\`).
* Tempelkan URL tersebut ke kolom **Web App URL** di pengaturan aplikasi ini!
`;
