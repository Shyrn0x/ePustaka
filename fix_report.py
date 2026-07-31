import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

report_hook = """
  const filtered = data.filter(t => 
    t.member_name.toLowerCase().includes(search.toLowerCase()) || 
    t.book_title.toLowerCase().includes(search.toLowerCase()) ||
    t.status.toLowerCase().includes(search.toLowerCase())
  );
  const { items: sortedTransactions, requestSort: requestSortTxs, sortConfig: sortConfigTxs } = useSortableData(filtered);
"""

content = re.sub(
    r'  const filtered = data\.filter\(t => \n\s*t\.member_name\.toLowerCase\(\)\.includes\(search\.toLowerCase\(\)\) \|\| \n\s*t\.book_title\.toLowerCase\(\)\.includes\(search\.toLowerCase\(\)\)\n\s*\);',
    report_hook.strip(),
    content,
    flags=re.DOTALL
)

with open('src/App.tsx', 'w') as f:
    f.write(content)
