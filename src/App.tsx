/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import jsQR from 'jsqr';
import { 
  Library, 
  QrCode, 
  RotateCcw, 
  List, 
  User, 
  ArrowLeft,
  Search,
  BookOpen,
  Database,
  CheckCircle2,
  XCircle,
  Book
} from 'lucide-react';
import { cn } from './lib/utils';

type ViewState = 'HOME' | 'PINJAM' | 'KEMBALI' | 'KATALOG' | 'STAFF_LOGIN' | 'DASHBOARD';

export default function App() {
  const [view, setView] = useState<ViewState>('HOME');
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [remoteUrl, setRemoteUrl] = useState("");

  const handleLoginSuccess = (data: any) => {
    if (data.remoteUrl) setRemoteUrl(data.remoteUrl);
    setView('DASHBOARD');
  };

  useEffect(() => {
    const checkDb = async () => {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) setDbStatus('connected');
        else setDbStatus('checking'); // Less intrusive
      } catch (err) {
        setDbStatus('checking');
      }
    };
    checkDb();
  }, []);

  const renderView = () => {
    switch (view) {
      case 'HOME':
        return <HomeView onNavigate={setView} />;
      case 'PINJAM':
        return <ActionView title="Peminjaman Mandiri" onBack={() => setView('HOME')} type="PINJAM" />;
      case 'KEMBALI':
        return <ActionView title="Pengembalian Mandiri" onBack={() => setView('HOME')} type="KEMBALI" />;
      case 'KATALOG':
        return <KatalogView onBack={() => setView('HOME')} />;
      case 'STAFF_LOGIN':
        return <StaffLoginView onBack={() => setView('HOME')} onLogin={handleLoginSuccess} />;
      case 'DASHBOARD':
        return <StaffDashboard onLogout={() => setView('HOME')} remoteUrl={remoteUrl} />;
      default:
        return <HomeView onNavigate={setView} />;
    }
  };

  return (
    <div className="h-screen w-screen bg-[#6366f1] bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] to-[#d946ef] p-2 md:p-4 lg:p-6 flex flex-col items-center justify-center font-sans overflow-hidden">
      <div className="w-full h-full max-w-7xl bg-white rounded-2xl md:rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col">
        {/* Header */}
        <header className="px-10 py-6 border-b border-gray-100 flex items-center justify-between no-print">
          <div 
            className={`flex items-center gap-3 group ${view !== 'DASHBOARD' ? 'cursor-pointer' : ''}`}
            onClick={() => {
              if (view !== 'DASHBOARD') setView('HOME');
            }}
          >
            <div className="bg-[#6366f1] p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
              <Library size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-800 tracking-tighter leading-none">ePustaka</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Sistem Perpustakaan Mandiri</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className={cn(
              "hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-colors",
              dbStatus === 'connected' ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"
            )}>
              <div className={cn("w-2 h-2 rounded-full", dbStatus === 'connected' ? "bg-green-500 animate-pulse" : "bg-orange-500")} />
              {dbStatus === 'connected' ? "System Online" : "Local Database Only"}
            </div>
            
            <button 
              onClick={() => {
                if (view !== 'DASHBOARD') setView('STAFF_LOGIN');
              }}
              disabled={view === 'DASHBOARD'}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all text-sm font-bold border ${view === 'DASHBOARD' ? 'bg-indigo-50 border-indigo-100 text-indigo-600 cursor-default opacity-80' : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-100'}`}
            >
              <User size={18} />
              {view === 'DASHBOARD' ? 'Admin' : 'Admin'}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-0 overflow-auto relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="h-full w-full p-8 flex flex-col"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          .h-screen, .w-screen { height: auto !important; width: auto !important; padding: 0 !important; background: none !important; overflow: visible !important; }
          .shadow-2xl, .shadow-xl, .shadow-lg { box-shadow: none !important; }
          .bg-white { background: white !important; }
          .rounded-2xl, .rounded-3xl, .md\\:rounded-3xl { border-radius: 0 !important; }
          
          /* Target specific QR container */
          .qr-print-only {
            display: block !important;
            position: absolute;
            top: 0;
            left: 0;
            width: 4cm;
            height: 6cm;
            border: 1px solid #eee;
            padding: 10px;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}

function HomeView({ onNavigate }: { onNavigate: (v: ViewState) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full max-w-5xl">
        <HomeCard 
          icon={<Book size={40} />} 
          title="Pinjam Buku" 
          onClick={() => onNavigate('PINJAM')} 
          delay={0.1}
        />
        <HomeCard 
          icon={<RotateCcw size={40} />} 
          title="Kembalikan Buku" 
          onClick={() => onNavigate('KEMBALI')} 
          delay={0.2}
        />
        <HomeCard 
          icon={<List size={40} />} 
          title="Katalog Buku" 
          onClick={() => onNavigate('KATALOG')} 
          delay={0.3}
        />
      </div>
    </div>
  );
}

function HomeCard({ icon, title, onClick, delay }: { icon: React.ReactNode, title: string, onClick: () => void, delay: number }) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="bg-white border-2 border-transparent hover:border-[#8b5cf6] p-8 rounded-[32px] shadow-lg hover:shadow-xl transition-all flex flex-col items-center gap-4 md:gap-6 group"
    >
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-gradient-to-br from-[#6366f1] to-[#a855f7] text-white flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-700 tracking-tight">{title}</h3>
    </motion.button>
  );
}

