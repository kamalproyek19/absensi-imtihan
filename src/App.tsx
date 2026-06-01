import { useState, useEffect } from "react";
import { StudentData, AppConfig, ScanMode } from "./types";
import { INITIAL_DEMO_DATA } from "./data";
import {
  playSuccessSound,
  playErrorSound,
  triggerSuccessVibration,
  triggerErrorVibration,
} from "./utils/feedback";
import ScannerModal from "./components/ScannerModal";
import SettingsModal from "./components/SettingsModal";
import Statistics from "./components/Statistics";
import StudentTable from "./components/StudentTable";
import ToastContainer, { ToastMessage } from "./components/Toast";
import {
  QrCode,
  Settings,
  Flame,
  Check,
  ChevronRight,
  Wifi,
  WifiOff,
  User,
  Heart,
  AlertCircle,
  FileSpreadsheet,
  BookOpen,
  X,
  Database,
  ArrowRight,
  RefreshCw,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Default config values
const DEFAULT_CONFIG: AppConfig = {
  spreadsheetId: "",
  apiKey: "",
  sheetName: "Data",
  webAppUrl: "",
  mode: "demo",
};

export default function App() {
  // Config & Database States
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Scanner & Modal Controls
  const [scanMode, setScanMode] = useState<ScanMode>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Password Prompt States
  const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  // Match result states (for validation of scanned QR)
  const [scannedResult, setScannedResult] = useState<{
    student: StudentData;
    mode: "ayah" | "ibu";
    code: string;
    alreadyCheckedIn: boolean;
    existingTimestamp?: string;
  } | null>(null);

  // Error Match QR states
  const [scanError, setScanError] = useState<{
    code: string;
    mode: "ayah" | "ibu";
    message: string;
  } | null>(null);

  // Toast array
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Monitor online status
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  // Initialize config and load data
  useEffect(() => {
    // Load config from Local Storage if exists
    const storedConfig = localStorage.getItem("imtihan_app_config");
    let currentConfig = DEFAULT_CONFIG;
    if (storedConfig) {
      try {
        currentConfig = JSON.parse(storedConfig);
        setConfig(currentConfig);
      } catch (e) {
        console.error("Failed to parse config on load, using default", e);
      }
    }

    // Load actual student records of presence
    loadStudentData(currentConfig);
  }, []);

  // Helper to append a notification toast
  const addToast = (type: "success" | "error" | "warning", text: string) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Load students dataset based on config mode
  const loadStudentData = async (configOverride?: AppConfig) => {
    const activeConfig = configOverride || config;
    setIsLoading(true);

    if (activeConfig.mode === "demo") {
      // Offline/Local Storage Simulation database
      const storedData = localStorage.getItem("imtihan_attendance_data");
      if (storedData) {
        try {
          setStudents(JSON.parse(storedData));
        } catch (e) {
          console.error("Failed to parse local stored presence data, seeding default", e);
          localStorage.setItem("imtihan_attendance_data", JSON.stringify(INITIAL_DEMO_DATA));
          setStudents(INITIAL_DEMO_DATA);
        }
      } else {
        localStorage.setItem("imtihan_attendance_data", JSON.stringify(INITIAL_DEMO_DATA));
        setStudents(INITIAL_DEMO_DATA);
      }
      setIsLoading(false);
    } else {
      // Live Google Sheets mode
      if (!isOnline) {
        addToast("error", "Koneksi internet lambat atau offline. Membuka versi cadangan.");
        activeConfig.mode = "demo";
        loadStudentData(activeConfig);
        return;
      }

      // 1. Try Apps Script Web App FIRST (Supports Read & Write)
      if (activeConfig.webAppUrl) {
        try {
          const response = await fetch(activeConfig.webAppUrl, { method: "GET" });
          const result = await response.json();
          if (result && result.status === "success" && Array.isArray(result.data)) {
            setStudents(result.data);
            addToast("success", "Sore! Sinkronisasi data Google Sheets berhasil dilakukan.");
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.warn("Fetch with Apps Script URL failed, falling back to read-only API Key", err);
        }
      }

      // 2. Try Standard Direct Google Sheets API (v4) read-only Key SECOND
      if (activeConfig.spreadsheetId && activeConfig.apiKey) {
        try {
          const url = `https://sheets.googleapis.com/v4/spreadsheets/${activeConfig.spreadsheetId}/values/${activeConfig.sheetName}?key=${activeConfig.apiKey}`;
          const response = await fetch(url);
          const data = await response.json();
          if (data && data.values && data.values.length > 1) {
            // Map row matrix to StudentData models
            const rows = data.values;
            const mapped: StudentData[] = [];
            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              if (row[1]) { // If student name exists
                mapped.push({
                  no: i,
                  namaSiswa: row[1]?.toString() || "",
                  kelas: row[2]?.toString() || "",
                  kodeUnikAyah: row[3]?.toString() || "",
                  kodeUnikIbu: row[4]?.toString() || "",
                  kehadiranAyah: row[5]?.toString() || "",
                  kehadiranIbu: row[6]?.toString() || "",
                });
              }
            }
            setStudents(mapped);
            addToast("success", "Sinkronisasi Google Sheets API v4 berhasil!");
          } else {
            throw new Error("Struktur kolom sheet kosong atau salah.");
          }
        } catch (err: any) {
          console.error("All Google Sheet pulls failed:", err);
          addToast("error", `Sinkronisasi gagal. Pastikan tab bernama '${activeConfig.sheetName}' & API Key valid.`);
          // Auto fallback to local storage so committee operations can proceed seamlessly
          const localData = localStorage.getItem("imtihan_attendance_data") 
            ? JSON.parse(localStorage.getItem("imtihan_attendance_data")!) 
            : INITIAL_DEMO_DATA;
          setStudents(localData);
        }
      } else {
        addToast("warning", "Google Sheets belum terkonfigurasi. Menggunakan data demo.");
        const localData = localStorage.getItem("imtihan_attendance_data") 
          ? JSON.parse(localStorage.getItem("imtihan_attendance_data")!) 
          : INITIAL_DEMO_DATA;
        setStudents(localData);
      }
      setIsLoading(false);
    }
  };

  // Trigger when a config is modified inside SettingsModal
  const handleSaveConfig = (newConfig: AppConfig) => {
    localStorage.setItem("imtihan_app_config", JSON.stringify(newConfig));
    setConfig(newConfig);
    addToast("success", `Pengaturan disimpan. Mengaktifkan Mode ${newConfig.mode === "demo" ? "Demo" : "Google Sheets"}`);
    loadStudentData(newConfig);
  };

  // Reset entire database back to default initial values
  const handleResetDemoData = () => {
    localStorage.setItem("imtihan_attendance_data", JSON.stringify(INITIAL_DEMO_DATA));
    setStudents(INITIAL_DEMO_DATA);
    addToast("success", "Seluruh data kehadiran berhasil di-riset ulang!");
  };

  // Open the QR code validator
  const handleScanClick = (mode: "ayah" | "ibu") => {
    setScanMode(mode);
    setIsScannerOpen(true);
  };

  // Triggered when a QR code scan completes inside ScannerModal
  const handleQRDetected = (decodedTextOrCode: string) => {
    const cleanCode = decodedTextOrCode.trim();
    if (!cleanCode) return;

    // Determine current active scanning mode
    const mode = scanMode || "ayah";

    // Locate student
    const student = students.find((s) => {
      if (mode === "ayah") {
        return s.kodeUnikAyah.trim().toLowerCase() === cleanCode.toLowerCase();
      } else {
        return s.kodeUnikIbu.trim().toLowerCase() === cleanCode.toLowerCase();
      }
    });

    if (student) {
      // Check if student presence was already recorded
      const presenceTimestamp = mode === "ayah" ? student.kehadiranAyah : student.kehadiranIbu;
      const isAlreadyPresent = presenceTimestamp && presenceTimestamp.trim() !== "";

      if (isAlreadyPresent) {
        // Warning: already present duplicate check!
        triggerErrorVibration();
        playErrorSound();
        addToast("warning", `${student.namaSiswa} sudah mengisi kehadiran.`);
        setScannedResult({
          student,
          mode,
          code: cleanCode,
          alreadyCheckedIn: true,
          existingTimestamp: presenceTimestamp,
        });
      } else {
        // Success: valid student found, pending confirmation!
        triggerSuccessVibration();
        playSuccessSound();
        setScannedResult({
          student,
          mode,
          code: cleanCode,
          alreadyCheckedIn: false,
        });
      }
    } else {
      // Student QR non-existent / broken
      triggerErrorVibration();
      playErrorSound();
      setScanError({
        code: cleanCode,
        mode,
        message: `Kode QR '${cleanCode}' tidak ditemukan pada kolom Kode Unik ${mode === "ayah" ? "Ayah" : "Ibu"}.`,
      });
      addToast("error", "Kode QR tidak valid!");
    }
  };

  // Authorizes and opens the Settings panel using password check
  const handleOpenSettingsClick = () => {
    setIsPasswordPromptOpen(true);
    setPasswordInput("");
    setPasswordError(false);
  };

  // Commits/Writes presence check-in either locally or in sheets
  const handleConfirmAttendance = async () => {
    if (!scannedResult) return;

    const { student, mode, code } = scannedResult;
    setIsLoading(true);

    const originalStudents = [...students];

    // Format current timestamp: DD-MM-YY HH:mm:ss in Indonesian Localtime
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const yr = now.getFullYear().toString().slice(-2);
    const timestamp = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${yr} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    // Optimistic UI Update: update UI state instantly
    const updated = students.map((s) => {
      if (s.no === student.no) {
        return {
          ...s,
          kehadiranAyah: mode === "ayah" ? timestamp : s.kehadiranAyah,
          kehadiranIbu: mode === "ibu" ? timestamp : s.kehadiranIbu,
        };
      }
      return s;
    });

    setStudents(updated);
    localStorage.setItem("imtihan_attendance_data", JSON.stringify(updated));

    // Provide instant feedback and close details popup
    triggerSuccessVibration();
    playSuccessSound();
    addToast("success", `Kehadiran ${student.namaSiswa} (${mode === "ayah" ? "Ayah" : "Ibu"}) disimpan!`);
    setScannedResult(null);

    if (config.mode === "demo") {
      setIsLoading(false);
    } else {
      // Background webApp sync write
      if (!isOnline) {
        setIsLoading(false);
        return;
      }

      if (config.webAppUrl) {
        try {
          const response = await fetch(config.webAppUrl, {
            method: "POST",
            redirect: "follow",
            headers: {
              "Content-Type": "text/plain;charset=utf-8",
            },
            body: JSON.stringify({
              code,
              mode,
              timestamp,
            }),
          });
          const result = await response.json();

          if (result && result.status === "success") {
            // Keep background state updated
            loadStudentData();
          } else if (result && result.status === "already_present") {
            // No action needed since already set, but refresh background
            loadStudentData();
          } else {
            throw new Error(result?.message || "Eror penulisan.");
          }
        } catch (err: any) {
          console.error("Failed to commit live sheet update in background:", err);
          addToast("error", `Membatalkan kehadiran ${student.namaSiswa}: Gagal kirim spreadsheet.`);
          // Rollback local state
          setStudents(originalStudents);
          localStorage.setItem("imtihan_attendance_data", JSON.stringify(originalStudents));
        }
      } else {
        addToast("warning", "Apps Script URL Kosong. Hanya disimpan secara lokal.");
      }
      setIsLoading(false);
    }
  };

  // manual override Check-In toggle directly inside student table row clicks
  const handleManualCheckInOverride = async (no: number, mode: "ayah" | "ibu", isCheckIn: boolean) => {
    setIsLoading(true);

    const studentToUpdate = students.find((s) => s.no === no);
    if (!studentToUpdate) {
      setIsLoading(false);
      return;
    }

    const originalStudents = [...students];

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const yr = now.getFullYear().toString().slice(-2);
    const timestamp = isCheckIn
      ? `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${yr} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
      : "";

    const codeToCommit = mode === "ayah" ? studentToUpdate.kodeUnikAyah : studentToUpdate.kodeUnikIbu;

    // Optimistic UI Update: update state locally instantly
    const updated = students.map((s) => {
      if (s.no === no) {
        return {
          ...s,
          kehadiranAyah: mode === "ayah" ? timestamp : s.kehadiranAyah,
          kehadiranIbu: mode === "ibu" ? timestamp : s.kehadiranIbu,
        };
      }
      return s;
    });

    setStudents(updated);
    localStorage.setItem("imtihan_attendance_data", JSON.stringify(updated));

    if (config.mode === "demo") {
      addToast("success", isCheckIn ? `Kehadiran manual ${studentToUpdate.namaSiswa} disimpan.` : `Kehadiran manual ${studentToUpdate.namaSiswa} di-reset.`);
      setIsLoading(false);
    } else {
      if (config.webAppUrl) {
        try {
          const response = await fetch(config.webAppUrl, {
            method: "POST",
            redirect: "follow",
            headers: {
              "Content-Type": "text/plain;charset=utf-8",
            },
            body: JSON.stringify({
              code: codeToCommit,
              mode: mode,
              timestamp: timestamp, // empty string clears the column in Apps Script
            }),
          });
          const result = await response.json();
          if (result && result.status === "success") {
            addToast("success", isCheckIn ? `Spreasheet terupdate: ${studentToUpdate.namaSiswa} Hadir.` : `Spreadsheet terupdate: ${studentToUpdate.namaSiswa} Reset.`);
            loadStudentData();
          } else {
            throw new Error(result?.message || "Ditolak oleh Apps Script");
          }
        } catch (e: any) {
          console.error("Manual check in record failed in background:", e);
          if (!isCheckIn) {
            addToast("error", `Gagal Reset Sheet: ${e?.message || "Koneksi terputus"}. Silakan SALIN & DEPLOY Apps Script TERBARU di modal Pengaturan!`);
          } else {
            addToast("error", `Gagal update Google Sheets: ${e?.message || "Koneksi terputus"}. Memulihkan status.`);
          }
          // Rollback local state
          setStudents(originalStudents);
          localStorage.setItem("imtihan_attendance_data", JSON.stringify(originalStudents));
        }
      } else {
        addToast("warning", "Apps Script URL belum terkonfigurasi. Perubahan disimpan di memori lokal.");
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans" id="imtihan-app-root">
      
      {/* Network offline/online status notice */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2 transition-all">
          <WifiOff className="w-4 h-4 animate-bounce" />
          <span>Anda Offline. Menggunakan simulasi lokal database secara otomatis.</span>
        </div>
      )}

      {/* Hero Header with deep brand-teal gradient */}
      <header className="bg-gradient-to-r from-teal-850 from-[#115e59] to-[#0f766e] text-white py-6 md:py-8 px-4 md:px-8 relative shadow-lg">
        
        {/* Subtle geometric pattern banner overlay */}
        <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-slate-100 to-teal-900 pointer-events-none" />

        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
          
          <div className="flex items-center gap-2.5 sm:gap-4 text-center sm:text-left">
            {/* Mosque Dome style dynamic launcher icon */}
            <div className="p-2 bg-white backdrop-blur-md rounded-2xl border border-white/25 shadow-inner w-14 h-14 flex items-center justify-center overflow-hidden">
              <img src="https://iili.io/C3rO9EX.png" alt="Logo" className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
            </div>
            
            <div>
              <span className="bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full select-none">
                WALI SANTRI QR CODE
              </span>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-1">
                YPP ASWAJ AMBUNTEN
              </h1>
              <p className="text-xs text-teal-200 mt-1 max-w-xl">
                e-Absensi Kartu Undangan Haflatul Imtihan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            
            {/* Sync Refresh Status indicator */}
            <button
              onClick={() => loadStudentData()}
              className="p-3 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 transition text-teal-200 hover:text-white rounded-2xl flex items-center justify-center"
              title="Perbarui Data dari Google Sheets"
              id="reload-database-btn"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
            </button>

            {/* Config Mode Tag */}
            <div className="hidden md:flex flex-col items-end px-3">
              <span className="text-[10px] text-teal-200 font-mono">DATABASE MODE:</span>
              <span className="text-xs font-semibold text-white flex items-center gap-1.5 mt-0.5 text-right font-mono">
                {config.mode === "demo" ? (
                  <>
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    Demo (Offline)
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                    Google Sheets
                  </>
                )}
              </span>
            </div>

            {/* Config Settings Button */}
            <button
              onClick={handleOpenSettingsClick}
              className="flex items-center gap-2 px-4 py-3 bg-white text-teal-900 border border-transparent font-semibold shadow-md rounded-2xl hover:bg-slate-50 hover:shadow-lg transition active:scale-95 text-xs"
              id="open-settings-modal-btn"
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
              Pengaturan
            </button>

          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
        
        {/* Dynamic Warning Alert if Live Sheet is active but Apps Script URL is missing */}
        {config.mode === "sheets" && !config.webAppUrl && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl max-w-5xl mx-auto flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1 text-xs">
              <h5 className="font-semibold text-amber-800">Peringatan: Apps Script URL Belum Terpasang</h5>
              <p className="text-amber-700 leading-normal">
                Mode Google Sheets aktif, tapi Apps Script URL kosong. Hanya bisa baca data. Atur di Pengaturan.
              </p>
            </div>
          </div>
        )}

        {/* Realtime Statistics Widgets */}
        <Statistics students={students} />

        {/* Quick Scan Big Buttons (Indonesian: Tombol Menu Utama) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" id="scan-triggers-grid">
          
          {/* Button 1: Scan Undangan Ayah */}
          <button
            onClick={() => handleScanClick("ayah")}
            className="group relative cursor-pointer overflow-hidden p-6 md:p-8 rounded-3xl bg-gradient-to-br from-[#0284c7] to-[#1e3a8a] text-white hover:to-[#1d4ed8] shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 text-left transition-all duration-300 flex flex-col justify-between min-h-[200px]"
            id="trigger-scan-ayah-btn"
          >
            {/* Background pattern */}
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-[0.06] text-white pointer-events-none">
              <User className="w-48 h-48" />
            </div>

            <div className="w-full">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <span className="text-[10px] bg-white/20 border border-white/25 text-white font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                    Undangan Ayah
                  </span>
                  <h3 className="text-xl font-extrabold tracking-tight flex items-center gap-2 text-white">
                    Scan Undangan Ayah
                  </h3>
                </div>
                
                {/* Big colored round icon placeholder */}
                <div className="w-14 h-14 bg-white/10 text-white rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-[#1e3a8a] transition-all duration-300 shadow-sm border border-white/20">
                  <QrCode className="w-6 h-6" />
                </div>
              </div>

              <p className="text-xs text-sky-100/90 leading-normal mt-4 max-w-sm">
                Pindai QR code undangan khusus ayah
              </p>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-amber-300 hover:text-white font-bold mt-6 group-hover:translate-x-1 transition-all">
              <span>Buka Kamera Scan</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* Button 2: Scan Undangan Ibu */}
          <button
            onClick={() => handleScanClick("ibu")}
            className="group relative cursor-pointer overflow-hidden p-6 md:p-8 rounded-3xl bg-gradient-to-br from-[#db2777] to-[#881337] text-white hover:to-[#9d174d] shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 text-left transition-all duration-300 flex flex-col justify-between min-h-[200px]"
            id="trigger-scan-ibu-btn"
          >
            {/* Background pattern */}
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-[0.06] text-white pointer-events-none">
              <Heart className="w-48 h-48" />
            </div>

            <div className="w-full">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <span className="text-[10px] bg-white/20 border border-white/25 text-white font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                    Undangan Ibu
                  </span>
                  <h3 className="text-xl font-extrabold tracking-tight flex items-center gap-2 text-white">
                    Scan Undangan Ibu
                  </h3>
                </div>

                {/* Big colored round icon placeholder */}
                <div className="w-14 h-14 bg-white/10 text-white rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-[#881337] transition-all duration-300 shadow-sm border border-white/20">
                  <QrCode className="w-6 h-6" />
                </div>
              </div>

              <p className="text-xs text-rose-100/90 leading-normal mt-4 max-w-sm">
                Pindai QR code undangan khusus ibu
              </p>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-amber-300 hover:text-white font-bold mt-6 group-hover:translate-x-1 transition-all">
              <span>Buka Kamera Scan</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

        </div>

        {/* Master Student Data Grid and presence lists */}
        <StudentTable
          students={students}
          onManualCheckIn={handleManualCheckInOverride}
          onResetAllData={handleResetDemoData}
          isLoading={isLoading}
          appMode={config.mode}
        />

      </main>

      {/* Footer copyright */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-6 px-4 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="font-mono">
            YPP ASWAJ AMBUNTEN © 2026
          </p>
          <p className="text-[10px] text-slate-400 font-mono">
            Optimized for Android OS • Powered by Google AI Studio
          </p>
        </div>
      </footer>

      {/* MODAL 1: QR CODE LIVE CAMERA SCANNER */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleQRDetected}
        mode={scanMode}
        isPaused={scannedResult !== null || scanError !== null}
      />

      {/* MODAL 2: SETTINGS CONFIGURE DB & SHEETS */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
      />

      {/* MODAL 3: SCAN VALDIATION SUCCESS RESULT SCREEN */}
      {scannedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setScannedResult(null)}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className={`relative w-full max-w-md border rounded-3xl overflow-hidden shadow-2xl ${
              scannedResult.alreadyCheckedIn 
                ? "bg-slate-900 border-amber-800"
                : "bg-white border-slate-200"
            }`}
            id="scan-result-card"
          >
            {/* Header Result */}
            <div className={`px-6 py-5 flex items-center gap-3 border-b ${
              scannedResult.alreadyCheckedIn 
                ? "bg-amber-950/40 border-slate-800"
                : "bg-teal-50 border-teal-100"
            }`}>
              <div className={`p-2 rounded-2xl ${
                scannedResult.alreadyCheckedIn 
                  ? "bg-amber-950 border border-amber-800/60 text-amber-500" 
                  : "bg-teal-100/60 border border-teal-200 text-teal-600"
              }`}>
                {scannedResult.alreadyCheckedIn ? <AlertCircle className="w-6 h-6" /> : <Check className="w-6 h-6" />}
              </div>
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  scannedResult.alreadyCheckedIn ? "text-amber-400" : "text-teal-600"
                }`}>
                  {scannedResult.alreadyCheckedIn ? "Peringatan Duplikasi!" : "QR Code Ditemukan"}
                </span>
                <h4 className={`text-sm font-bold ${
                  scannedResult.alreadyCheckedIn ? "text-slate-100" : "text-slate-900"
                }`}>
                  {scannedResult.alreadyCheckedIn ? "Undangan Sudah Absen" : "Verifikasi Data Wali"}
                </h4>
              </div>
            </div>

            {/* Validation Student Details Card Body */}
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <span className="text-slate-400">Nama Siswa:</span>
                  <span className={`col-span-2 font-bold ${
                    scannedResult.alreadyCheckedIn ? "text-slate-150 text-slate-100" : "text-slate-900"
                  }`}>
                    {scannedResult.student.namaSiswa}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <span className="text-slate-400">Kelas:</span>
                  <span className={`col-span-2 font-semibold ${
                    scannedResult.alreadyCheckedIn ? "text-slate-350" : "text-slate-700"
                  }`}>
                    {scannedResult.student.kelas}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 text-xs">
                  <span className="text-slate-400">Jenis Wali:</span>
                  <span className="col-span-2 font-semibold uppercase font-mono tracking-wider text-teal-500">
                    Undangan {scannedResult.mode === "ayah" ? "Ayah (Walimad)" : "Ibu (Wali)"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 text-xs">
                  <span className="text-slate-400">Kode Unik:</span>
                  <span className="col-span-2 font-mono text-xs select-all text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/25 w-fit">
                    {scannedResult.code}
                  </span>
                </div>
              </div>

              {/* Duplicate check timestamps */}
              {scannedResult.alreadyCheckedIn && (
                <div className="p-3 bg-amber-950/40 border border-amber-900 rounded-2xl text-xs space-y-1">
                  <span className="text-slate-500 font-mono text-[10px] block uppercase tracking-wide">
                    TERCATAT SEBELUMNYA:
                  </span>
                  <p className="text-amber-400 font-semibold font-mono">
                    {scannedResult.existingTimestamp}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Bottom Controls */}
            <div className={`px-6 py-4 flex justify-end gap-2.5 border-t ${
              scannedResult.alreadyCheckedIn ? "border-slate-800 bg-slate-950/20" : "border-slate-100 bg-slate-50"
            }`}>
              <button
                onClick={() => setScannedResult(null)}
                className={`px-4 py-2 hover:bg-slate-800 rounded-xl text-xs font-semibold ${
                  scannedResult.alreadyCheckedIn ? "text-slate-400 hover:text-slate-100" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
                id="cancel-attendance-btn"
              >
                {scannedResult.alreadyCheckedIn ? "Tutup" : "Batal"}
              </button>
              
              {!scannedResult.alreadyCheckedIn && (
                <button
                  onClick={handleConfirmAttendance}
                  className="px-5 py-2.5 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-xl text-xs font-bold shadow-md border border-teal-500 active:scale-95 transition"
                  id="confirm-attendance-btn"
                >
                  ✅ Simpan Kehadiran
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL 4: INVALID QR CODE / ERROR CODE DISPLAY */}
      {scanError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setScanError(null)}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="relative w-full max-w-sm bg-slate-900 border border-rose-950 rounded-3xl overflow-hidden shadow-2xl"
            id="scan-error-card"
          >
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-rose-950 border border-rose-900/50 text-rose-500 rounded-full flex justify-center items-center mx-auto mb-2 animate-bounce">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-base">QR Tidak Ditemukan</h3>
                <p className="text-xs text-rose-400 mt-1 select-all font-mono py-1 rounded bg-rose-950/40 border border-rose-950">
                  {scanError.code}
                </p>
                <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                  {scanError.message}
                </p>
              </div>
            </div>

            <div className="px-6 py-4 flex gap-2 border-t border-slate-800 bg-slate-950/25">
              <button
                onClick={() => setScanError(null)}
                className="flex-1 px-4 py-2 hover:bg-slate-800 text-slate-400 rounded-xl hover:text-slate-200 text-xs font-semibold transition"
                id="close-error-card-btn"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  const savedMode = scanError.mode;
                  setScanError(null);
                  handleScanClick(savedMode);
                }}
                className="flex-1 px-4 py-2.5 bg-rose-700 hover:bg-rose-600 border border-rose-600 text-white rounded-xl text-xs font-bold active:scale-95 transition"
                id="rescan-err-btn"
              >
                Pindai Ulang
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* PASSWORD PROMPT MODAL FOR CONFIG SECURITY */}
      {isPasswordPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setIsPasswordPromptOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="relative w-full max-w-sm bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl space-y-4"
            id="password-prompt-card"
          >
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-teal-50 text-[#0f766e] rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Settings className="w-6 h-6 animate-spin-slow" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">
                Akses Terproteksi
              </h3>
              <p className="text-xs text-slate-500">
                Masukkan kata sandi panitia untuk membuka Pengaturan Database.
              </p>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (passwordInput === "Bismillah") {
                  setIsPasswordPromptOpen(false);
                  setIsSettingsOpen(true);
                } else {
                  setPasswordError(true);
                  triggerErrorVibration();
                  playErrorSound();
                }
              }}
              className="space-y-3"
            >
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (passwordError) setPasswordError(false);
                }}
                placeholder="Kata sandi..."
                autoFocus
                className={`w-full text-center text-sm bg-slate-50 border rounded-xl px-4 py-3 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20 transition ${
                  passwordError ? "border-rose-300 ring-2 ring-rose-50" : "border-slate-200 focus:border-[#0f766e]"
                }`}
              />
              
              {passwordError && (
                <p className="text-[10px] text-center text-rose-600 font-bold">
                  Kata sandi salah! Gunakan sandi khusus panitia.
                </p>
              )}

              <div className="flex gap-2 text-xs font-bold pt-1">
                <button
                  type="button"
                  onClick={() => setIsPasswordPromptOpen(false)}
                  className="flex-1 py-2.5 hover:bg-slate-50 text-slate-500 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#0f766e] hover:bg-[#0f766e]/90 text-white rounded-xl active:scale-95 transition shadow-sm"
                >
                  Buka Akses
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Global slide-up Toast list */}
      <ToastContainer toasts={toasts} onRemove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

    </div>
  );
}
