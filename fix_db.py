import re
with open('database.sql', 'r') as f:
    sql = f.read()

# Remove the schema's insert
sql = re.sub(r"-- Note: In production.*?ON DUPLICATE KEY UPDATE username=username;\n", "", sql, flags=re.DOTALL)

with open('database.sql', 'w') as f:
    f.write(sql)
