import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, RefreshCw, X, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  mode: "ayah" | "ibu" | null;
  isPaused: boolean;
}

export default function ScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  mode,
  isPaused,
}: ScannerModalProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [initLoading, setInitLoading] = useState(true);

  const qrCodeInstanceRef = useRef<Html5Qrcode | null>(null);
  const containerId = "qr-reader-element";

  // Prevent double scans during transition states
  const lastScannedTimeRef = useRef<number>(0);
  const lastScannedValueRef = useRef<string>("");
  const cameraStartTimeRef = useRef<number>(0);
  const scanningLockRef = useRef<boolean>(false);

  const isPausedRef = useRef(isPaused);
  const onScanSuccessRef = useRef(onScanSuccess);

  useEffect(() => {
    isPausedRef.current = isPaused;
    if (!isPaused && isOpen) {
      // Just resumed/unpaused! Reset locks, historical scan values, and warm-up delay
      scanningLockRef.current = false;
      lastScannedValueRef.current = "";
      cameraStartTimeRef.current = Date.now();
    }
  }, [isPaused, isOpen]);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  // Load cameras and prompt permissions
  useEffect(() => {
    if (!isOpen) return;

    setInitLoading(true);
    setErrorMessage("");
    setHasPermission(null);

    // Give short delay to ensure modal transitions compile beautifully
    const timer = setTimeout(() => {
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (devices && devices.length > 0) {
            setCameras(devices);
            setHasPermission(true);
            
            // Try selecting the back camera by default for scanner behavior
            const backCam = devices.find((device) =>
              device.label.toLowerCase().includes("back") ||
              device.label.toLowerCase().includes("rear") ||
              device.label.toLowerCase().includes("environment")
            );
            setActiveCameraId(backCam ? backCam.id : devices[0].id);
          } else {
            setHasPermission(false);
            setErrorMessage("Kamera tidak ditemukan di perangkat Anda.");
          }
          setInitLoading(false);
        })
        .catch((err) => {
          console.error("Camera detection error:", err);
          setHasPermission(false);
          setErrorMessage(
            "Gagal mengakses kamera. Pastikan izin kamera telah diberikan di browser."
          );
          setInitLoading(false);
        });
    }, 400);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]);

  // Start scanner when active camera changes or permission is obtained
  useEffect(() => {
    if (!isOpen || !activeCameraId || !hasPermission) return;

    startScanner(activeCameraId);

    return () => {
      stopScanner();
    };
  }, [isOpen, activeCameraId, hasPermission]);

  const startScanner = async (cameraId: string) => {
    setInitLoading(true);
    try {
      if (qrCodeInstanceRef.current) {
        await stopScanner();
      }

      const html5QrCode = new Html5Qrcode(containerId);
      qrCodeInstanceRef.current = html5QrCode;
      scanningLockRef.current = false;

      const config = {
        fps: 15,
        // Make selection square scalable
        qrbox: (width: number, height: number) => {
          const size = Math.min(width, height) * 0.70;
          return { width: Math.floor(size), height: Math.floor(size) };
        },
        aspectRatio: 1.0,
      };

      cameraStartTimeRef.current = Date.now();

      await html5QrCode.start(
        cameraId,
        config,
        (decodedText) => {
          // If paused (e.g. holding confirm status details or error popup dialog), ignore reading new scans
          if (isPausedRef.current) {
            return;
          }

          // Success callback
          const now = Date.now();
          
          // 1. Warm-up delay: ignore any frames read in the first 1.5 seconds of starting the scanner
          // This prevents immediate re-triggering of the failed QR code and gives the user time to swap cards.
          if (now - cameraStartTimeRef.current < 1500) {
            return;
          }

          // 2. Main lock & debounce check
          if (
            !scanningLockRef.current &&
            now - lastScannedTimeRef.current > 1500 // 1.5 seconds debounce
          ) {
            const cleanText = decodedText.trim();
            
            // 3. Prevent duplicate scan of the same code within 5 seconds
            if (cleanText === lastScannedValueRef.current && now - lastScannedTimeRef.current < 5000) {
              return;
            }

            lastScannedTimeRef.current = now;
            lastScannedValueRef.current = cleanText;
            scanningLockRef.current = true; // lock
            onScanSuccessRef.current(decodedText);
          }
        },
        () => {
          // Quiet error placeholder
        }
      );

      setIsScanning(true);
      setInitLoading(false);
    } catch (err: any) {
      console.error("Failed to start scanner:", err);
      // Clean up on fail
      setIsScanning(false);
      setInitLoading(false);
      setErrorMessage(
        `Gagal memulai pemindaian kamera: ${err?.message || "Eror tidak diketahui"}`
      );
    }
  };

  const stopScanner = async () => {
    if (qrCodeInstanceRef.current) {
      if (qrCodeInstanceRef.current.isScanning) {
        try {
          await qrCodeInstanceRef.current.stop();
        } catch (e) {
          console.error("Error stopping html5-qrcode standard flow", e);
        }
      }
      qrCodeInstanceRef.current = null;
    }
    setIsScanning(false);
    setTorchOn(false);
  };

  const toggleCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setActiveCameraId(cameras[nextIndex].id);
  };

  const toggleTorch = async () => {
    if (!qrCodeInstanceRef.current || !isScanning) return;
    
    try {
      const state = !torchOn;
      // Many mobile browsers support applying video tracks capabilities dynamically
      const track = qrCodeInstanceRef.current.toSupportType() ? 
        (qrCodeInstanceRef.current as any)._localSupportedConfig : null;
        
      // Programmatic flash toggle with html5-qrcode
      await qrCodeInstanceRef.current.applyVideoConstraints({
        advanced: [{ torch: state }] as any
      });
      setTorchOn(state);
    } catch (err) {
      console.warn("Torch / Senter tidak didukung pada browser ini.", err);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Transparent dark backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            stopScanner().then(onClose);
          }}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        {/* Scanner Content Container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative w-full max-w-md bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-2xl"
          id="scanner-box-container"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 bg-white flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Scan Undangan {mode === "ayah" ? "Ayah" : "Ibu"}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Dekatkan barcode/QR code ke kamera
              </p>
            </div>
            <button
              onClick={() => stopScanner().then(onClose)}
              className="p-1 px-2.5 py-2.5 rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              id="close-scanner-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scanner view port */}
          <div className="relative w-full aspect-square bg-slate-950 flex flex-col justify-center items-center">
            
            {/* Base div for html5-qrcode mount */}
            <div
              id={containerId}
              className="w-full h-full object-cover"
            />

            {/* Glowing borders around scan target overlay */}
            {isScanning && !initLoading && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                
                {/* Viewport Box overlay border */}
                <div className="relative w-[70%] h-[70%] border border-teal-550/30 rounded-xl flex items-center justify-center">
                  
                  {/* Laser line effect */}
                  <motion.div
                    animate={{ y: ["-95%", "95%"] }}
                    transition={{
                      repeat: Infinity,
                      repeatType: "reverse",
                      duration: 2.2,
                      ease: "easeInOut",
                    }}
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-md shadow-teal-500/50"
                  />

                  {/* Corner styling */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-teal-500 rounded-tl-xl" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-teal-500 rounded-tr-xl" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-teal-500 rounded-bl-xl" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-teal-500 rounded-br-xl" />
                </div>

                {/* Dark shading for outside the box */}
                <div className="absolute top-0 bottom-0 left-0 w-[15%] bg-slate-950/40" />
                <div className="absolute top-0 bottom-0 right-0 w-[15%] bg-slate-950/40" />
                <div className="absolute top-0 h-[15%] left-[15%] right-[15%] bg-slate-950/40" />
                <div className="absolute bottom-0 h-[15%] left-[15%] right-[15%] bg-slate-950/40" />
              </div>
            )}

            {/* Skeleton Loading & Loading indicators */}
            {initLoading && (
              <div className="absolute inset-0 bg-slate-950 flex flex-col justify-center items-center p-6 text-center">
                <RefreshCw className="w-12 h-12 text-[#0f766e] animate-spin mb-4" />
                <p className="text-slate-100 text-sm font-semibold">Inisialisasi Kamera...</p>
                <p className="text-xs text-slate-400 mt-1">Mengaktifkan kamera...</p>
              </div>
            )}

            {/* Permission / Error Screen */}
            {!initLoading && !isScanning && (
              <div className="absolute inset-0 bg-slate-950 flex flex-col justify-center items-center p-6 text-center">
                <CameraOff className="w-12 h-12 text-amber-500 mb-4" />
                <p className="text-slate-100 font-bold text-sm">
                  {hasPermission === false ? "Izin Kamera Dibutuhkan" : "Gagal Membuka Kamera"}
                </p>
                <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
                  {errorMessage || "Aktifkan izin kamera dan muat ulang halaman."}
                </p>
                
                <button
                  onClick={() => startScanner(activeCameraId)}
                  className="mt-5 text-xs font-bold tracking-wider text-teal-400 px-4 py-2 border border-teal-600/40 bg-teal-950/40 rounded-xl hover:bg-teal-900/40 active:scale-95 transition"
                  id="retry-camera-btn"
                >
                  Coba Hubungkan Kembali
                </button>
              </div>
            )}
          </div>

          {/* Quick controls underneath scanner */}
          <div className="bg-slate-50 px-6 py-5 border-t border-slate-100 flex justify-around items-center">
            
            {/* Swap Camera Button */}
            <button
              onClick={toggleCamera}
              disabled={cameras.length <= 1}
              className={`flex flex-col items-center gap-1.5 text-xs text-slate-500 transition hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed`}
              title="Ganti Kamera Depan/Belakang"
              id="switch-camera-btn"
            >
              <div className="p-3.5 bg-white rounded-2xl hover:bg-slate-100 border border-slate-200/60 flex justify-center items-center active:scale-95 transition shadow-sm text-slate-700">
                <RefreshCw className="w-5 h-5" />
              </div>
              <span className="font-semibold text-[10px]">Ganti Kamera ({cameras.length})</span>
            </button>

            {/* Light Flash/Torch Toggle Button */}
            <button
              onClick={toggleTorch}
              disabled={!isScanning}
              className={`flex flex-col items-center gap-1.5 text-xs text-slate-500 transition hover:text-slate-700 disabled:opacity-40`}
              title="Nyalakan Senter"
              id="toggle-torch-btn"
            >
              <div className={`p-3.5 rounded-2xl border flex justify-center items-center active:scale-95 transition shadow-sm ${
                torchOn 
                  ? "bg-amber-550 bg-amber-500 border-amber-500 text-white" 
                  : "bg-white border-slate-200/60 text-slate-700 hover:bg-slate-100"
              }`}>
                <Zap className="w-5 h-5" />
              </div>
              <span className="font-semibold text-[10px]">Senter ({torchOn ? "Aktif" : "Mati"})</span>
            </button>
          </div>

          {/* Disclaimer/Status */}
          <div className="px-6 py-3.5 bg-white border-t border-slate-100 flex text-center justify-center items-center text-[10px] text-slate-400 font-bold font-mono tracking-wide">
            MODE SCANNER: {mode?.toUpperCase()} • DETEKSI OTOMATIS AKTIF
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
