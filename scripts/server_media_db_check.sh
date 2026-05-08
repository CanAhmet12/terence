#!/bin/bash
set -e
cd /var/www/terence/nazliyavuz-platform/backend
P=$(grep ^DB_PASSWORD= .env | cut -d= -f2-)
MYSQL="mysql -h127.0.0.1 -uterence_user -p${P} terence_db -N"

echo "=== counts ==="
echo -n "content_items: "; $MYSQL -e "SELECT COUNT(*) FROM content_items;"
echo -n "curriculum_topics: "; $MYSQL -e "SELECT COUNT(*) FROM curriculum_topics;"
echo -n "linked_topic_id set: "; $MYSQL -e "SELECT COUNT(*) FROM curriculum_topics WHERE linked_topic_id IS NOT NULL;"
echo -n "courses slug ct-topic-: "; $MYSQL -e "SELECT COUNT(*) FROM courses WHERE slug LIKE 'ct-topic-%';"

echo "=== sample content_items.topic_id vs topics ==="
$MYSQL -e "SELECT ci.id, ci.topic_id, ci.type, LEFT(ci.title,40) t FROM content_items ci ORDER BY ci.id DESC LIMIT 8;" || true

echo "=== topics max id / curriculum_topics max id ==="
$MYSQL -e "SELECT (SELECT MAX(id) FROM topics) AS max_topic_id, (SELECT MAX(id) FROM curriculum_topics) AS max_curriculum_topic_id;"

echo "=== legacy join test (ci.topic_id = ct.id) row count ==="
$MYSQL -e "SELECT COUNT(*) FROM content_items ci INNER JOIN curriculum_topics ct ON ct.id = ci.topic_id WHERE ci.is_active = 1;" || true

echo "=== curriculum subjects for grade 12 / TYT sample ==="
$MYSQL -e "SELECT id, slug, name, grade, exam_type FROM curriculum_subjects WHERE is_active=1 LIMIT 12;"

echo "=== grep mediaCatalog in deployed controller (bridge function) ==="
grep -n "contentItemsForBridgeCurriculumTopic" app/Http/Controllers/Api/CurriculumController.php | head -3 || echo "NOT FOUND - old code?"
