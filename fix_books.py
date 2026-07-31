import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add th for Author, Category
th_add = """              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSortBooks('author')}>Penulis {sortConfigBooks?.key === 'author' ? (sortConfigBooks.direction === 'asc' ? '↑' : '↓') : '↕'}</th>
              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSortBooks('category')}>Kategori {sortConfigBooks?.key === 'category' ? (sortConfigBooks.direction === 'asc' ? '↑' : '↓') : '↕'}</th>
"""

content = re.sub(
    r'(<th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick=\{\(\) => requestSortBooks\(\'title\'\)\}>Buku \{sortConfigBooks\?\.key === \'title\' \? \(sortConfigBooks\.direction === \'asc\' \? \'↑\' : \'↓\'\) : \'↕\'\}</th>\n)',
    r'\1' + th_add,
    content
)

# Add td for Author, Category
td_add = """                  <td className="px-6 py-4">
                    <p className="text-gray-600 text-xs">{b.author}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-600 text-xs">{b.category || '-'}</p>
                  </td>
"""

content = re.sub(
    r'(<td className="px-6 py-4">\n\s*<p className="font-bold text-gray-800">\{b\.title\}</p>\n\s*</td>\n)',
    r'\1' + td_add,
    content
)

with open('src/App.tsx', 'w') as f:
    f.write(content)
