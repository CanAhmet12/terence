p = '/var/www/terence/nazliyavuz-platform/backend/database/migrations/2025_10_26_000000_add_critical_performance_indexes.php'
with open(p) as f: c = f.read()
# Fix notifications - use read_at not is_read
c = c.replace("['user_id', 'is_read', 'created_at']", "['user_id', 'read_at', 'created_at']")
c = c.replace("'notifications_user_read_created_index'", "'notifications_user_read_at_created_index'")
c = c.replace("notifications_user_read_created_index", "notifications_user_read_at_created_index")
with open(p,'w') as f: f.write(c)
