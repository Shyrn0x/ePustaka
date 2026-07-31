import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace ISBN input
content = content.replace(
    'onChange={e => setFormData({...formData, isbn: e.target.value})}',
    'onChange={e => setFormData({...formData, isbn: e.target.value.replace(/\\D/g, \'\')})}'
)

# Replace NISN input
content = content.replace(
    '<input required type="text" placeholder="Contoh: 3.33.xx.x" value={formData.student_id} onChange={e => setFormData({...formData, student_id: e.target.value})}',
    '<input required type="text" placeholder="Contoh: 12345678" value={formData.student_id} onChange={e => setFormData({...formData, student_id: e.target.value.replace(/\\D/g, \'\')})}'
)

with open('src/App.tsx', 'w') as f:
    f.write(content)
