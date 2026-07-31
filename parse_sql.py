import sqlparse
with open('database.sql', 'r') as f:
    sql = f.read()

parsed = sqlparse.parse(sql)
for stmt in parsed:
    if stmt.get_type() == 'UNKNOWN':
        print(stmt.value.strip())
