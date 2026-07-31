import re

with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

def make_th(label, key, req_sort, conf_sort):
    return f'              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={{() => {req_sort}(\'{key}\')}}>{label} {{{conf_sort}?.key === \'{key}\' ? ({conf_sort}.direction === \'asc\' ? \'↑\' : \'↓\') : \'↕\'}}</th>\n'

for i, line in enumerate(lines):
    if "requestSortBooks" in line and "Buku" in line:
        if 1600 < i < 1700: # FinesView
            lines[i] = make_th('Buku', 'book_title', 'requestSortTxs', 'sortConfigTxs')
        elif 1700 < i < 1850: # ReportView
            lines[i] = make_th('Buku', 'book_title', 'requestSortTxs', 'sortConfigTxs')
    if "requestSortTxs" in line and "Anggota" in line and 1700 < i < 1850:
         lines[i] = make_th('Anggota', 'member_name', 'requestSortTxs', 'sortConfigTxs')
    if "requestSortTxs" in line and "Waktu" in line and 1700 < i < 1850:
         lines[i] = make_th('Waktu', 'transaction_date', 'requestSortTxs', 'sortConfigTxs')
    if "requestSortTxs" in line and "Status" in line and "Status Denda" not in line and 1700 < i < 1850:
         lines[i] = make_th('Status', 'status', 'requestSortTxs', 'sortConfigTxs')

with open('src/App.tsx', 'w') as f:
    f.writelines(lines)
