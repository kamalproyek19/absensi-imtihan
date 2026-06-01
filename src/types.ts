export interface StudentData {
  no: number;
  namaSiswa: string;
  kelas: string;
  kodeUnikAyah: string;
  kodeUnikIbu: string;
  kehadiranAyah: string; // "Hadir - YYYY-MM-DD HH:mm:ss" or empty
  kehadiranIbu: string; // "Hadir - YYYY-MM-DD HH:mm:ss" or empty
}

export interface AppConfig {
  spreadsheetId: string;
  apiKey: string;
  sheetName: string;
  webAppUrl: string; // For writing back to Google Sheets via Apps Script
  mode: "demo" | "sheets";
}

export type ScanMode = "ayah" | "ibu" | null;
