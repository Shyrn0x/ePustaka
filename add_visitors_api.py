import re

with open('server.ts', 'r') as f:
    content = f.read()

visitors_api = """
  // Visitor Stats
  app.get("/api/stats/visitors", async (req, res) => {
    if (!db) {
      return res.json([
        { month: 'Jan', visitors: 10 },
        { month: 'Feb', visitors: 15 }
      ]);
    }
    try {
      const [rows]: any = await db.execute(`
        SELECT DATE_FORMAT(transaction_date, '%Y-%m') as month, COUNT(DISTINCT member_id) as visitors
        FROM transactions
        GROUP BY month
        ORDER BY month ASC
      `);
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Visitor stats failed" });
    }
  });
"""

content = content.replace('  // Analytics', visitors_api + '\n  // Analytics')

with open('server.ts', 'w') as f:
    f.write(content)
