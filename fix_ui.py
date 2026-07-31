import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace('bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm h-full flex flex-col', 'bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col h-full')

with open('src/App.tsx', 'w') as f:
    f.write(content)
