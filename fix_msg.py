p = '/var/www/terence/nazliyavuz-platform/backend/database/migrations/2025_09_19_120457_create_messages_table.php'
with open(p) as f: c = f.read()
c = c.replace("->foreignId('thread_id')->nullable()->constrained('message_threads')->onDelete('cascade')", "->unsignedBigInteger('thread_id')->nullable()")
with open(p,'w') as f: f.write(c)
