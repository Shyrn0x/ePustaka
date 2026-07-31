import re

with open('server.ts', 'r') as f:
    content = f.read()

get_txs = """
  // Get Transactions / Report
  app.get("/api/transactions", async (req, res) => {
    if (!db) return res.json([...mockTransactions].sort((a: any, b: any) => new Date(b.return_date || b.transaction_date).getTime() - new Date(a.return_date || a.transaction_date).getTime()));
    try {
      // Auto-update status to TERLAMBAT and calculate fines for ongoing transactions
      await db.execute(`
        UPDATE transactions 
        SET 
          status = CASE WHEN NOW() > due_date THEN 'TERLAMBAT' ELSE status END,
          fine_amount = CASE WHEN NOW() > due_date THEN DATEDIFF(NOW(), due_date) * 1000 ELSE fine_amount END
        WHERE status IN ('BERJALAN', 'TERLAMBAT')
      `);

      const [rows] = await db.execute(`
        SELECT t.*, m.name as member_name, b.title as book_title 
        FROM transactions t
        JOIN users m ON t.member_id = m.id
        JOIN books b ON t.book_id = b.id
        ORDER BY IFNULL(t.return_date, t.transaction_date) DESC
      `);
      
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.json([...mockTransactions].sort((a: any, b: any) => new Date(b.return_date || b.transaction_date).getTime() - new Date(a.return_date || a.transaction_date).getTime()));
    }
  });
"""

content = re.sub(
    r'  // Get Transactions / Report\n  app\.get\("/api/transactions", async \(req, res\) => \{.*?    \} catch \(err\) \{\n      res\.json\(\[\.\.\.mockTransactions\]\.sort\(\(a: any, b: any\) => new Date\(b\.return_date \|\| b\.transaction_date\)\.getTime\(\) - new Date\(a\.return_date \|\| a\.transaction_date\)\.getTime\(\)\)\);\n    \}\n  \}\);\n',
    get_txs.strip() + '\n',
    content,
    flags=re.DOTALL
)

# Replace 'BERJALAN' with 'BERJALAN', 'TERLAMBAT' where needed
# e.g., in KEMBALI
content = content.replace("status = 'BERJALAN' LIMIT 1", "status IN ('BERJALAN', 'TERLAMBAT') LIMIT 1")

with open('server.ts', 'w') as f:
    f.write(content)
