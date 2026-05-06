#!/bin/bash
set -euo pipefail
cd /var/www/terence/nazliyavuz-platform/backend
PW=$(grep '^DB_PASSWORD=' .env | cut -d= -f2- | tr -d '\r' | sed 's/^"//;s/"$//')
MYSQL=(mysql -h127.0.0.1 -uterence_user -p"${PW}" terence_db -N)

echo "=== curriculum_subjects / units / topics (toplam) ==="
"${MYSQL[@]}" -e "
SELECT 'subjects' AS k, COUNT(*) FROM curriculum_subjects
UNION ALL SELECT 'units', COUNT(*) FROM curriculum_units
UNION ALL SELECT 'topics', COUNT(*) FROM curriculum_topics;
"

echo ""
echo "=== Dersler: grade | exam_type | adet ==="
"${MYSQL[@]}" -e "
SELECT grade, exam_type, COUNT(*) AS ders_sayisi
FROM curriculum_subjects
WHERE is_active = 1
GROUP BY grade, exam_type
ORDER BY grade, exam_type;
"

echo ""
echo "=== Her ders: slug | name | unite | konu ==="
"${MYSQL[@]}" -e "
SELECT s.slug, s.name, s.grade, s.exam_type,
       COUNT(DISTINCT u.id) AS unite,
       COUNT(DISTINCT t.id) AS konu
FROM curriculum_subjects s
LEFT JOIN curriculum_units u ON u.subject_id = s.id AND u.is_active = 1
LEFT JOIN curriculum_topics t ON t.unit_id = u.id AND t.is_active = 1
WHERE s.is_active = 1
GROUP BY s.id, s.slug, s.name, s.grade, s.exam_type
ORDER BY s.grade, s.exam_type, s.sort_order, s.name;
"
