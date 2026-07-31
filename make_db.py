import re

with open('schema.sql', 'r') as f:
    schema = f.read()

with open('database.sql', 'r') as f:
    db = f.read()

inserts = []
# Match INSERT INTO `users`, INSERT INTO `books`, INSERT INTO `transactions`
for table in ['users', 'books', 'transactions']:
    matches = re.findall(rf'INSERT INTO `{table}` .*?;\n', db, re.DOTALL)
    for match in matches:
        inserts.append(match)

with open('database.sql', 'w') as f:
    f.write("-- phpMyAdmin SQL Dump\n")
    f.write("-- Database: `pustaka_kiosk`\n\n")
    f.write(schema + "\n\n")
    f.write("--\n-- Data untuk tabel-tabel\n--\n\n")
    for ins in inserts:
        f.write(ins + "\n")

