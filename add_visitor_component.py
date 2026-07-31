import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Make sure recharts is imported
if 'BarChart' not in content:
    content = re.sub(
        r'import \{ cn \} from \'./lib/utils\';',
        r"import { cn } from './lib/utils';\nimport { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';",
        content
    )

visitor_stats_comp = """
function VisitorStats() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('/api/stats/visitors').then(res => res.json()).then(setData);
  }, []);

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm h-full flex flex-col">
      <h3 className="text-xl font-black text-gray-800 mb-6 tracking-tight">Statistik Peminjam per Bulan</h3>
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
            <Tooltip 
              cursor={{ fill: '#F3F4F6' }} 
              contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="visitors" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-x-auto border border-gray-100 rounded-2xl flex-1">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase border-b">
            <tr>
              <th className="px-6 py-4">Bulan</th>
              <th className="px-6 py-4 text-right">Jumlah Peminjam</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((row: any) => (
              <tr key={row.month} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 font-medium text-gray-700">{row.month}</td>
                <td className="px-6 py-4 text-right font-bold text-indigo-600">{row.visitors}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-gray-400">Belum ada data pengunjung.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
"""

content = content + "\n" + visitor_stats_comp

# Replace layout in DashboardView
layout_old = """              <div className="flex-1 min-h-0">
                <RecentActivity />
              </div>"""

layout_new = """              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <VisitorStats />
                </div>
                <div className="lg:col-span-1">
                  <RecentActivity />
                </div>
              </div>"""

content = content.replace(layout_old, layout_new)

with open('src/App.tsx', 'w') as f:
    f.write(content)

