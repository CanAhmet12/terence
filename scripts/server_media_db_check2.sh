#!/bin/bash
set -e
cd /var/www/terence/nazliyavuz-platform/backend
P=$(grep ^DB_PASSWORD= .env | cut -d= -f2-)
MYSQL="mysql -h127.0.0.1 -uterence_user -p${P} terence_db -N"

echo "=== topics 25-35 with course ==="
mysql -h127.0.0.1 -uterence_user -p"${P}" terence_db -e "
SELECT t.id, t.title, u.title AS unit_title, c.id AS course_id, c.title AS course_title, c.slug, c.subject, c.grade
FROM topics t
JOIN units u ON u.id = t.unit_id
JOIN courses c ON c.id = u.course_id
WHERE t.id BETWEEN 1 AND 40
ORDER BY t.id;
"

echo "=== content count per topic_id (top 15) ==="
mysql -h127.0.0.1 -uterence_user -p"${P}" terence_db -e "
SELECT topic_id, COUNT(*) n FROM content_items WHERE is_active=1 GROUP BY topic_id ORDER BY n DESC LIMIT 15;
"

echo "=== sample curriculum_topics matematik / tyt ==="
mysql -h127.0.0.1 -uterence_user -p"${P}" terence_db -e "
SELECT ct.id, ct.title, ct.linked_topic_id, cu.title AS unit_title, cs.slug AS subject_slug
FROM curriculum_topics ct
JOIN curriculum_units cu ON cu.id = ct.unit_id
JOIN curriculum_subjects cs ON cs.id = cu.subject_id
WHERE cs.slug LIKE '%matematik%' AND cs.grade IN ('12','11','10')
LIMIT 15;
"

echo "=== any curriculum topic title match course topic titles? ==="
mysql -h127.0.0.1 -uterence_user -p"${P}" terence_db -e "
SELECT ct.id AS ct_id, ct.title AS ct_title, t.id AS topic_id, t.title AS t_title
FROM curriculum_topics ct
JOIN topics t ON t.title = ct.title
WHERE ct.linked_topic_id IS NULL
LIMIT 20;
"
