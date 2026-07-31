with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("  Book,\n  DownloadOpen,", "  BookOpen,")
content = content.replace("  Book,\n  Download\n}", "  Book,\n  Download\n}")
with open('src/App.tsx', 'w') as f:
    f.write(content)
