const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetButtons = `<button onClick={() => { 
                  if (user) { onBack(); } 
                  else { setStatus('idle'); setMessage(''); setScannedBooks([]); scannedCodesRef.current.clear(); setActiveLoans([]); setActiveLoansFetched(false); setMember(null); setStep(1); } 
                }} className="w-full py-3 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-colors">
                  Kembali ke Awal
                </button>
                <button onClick={() => { onBack(); setMessage(''); setScannedBooks([]); scannedCodesRef.current.clear(); setActiveLoans([]); setActiveLoansFetched(false); setMember(null); }} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-200">
                    Selesai
                </button>`;

const replacement = `<button onClick={() => { 
                  setStatus('idle'); 
                  setMessage(''); 
                  setScannedBooks([]); 
                  scannedCodesRef.current.clear(); 
                  setActiveLoans([]); 
                  setActiveLoansFetched(false); 
                  if (user) {
                     setStep(2); // Scan book again
                  } else {
                     setMember(null); 
                     setStep(1); // Scan member again
                  }
                }} className="w-full py-3 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-colors">
                  {user ? "Scan Buku Lagi" : "Scan Pengguna Lain"}
                </button>
                <button onClick={() => { onBack(); setMessage(''); setScannedBooks([]); scannedCodesRef.current.clear(); setActiveLoans([]); setActiveLoansFetched(false); setMember(null); }} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-200">
                    Selesai & Kembali ke Menu
                </button>`;

if (code.includes('Kembali ke Awal')) {
  code = code.replace(targetButtons, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Fixed buttons");
} else {
  console.log("Buttons not found");
}
