import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add download function inside ReportView
download_func = """
  const handleDownload = () => {
    if (sortedTransactions.length === 0) {
      alert("Tidak ada data untuk diunduh.");
      return;
    }
    const headers = ["Waktu", "Peminjam", "Buku", "Tipe", "Status", "Denda", "Status Denda"];
    const csvContent = [
      headers.join(","),
      ...sortedTransactions.map((t: any) => 
        [
          `"${new Date(t.transaction_date).toLocaleString()}"`, 
          `"${t.member_name}"`, 
          `"${t.book_title}"`, 
          `"${t.type}"`, 
          `"${t.status}"`, 
          `"${t.fine_amount || 0}"`, 
          `"${t.fine_status || '-'}"`
        ].join(",")
      )
    ].join("\\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Rekap_Peminjaman_${new Date().toISOString().slice(0,7)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
"""

content = re.sub(
    r'(const filteredTransactions = data\.filter\(t =>.*?;\n  const { items: sortedTransactions, requestSort: requestSortTxs, sortConfig: sortConfigTxs } = useSortableData\(filteredTransactions\);\n)',
    r'\1' + download_func,
    content,
    flags=re.DOTALL
)

# Add Download Button in JSX next to Search input
button_jsx = """
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari transaksi..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-sm whitespace-nowrap"
          >
            Unduh Rekap Bulanan
          </button>
        </div>
"""

# Find the exact search bar structure in ReportView
# Actually, I'll just replace the whole `<div className="relative mb-6">...</div>`
content = re.sub(
    r'<div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">\s*<div className="flex justify-between items-center mb-6">\s*<h3 className="text-xl font-black text-gray-800 tracking-tight">Riwayat Peminjaman</h3>\s*</div>\s*<div className="relative mb-6">.*?</div>',
    r'<div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">\n        <div className="flex justify-between items-center mb-6">\n          <h3 className="text-xl font-black text-gray-800 tracking-tight">Riwayat Peminjaman</h3>\n        </div>\n' + button_jsx,
    content,
    flags=re.DOTALL
)

with open('src/App.tsx', 'w') as f:
    f.write(content)

