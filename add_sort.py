import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

hook_code = """
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
"""

# Insert hook after imports
imports_end = content.find('export default function App()')
content = content[:imports_end] + hook_code + "\n" + content[imports_end:]

# Add useMemo to react imports
content = re.sub(r'import React, { (.*?) } from "react";', r'import React, { \1, useMemo } from "react";', content)

# 1. BookManagementView
content = re.sub(
    r'(const filteredBooks = books.filter\(b =>.*?;\n)',
    r'\1\n  const { items: sortedBooks, requestSort: requestSortBooks, sortConfig: sortConfigBooks } = useSortableData(filteredBooks);\n',
    content,
    flags=re.DOTALL
)
content = content.replace('filteredBooks.map((b: any)', 'sortedBooks.map((b: any)')
# Make headers clickable
def replace_th(match, request_sort_name, sort_config_name):
    # match is like <th className="px-4 py-3 font-semibold text-gray-600">Judul</th>
    # extract title
    full = match.group(0)
    inner = match.group(2)
    classes = match.group(1)
    # map title to key
    key_map = {
        'Judul': 'title', 'Penulis': 'author', 'ISBN': 'isbn', 'Kategori': 'category', 'Penerbit': 'publisher', 'Stok': 'total_copies', 'Tersedia': 'available_copies',
        'ID/Kode': 'qr_code', 'Nama': 'name', 'NIS/NIP': 'student_id', 'Role': 'role', 'Limit': 'max_borrow_limit',
        'Peminjam': 'member_name', 'Tanggal': 'transaction_date', 'Status': 'status'
    }
    key = key_map.get(inner, None)
    if not key: return full
    
    return f'<th className="{classes} cursor-pointer hover:bg-gray-100" onClick={{() => {request_sort_name}(\'{key}\')}}>{inner} {{{sort_config_name}?.key === \'{key}\' ? ({sort_config_name}.direction === \'asc\' ? \'↑\' : \'↓\') : \'↕\'}}</th>'

# We'll just replace <th> manually using regex in specific components
# BookManagementView headers:
content = re.sub(
    r'<th className="(.*?)">(ID/Kode|Judul|Penulis|Stok|Tersedia)</th>',
    lambda m: replace_th(m, 'requestSortBooks', 'sortConfigBooks'),
    content
)

# 2. MemberManagementView
content = re.sub(
    r'(const filteredMembers = members.filter\(m =>.*?;\n)',
    r'\1\n  const { items: sortedMembers, requestSort: requestSortMembers, sortConfig: sortConfigMembers } = useSortableData(filteredMembers);\n',
    content,
    flags=re.DOTALL
)
content = content.replace('filteredMembers.map((m: any)', 'sortedMembers.map((m: any)')
content = re.sub(
    r'<th className="(.*?)">(ID/Kode|Nama|NIS/NIP|Role|Limit)</th>',
    lambda m: replace_th(m, 'requestSortMembers', 'sortConfigMembers'),
    content
)

# 3. ReportView (Transactions)
content = re.sub(
    r'(const filteredTransactions = transactions.filter\(t =>.*?;\n)',
    r'\1\n  const { items: sortedTransactions, requestSort: requestSortTxs, sortConfig: sortConfigTxs } = useSortableData(filteredTransactions);\n',
    content,
    flags=re.DOTALL
)
content = content.replace('filteredTransactions.map((t: any)', 'sortedTransactions.map((t: any)')
content = re.sub(
    r'<th className="(.*?)">(Peminjam|Judul|Tanggal|Status)</th>',
    lambda m: replace_th(m, 'requestSortTxs', 'sortConfigTxs'),
    content
)

with open('src/App.tsx', 'w') as f:
    f.write(content)

