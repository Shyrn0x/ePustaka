with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace('].join("\n");', '].join("\\n");')
with open('src/App.tsx', 'w') as f:
    f.write(content)
