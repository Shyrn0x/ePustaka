import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# FinesView hook injection
fines_hook = """
  const filtered = data.filter(t => t.fine_amount > 0 && (
    t.member_name.toLowerCase().includes(search.toLowerCase()) || 
    t.book_title.toLowerCase().includes(search.toLowerCase())
  ));
  const { items: sortedFines, requestSort: requestSortTxs, sortConfig: sortConfigTxs } = useSortableData(filtered);
"""
content = re.sub(r'  const filtered = data\.filter\(t => t\.fine_amount > 0 && \(\n.*?t\.member_name\.toLowerCase\(\)\.includes\(search\.toLowerCase\(\)\) \|\| \n.*?t\.book_title\.toLowerCase\(\)\.includes\(search\.toLowerCase\(\)\)\n\s*\)\);', fines_hook.strip(), content, flags=re.DOTALL)
content = content.replace('filtered.map((t: any)', 'sortedFines.map((t: any)')

# ReportView hook injection
report_hook = """
  const filtered = data.filter(t => 
    t.member_name.toLowerCase().includes(search.toLowerCase()) || 
    t.book_title.toLowerCase().includes(search.toLowerCase()) ||
    t.status.toLowerCase().includes(search.toLowerCase())
  );
  const { items: sortedTransactions, requestSort: requestSortTxs, sortConfig: sortConfigTxs } = useSortableData(filtered);
"""
content = re.sub(r'  const filtered = data\.filter\(t => \n.*?t\.member_name\.toLowerCase\(\)\.includes\(search\.toLowerCase\(\)\) \|\| \n.*?t\.book_title\.toLowerCase\(\)\.includes\(search\.toLowerCase\(\)\) \|\|\n.*?t\.status\.toLowerCase\(\)\.includes\(search\.toLowerCase\(\)\)\n\s*\);', report_hook.strip(), content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(content)

