import { useState } from "react";
import { AppConfig } from "../types";
import { INSTRUCTIONS_ID } from "../data";
import { Save, Settings, Database, Cloud, HelpCircle, X, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onSaveConfig: (newConfig: AppConfig) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"config" | "instructions">("config");
  const [copied, setCopied] = useState(false);
  const [showSheetDetails, setShowSheetDetails] = useState(false);

  // Form State
  const [mode, setMode] = useState<"demo" | "sheets">(config.mode);
  const [spreadsheetId, setSpreadsheetId] = useState(config.spreadsheetId);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [sheetName, setSheetName] = useState(config.sheetName);
  const [webAppUrl, setWebAppUrl] = useState(config.webAppUrl);

  const handleSave = () => {
    onSaveConfig({
      mode,
      spreadsheetId: spreadsheetId.trim(),
      apiKey: apiKey.trim(),
      sheetName: sheetName.trim() || "Data",
      webAppUrl: webAppUrl.trim(),
    });
    onClose();
  };

  const handleCopyCode = () => {
    // Extract code block from instructions
    const codeRegex = /```javascript([\s\S]*?)```/;
    const match = INSTRUCTIONS_ID.match(codeRegex);
    if (match && match[1]) {
      navigator.clipboard.writeText(match[1].trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative w-full max-w-lg bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
          id="settings-modal"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-50 border border-teal-100 rounded-xl text-[#0f766e]">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">
                  Pengaturan Database
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Konfigurasi penyimpanan & integrasi Google Sheets
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 px-1.5 py-1.5 rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              id="close-settings-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-100 px-4 bg-slate-50/50">
            <button
              onClick={() => setActiveTab("config")}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all ${
                activeTab === "config"
                  ? "border-[#0f766e] text-[#0f766e]"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <Database className="w-4 h-4" />
              Koneksi
            </button>
            <button
              onClick={() => setActiveTab("instructions")}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all ${
                activeTab === "instructions"
                  ? "border-[#0f766e] text-[#0f766e]"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              Panduan Sheets
            </button>
          </div>

          {/* Content Pane */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-white">
            
            {activeTab === "config" && (
              <>
                {/* Database Mode Switcher */}
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Mode Penyimpanan
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {/* Demo Database Mode button */}
                    <button
                      onClick={() => setMode("demo")}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                        mode === "demo"
                          ? "bg-teal-55 bg-teal-50 border-[#0f766e] text-[#0f766e]"
                          : "bg-white border-slate-200 text-slate-500 hover:border-slate-350"
                      }`}
                    >
                      <Database className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Demo (Offline)</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Simulasi Local Storage</p>
                      </div>
                    </button>

                    {/* Google Sheets Mode button */}
                    <button
                      onClick={() => setMode("sheets")}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                        mode === "sheets"
                          ? "bg-teal-55 bg-teal-50 border-[#0f766e] text-[#0f766e]"
                          : "bg-white border-slate-200 text-slate-500 hover:border-slate-350"
                      }`}
                    >
                      <Cloud className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Google Sheets (Online)</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Integrasi Sinkronisasi Realtime</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Form fields */}
                {mode === "sheets" ? (
                  <div className="space-y-4">
                    {/* Google Sheets Web App URL - RECOMMENDED for write */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                        Apps Script Web App URL
                        <span className="text-emerald-700 text-[10px] lowercase normal-case bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-semibold">direkomendasikan</span>
                      </label>
                      <input
                        type="url"
                        value={webAppUrl}
                        onChange={(e) => setWebAppUrl(e.target.value)}
                        placeholder="https://script.google.com/macros/s/.../exec"
                        className="w-full text-xs bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-[#0f766e] transition font-mono placeholder:text-slate-400 focus:ring-1 focus:ring-[#0f766e]/20"
                      />
                      <p className="text-[10px] text-slate-400 leading-normal font-sans">
                        Dihasilkan dari langkah Apps Script agar kehadiran bisa ditulis balik ke Sheet secara aman dari HP.
                      </p>
                    </div>

                    {/* Show Advance Details Toggle */}
                    <button
                      onClick={() => setShowSheetDetails(!showSheetDetails)}
                      className="text-xs text-[#0f766e] hover:text-[#0f766e]/90 font-bold flex items-center gap-1.5 py-1"
                    >
                      {showSheetDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {showSheetDetails ? "Sembunyikan Pengaturan API Langsung" : "Tampilkan Pengaturan API Langsung (Hanya Membaca)"}
                    </button>

                    {showSheetDetails && (
                      <div className="space-y-4 p-4 border border-slate-100 bg-slate-50 rounded-2xl animate-fadeIn">
                        {/* Spreadsheet ID */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                            Spreadsheet ID
                          </label>
                          <input
                            type="text"
                            value={spreadsheetId}
                            onChange={(e) => setSpreadsheetId(e.target.value)}
                            placeholder="Contoh: 1a2b3c4d5e6f7g8h9i0j..."
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-[#0f766e] transition font-mono placeholder:text-slate-400 focus:ring-1 focus:ring-[#0f766e]/20"
                          />
                          <p className="text-[10px] text-slate-400 leading-normal font-sans">
                            Dapat disalin dari URL browser file Google Sheet Anda: 
                            <span className="text-slate-500 select-all font-mono font-semibold"> d/&lt;Spreadsheet_ID&gt;/edit</span>.
                          </p>
                        </div>

                        {/* Google API Key */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                            Google Cloud API Key
                          </label>
                          <input
                            type="text"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="AIzaSy..."
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-[#0f766e] transition font-mono placeholder:text-slate-400 focus:ring-1 focus:ring-[#0f766e]/20"
                          />
                        </div>

                        {/* Sheet Name */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                            Nama Tab Sheet
                          </label>
                          <input
                            type="text"
                            value={sheetName}
                            onChange={(e) => setSheetName(e.target.value)}
                            placeholder="Contoh: Data"
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-[#0f766e] transition font-mono placeholder:text-slate-400 focus:ring-1 focus:ring-[#0f766e]/20"
                          />
                          <p className="text-[10px] text-slate-400 font-bold font-mono">
                            Default: Data (sensitif terhadap huruf kapital)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-5 bg-slate-50 border border-slate-100 border-dashed rounded-2xl text-center space-y-2">
                    <Database className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-700 font-bold">Bekerja Offline (Mode Simulasi)</p>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-normal font-sans">
                      Aplikasi menggunakan basis data lokal yang tersimpan di memori browser. Anda dapat melakukan scan, mencatat kehadiran, dan mengatur data sesuka hati. Cocok untuk demo cepat tanpa setup Spreadsheet!
                    </p>
                  </div>
                )}
              </>
            )}

            {activeTab === "instructions" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-150">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    Kode Apps Script Tulis Data
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 text-xs text-[#0f766e] hover:text-[#0f766e]/90 bg-teal-50 border border-teal-100 px-3 py-1.5 rounded-lg active:scale-95 transition font-semibold"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Salin Kode
                      </>
                    )}
                  </button>
                </div>

                <div className="text-slate-600 text-xs leading-relaxed space-y-4 font-sans border-t border-slate-100 pt-3">
                  <p className="font-bold text-[#d97706]">💡 Cara Mengintegrasikan:</p>
                  <ol className="list-decimal list-inside space-y-2.5 text-slate-500">
                    <li>Buka Google Sheet yang ingin Anda gunakan.</li>
                    <li>Klik <strong>Ekstensi/Extensions</strong> &gt; <strong>Apps Script</strong>.</li>
                    <li>Salin kode di atas dengan mengklik tombol <strong>Salin Kode</strong> dan tempel di editor Google Script.</li>
                    <li>Klik tombol <strong>Terapkan/Deploy</strong> &gt; <strong>Penerapan baru/New deployment</strong>.</li>
                    <li>Pilih tipe <strong>Web app/Aplikasi Web</strong> (ikon gerigi).</li>
                    <li>Ubah <em>"Akses/Who has access"</em> menjadi <strong>"Siapa saja/Anyone"</strong>. Klik Deploy.</li>
                    <li>Salin URL Web App yang disediakan Google, kembali ke tab <strong>Koneksi</strong>, aktifkan Mode Google Sheets, lalu paste ke kolom Apps Script URL!</li>
                  </ol>
                </div>
              </div>
            )}
            
          </div>

          {/* Footer Save / Close controls */}
          <div className="px-6 py-4.5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition rounded-xl"
              id="cancel-settings-btn"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#0f766e] hover:bg-[#0f766e]/90 rounded-xl shadow-md active:scale-95 transition"
              id="save-settings-btn"
            >
              <Save className="w-4 h-4" />
              Simpan Konfigurasi
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
