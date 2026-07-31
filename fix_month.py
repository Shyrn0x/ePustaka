import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add month filter state
state_repl = """  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState("");"""
content = content.replace('  const [search, setSearch] = useState("");', state_repl)

# Update filter logic
filter_repl = """const filtered = data.filter(t => {
    const matchSearch = t.member_name.toLowerCase().includes(search.toLowerCase()) || 
      t.book_title.toLowerCase().includes(search.toLowerCase()) ||
      t.status.toLowerCase().includes(search.toLowerCase());
      
    if (filterMonth) {
      const txMonth = new Date(t.transaction_date).toISOString().slice(0, 7);
      return matchSearch && txMonth === filterMonth;
    }
    return matchSearch;
  });"""
content = re.sub(
    r'const filtered = data\.filter\(t => \n\s*t\.member_name\.toLowerCase\(\)\.includes\(search\.toLowerCase\(\)\) \|\| \n\s*t\.book_title\.toLowerCase\(\)\.includes\(search\.toLowerCase\(\)\) \|\|\n\s*t\.status\.toLowerCase\(\)\.includes\(search\.toLowerCase\(\)\)\n\s*\);',
    filter_repl,
    content,
    flags=re.DOTALL
)

# Add month input to UI
ui_repl = """          <div className="relative">
            <input
              type="month"
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none w-40 text-gray-600"
            />
          </div>
          <div className="relative">"""
content = content.replace('          <div className="relative">\n            <Search', ui_repl + '\n            <Search')

with open('src/App.tsx', 'w') as f:
    f.write(content)

