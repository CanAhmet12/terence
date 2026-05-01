#!/usr/bin/env bash
set -euo pipefail

echo "== Grade Scope Audit =="
echo "-- Null student profiles"
mysql -N -e "
SELECT COUNT(*)
FROM users
WHERE role = 'student' AND (grade IS NULL OR target_exam IS NULL);
"

echo "-- Course enrollment mismatches"
mysql -N -e "
SELECT ce.user_id, ce.course_id, u.grade AS user_grade, u.target_exam, c.grade AS course_grade, c.exam_type
FROM course_enrollments ce
JOIN users u ON u.id = ce.user_id
JOIN courses c ON c.id = ce.course_id
WHERE u.role = 'student'
  AND (
    (c.grade IS NOT NULL AND c.grade <> u.grade)
    OR (c.exam_type NOT IN (u.target_exam, 'Genel'))
  )
LIMIT 50;
"

echo "-- Exam answer/session-user mismatches"
mysql -N -e "
SELECT ea.id, ea.user_id, es.user_id AS session_user_id, ea.exam_session_id
FROM exam_answers ea
JOIN exam_sessions es ON es.id = ea.exam_session_id
WHERE ea.user_id <> es.user_id
LIMIT 50;
"

echo "-- Question answer scope mismatches"
mysql -N -e "
SELECT qa.id, qa.user_id, q.id AS question_id, u.grade AS user_grade, q.grade AS question_grade, u.target_exam, q.exam_type
FROM question_answers qa
JOIN users u ON u.id = qa.user_id
JOIN questions q ON q.id = qa.question_id
WHERE u.role = 'student'
  AND (
    q.grade <> u.grade
    OR q.exam_type NOT IN (u.target_exam, 'Genel')
  )
LIMIT 50;
"

echo "Audit completed."
