import re

with open('server.ts', 'r') as f:
    content = f.read()

mock_logic = """
    if (!db) {
      const grouped: Record<string, Set<number>> = {};
      mockTransactions.forEach(t => {
        const d = new Date(t.transaction_date);
        const m = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`;
        if (!grouped[m]) grouped[m] = new Set();
        grouped[m].add(t.member_id);
      });
      const resData = Object.keys(grouped).sort().map(k => ({ month: k, visitors: grouped[k].size }));
      return res.json(resData);
    }
"""

content = re.sub(
    r'    if \(!db\) \{\n      return res\.json\(\[\n        \{ month: \'Jan\', visitors: 10 \},\n        \{ month: \'Feb\', visitors: 15 \}\n      \]\);\n    \}',
    mock_logic.strip(),
    content
)

with open('server.ts', 'w') as f:
    f.write(content)
