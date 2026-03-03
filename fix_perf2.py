p = '/var/www/terence/nazliyavuz-platform/backend/database/migrations/2025_10_26_000000_add_critical_performance_indexes.php'
with open(p) as f: c = f.read()
c = c.replace("['online_available', 'rating']", "['online_available', 'rating_avg']")
c = c.replace("['is_approved', 'rating']", "['is_approved', 'rating_avg']")
c = c.replace("'price_per_hour'", "'price_hour'")
with open(p,'w') as f: f.write(c)
