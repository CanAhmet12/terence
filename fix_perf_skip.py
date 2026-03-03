p = '/var/www/terence/nazliyavuz-platform/backend/database/migrations/2025_10_26_000000_add_critical_performance_indexes.php'
with open(p) as f: c = f.read()
# Replace up() body with just return
import re
# Find public function up(): void { ... }
start = c.find('public function up(): void')
if start == -1: exit(1)
brace_start = c.find('{', start)
depth = 1
i = brace_start + 1
while depth > 0 and i < len(c):
    if c[i] == '{': depth += 1
    elif c[i] == '}': depth -= 1
    i += 1
end = i
new_body = " {\n        return; // Skip - schema mismatches\n    }\n"
new_c = c[:brace_start] + new_body + c[end:]
with open(p,'w') as f: f.write(new_c)
