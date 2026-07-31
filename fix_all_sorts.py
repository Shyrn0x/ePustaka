import re

with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

def make_th(label, key, req_sort, conf_sort):
    return f'              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={{() => {req_sort}(\'{key}\')}}>{label} {{{conf_sort}?.key === \'{key}\' ? ({conf_sort}.direction === \'asc\' ? \'↑\' : \'↓\') : \'↕\'}}</th>\n'

for i, line in enumerate(lines):
    # BookManagementView
    if '<th className="px-6 py-4">QR</th>' in line:
        lines[i] = make_th('QR', 'qr_code', 'requestSortBooks', 'sortConfigBooks')
    elif '<th className="px-6 py-4">Buku</th>' in line:
        lines[i] = make_th('Buku', 'title', 'requestSortBooks', 'sortConfigBooks')
    
    # MemberManagementView
    elif '<th className="px-6 py-4 tracking-tighter">UID Kartu</th>' in line:
        lines[i] = make_th('UID Kartu', 'rfid_uid', 'requestSortMembers', 'sortConfigMembers')
    elif '<th className="px-6 py-4">Nama Lengkap</th>' in line:
        lines[i] = make_th('Nama Lengkap', 'name', 'requestSortMembers', 'sortConfigMembers')
    elif '<th className="px-6 py-4">NISN</th>' in line:
        lines[i] = make_th('NISN', 'student_id', 'requestSortMembers', 'sortConfigMembers')
    elif '<th className="px-6 py-4">Maks Pinjam</th>' in line:
        lines[i] = make_th('Maks Pinjam', 'max_borrow_limit', 'requestSortMembers', 'sortConfigMembers')
    elif '<th className="px-6 py-4">Status</th>' in line and 1500 < i < 1550:
        lines[i] = make_th('Status', 'role', 'requestSortMembers', 'sortConfigMembers')

    # FinesView
    elif '<th className="px-6 py-4">Waktu</th>' in line and 1600 < i < 1700:
        lines[i] = make_th('Waktu', 'transaction_date', 'requestSortTxs', 'sortConfigTxs')
    elif '<th className="px-6 py-4">Anggota</th>' in line and 1600 < i < 1700:
        lines[i] = make_th('Anggota', 'member_name', 'requestSortTxs', 'sortConfigTxs')
    elif '<th className="px-6 py-4">Buku</th>' in line and 1600 < i < 1700:
        lines[i] = make_th('Buku', 'book_title', 'requestSortTxs', 'sortConfigTxs')
    elif '<th className="px-6 py-4">Jumlah Denda</th>' in line:
        lines[i] = make_th('Jumlah Denda', 'fine_amount', 'requestSortTxs', 'sortConfigTxs')
    elif '<th className="px-6 py-4">Status</th>' in line and 1600 < i < 1700:
        lines[i] = make_th('Status Denda', 'fine_status', 'requestSortTxs', 'sortConfigTxs')

    # ReportView
    elif '<th className="px-6 py-4">Waktu</th>' in line and 1750 < i < 1850:
        lines[i] = make_th('Waktu', 'transaction_date', 'requestSortTxs', 'sortConfigTxs')
    elif '<th className="px-6 py-4">Anggota</th>' in line and 1750 < i < 1850:
        lines[i] = make_th('Anggota', 'member_name', 'requestSortTxs', 'sortConfigTxs')
    elif '<th className="px-6 py-4">Buku</th>' in line and 1750 < i < 1850:
        lines[i] = make_th('Buku', 'book_title', 'requestSortTxs', 'sortConfigTxs')
    elif '<th className="px-6 py-4">Status</th>' in line and 1750 < i < 1850:
        lines[i] = make_th('Status', 'status', 'requestSortTxs', 'sortConfigTxs')


with open('src/App.tsx', 'w') as f:
    f.writelines(lines)
