import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Make sure Download icon is imported
if 'Download' not in content[:1000]:
    content = re.sub(
        r'import \{ (.*?) \} from \'lucide-react\';',
        r'import { \1, Download } from \'lucide-react\';',
        content
    )

download_func = """
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

# Insert handleDownload before "const filtered = data.filter" in ReportView
# Wait, "const filtered = data.filter" appears multiple times. In ReportView:
# We can match `const { items: sortedTransactions, requestSort: requestSortTxs, sortConfig: sortConfigTxs } = useSortableData(filtered);`
content = re.sub(
    r'(const \{ items: sortedTransactions, requestSort: requestSortTxs, sortConfig: sortConfigTxs \} = useSortableData\(filtered\);)',
    r'\1\n' + download_func,
    content
)

# Update JSX to include download button
jsx_replacement = """        <div className="flex flex-col sm:flex-row items-center gap-3">
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
        </div>"""

content = re.sub(
    r'<div className="relative">\s*<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size=\{16\} />\s*<input \n\s*type="text" \n\s*placeholder="Cari transaksi\.\.\." \n\s*value=\{search\}\n\s*onChange=\{e => setSearch\(e\.target\.value\)\}\n\s*className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none w-64"\n\s*/>\s*</div>',
    jsx_replacement,
    content
)

with open('src/App.tsx', 'w') as f:
    f.write(content)
