import { CheckCircle2, AlertOctagon, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning";
  text: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none" id="toast-container">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-2xl border shadow-xl ${
              t.type === "success"
                ? "bg-white border-emerald-150 border-emerald-100 text-emerald-800"
                : t.type === "error"
                ? "bg-white border-rose-150 border-rose-100 text-rose-800"
                : "bg-white border-slate-150 border-slate-100 text-slate-700"
            }`}
          >
            <div className="flex items-center gap-3">
              {t.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              ) : (
                <AlertOctagon className="w-5 h-5 text-rose-500 flex-shrink-0" />
              )}
              <span className="text-xs font-bold leading-normal">{t.text}</span>
            </div>
            
            <button
              onClick={() => onRemove(t.id)}
              className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition"
              id={`remove-toast-${t.id}`}
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
