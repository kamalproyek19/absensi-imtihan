import { useState } from "react";
import { StudentData } from "../types";
import { Search, Filter, CheckCircle2, XCircle, Trash2, Edit3, HelpCircle, Download, RefreshCw, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

interface StudentTableProps {
  students: StudentData[];
  onManualCheckIn: (no: number, mode: "ayah" | "ibu", isCheckIn: boolean) => void;
  onResetAllData?: () => void;
  isLoading: boolean;
  appMode: "demo" | "sheets";
}

// Helper function to format any messy date string into standard DD-MM-YY HH:mm:ss
const formatTimestampDisplay = (val: string | undefined | null): string => {
  if (!val || val.trim() === "") return "";
  
  const trimmed = val.trim();
  
  // If it's already in DD-MM-YY HH:mm:ss format
  if (/^\d{2}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  
  // Check if it's "Hadir - DD-MM-YY HH:mm:ss" or "Hadir - YYYY-MM-DD HH:mm:ss"
  if (trimmed.startsWith("Hadir - ")) {
    const rawTime = trimmed.replace("Hadir - ", "");
    const dateParsed = new Date(rawTime);
    if (!isNaN(dateParsed.getTime())) {
      const pad = (n: number) => n.toString().padStart(2, "0");
      const yr = dateParsed.getFullYear().toString().slice(-2);
      return `${pad(dateParsed.getDate())}-${pad(dateParsed.getMonth() + 1)}-${yr} ${pad(dateParsed.getHours())}:${pad(dateParsed.getMinutes())}:${pad(dateParsed.getSeconds())}`;
    }
    return rawTime;
  }

  // Try parsing any JS date representation (e.g. Mon Jun 01 2026...)
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const yr = parsed.getFullYear().toString().slice(-2);
    return `${pad(parsed.getDate())}-${pad(parsed.getMonth() + 1)}-${yr} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}:${pad(parsed.getSeconds())}`;
  }
  
  return trimmed;
};

export default function StudentTable({
  students,
  onManualCheckIn,
  onResetAllData,
  isLoading,
  appMode,
}: StudentTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("Semua");
  const [attendanceFilter, setAttendanceFilter] = useState<"semua" | "hadir_ayah" | "hadir_ibu" | "hadir_dua" | "belum_hadir">("semua");
  const [confirmManual, setConfirmManual] = useState<{ no: number; mode: "ayah" | "ibu"; state: boolean } | null>(null);

  // Extract unique classes
  const classes = ["Semua", ...Array.from(new Set(students.map((s) => s.kelas))).sort()];

  // Search and Filter records
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.namaSiswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.kodeUnikAyah.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.kodeUnikIbu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.kelas.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = selectedClass === "Semua" ? true : s.kelas === selectedClass;

    let matchesAttendance = true;
    const hasAyah = s.kehadiranAyah && s.kehadiranAyah.trim() !== "";
    const hasIbu = s.kehadiranIbu && s.kehadiranIbu.trim() !== "";

    if (attendanceFilter === "hadir_ayah") matchesAttendance = hasAyah;
    else if (attendanceFilter === "hadir_ibu") matchesAttendance = hasIbu;
    else if (attendanceFilter === "hadir_dua") matchesAttendance = hasAyah && hasIbu;
    else if (attendanceFilter === "belum_hadir") matchesAttendance = !hasAyah && !hasIbu;

    return matchesSearch && matchesClass && matchesAttendance;
  });

  // Export as CSV Report
  const handleExportCSV = () => {
    try {
      const headers = ["No", "Nama Siswa", "Kelas", "Kode Unik Ayah", "Kode Unik Ibu", "Kehadiran Ayah", "Kehadiran Ibu"];
      const rows = students.map((s) => [
        s.no,
        `"${s.namaSiswa.replace(/"/g, '""')}"`,
        `"${s.kelas.replace(/"/g, '""')}"`,
        s.kodeUnikAyah,
        s.kodeUnikIbu,
        s.kehadiranAyah ? `"${s.kehadiranAyah}"` : '""',
        s.kehadiranIbu ? `"${s.kehadiranIbu}"` : '""',
      ]);
      
      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
        + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Laporan_Absensi_Haflatul_Imtihan_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Gagal mengunduh CSV", e);
    }
  };

  const executeManualAction = () => {
    if (!confirmManual) return;
    onManualCheckIn(confirmManual.no, confirmManual.mode, confirmManual.state);
    setConfirmManual(null);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm" id="student-table-card">
      
      {/* Title Controls */}
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-800 text-base">
            Daftar Kehadiran Ortu/Wali
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencarian, filter data, dan ekspor pelaporan cetak
          </p>
        </div>
        <div className="flex gap-2.5">
          {appMode === "demo" && onResetAllData && (
            <button
              onClick={() => {
                if (window.confirm("Beneran ingin meriset ulang seluruh demo data kehadiran?")) {
                  onResetAllData();
                }
              }}
              className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-500 font-semibold px-3 py-1.5 rounded-xl border border-rose-100 bg-rose-50 active:scale-95 transition"
              id="reset-demo-btn"
              title="Reset data kehadiran ke semula"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Demo
            </button>
          )}

          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedClass("Semua");
              setAttendanceFilter("semua");
            }}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-800 font-semibold px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:scale-95 transition"
            id="reset-filter-btn"
            title="Reset pencarian dan semua filter"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            Reset
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs text-[#0f766e] hover:text-[#0f766e]/90 font-semibold px-3.5 py-1.5 rounded-xl border border-teal-100 bg-teal-50 active:scale-95 transition"
            id="export-csv-btn"
          >
            <Download className="w-3.5 h-3.5" />
            Laporan CSV
          </button>
        </div>
      </div>

      {/* Inputs / Filters panel */}
      <div className="p-6 bg-slate-50/30 border-b border-slate-100 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* SEARCH FIELD */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama, kelas, kode..."
              className="w-full text-xs pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 placeholder:text-slate-400 hover:border-slate-300 focus:outline-none focus:border-[#0f766e] transition focus:ring-1 focus:ring-[#0f766e]/20"
              id="search-input"
            />
          </div>

          {/* CLASS SELECTOR */}
          <div className="relative">
            <Filter className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full text-xs pl-10 pr-8 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 appearance-none focus:outline-none focus:border-[#0f766e] hover:border-slate-300 transition focus:ring-1 focus:ring-[#0f766e]/20"
              id="class-filter-select"
            >
              {classes.map((c) => (
                <option key={c} value={c}>
                  Kelas: {c}
                </option>
              ))}
            </select>
            <div className="absolute right-3.5 top-4 pointer-events-none w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-slate-400" />
          </div>

          {/* QUICK STAT FILTER */}
          <div className="relative">
            <select
              value={attendanceFilter}
              onChange={(e) => setAttendanceFilter(e.target.value as any)}
              className="w-full text-xs px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 appearance-none focus:outline-none focus:border-[#0f766e] hover:border-slate-300 transition focus:ring-1 focus:ring-[#0f766e]/20"
              id="attendance-filter-select"
            >
              <option value="semua">Status: Semua Kehadiran</option>
              <option value="hadir_ayah">Hadir: Undangan Ayah</option>
              <option value="hadir_ibu">Hadir: Undangan Ibu</option>
              <option value="hadir_dua">Hadir: Kedua Wali</option>
              <option value="belum_hadir">Status: Belum Hadir</option>
            </select>
            <div className="absolute right-3.5 top-4 pointer-events-none w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-slate-400" />
          </div>

        </div>
      </div>

      {/* Table Data View */}
      <div className="overflow-x-auto w-full custom-scrollbar">
        {isLoading ? (
          /* SKELETON LOADING STATE */
          <div className="p-8 space-y-4" id="table-skeleton-loading">
            {[1, 2, 3].map((val) => (
              <div key={val} className="flex gap-4 items-center animate-pulse">
                <div className="h-5 bg-slate-100 rounded w-10" />
                <div className="h-5 bg-slate-100 rounded w-1/3" />
                <div className="h-5 bg-slate-100 rounded w-16" />
                <div className="h-5 bg-slate-100 rounded w-24" />
                <div className="h-5 bg-slate-100 rounded w-24" />
              </div>
            ))}
          </div>
        ) : filteredStudents.length === 0 ? (
          /* EMPTY STATE */
          <div className="p-12 text-center space-y-3 bg-white" id="table-empty-state">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-slate-600 font-semibold text-sm">Data tidak ditemukan</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Tidak ada santri yang cocok dengan kriteria pencarian atau filter absensi terpilih.
            </p>
          </div>
        ) : (
          /* DATA TABLE */
          <table className="w-full text-left text-xs" id="santri-table">
            <thead className="bg-[#f8fafc] text-slate-500 border-b border-slate-100 uppercase font-bold font-mono tracking-wider">
              <tr>
                <th className="py-3 px-5 text-[10px] w-12">No</th>
                <th className="py-3 px-5 text-[10px]">Nama Siswa</th>
                <th className="py-3 px-5 text-[10px] w-28">Kelas</th>
                <th className="py-3 px-5 text-[10px]">Kehadiran Ayah</th>
                <th className="py-3 px-5 text-[10px]">Kehadiran Ibu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {filteredStudents.map((student) => {
                const isAyahHadir = student.kehadiranAyah && student.kehadiranAyah.trim() !== "";
                const isIbuHadir = student.kehadiranIbu && student.kehadiranIbu.trim() !== "";

                return (
                  <tr
                    key={student.no}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    {/* No */}
                    <td className="py-3.5 px-5 font-mono text-slate-400">
                      {student.no}
                    </td>

                    {/* Student Name */}
                    <td className="py-3.5 px-5">
                      <div>
                        <div className="font-bold text-slate-800">{student.namaSiswa}</div>
                        <div className="flex gap-2 text-[10px] text-slate-400 mt-1 select-all font-mono">
                          <span>Ayah: <span className="text-slate-600 font-medium">{student.kodeUnikAyah}</span></span>
                          <span className="text-slate-200">|</span>
                          <span>Ibu: <span className="text-slate-600 font-medium">{student.kodeUnikIbu}</span></span>
                        </div>
                      </div>
                    </td>

                    {/* Class */}
                    <td className="py-3.5 px-5 font-bold text-slate-500">
                      {student.kelas}
                    </td>

                    {/* Father Presence */}
                    <td className="py-3.5 px-5">
                      <div className="flex flex-col gap-1">
                        {isAyahHadir ? (
                          <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 w-fit font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
                            <span className="text-[10px] font-mono leading-none">
                              {formatTimestampDisplay(student.kehadiranAyah)}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 w-fit">
                            <XCircle className="w-3.5 h-3.5 flex-shrink-0 text-slate-300" />
                            <span className="text-[10px] font-mono leading-none">Belum Hadir</span>
                          </div>
                        )}
                        
                        {/* Quick switch to manual override Father */}
                        <button
                          onClick={() => setConfirmManual({
                            no: student.no,
                            mode: "ayah",
                            state: !isAyahHadir
                          })}
                          className="text-[9px] text-[#0f766e] hover:text-[#0f765e]/80 font-bold tracking-wide mt-1 text-left w-fit cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                          {isAyahHadir ? "Reset Kehadiran" : "Set Hadir Manual"}
                        </button>
                      </div>
                    </td>

                    {/* Mother Presence */}
                    <td className="py-3.5 px-5">
                      <div className="flex flex-col gap-1">
                        {isIbuHadir ? (
                          <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 w-fit font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
                            <span className="text-[10px] font-mono leading-none">
                              {formatTimestampDisplay(student.kehadiranIbu)}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 w-fit">
                            <XCircle className="w-3.5 h-3.5 flex-shrink-0 text-slate-300" />
                            <span className="text-[10px] font-mono leading-none">Belum Hadir</span>
                          </div>
                        )}

                        {/* Quick switch to manual override Mother */}
                        <button
                          onClick={() => setConfirmManual({
                            no: student.no,
                            mode: "ibu",
                            state: !isIbuHadir
                          })}
                          className="text-[9px] text-[#0f766e] hover:text-[#0f766e]/80 font-bold tracking-wide mt-1 text-left w-fit cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                          {isIbuHadir ? "Reset Kehadiran" : "Set Hadir Manual"}
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirmation Modal for Manual Check In Overrides */}
      {confirmManual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setConfirmManual(null)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-sm bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-sm">
                  Konfirmasi Perubahan Status
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Apakah Anda yakin ingin mengubah kehadiran manual untuk{" "}
                  <strong>
                    {students.find((s) => s.no === confirmManual.no)?.namaSiswa}
                  </strong>{" "}
                  sebagai <strong>{confirmManual.mode.toUpperCase()}</strong>?
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs font-bold pt-2">
              <button
                onClick={() => setConfirmManual(null)}
                className="px-4 py-2 hover:bg-slate-50 text-slate-500 rounded-xl transition"
                id="cancel-manual-btn"
              >
                Batal
              </button>
              <button
                onClick={executeManualAction}
                className="px-5 py-2 bg-[#0f766e] hover:bg-[#0f766e]/90 text-white rounded-xl active:scale-95 transition shadow-sm"
                id="confirm-manual-btn"
              >
                Ya, Simpan Status
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
