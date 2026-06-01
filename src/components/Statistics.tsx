import { StudentData } from "../types";
import { Users, UserCheck, Clock, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";

interface StatisticsProps {
  students: StudentData[];
}

export default function Statistics({ students }: StatisticsProps) {
  const totalStudents = students.length;

  // Calculate separate check-ins
  const presentAyah = students.filter((s) => s.kehadiranAyah && s.kehadiranAyah.trim() !== "").length;
  const presentIbu = students.filter((s) => s.kehadiranIbu && s.kehadiranIbu.trim() !== "").length;
  
  // Total possible invitations = 2 per student (one Father, one Mother)
  const totalInvitations = totalStudents * 2;
  const totalPresent = presentAyah + presentIbu;
  const totalAbsent = totalInvitations - totalPresent;

  // Percentage calculations
  const presentPercent = totalInvitations > 0 ? Math.round((totalPresent / totalInvitations) * 100) : 0;
  const ayahPercent = totalStudents > 0 ? Math.round((presentAyah / totalStudents) * 100) : 0;
  const ibuPercent = totalStudents > 0 ? Math.round((presentIbu / totalStudents) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="stats-container">
      
      {/* CARD 1: TOTAL SISWA (Total Data) */}
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="bg-white border border-slate-100/90 rounded-3xl p-6 shadow-sm relative overflow-hidden"
        id="stat-total-data"
      >
        <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-[0.02] text-teal-600">
          <Users className="w-32 h-32" />
        </div>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Data Siswa
            </span>
            <h4 className="text-3xl font-black text-slate-800 font-sans tracking-tight">
              {totalStudents}
            </h4>
            <p className="text-[11px] text-slate-400">
              Siswa terdaftar di database
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl text-[#0f766e]">
            <Users className="w-6 h-6" />
          </div>
        </div>
        {/* Subtle decorative baseline */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
          <div className="bg-[#0f766e] h-full rounded-full w-full" />
        </div>
      </motion.div>

      {/* CARD 2: TOTAL HADIR */}
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="bg-white border border-slate-100/90 rounded-3xl p-6 shadow-sm relative overflow-hidden"
        id="stat-total-hadir"
      >
        <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-[0.02] text-emerald-600">
          <UserCheck className="w-32 h-32" />
        </div>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Wali Santri Hadir
            </span>
            <div className="flex items-baseline gap-2">
              <h4 className="text-3xl font-black text-[#0f766e] tracking-tight">
                {totalPresent}
              </h4>
              <span className="text-xs text-slate-400 font-semibold font-mono">
                / {totalInvitations} ({presentPercent}%)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
              <span className="text-[#0f766e] font-semibold">Ayah: {presentAyah} ({ayahPercent}%)</span>
              <span className="text-slate-300">•</span>
              <span className="text-amber-600 font-semibold">Ibu: {presentIbu} ({ibuPercent}%)</span>
            </p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
        
        {/* Combined Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden flex">
          <div 
            style={{ width: `${(presentAyah / totalInvitations) * 100}%` }} 
            className="bg-[#0f766e] h-full rounded-l-full transition-all duration-500" 
            title={`Ayah: ${presentAyah}`}
          />
          <div 
            style={{ width: `${(presentIbu / totalInvitations) * 100}%` }} 
            className="bg-amber-500 h-full rounded-r-full transition-all duration-500" 
            title={`Ibu: ${presentIbu}`}
          />
        </div>
      </motion.div>

      {/* CARD 3: BELUM HADIR */}
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="bg-white border border-slate-100/90 rounded-3xl p-6 shadow-sm relative overflow-hidden"
        id="stat-belum-hadir"
      >
        <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-[0.02] text-amber-600">
          <Clock className="w-32 h-32" />
        </div>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Belum Hadir
            </span>
            <h4 className="text-3xl font-black text-amber-600 tracking-tight">
              {totalAbsent}
            </h4>
            <p className="text-[11px] text-slate-400">
              Wali santri belum absen / dalam perjalanan
            </p>
          </div>
          <div className="p-4 bg-orange-50 rounded-2xl text-[#d97706]">
            <Clock className="w-6 h-6" />
          </div>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
          <div 
            style={{ width: `${(totalAbsent / totalInvitations) * 100}%` }}
            className="bg-[#d97706] h-full transition-all duration-500" 
          />
        </div>
      </motion.div>

    </div>
  );
}
