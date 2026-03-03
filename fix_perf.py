p = '/var/www/terence/nazliyavuz-platform/backend/database/migrations/2025_10_26_000000_add_critical_performance_indexes.php'
with open(p) as f: c = f.read()
c = c.replace("if (!$this->indexExists('users', 'users_is_active_created_at_index')) {", "if (Schema::hasColumn('users', 'is_active') && !$this->indexExists('users', 'users_is_active_created_at_index')) {")
with open(p,'w') as f: f.write(c)
