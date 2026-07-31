with open('server.ts', 'r') as f:
    content = f.read()

content = content.replace("status = 'BERJALAN'", "status IN ('BERJALAN', 'TERLAMBAT')")
content = content.replace("t.status === 'BERJALAN'", "['BERJALAN', 'TERLAMBAT'].includes(t.status)")
content = content.replace("status IN ('BERJALAN', 'TERLAMBAT')'", "status IN ('BERJALAN', 'TERLAMBAT')") # fix double quotes issue maybe?
content = content.replace("status: 'BERJALAN'", "status: 'BERJALAN'") # wait, this was creating a new tx

with open('server.ts', 'w') as f:
    f.write(content)
