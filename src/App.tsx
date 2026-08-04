/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Book,
  Download,
  Clock,
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  CreditCard,
  BookMarked
} from 'lucide-react';
import { cn } from './lib/utils';
import { BarChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type ViewState = 'LOGIN' | 'HOME' | 'PINJAM' | 'KEMBALI' | 'KATALOG' | 'DASHBOARD' | 'PROFIL';


const useSortableData = (items: any[], config: { key: string, direction: 'asc' | 'desc' } | null = null) => {
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(config);

  const sortedItems = useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return { items: sortedItems, requestSort, sortConfig };
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<ViewState>('LOGIN');
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [remoteUrl, setRemoteUrl] = useState("");

  const handleLoginSuccess = (data: any) => {
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    if (data.remoteUrl) setRemoteUrl(data.remoteUrl);
    setUser(data.user);
    if (data.user?.role === 'ADMIN') {
      setView('DASHBOARD');
    } else {
      setView('HOME');
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setView('LOGIN');
  };

  useEffect(() => {
    let timeoutId: any;
    const resetTimeout = () => {
      clearTimeout(timeoutId);
      if (user && user.role === 'ADMIN') {
        timeoutId = setTimeout(() => {
          handleLogout();
        }, 10 * 60 * 1000); // 10 minutes
      }
    };

    if (user && user.role === 'ADMIN') {
      resetTimeout();
      window.addEventListener('mousemove', resetTimeout);
      window.addEventListener('keydown', resetTimeout);
      window.addEventListener('click', resetTimeout);
      window.addEventListener('touchstart', resetTimeout);
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimeout);
      window.removeEventListener('keydown', resetTimeout);
      window.removeEventListener('click', resetTimeout);
      window.removeEventListener('touchstart', resetTimeout);
    };
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          setUser({ id: payload.id, username: payload.username, role: payload.role, name: payload.name });
          if (payload.role === 'ADMIN') {
            setView('DASHBOARD');
          } else {
            setView('HOME');
          }
        } else {
          localStorage.removeItem('token');
        }
      } catch (e) {
        localStorage.removeItem('token');
      }
    }
  }, []);

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
    if (!user && view === 'KATALOG') {
      return <KatalogView onBack={() => setView('LOGIN')} />;
    }
    if (!user) {
      return <LoginView onLogin={handleLoginSuccess} onKatalog={() => setView('KATALOG')} />;
    }

    switch (view) {
      case 'HOME':
        return <HomeView onNavigate={setView} />;
      case 'PINJAM':
        return <ActionView title="Peminjaman Mandiri" onBack={() => setView('HOME')} type="PINJAM" user={user} />;
      case 'KEMBALI':
        return <ActionView title="Pengembalian Mandiri" onBack={() => setView('HOME')} type="KEMBALI" user={user} />;
      case 'KATALOG':
        return <KatalogView onBack={() => setView('HOME')} />;
      case 'PROFIL':
        return <UserProfileView user={user} onBack={() => setView('HOME')} />;
      case 'DASHBOARD':
        return <StaffDashboard onLogout={handleLogout} remoteUrl={remoteUrl} />;
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
              if (user) { if (user.role === 'ADMIN') setView('DASHBOARD'); else setView('HOME'); } else setView('LOGIN');
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
            
            {user && (
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all text-sm font-bold border bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 border-gray-100 hover:border-red-100"
              >
                Logout
              </button>
            )}
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
              className="min-h-full w-full p-8 flex flex-col"
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
          icon={<User size={40} />} 
          title="Profil & Riwayat" 
          onClick={() => onNavigate('PROFIL')} 
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

function ActionView({ title, onBack, type, user }: { title: string, onBack: () => void, type: 'PINJAM' | 'KEMBALI', user?: any }) {
  const [step, setStep] = useState(user ? 2 : 1);
  const [member, setMember] = useState<any>(user || null);
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
          const userTx = (Array.isArray(txs) ? txs : []).filter(t => t.member_id === member.id && (t.status === 'BERJALAN' || t.status === 'TERLAMBAT'));
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
  // 📝 KETERANGAN FUNGSI:
  // Fungsi utama untuk menangani input dari alat RFID Scanner (yang bertindak sebagai keyboard).
  // Saat kartu didekatkan, alat akan "mengetik" nomor seri dan diakhiri dengan tombol 'Enter'.
  // Fungsi ini menangkap hasil ketikan tersebut untuk memproses ID anggota atau QR Code buku.
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
                  processQrCode(code.data.trim());
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
                <button onClick={() => { 
                  if (user) { onBack(); } 
                  else { setStatus('idle'); setMessage(''); setScannedBooks([]); scannedCodesRef.current.clear(); setActiveLoans([]); setActiveLoansFetched(false); setMember(null); setStep(1); } 
                }} className="w-full py-3 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-colors">
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
  const [filterMonth, setFilterMonth] = useState("");
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

function LoginView({ onLogin, onKatalog }: { onLogin: (data: any) => void, onKatalog: () => void }) {
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
        body: JSON.stringify({ username: username.trim(), password })
      });
      
      let data;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error("Invalid response format");
      }
      
      if (res.ok && data.success) {
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        onLogin(data);
      } else {
        setError(data.error || "Username atau password salah!");
      }
    } catch (err) {
      setError("Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-8 my-auto">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-[#8b5cf6]/10 rounded-3xl text-[#8b5cf6] mb-4">
            <User size={48} />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Login ePustaka</h2>
          <p className="text-gray-500">Silahkan scan RFID atau masukan Username dan Password anda</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-2">
            <XCircle size={16} />
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Username / Scan RFID</label>
            <input 
              type="text" 
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-[#8b5cf6] outline-none"
              autoFocus
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
            {loading ? "Logging in..." : "Masuk"}
          </button>
          <div className="mt-6 text-center">
             <p className="text-sm text-gray-500 mb-3 font-medium">Bisa juga masuk sebagai tamu untuk</p>
             <button 
               onClick={onKatalog}
               className="w-full py-3.5 bg-white border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 rounded-xl font-bold shadow-sm transition-all active:scale-[0.98]"
             >
               Lihat Katalog Buku
             </button>
          </div>

        </div>
      </div>
    </div>
  );
}

function StaffDashboard({ onLogout, remoteUrl }: { onLogout: () => void, remoteUrl: string }) {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'BOOKS' | 'MEMBERS' | 'REPORT' | 'FINES'>('OVERVIEW');
  const [stats, setStats] = useState({ totalBooks: 0, borrowedBooks: 0, activeMembers: 0, totalFines: 0 });

  useEffect(() => {
    fetch('/api/stats').then(res => res.json()).then(data => setStats(data && typeof data === 'object' ? data : stats)).catch(() => {});
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

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <VisitorStats />
                </div>
                <div className="lg:col-span-1">
                  <RecentActivity />
                </div>
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
  const [filterMonth, setFilterMonth] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState<any>({ qr_code: '', title: '', author: '', publisher: '', isbn: '', category: '', total_copies: 1 });

  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const loadBooks = () => fetch('/api/books', { cache: 'no-cache' }).then(res => res.json()).then(data => Array.isArray(data) ? setBooks(data) : setBooks([])).catch(() => setBooks([]));
  useEffect(() => { loadBooks(); }, []);

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(search.toLowerCase()) || 
    b.author.toLowerCase().includes(search.toLowerCase()) ||
    b.qr_code.toLowerCase().includes(search.toLowerCase())
  );

  const { items: sortedBooks, requestSort: requestSortBooks, sortConfig: sortConfigBooks } = useSortableData(filteredBooks);

  // 📝 KETERANGAN FUNGSI:
  // Fungsi untuk memanggil API penghapusan Buku.
  // Sama seperti member, jika berhasil dihapus, fungsi akan me-refresh daftar buku terbaru (loadBooks).
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

  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handlePreSubmit = (e: any) => {
    e.preventDefault();
    setShowSaveConfirm(true);
  };

  const executeSubmit = async () => {
    setShowSaveConfirm(false);
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
            <input
              type="month"
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none w-40 text-gray-600"
            />
          </div>
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
              setShowSaveConfirm(false);
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

      {showSaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
              <BookOpen size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              {formData.id ? 'Konfirmasi Simpan Perubahan' : 'Konfirmasi Simpan Buku'}
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Apakah Anda yakin ingin menyimpan data buku <span className="font-bold text-indigo-600">"{formData.title || formData.qr_code}"</span>?
            </p>
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => setShowSaveConfirm(false)} 
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-sm transition-colors"
              >
                Batal
              </button>
              <button 
                type="button" 
                onClick={executeSubmit} 
                className="flex-1 py-2.5 bg-[#6366f1] hover:bg-[#5558e6] text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-100 transition-colors"
              >
                Ya, Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <form onSubmit={handlePreSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 animate-in fade-in duration-300">
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
              <input required type="text" placeholder="ISBN" value={formData.isbn} onChange={e => setFormData({...formData, isbn: e.target.value.replace(/\D/g, '')})} className="w-full px-4 py-2 rounded-xl border outline-none focus:ring-1 focus:ring-indigo-400 mt-1" />
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
              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSortBooks('qr_code')}>QR {sortConfigBooks?.key === 'qr_code' ? (sortConfigBooks.direction === 'asc' ? '↑' : '↓') : '↕'}</th>
              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSortBooks('title')}>Buku {sortConfigBooks?.key === 'title' ? (sortConfigBooks.direction === 'asc' ? '↑' : '↓') : '↕'}</th>
              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSortBooks('author')}>Penulis {sortConfigBooks?.key === 'author' ? (sortConfigBooks.direction === 'asc' ? '↑' : '↓') : '↕'}</th>
              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSortBooks('category')}>Kategori {sortConfigBooks?.key === 'category' ? (sortConfigBooks.direction === 'asc' ? '↑' : '↓') : '↕'}</th>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => requestSortBooks('available_copies')}>Tersedia {sortConfigBooks?.key === 'available_copies' ? (sortConfigBooks.direction === 'asc' ? '↑' : '↓') : '↕'}</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedBooks.map((b: any) => (
                <tr key={b.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div id={`qr-${b.qr_code}`} className="hidden"><QRCodeSVG value={b.qr_code} size={256} includeMargin={true} bgColor="#ffffff" fgColor="#000000" level="H" /></div>
                    <span className="font-mono text-[10px] font-bold text-gray-400">{b.qr_code}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800">{b.title}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-600 text-xs">{b.author}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-600 text-xs">{b.category || '-'}</p>
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
  const [filterMonth, setFilterMonth] = useState("");
  const [regStep, setRegStep] = useState<'IDLE' | 'SCANNING' | 'FORM'>('IDLE');
  const [formData, setFormData] = useState<any>({ rfid_uid: '', name: '', role: 'SISWA', max_borrow_limit: 5, username: '', password: '' });
  const [scannedInput, setScannedInput] = useState("");

  const loadMembers = () => fetch('/api/members', { cache: 'no-cache' }).then(res => res.json()).then(data => Array.isArray(data) ? setMembers(data) : setMembers([])).catch(() => setMembers([]));
  useEffect(() => { loadMembers(); }, []);

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.rfid_uid.toLowerCase().includes(search.toLowerCase())
  );

  const { items: sortedMembers, requestSort: requestSortMembers, sortConfig: sortConfigMembers } = useSortableData(filteredMembers);

  // 📝 KETERANGAN FUNGSI:
  // Fungsi (Event Handler) untuk menghapus data anggota dengan memanggil API ke Backend.
  // Jika gagal (misal karena constraint Foreign Key), akan menangkap pesan error dari server
  // lalu memunculkannya melalui window.alert() kepada admin.
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

  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handlePreSubmit = (e: any) => {
    e.preventDefault();
    setShowSaveConfirm(true);
  };

  const executeSubmit = async () => {
    setShowSaveConfirm(false);
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
      setFormData({ rfid_uid: '', name: '', role: 'SISWA', max_borrow_limit: 5, username: '', password: '' });
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
      role: member.role || 'SISWA',
      max_borrow_limit: member.max_borrow_limit || 5,
      username: member.username || '',
      password: '' // Kosongkan password saat edit
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
              setShowSaveConfirm(false);
              setFormData({ rfid_uid: '', name: '', role: 'SISWA', max_borrow_limit: 5, username: '', password: '' });
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

      {showSaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
              <User size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              {formData.id ? 'Konfirmasi Simpan Perubahan' : 'Konfirmasi Simpan Anggota'}
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Apakah Anda yakin ingin menyimpan data anggota <span className="font-bold text-indigo-600">"{formData.name}"</span>?
            </p>
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => setShowSaveConfirm(false)} 
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-sm transition-colors"
              >
                Batal
              </button>
              <button 
                type="button" 
                onClick={executeSubmit} 
                className="flex-1 py-2.5 bg-[#6366f1] hover:bg-[#5558e6] text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-100 transition-colors"
              >
                Ya, Simpan
              </button>
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
        <form onSubmit={handlePreSubmit} className="bg-white p-8 rounded-[2rem] border-2 border-indigo-100 shadow-xl shadow-indigo-100/20 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-500">
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
          <div>
            <label className="block text-xs font-black text-gray-400 mb-2 uppercase">Username (Opsional)</label>
            <input type="text" placeholder="Masukkan username" value={formData.username || ''} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-5 py-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50" />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 mb-2 uppercase">{formData.id ? 'Password Baru (Opsional)' : 'Password (Opsional)'}</label>
            <input type="password" placeholder={formData.id ? "Kosongkan jika tidak diubah" : "Masukkan password"} value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-5 py-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50" />
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
              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSortMembers('rfid_uid')}>UID Kartu {sortConfigMembers?.key === 'rfid_uid' ? (sortConfigMembers.direction === 'asc' ? '↑' : '↓') : '↕'}</th>
              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSortMembers('name')}>Nama Lengkap {sortConfigMembers?.key === 'name' ? (sortConfigMembers.direction === 'asc' ? '↑' : '↓') : '↕'}</th>
              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSortMembers('max_borrow_limit')}>Maks Pinjam {sortConfigMembers?.key === 'max_borrow_limit' ? (sortConfigMembers.direction === 'asc' ? '↑' : '↓') : '↕'}</th>
              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSortMembers('role')}>Status {sortConfigMembers?.key === 'role' ? (sortConfigMembers.direction === 'asc' ? '↑' : '↓') : '↕'}</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {sortedMembers.map((m: any) => (
              <tr key={m.id} className="hover:bg-gray-50/30 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-mono text-[10px] text-gray-500 font-bold bg-gray-100 px-2 py-1 rounded">{m.rfid_uid}</span>
                </td>
                <td className="px-6 py-4">
                  <p className="font-black text-gray-800">{m.name}</p>
                </td>
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
  const [filterMonth, setFilterMonth] = useState("");
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editAmount, setEditAmount] = useState(0);

  const fetchData = () => {
    fetch('/api/transactions').then(res => res.json()).then(data => Array.isArray(data) ? setData(data) : setData([])).catch(() => setData([]));
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
  const { items: sortedFines, requestSort: requestSortTxs, sortConfig: sortConfigTxs } = useSortableData(filtered);

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
              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSortTxs('transaction_date')}>Waktu {sortConfigTxs?.key === 'transaction_date' ? (sortConfigTxs.direction === 'asc' ? '↑' : '↓') : '↕'}</th>
              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSortTxs('member_name')}>Anggota {sortConfigTxs?.key === 'member_name' ? (sortConfigTxs.direction === 'asc' ? '↑' : '↓') : '↕'}</th>
              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSortTxs('book_title')}>Buku {sortConfigTxs?.key === 'book_title' ? (sortConfigTxs.direction === 'asc' ? '↑' : '↓') : '↕'}</th>
              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSortTxs('fine_amount')}>Jumlah Denda {sortConfigTxs?.key === 'fine_amount' ? (sortConfigTxs.direction === 'asc' ? '↑' : '↓') : '↕'}</th>
              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSortTxs('fine_status')}>Status Denda {sortConfigTxs?.key === 'fine_status' ? (sortConfigTxs.direction === 'asc' ? '↑' : '↓') : '↕'}</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sortedFines.map((t: any) => (
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
  const [filterMonth, setFilterMonth] = useState("");

  const fetchData = () => {
    fetch('/api/transactions').then(res => res.json()).then(data => Array.isArray(data) ? setData(data) : setData([])).catch(() => setData([]));
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

const filtered = data.filter(t => {
    const matchSearch = t.member_name.toLowerCase().includes(search.toLowerCase()) || 
      t.book_title.toLowerCase().includes(search.toLowerCase()) ||
      t.status.toLowerCase().includes(search.toLowerCase());
      
    if (filterMonth) {
      const txMonth = new Date(t.transaction_date).toISOString().slice(0, 7);
      return matchSearch && txMonth === filterMonth;
    }
    return matchSearch;
  });
  const { items: sortedTransactions, requestSort: requestSortTxs, sortConfig: sortConfigTxs } = useSortableData(filtered);

  const handleDownload = () => {
    if (sortedTransactions.length === 0) {
      return; // handle silently or use toast in real app
    }
    const headers = ["Waktu", "Peminjam", "Buku", "Tipe", "Status", "Denda", "Status Denda"];
    const csvContent = [
      headers.join(","),
      ...sortedTransactions.map((t: any) => 
        [
          `"${new Date(t.transaction_date).toLocaleString('id-ID')}"`, 
          `"${t.member_name}"`, 
          `"${t.book_title}"`, 
          `"${t.type}"`, 
          `"${t.status}"`, 
          `"${t.fine_amount || 0}"`, 
          `"${t.fine_status || '-'}"`
        ].join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Rekap_Peminjaman_${new Date().toISOString().slice(0,7)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">Riwayat Transaksi</h3>
                <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative">
            <input
              type="month"
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none w-40 text-gray-600"
            />
          </div>
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
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors"
          >
            <Download size={16} /> Unduh Rekap
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto shadow-sm">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase border-b">
            <tr>
              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSortTxs('transaction_date')}>Waktu {sortConfigTxs?.key === 'transaction_date' ? (sortConfigTxs.direction === 'asc' ? '↑' : '↓') : '↕'}</th>
              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSortTxs('member_name')}>Anggota {sortConfigTxs?.key === 'member_name' ? (sortConfigTxs.direction === 'asc' ? '↑' : '↓') : '↕'}</th>
              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSortTxs('book_title')}>Buku {sortConfigTxs?.key === 'book_title' ? (sortConfigTxs.direction === 'asc' ? '↑' : '↓') : '↕'}</th>
              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSortTxs('status')}>Status {sortConfigTxs?.key === 'status' ? (sortConfigTxs.direction === 'asc' ? '↑' : '↓') : '↕'}</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sortedTransactions.map((t: any) => (
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
                   {t.type === 'PINJAM' && (t.status === 'BERJALAN' || t.status === 'TERLAMBAT') && (
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
    fetch('/api/transactions').then(res => res.json()).then(data => Array.isArray(data) ? setLogs(data.slice(0, 5)) : setLogs([])).catch(() => setLogs([]));
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


function VisitorStats() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('/api/stats/visitors').then(res => res.json()).then(data => Array.isArray(data) ? setData(data) : setData([])).catch(() => setData([]));
  }, []);

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col h-full">
      <h3 className="text-xl font-black text-gray-800 mb-6 tracking-tight">Statistik Peminjam per Bulan</h3>
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
            <Tooltip 
              cursor={{ fill: '#F3F4F6' }} 
              contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="visitors" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-x-auto border border-gray-100 rounded-2xl flex-1">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase border-b">
            <tr>
              <th className="px-6 py-4">Bulan</th>
              <th className="px-6 py-4 text-right">Jumlah Peminjam</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((row: any) => (
              <tr key={row.month} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 font-medium text-gray-700">{row.month}</td>
                <td className="px-6 py-4 text-right font-bold text-indigo-600">{row.visitors}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-gray-400">Belum ada data pengunjung.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserProfileView({ user, onBack }: { user: any, onBack: () => void }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('SEMUA');

  useEffect(() => {
    fetch(`/api/users/${user.id}/history`)
      .then(res => res.json())
      .then(data => {
        setHistory(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setHistory([]);
        setLoading(false);
      });
  }, [user.id]);

  const totalPinjam = history.length;
  const sedangDipinjam = history.filter(tx => tx.status === 'BERJALAN' || tx.status === 'TERLAMBAT').length;
  const totalDenda = history.reduce((sum, tx) => sum + (tx.fine_amount || 0), 0);

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-3xl p-4 md:p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
         <div>
            <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-[#6366f1] transition-colors font-bold mb-4"><ChevronLeft /> Kembali</button>
            <h2 className="text-3xl font-black text-gray-800 tracking-tight">Profil & Riwayat</h2>
         </div>
      </div>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div className="flex items-center gap-6">
           <div className="w-16 h-16 bg-[#8b5cf6]/10 text-[#8b5cf6] rounded-full flex items-center justify-center shrink-0">
              <User size={32} />
           </div>
           <div>
              <h3 className="text-xl font-bold text-gray-800">{user.name}</h3>
              <p className="text-gray-500 font-medium">Status: {user.role}</p>
           </div>
         </div>
         <div className="flex flex-wrap gap-4">
           <div className="bg-blue-50 px-4 py-3 rounded-xl border border-blue-100 min-w-[120px]">
             <div className="text-blue-500 flex items-center gap-2 mb-1"><BookMarked size={16}/> <span className="text-xs font-bold uppercase tracking-wider">Total Pinjam</span></div>
             <div className="text-2xl font-black text-blue-900">{totalPinjam} <span className="text-sm font-medium text-blue-600">Buku</span></div>
           </div>
           <div className="bg-orange-50 px-4 py-3 rounded-xl border border-orange-100 min-w-[120px]">
             <div className="text-orange-500 flex items-center gap-2 mb-1"><Clock size={16}/> <span className="text-xs font-bold uppercase tracking-wider">Sedang Dipinjam</span></div>
             <div className="text-2xl font-black text-orange-900">{sedangDipinjam} <span className="text-sm font-medium text-orange-600">Buku</span></div>
           </div>
           <div className="bg-red-50 px-4 py-3 rounded-xl border border-red-100 min-w-[120px]">
             <div className="text-red-500 flex items-center gap-2 mb-1"><AlertCircle size={16}/> <span className="text-xs font-bold uppercase tracking-wider">Total Denda</span></div>
             <div className="text-2xl font-black text-red-900"><span className="text-sm font-bold">Rp</span> {totalDenda.toLocaleString('id-ID')}</div>
           </div>
         </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-1 min-h-[400px] flex flex-col">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><List size={20} /> Riwayat Transaksi</h3>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {['SEMUA', 'BERJALAN', 'TERLAMBAT', 'SELESAI'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-bold transition-colors capitalize",
                  filterStatus === status ? "bg-white text-[#8b5cf6] shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                {status.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="text-center py-10 text-gray-500 font-medium flex items-center justify-center gap-3">
             <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#8b5cf6]"></div>
             Memuat data...
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-gray-500 flex flex-col items-center gap-4">
             <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center text-gray-400">
               <Book size={24} />
             </div>
             <div className="font-medium">Belum ada riwayat transaksi.</div>
          </div>
        ) : (() => {
          const filteredHistory = history.filter(tx => filterStatus === 'SEMUA' || tx.status === filterStatus);
          if (filteredHistory.length === 0) {
            return (
              <div className="text-center py-12 text-gray-500 flex flex-col items-center gap-4">
                 <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center text-gray-400">
                   <List size={24} />
                 </div>
                 <div className="font-medium">Tidak ada transaksi untuk status {filterStatus.toLowerCase()}.</div>
              </div>
            );
          }
          return (
            <div className="space-y-4">
              {filteredHistory.map((tx, idx) => (
              <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 gap-4 hover:border-[#8b5cf6]/30 transition-colors">
                <div className="flex items-start gap-4">
                   <div className={cn(
                     "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                     tx.status === 'SELESAI' ? "bg-green-100 text-green-600" :
                     tx.status === 'TERLAMBAT' ? "bg-red-100 text-red-600" :
                     "bg-orange-100 text-orange-600"
                   )}>
                     {tx.status === 'SELESAI' ? <CheckCircle size={20} /> : tx.status === 'TERLAMBAT' ? <AlertCircle size={20} /> : <Clock size={20} />}
                   </div>
                   <div>
                     <h4 className="font-bold text-gray-800 leading-tight mb-1">{tx.book_title || "Buku"}</h4>
                     <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                       <span>Dipinjam: {new Date(tx.transaction_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</span>
                       {tx.return_date && <span>• Dikembalikan: {new Date(tx.return_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</span>}
                     </p>
                   </div>
                </div>
                <div className="flex items-center gap-4 md:text-right ml-14 md:ml-0">
                   <div>
                      {tx.fine_amount > 0 && <span className="block text-sm font-bold text-red-500">Denda: Rp {tx.fine_amount.toLocaleString('id-ID')}</span>}
                      {tx.type === 'PINJAM' && tx.status === 'BERJALAN' && <span className="block text-sm font-bold text-orange-500">Batas: {new Date(tx.due_date).toLocaleDateString('id-ID')}</span>}
                   </div>
                   <div className={cn(
                     "px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider",
                     tx.status === 'SELESAI' ? "bg-green-100 text-green-700 border border-green-200" :
                     tx.status === 'TERLAMBAT' ? "bg-red-100 text-red-700 border border-red-200" :
                     "bg-orange-100 text-orange-700 border border-orange-200"
                   )}>
                     {tx.status}
                   </div>
                </div>
              </div>
            ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