function ActionView({ title, onBack, type }: { title: string, onBack: () => void, type: 'PINJAM' | 'KEMBALI' }) {
  const [step, setStep] = useState(1);
  const [member, setMember] = useState<any>(null);
  const [book, setBook] = useState<any>(null);
  const [scannedBooks, setScannedBooks] = useState<any[]>([]);
  const [scannedInput, setScannedInput] = useState("");
  const [status, setStatus] = useState<'idle' | 'loading' | 'confirm' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const scannedCodesRef = useRef<Set<string>>(new Set());
  const [katalogBooks, setKatalogBooks] = useState<any[]>([]);
  const [activeLoans, setActiveLoans] = useState<any[]>([]);
  const [activeLoansFetched, setActiveLoansFetched] = useState(false);

  useEffect(() => {
    if (step === 2) {
      if (katalogBooks.length === 0) {
        fetch('/api/books').then(res => res.json()).then(setKatalogBooks).catch(() => {});
      }
      if (type === 'KEMBALI' && !activeLoansFetched && member) {
        setActiveLoansFetched(true);
        fetch('/api/transactions').then(res => res.json()).then(txs => {
          const userTx = (Array.isArray(txs) ? txs : []).filter(t => t.member_id === member.id && t.status === 'BERJALAN');
          setActiveLoans(userTx);
        }).catch(() => {});
      }
    }
  }, [step, type, member, activeLoansFetched]);

  const processQrCode = async (input: string) => {
    if (isProcessing || status === 'loading') return;
    if (scannedCodesRef.current.has(input)) return;

    if (type === 'PINJAM') {
      const maxAllowed = member?.max_borrow_limit ?? 5;
      const activeBorrows = member?.active_borrows ?? 0;
      if (scannedBooks.length + activeBorrows >= maxAllowed) {
         setMessage(`Maksimal meminjam ${maxAllowed} buku! (Sedang dipinjam: ${activeBorrows})`);
         setStatus('error');
         setTimeout(() => { setStatus('idle'); setMessage(''); }, 3000);
         return;
      }
    }
    
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/books/${input}`);
      if (res.ok) {
        const bookData = await res.json();
        
        // Double check availability
        if (type === 'PINJAM' && bookData.available_copies <= 0) {
           setMessage("Buku sedang tidak tersedia (habis).");
           setStatus('error');
           setTimeout(() => { setStatus('idle'); setMessage(''); }, 3000);
           setIsProcessing(false);
           return;
        }

        // Check if user actually borrowed this book when returning
        if (type === 'KEMBALI') {
           const isBorrowed = activeLoans.some(t => t.book_id === bookData.id);
           if (!isBorrowed) {
              setMessage("Buku ini tidak sedang Anda pinjam.");
              setStatus('error');
              setTimeout(() => { setStatus('idle'); setMessage(''); }, 3000);
              setIsProcessing(false);
              return;
           }
        }

        scannedCodesRef.current.add(input);
        setScannedBooks(prev => {
           if (prev.some(b => b.qr_code === bookData.qr_code)) return prev;
           return [...prev, bookData];
        });
      } else {
        // Just briefly ignore or show a small toast, don't interrupt scanner
      }
    } catch (err) {
      // ignore
    }
    setTimeout(() => setIsProcessing(false), 500);
  };

  const confirmTransaction = async () => {
    if (scannedBooks.length === 0 || !member) return;
    setStatus('loading');
    let totalFine = 0;
    
    let successIds: number[] = [];
    let errors: string[] = [];

    for (const b of scannedBooks) {
      try {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            member_id: member.id,
            book_id: b.id,
            type: type
          })
        });
        const resData = await res.json();
        if(!res.ok) {
           throw new Error(resData.error || `Gagal: ${b.title}`);
        }
        if (resData.fine) totalFine += resData.fine;
        successIds.push(b.id);
      } catch (err: any) {
        errors.push(err.message);
      }
    }

    if (errors.length > 0 && successIds.length === 0) {
       setStatus('error');
       setMessage(errors[0]); // Show the first error
       setScannedBooks([]);
       scannedCodesRef.current.clear();
       setTimeout(() => setStatus('idle'), 3000);
       return;
    }

    if (errors.length > 0) {
       setStatus('error');
       setMessage(`Berhasil sebagian. Error: ${errors[0]}`);
       setScannedBooks([]);
       scannedCodesRef.current.clear();
       setTimeout(() => setStatus('idle'), 4000);
       return;
    }

    // All successful
    setStatus('success');
    let successMessage = type === 'PINJAM' ? `Berhasil meminjam ${scannedBooks.length} buku!` : `Berhasil mengembalikan ${scannedBooks.length} buku!`;
    if (totalFine > 0) successMessage += ` Denda: Rp ${totalFine.toLocaleString('id-ID')}`;
    setMessage(successMessage);
  };

  const processRfid = async (input: string) => {
    if (status === 'loading') return;
    setStatus('loading');
    try {
      const res = await fetch(`/api/members/${input}`);
      if (res.ok) {
        const data = await res.json();
        setMember(data);
        setStep(2);
        setStatus('idle');
        setMessage("");
      } else {
        setStatus('error');
        setMessage("Kartu tidak terdaftar!");
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch (err) {
      setStatus('error');
      setMessage("Terjadi kesalahan koneksi");
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  // RFID scanners usually act as keyboards. We listen for 'Enter' key.
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Ignore keyboard if not idle
      if (status !== 'idle') return;

      if (e.key === 'Enter') {
        const input = scannedInput.trim();
        if (!input) return;

        setScannedInput("");

        if (step === 1) {
          processRfid(input);
        } else {
          // If we receive arbitrary keyboard enter at step 2, assume it's scanner
          processQrCode(input);
        }
      } else if (e.key.length === 1) {
        setScannedInput(prev => prev + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scannedInput, step, member, type, status, onBack]);

  // Polling for RFID scans
  useEffect(() => {
    const interval = setInterval(() => {
      if (step !== 1 || status !== 'idle') return;
      fetch('/api/rfid/consume', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (data && data.uid) {
            if (step === 1 && status === 'idle') {
              processRfid(data.uid);
            }
          }
        })
        .catch(() => {});
    }, 1000);
    
    return () => clearInterval(interval);
  }, [step, status]);

  // JSQR Scanner integration
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animationFrameId: number;
    let localStream: MediaStream | null = null;
    let isActive = true;

    if (step === 2 && status === 'idle') {
      const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          localStream = stream;
          if (videoRef.current && isActive) {
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute("playsinline", "true"); // required to tell iOS safari we don't want fullscreen
            await videoRef.current.play();
            requestAnimationFrame(tick);
          }
        } catch (err) {
          console.warn("Error accessing camera:", err);
        }
      };

      let lastScanTime = 0;
      const tick = (time: number) => {
        if (!isActive || status !== 'idle') return;
        
        if (time - lastScanTime > 300) {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            if (canvas && video.videoWidth > 0 && video.videoHeight > 0) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext("2d", { willReadFrequently: true });
              if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                  inversionAttempts: "attemptBoth",
                });
                
                if (code && code.data && code.data.trim() !== '') {
                  // Ensure only non-empty strings are sent
                  processQrCode(code.data);
                }
              }
            }
          }
          lastScanTime = time;
        }
        animationFrameId = requestAnimationFrame(tick);
      };

      startCamera();
    }

    return () => {
      isActive = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [step, status]);

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-4 mb-4 md:mb-8">
        <button onClick={onBack} className="p-2 bg-indigo-50 hover:bg-indigo-100 rounded-full text-indigo-600 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      </div>

      <div className="flex-1 flex flex-col items-center pt-2 pb-6 text-center max-w-2xl mx-auto w-full overflow-y-auto px-1">
        {status === 'success' || status === 'confirm' ? (
          <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex flex-col items-center w-full max-w-sm pt-4 pb-2">
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center mb-4",
              status === 'success' ? "bg-green-100 text-green-600" : "bg-indigo-100 text-indigo-600"
            )}>
              {status === 'success' ? <CheckCircle2 size={48} /> : <BookOpen size={48} />}
            </div>
            <h3 className="text-xl font-black text-gray-800">
              {status === 'success' ? message : `Konfirmasi ${type === 'PINJAM' ? 'Peminjaman' : 'Pengembalian'}`}
            </h3>
            
            {member && scannedBooks.length > 0 && (
               <div className="mt-4 w-full max-w-sm text-left">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Detail Transaksi</span>
                  </div>
                  <div className="mb-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Peminjam</p>
                    <p className="text-sm font-bold text-gray-800 truncate mt-0.5">{member.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Buku ({scannedBooks.length})</p>
                    <ul className="flex flex-col gap-1.5 max-h-32 overflow-y-auto w-full">
                      {scannedBooks.map((b, i) => (
                        <li key={i} className="text-xs font-bold text-gray-700 truncate border-l-2 border-indigo-200 pl-3">{b.title}</li>
                      ))}
                    </ul>
                  </div>
               </div>
            )}

            {status === 'confirm' ? (
              <div className="w-full max-w-sm flex items-center gap-3 mt-4">
                <button onClick={() => { setStatus('idle'); }} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                  Batal
                </button>
                <button onClick={confirmTransaction} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all active:scale-[0.98]">
                  Konfirmasi
                </button>
              </div>
            ) : (
              <div className="w-full mt-4 flex flex-col gap-2">
                <button onClick={() => { setStatus('idle'); setMessage(''); setScannedBooks([]); scannedCodesRef.current.clear(); setActiveLoans([]); setActiveLoansFetched(false); setMember(null); setStep(1); }} className="w-full py-3 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-colors">
                  Kembali ke Awal
                </button>
                <button onClick={() => { onBack(); setMessage(''); setScannedBooks([]); scannedCodesRef.current.clear(); setActiveLoans([]); setActiveLoansFetched(false); setMember(null); }} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-200">
                    Selesai
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="w-full flex-1 flex flex-col justify-center items-center py-4">
            {member && step === 2 && (
              <div className="flex items-center gap-2 mb-2 bg-indigo-50/50 py-1.5 px-3 rounded-full border border-indigo-100 w-fit mx-auto">
                <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
                  <User size={12} />
                </div>
                <p className="text-xs font-bold text-gray-800">{member.name}</p>
              </div>
            )}

            <div className="w-full mb-4">
              <h3 className="text-lg font-black text-gray-800 tracking-tight">
                {message || (step === 1 ? "Tempel Kartu" : "Scan Buku")}
              </h3>
              <p className="text-gray-400 font-bold text-[11px] mt-0.5">
                {step === 1 
                  ? "Arahkan kartu ke sensor." 
                  : "Arahkan barcode buku ke kamera."}
              </p>
            </div>

            <div className="relative w-full flex flex-col sm:flex-row justify-center items-center sm:items-start gap-4 sm:gap-6 px-2 sm:px-4">
              {step === 1 || status !== 'idle' ? (
                <div className={cn(
                  "w-48 h-48 rounded-full border-4 flex items-center justify-center transition-all duration-300",
                  status === 'error' ? "border-red-500 bg-red-50" : 
                  status === 'loading' ? "border-blue-500 animate-spin border-t-transparent" : "border-dashed border-[#8b5cf6] animate-pulse"
                )}>
                  {status === 'loading' ? null : (
                    <div className={cn(
                      "w-40 h-40 rounded-full flex items-center justify-center",
                      status === 'error' ? "bg-red-100" : "bg-[#8b5cf6]/10"
                    )}>
                      {status === 'error' ? <XCircle size={64} className="text-red-500" /> : 
                       step === 1 ? <User size={64} className="text-[#8b5cf6]" /> : <BookOpen size={64} className="text-[#8b5cf6]" />}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full max-w-xs flex flex-col gap-3">
                  <div className="w-full overflow-hidden bg-black flex items-center justify-center aspect-square shadow-lg rounded-3xl">
                    <video ref={videoRef} className="w-full h-full object-cover"></video>
                    <canvas ref={canvasRef} className="hidden"></canvas>
                  </div>
                  
                  <div className="w-full flex justify-center">
                    <select 
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-bold text-gray-500 text-center appearance-none cursor-pointer"
                      onChange={(e) => {
                        if (e.target.value) {
                          processQrCode(e.target.value);
                          e.target.value = "";
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>--- Pilih manual ---</option>
                      {(type === 'PINJAM' ? katalogBooks : katalogBooks.filter(kb => activeLoans.some(t => t.book_id === kb.id))).map((kb: any) => (
                        <option key={kb.id} value={kb.qr_code} disabled={type === 'PINJAM' && kb.available_copies <= 0}>
                          {kb.title} {type === 'PINJAM' && kb.available_copies <= 0 ? '(Habis)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {scannedBooks.length > 0 && step === 2 && (
                <div className="w-full max-w-xs text-left bg-gray-50 p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full max-h-[350px]">
                  <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Buku Dipindai ({scannedBooks.length})</span>
                  </div>
                  <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-2">
                    {scannedBooks.map((b, i) => (
                      <div key={i} className="flex justify-between items-center group py-2.5 bg-white px-3 rounded-xl border border-gray-100 shadow-sm">
                        <span className="text-sm font-bold text-gray-800 truncate pr-4">{b.title}</span>
                        <button onClick={() => {
                          scannedCodesRef.current.delete(b.qr_code);
                          setScannedBooks(prev => prev.filter((_, idx) => idx !== i));
                        }} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                          <XCircle size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <button onClick={() => setStatus('confirm')} className="w-full py-3 mt-4 bg-indigo-600 text-white text-base font-black rounded-xl hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-md">
                    Konfirmasi
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardAction({ title, icon, color, onClick }: { title: string, icon: React.ReactNode, color: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full p-4 flex items-center gap-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all group border border-transparent hover:border-gray-200"
    >
      <div className={cn("w-12 h-12 rounded-xl text-white flex items-center justify-center shadow-md", color)}>
        {icon}
      </div>
      <span className="font-bold text-gray-700 group-hover:text-gray-900 leading-tight text-left">{title}</span>
    </button>
  );
}

function KatalogView({ onBack }: { onBack: () => void }) {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState<any>(null);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/books?search=${encodeURIComponent(search)}`);
        const data = await res.json();
        setBooks(Array.isArray(data) ? data : []);
      } catch (err) {
        setBooks([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  return (
    <div className="flex-1 flex flex-col relative h-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-indigo-50 hover:bg-indigo-100 rounded-full text-indigo-600 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold text-gray-800">Katalog Buku</h2>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari judul atau pengarang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-[#8b5cf6] outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-auto pb-8">
        {loading ? (
          <div className="col-span-full py-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-[#8b5cf6]/20 border-t-[#8b5cf6] rounded-full animate-spin" />
            <p className="text-gray-400">Memuat data buku...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400">Buku tidak ditemukan.</div>
        ) : (
          books.map((book: any, i) => (
            <div key={i} onClick={() => setSelectedBook(book)} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex gap-4 cursor-pointer group hover:bg-indigo-50/30">
              <div className="w-16 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-[#8b5cf6]/40 group-hover:bg-indigo-100/50">
                <BookOpen size={32} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 leading-tight group-hover:text-[#6366f1]">{book.title}</h4>
                <p className="text-sm text-gray-500 mt-1">{book.author} • {book.category}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    book.available_copies > 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                  )}>
                    {book.available_copies > 0 ? `${book.available_copies} Tersedia` : "Kosong"}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedBook && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in p-2 sm:p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 relative shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200">
            <button onClick={() => setSelectedBook(null)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 transition-colors cursor-pointer">
              <XCircle size={24} />
            </button>
            <div className="flex items-center gap-4 mb-6 mt-1">
              <div className="w-14 h-16 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-300 shrink-0">
                 <BookOpen size={28} />
              </div>
              <div className="flex-1 min-w-0 pr-8">
                <h3 className="text-lg font-black text-gray-800 leading-tight mb-1 truncate">{selectedBook.title}</h3>
                <p className="text-sm font-bold text-gray-500 truncate">{selectedBook.author}</p>
              </div>
            </div>
            
            <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold text-gray-400 uppercase">Kategori</span>
                 <span className="text-[13px] font-bold text-gray-700 max-w-[60%] truncate text-right">{selectedBook.category || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold text-gray-400 uppercase">Penerbit</span>
                 <span className="text-[13px] font-bold text-gray-700 max-w-[60%] truncate text-right">{selectedBook.publisher || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold text-gray-400 uppercase">ISBN</span>
                 <span className="text-[13px] font-bold text-gray-700 max-w-[60%] truncate text-right">{selectedBook.isbn || '-'}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                 <span className="text-[10px] font-bold text-gray-400 uppercase">Stok Tersedia</span>
                 <span className={cn("text-sm font-black", selectedBook.available_copies > 0 ? "text-emerald-600" : "text-rose-600")}>
                   {selectedBook.available_copies} / {selectedBook.total_copies}
                 </span>
              </div>
            </div>
            <button onClick={() => setSelectedBook(null)} className="w-full mt-5 py-3 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer text-sm">
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StaffLoginView({ onBack, onLogin }: { onBack: () => void, onLogin: (data: any) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        onLogin(data);
      } else {
        setError("Username atau password salah!");
      }
    } catch (err) {
      setError("Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-[#8b5cf6]/10 rounded-3xl text-[#8b5cf6] mb-4">
            <User size={48} />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Admin Portal</h2>
          <p className="text-gray-500">Masukkan kredensial Anda untuk masuk ke sistem</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-2">
            <XCircle size={16} />
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
            <input 
              type="text" 
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-[#8b5cf6] outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-[#8b5cf6] outline-none"
            />
          </div>
          <button 
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-4 bg-[#6366f1] text-white rounded-xl font-bold shadow-lg hover:bg-[#5558e6] transition-all transform active:scale-95 mt-4 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          <button 
            onClick={onBack}
            className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors mt-2"
          >
            Kembali ke Kiosk
          </button>
        </div>
      </div>
    </div>
  );
}

function StaffDashboard({ onLogout, remoteUrl }: { onLogout: () => void, remoteUrl: string }) {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'BOOKS' | 'MEMBERS' | 'REPORT' | 'FINES'>('OVERVIEW');
  const [stats, setStats] = useState({ totalBooks: 0, borrowedBooks: 0, activeMembers: 0, totalFines: 0 });

  useEffect(() => {
    fetch('/api/stats').then(res => res.json()).then(setStats);
  }, [activeTab]);

  const menuItems = [
    { id: 'OVERVIEW', label: 'Ringkasan', icon: <Database size={20} /> },
    { id: 'BOOKS', label: 'Buku', icon: <BookOpen size={20} /> },
    { id: 'MEMBERS', label: 'Anggota', icon: <User size={20} /> },
    { id: 'REPORT', label: 'Log', icon: <List size={20} /> },
    { id: 'FINES', label: 'Denda', icon: <List size={20} /> },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full -m-4 md:-m-6 lg:-m-8 overflow-hidden bg-white">
      {/* Sidebar Dahsboard */}
      <aside className="w-full md:w-56 border-r border-gray-100 p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          {menuItems.map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold transition-all text-sm",
                activeTab === item.id 
                  ? "bg-[#6366f1] text-white shadow-lg shadow-indigo-100" 
                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-auto">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 transition-all text-sm shadow-sm"
          >
            <RotateCcw size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <div className="flex-1 p-8 flex flex-col overflow-auto">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">
              {menuItems.find(m => m.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-2">
             <div className="text-right">
                <p className="text-xs font-black text-gray-800 leading-none uppercase">Admin</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Super User</p>
             </div>
             <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xs border">A</div>
          </div>
        </div>

        <div className="flex-1">
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-8 md:p-10 text-white flex justify-between items-center shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-2xl md:text-3xl font-black mb-2 tracking-tight">Selamat Datang, Admin!</h3>
                  <p className="text-indigo-100 font-medium max-w-md">Pantau sirkulasi buku dan kelola data ePustaka dengan cepat dan mudah.</p>
                </div>
                <div className="hidden md:flex absolute right-4 -bottom-4 z-0 opacity-20">
                   <Library size={160} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard label="Total Judul Buku" value={stats.totalBooks} icon={<BookOpen size={28} />} color="text-indigo-600" bg="bg-indigo-50" border="border-indigo-100" />
                <StatCard label="Sedang Dipinjam" value={stats.borrowedBooks} icon={<RotateCcw size={28} />} color="text-amber-600" bg="bg-amber-50" border="border-amber-100" />
                <StatCard label="Anggota Aktif" value={stats.activeMembers} icon={<User size={28} />} color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-100" />
              </div>

              <div className="flex-1 min-h-0">
                <RecentActivity />
              </div>
            </div>
          )}

          {activeTab === 'BOOKS' && <BookManagementView />}
          {activeTab === 'MEMBERS' && <MemberManagementView />}
          {activeTab === 'REPORT' && <ReportView />}
          {activeTab === 'FINES' && <FinesView />}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, bg, border }: any) {
  return (
    <div className={cn("p-6 md:p-8 rounded-[2rem] border shadow-sm flex items-center justify-between transition-all hover:scale-[1.02]", bg, border)}>
      <div>
        <p className={cn("text-xs font-bold uppercase tracking-widest mb-1 opacity-70", color)}>{label}</p>
        <p className={cn("text-4xl md:text-5xl font-black tracking-tighter", color)}>{value}</p>
      </div>
      <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center bg-white shadow-sm ring-4 ring-white/50", color)}>
        {icon}
      </div>
    </div>
  );
}

import { QRCodeSVG } from 'qrcode.react';

function BookManagementView() {
  const [books, setBooks] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState<any>({ qr_code: '', title: '', author: '', publisher: '', isbn: '', category: '', total_copies: 1 });

  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const loadBooks = () => fetch('/api/books', { cache: 'no-cache' }).then(res => res.json()).then(setBooks);
  useEffect(() => { loadBooks(); }, []);

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(search.toLowerCase()) || 
    b.author.toLowerCase().includes(search.toLowerCase()) ||
    b.qr_code.toLowerCase().includes(search.toLowerCase())
  );

  const executeDelete = async (id: number) => {
    const url = `/api/books/${id}`;
    try {
      const res = await fetch(url, { method: 'DELETE', cache: 'no-cache' });
      if (!res.ok) {
          const text = await res.text();
          console.error(`Gagal menghapus: Server memberikan respon ${res.status} - ${text}`);
      } else {
          await loadBooks();
      }
    } catch (e) {
      console.error('Delete request failed: ' + e);
    }
  };

  const downloadQR = (code: string, title: string) => {
    const svg = document.querySelector(`#qr-${code} svg`) as SVGElement;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 300, 300);
        ctx.drawImage(img, 0, 0, 300, 300);
      }
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR_${title.replace(/[^a-z0-9]/gi, '_')}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const generateID = () => {
    let id: string = "";
    let isDuplicate = true;
    while(isDuplicate) {
        id = "BK-" + Date.now().toString().slice(-6) + Math.random().toString(36).substring(2, 4).toUpperCase();
        isDuplicate = books.some(b => b.qr_code === id);
    }
    setFormData(prev => ({ ...prev, qr_code: id }));
  };

  const [errorMsg, setErrorMsg] = useState("");
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setErrorMsg("");
    const isEdit = !!formData.id;
    const res = await fetch(isEdit ? `/api/books/${formData.id}` : '/api/books', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      loadBooks();
      setShowAdd(false);
      setFormData({ qr_code: '', title: '', author: '', publisher: '', isbn: '', category: '', total_copies: 1 });
    } else {
      const err = await res.json();
      setErrorMsg(err.error || "Gagal menyimpan buku");
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteTarget(id);
  };

  const handleEdit = (book: any) => {
    setFormData({
      id: book.id,
      qr_code: book.qr_code || '',
      title: book.title || '',
      author: book.author || '',
      publisher: book.publisher || '',
      isbn: book.isbn || '',
      category: book.category || '',
      total_copies: book.total_copies || 1
    });
    setShowAdd(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">Manajemen Buku</h3>
        <div className="flex gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Cari buku..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none w-64"
            />
          </div>
          <button 
            onClick={() => {
              if (showAdd) {
                setFormData({ qr_code: '', title: '', author: '', publisher: '', isbn: '', category: '', total_copies: 1 });
                setShowAdd(false);
              } else {
                setFormData({ qr_code: '', title: '', author: '', publisher: '', isbn: '', category: '', total_copies: 1 });
                setShowAdd(true);
              }
            }}
            className="px-4 py-2 bg-[#6366f1] text-white rounded-xl font-bold hover:bg-[#5558e6] text-sm"
          >
            {showAdd ? 'Batal' : '+ Tambah Buku'}
          </button>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Konfirmasi Hapus</h3>
            <p className="text-gray-600 mb-6">Apakah Anda yakin ingin menghapus buku ini?</p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl">Batal</button>
              <button onClick={() => { executeDelete(deleteTarget); setDeleteTarget(null); }} className="flex-1 py-2 bg-red-500 text-white font-bold rounded-xl">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 animate-in fade-in duration-300">
           <div className="md:col-span-2 bg-gray-50 p-8 rounded-[2rem] grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-100 h-fit">
            <div className="md:col-span-2 flex items-end gap-2">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">QR Code ID</label>
                <input required type="text" placeholder="ID Buku" value={formData.qr_code} onChange={e => setFormData({...formData, qr_code: e.target.value})} className="w-full px-4 py-2 rounded-xl border outline-none focus:ring-1 focus:ring-indigo-400 mt-1" />
              </div>
              <button type="button" onClick={generateID} className="px-4 py-2 bg-indigo-100 text-indigo-600 font-bold rounded-xl text-xs h-[42px] hover:bg-indigo-200">Auto</button>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">Judul</label>
              <input required type="text" placeholder="Judul Buku" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 rounded-xl border outline-none focus:ring-1 focus:ring-indigo-400 mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">Pengarang</label>
              <input required type="text" placeholder="Pengarang" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} className="w-full px-4 py-2 rounded-xl border outline-none focus:ring-1 focus:ring-indigo-400 mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">Penerbit</label>
              <input required type="text" placeholder="Penerbit" value={formData.publisher} onChange={e => setFormData({...formData, publisher: e.target.value})} className="w-full px-4 py-2 rounded-xl border outline-none focus:ring-1 focus:ring-indigo-400 mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">ISBN</label>
              <input required type="text" placeholder="ISBN" value={formData.isbn} onChange={e => setFormData({...formData, isbn: e.target.value})} className="w-full px-4 py-2 rounded-xl border outline-none focus:ring-1 focus:ring-indigo-400 mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">Kategori</label>
              <input required type="text" placeholder="Kategori" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2 rounded-xl border outline-none focus:ring-1 focus:ring-indigo-400 mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase">Jumlah</label>
              <input required type="number" placeholder="Stok" value={formData.total_copies} onChange={e => setFormData({...formData, total_copies: parseInt(e.target.value)})} className="w-full px-4 py-2 rounded-xl border outline-none focus:ring-1 focus:ring-indigo-400 mt-1" />
            </div>
            {errorMsg && <div className="md:col-span-2 text-red-500 font-bold text-sm bg-red-50 p-2 rounded-lg">{errorMsg}</div>}
            <button type="submit" className="md:col-span-2 py-3 bg-[#6366f1] text-white font-bold rounded-xl mt-2">Simpan</button>
          </div>
          {formData.qr_code && (
            <div className="bg-white p-8 rounded-[2rem] border shadow-sm flex flex-col items-center justify-center gap-4 h-fit">
               <div id={`qr-${formData.qr_code}`} className="p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <QRCodeSVG value={formData.qr_code} size={150} includeMargin={true} bgColor="#ffffff" fgColor="#000000" level="H" />
               </div>
               <button 
                  type="button"
                  onClick={() => downloadQR(formData.qr_code, formData.title || "NewBook")}
                  className="w-full py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl text-sm"
               >
                  Download Gambar
               </button>
            </div>
          )}
        </form>
      )}

      {!showAdd && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full min-w-[500px] text-left text-sm">
            <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase border-b">
              <tr>
                <th className="px-6 py-4">QR</th>
                <th className="px-6 py-4">Buku</th>
                <th className="px-6 py-4">Tersedia</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredBooks.map((b: any) => (
                <tr key={b.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div id={`qr-${b.qr_code}`} className="hidden"><QRCodeSVG value={b.qr_code} size={256} includeMargin={true} bgColor="#ffffff" fgColor="#000000" level="H" /></div>
                    <span className="font-mono text-[10px] font-bold text-gray-400">{b.qr_code}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800">{b.title}</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-indigo-600">{b.available_copies}/{b.total_copies}</td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleEdit(b)}
                      className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                      title="Edit Buku"
                    >
                      <Database size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(b.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Hapus Buku"
                    >
                      <XCircle size={18} />
                    </button>
                    <button 
                      onClick={() => downloadQR(b.qr_code, b.title)}
                      className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                      title="Unduh QR"
                    >
                      <QrCode size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MemberManagementView() {
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [regStep, setRegStep] = useState<'IDLE' | 'SCANNING' | 'FORM'>('IDLE');
  const [formData, setFormData] = useState<any>({ rfid_uid: '', name: '', student_id: '', role: 'SISWA', max_borrow_limit: 5 });
  const [scannedInput, setScannedInput] = useState("");

  const loadMembers = () => fetch('/api/members', { cache: 'no-cache' }).then(res => res.json()).then(setMembers);
  useEffect(() => { loadMembers(); }, []);

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.student_id.toLowerCase().includes(search.toLowerCase()) ||
    m.rfid_uid.toLowerCase().includes(search.toLowerCase())
  );

  const executeDelete = async (id: number) => {
    const url = `/api/members/${id}`;
    try {
      const res = await fetch(url, { method: 'DELETE', cache: 'no-cache' });
      if (!res.ok) {
          const text = await res.text();
          let errorMsg = text;
          try {
            const json = JSON.parse(text);
            if (json.error) errorMsg = json.error;
          } catch (e) {}
          console.error(`Gagal menghapus: Server memberikan respon ${res.status} - ${text}`);
          alert(`Gagal menghapus anggota: ${errorMsg}`);
      } else {
          await loadMembers();
      }
    } catch (e) {
      console.error('Delete request failed: ' + e);
      alert('Terjadi kesalahan jaringan saat menghapus anggota');
    }
  };

  // Keyboard handle for RFID Scan during registration
  useEffect(() => {
    if (regStep !== 'SCANNING') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && scannedInput.trim()) {
        const uid = scannedInput.trim();
        const isRegistered = members.some(m => m.rfid_uid === uid);
        if (isRegistered) {
           setErrorMsg("ID RFID sudah terdaftar pada anggota lain!");
           setTimeout(() => setErrorMsg(""), 3000);
        } else {
           setFormData(prev => ({ ...prev, rfid_uid: uid }));
           setRegStep('FORM');
        }
        setScannedInput("");
      } else if (e.key.length === 1) {
        setScannedInput(prev => prev + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [regStep, scannedInput, members]);

  // Polling for RFID scans during registration
  useEffect(() => {
    if (regStep !== 'SCANNING') return;
    
    const interval = setInterval(() => {
      fetch('/api/rfid/consume', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (data && data.uid) {
            const uid = data.uid.trim();
            const isRegistered = members.some(m => m.rfid_uid === uid);
            if (isRegistered) {
               setErrorMsg("ID RFID sudah terdaftar pada anggota lain!");
               setTimeout(() => setErrorMsg(""), 3000);
            } else {
               setFormData(prev => ({ ...prev, rfid_uid: uid }));
               setRegStep('FORM');
            }
          }
        })
        .catch(() => {});
    }, 1000);
    return () => clearInterval(interval);
  }, [regStep, members]);

  const [errorMsg, setErrorMsg] = useState("");
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setErrorMsg("");
    const isEdit = !!formData.id;
    const res = await fetch(isEdit ? `/api/members/${formData.id}` : '/api/members', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setRegStep('IDLE');
      loadMembers();
      setFormData({ rfid_uid: '', name: '', student_id: '', role: 'SISWA', max_borrow_limit: 5 });
    } else {
      const err = await res.json();
      setErrorMsg(err.error || "Gagal mendaftarkan anggota");
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteTarget(id);
  };

  const handleEdit = (member: any) => {
    setFormData({
      id: member.id,
      rfid_uid: member.rfid_uid || '',
      name: member.name || '',
      student_id: member.student_id || '',
      role: member.role || 'SISWA',
      max_borrow_limit: member.max_borrow_limit || 5
    });
    setRegStep('FORM');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">Data Anggota</h3>
        <div className="flex gap-4 items-center">
          {regStep === 'IDLE' && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Cari anggota..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none w-64"
              />
            </div>
          )}
          <button 
            onClick={() => {
              setFormData({ rfid_uid: '', name: '', student_id: '', role: 'SISWA', max_borrow_limit: 5 });
              if (regStep === 'IDLE') {
                setRegStep('SCANNING');
              } else {
                setRegStep('IDLE');
              }
            }}
            className="px-4 py-2 bg-[#6366f1] text-white rounded-xl font-bold hover:bg-[#5558e6]"
          >
            {regStep === 'IDLE' ? '+ Daftar Anggota' : 'Batal'}
          </button>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Konfirmasi Hapus</h3>
            <p className="text-gray-600 mb-6">Apakah Anda yakin ingin menghapus anggota ini?</p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl">Batal</button>
              <button onClick={() => { executeDelete(deleteTarget); setDeleteTarget(null); }} className="flex-1 py-2 bg-red-500 text-white font-bold rounded-xl">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      {regStep === 'SCANNING' && (
        <div className="bg-indigo-50 border-2 border-dashed border-indigo-200 p-12 rounded-[2rem] text-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-indigo-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
            <User size={40} />
          </div>
          <h4 className="text-2xl font-black text-indigo-900 mb-2">Menunggu Scan Kartu...</h4>
          <p className="text-indigo-400 max-w-sm mx-auto">Silakan tempelkan kartu perpustakaan baru untuk memulai proses pendaftaran anggota.</p>
          {errorMsg && (
            <div className="mt-6 bg-red-100 text-red-600 font-bold p-3 rounded-xl max-w-sm mx-auto">
              {errorMsg}
            </div>
          )}
          <div className="mt-8 flex items-center justify-center gap-2">
             <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
             <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-100" />
             <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-200" />
          </div>
        </div>
      )}

      {regStep === 'FORM' && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] border-2 border-indigo-100 shadow-xl shadow-indigo-100/20 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-500">
          <div className="md:col-span-2 flex items-center gap-4 bg-indigo-50 p-4 rounded-2xl border border-indigo-100 mb-2">
            <div className="w-12 h-12 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-md">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-indigo-400 uppercase">UID Kartu Berhasil Diverifikasi</p>
              <p className="font-mono text-indigo-900 font-bold">{formData.rfid_uid}</p>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-black text-gray-400 mb-2 uppercase">Nama Lengkap</label>
            <input required type="text" placeholder="Masukkan nama siswa" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50" />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 mb-2 uppercase">Nomor Induk (ID)</label>
            <input required type="text" placeholder="Contoh: 3.33.xx.x" value={formData.student_id} onChange={e => setFormData({...formData, student_id: e.target.value})} className="w-full px-5 py-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50" />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 mb-2 uppercase">Peran Anggota</label>
            <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-5 py-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 font-bold">
              <option value="SISWA">Siswa</option>
              <option value="GURU">Guru / Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 mb-2 uppercase">Maks Pinjam Buku</label>
            <input required type="number" min="1" value={formData.max_borrow_limit || ''} onChange={e => setFormData({...formData, max_borrow_limit: e.target.value === '' ? '' : parseInt(e.target.value)})} className="w-full px-5 py-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 font-bold" />
          </div>
          {errorMsg && <div className="md:col-span-2 text-red-500 font-bold text-sm bg-red-50 p-3 rounded-xl">{errorMsg}</div>}
          <div className="flex items-end md:col-span-2">
            <button type="submit" className="w-full py-4 bg-[#6366f1] text-white font-black rounded-2xl shadow-lg hover:shadow-indigo-200 transition-all active:scale-[0.98]">
              Simpan
            </button>
          </div>
        </form>
      )}

      {regStep === 'IDLE' && (
        <div className="bg-white rounded-3xl border border-gray-100 overflow-x-auto shadow-sm">
          <table className="w-full min-w-[600px] text-left">
          <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b">
            <tr>
              <th className="px-6 py-4 tracking-tighter">UID Kartu</th>
              <th className="px-6 py-4">Nama Lengkap</th>
              <th className="px-6 py-4">NISN</th>
              <th className="px-6 py-4">Maks Pinjam</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {filteredMembers.map((m: any) => (
              <tr key={m.id} className="hover:bg-gray-50/30 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-mono text-[10px] text-gray-500 font-bold bg-gray-100 px-2 py-1 rounded">{m.rfid_uid}</span>
                </td>
                <td className="px-6 py-4">
                  <p className="font-black text-gray-800">{m.name}</p>
                </td>
                <td className="px-6 py-4 font-bold text-gray-500 tracking-tight">{m.student_id}</td>
                <td className="px-6 py-4 font-bold text-indigo-600">{m.max_borrow_limit || 5} Buku</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                    m.role === 'GURU' ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                  )}>{m.role}</span>
                </td>
                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleEdit(m)}
                      className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                      title="Edit Anggota"
                    >
                      <Database size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(m.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Hapus Anggota"
                    >
                      <XCircle size={18} />
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
    </div>
  );
}

function FinesView() {
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editAmount, setEditAmount] = useState(0);

  const fetchData = () => {
    fetch('/api/transactions').then(res => res.json()).then(setData);
  }

  const [txVersion, setTxVersion] = useState(0);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetch('/api/transactions/version')
        .then(res => res.json())
        .then(data => {
          if (data && data.version !== txVersion) {
            setTxVersion(data.version);
            fetchData();
          }
        })
        .catch(() => {});
    }, 2000);
    return () => clearInterval(interval);
  }, [txVersion]);

  const handleUpdate = async (t: any, newStatus: string, newAmount: number) => {
    // Removed window.confirm for iframe compatibility
    try {
      const res = await fetch(`/api/transactions/${t.id}/fine`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fine_amount: newAmount, fine_status: newStatus })
      });
      if (res.ok) {
        setEditTarget(null);
        fetchData();
      } else {
        console.error("Failed to update fine");
      }
    } catch (e) {
      console.error("Update error", e);
    }
  };

  const filtered = data.filter(t => t.fine_amount > 0 && (
    t.member_name.toLowerCase().includes(search.toLowerCase()) || 
    t.book_title.toLowerCase().includes(search.toLowerCase())
  ));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">Manajemen Denda</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Cari denda..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto shadow-sm">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase border-b">
            <tr>
              <th className="px-6 py-4">Waktu</th>
              <th className="px-6 py-4">Anggota</th>
              <th className="px-6 py-4">Buku</th>
              <th className="px-6 py-4">Jumlah Denda</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((t: any) => (
              <tr key={t.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 text-gray-400 text-[10px] font-bold">
                  {new Date(t.return_date || t.transaction_date).toLocaleDateString('id-ID')}
                </td>
                <td className="px-6 py-4 font-bold text-gray-700">{t.member_name}</td>
                <td className="px-6 py-4 text-gray-500">{t.book_title}</td>
                <td className="px-6 py-4 font-black text-red-500">
                  {editTarget?.id === t.id ? (
                    <input 
                      type="number" 
                      value={editAmount} 
                      onChange={e => setEditAmount(parseInt(e.target.value) || 0)}
                      className="w-24 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-sm text-gray-800"
                    />
                  ) : (
                    `Rp ${t.fine_amount.toLocaleString('id-ID')}`
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-black uppercase",
                    t.fine_status === 'LUNAS' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                  )}>{t.fine_status || 'BELUM_LUNAS'}</span>
                </td>
                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                  {editTarget?.id === t.id ? (
                     <>
                        <button onClick={() => handleUpdate(t, t.fine_status, editAmount)} className="text-xs font-bold px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">Simpan</button>
                        <button onClick={() => setEditTarget(null)} className="text-xs font-bold px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">Batal</button>
                     </>
                  ) : (
                     <>
                       {t.fine_status !== 'LUNAS' && (
                         <button onClick={() => handleUpdate(t, 'LUNAS', t.fine_amount)} className="text-xs font-bold px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">Konfirmasi Dibayar</button>
                       )}
                       <button onClick={() => { setEditTarget(t); setEditAmount(t.fine_amount); }} className="text-xs font-bold px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors">Edit</button>
                       <button onClick={() => handleUpdate(t, t.fine_status, 0)} className="text-xs font-bold px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">Hapus Denda</button>
                     </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-12 text-center text-gray-300">Tidak ada denda tercatat.</div>}
      </div>
    </div>
  );
}

function ReportView() {
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const fetchData = () => {
    fetch('/api/transactions').then(res => res.json()).then(setData);
  }

  const [txVersion, setTxVersion] = useState(0);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetch('/api/transactions/version')
        .then(res => res.json())
        .then(data => {
          if (data && data.version !== txVersion) {
            setTxVersion(data.version);
            fetchData();
          }
        })
        .catch(() => {});
    }, 2000);
    return () => clearInterval(interval);
  }, [txVersion]);

  const handleAdminKembali = async (t: any) => {
     // Removed window.confirm for iframe compatibility
     // In a production app you'd use a custom modal, but here we just proceed.
     try {
       const res = await fetch('/api/transactions', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           member_id: t.member_id,
           book_id: t.book_id,
           type: 'KEMBALI'
         })
       });
       if(res.ok) {
         fetchData();
       } else {
         // handle error silently or with on-page toast (skipping alert for iframe compatibility)
         console.error('Failed to Return');
       }
     } catch(e) {
       console.error('Return error', e);
     }
  };

  const filtered = data.filter(t => 
    t.member_name.toLowerCase().includes(search.toLowerCase()) || 
    t.book_title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">Riwayat Transaksi</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Cari transaksi..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto shadow-sm">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase border-b">
            <tr>
              <th className="px-6 py-4">Waktu</th>
              <th className="px-6 py-4">Anggota</th>
              <th className="px-6 py-4">Buku</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((t: any) => (
              <tr key={t.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 text-gray-400 text-[10px] font-bold">
                  <div>{new Date(t.transaction_date).toLocaleDateString('id-ID')}</div>
                  {t.return_date && <div>Kembali: {new Date(t.return_date).toLocaleDateString('id-ID')}</div>}
                </td>
                <td className="px-6 py-4 font-bold text-gray-700">{t.member_name}</td>
                <td className="px-6 py-4 text-gray-500">{t.book_title}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-black uppercase",
                    t.type === 'PINJAM' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                  )}>{t.type}</span>
                </td>
                <td className="px-6 py-4 text-right">
                   {t.type === 'PINJAM' && t.status === 'BERJALAN' && (
                     <button onClick={() => handleAdminKembali(t)} className="text-xs font-bold px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">Kembalikan</button>
                   )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-12 text-center text-gray-300">Belum ada transaksi.</div>}
      </div>
    </div>
  );
}

function RecentActivity() {
  const [logs, setLogs] = useState([]);

  const fetchLogs = () => {
    fetch('/api/transactions').then(res => res.json()).then(data => setLogs(data.slice(0, 5)));
  };

  const [txVersion, setTxVersion] = useState(0);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(() => {
      fetch('/api/transactions/version')
        .then(res => res.json())
        .then(data => {
          if (data && data.version !== txVersion) {
            setTxVersion(data.version);
            fetchLogs();
          }
        })
        .catch(() => {});
    }, 2000);
    return () => clearInterval(interval);
  }, [txVersion]);

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col h-full">
      <h3 className="text-xl font-black text-gray-800 mb-6 tracking-tight">Aktivitas Terakhir</h3>
      <div className="flex-1 space-y-5">
        {logs.map((l: any) => (
          <div key={l.id} className="flex items-center gap-4 py-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              l.type === 'PINJAM' ? "bg-amber-400" : "bg-emerald-400"
            )} />
            <div className="flex-1">
              <p className="text-sm text-gray-600 leading-tight">
                <span className="font-bold text-gray-800">{l.member_name}</span> 
                {l.type === 'PINJAM' ? ' meminjam ' : ' mengembalikan '} 
                <span className="text-indigo-600 font-medium">{l.book_title}</span>
              </p>
              <p className="text-xs text-gray-500 font-bold mt-1">{new Date(l.return_date || l.transaction_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
          </div>
        ))}
        {logs.length === 0 && <p className="text-center py-8 text-gray-300 text-sm">Tidak ada aktivitas.</p>}
      </div>
    </div>
  );
}
