import re
with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "requestSortTxs" in line and "sortConfigTxs" in line:
        if 1500 < i < 1540:  # MemberManagementView
            lines[i] = '              <th className="px-6 py-4">Status</th>\n'
        elif 1630 < i < 1660: # FinesView
            lines[i] = '              <th className="px-6 py-4">Status</th>\n'
        elif 1770 < i < 1790: # RecentActivity (or FinesView)
            lines[i] = '              <th className="px-6 py-4">Status</th>\n'

with open('src/App.tsx', 'w') as f:
    f.writelines(lines)
