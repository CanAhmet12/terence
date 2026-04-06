-- ============================================================
-- TERENCE DATABASE INDEX ANALYSIS QUERIES
-- ============================================================
-- Use these queries to analyze index usage and performance

-- 1. Check index usage statistics
SELECT 
    table_name,
    index_name,
    seq_in_index,
    column_name,
    cardinality
FROM information_schema.statistics
WHERE table_schema = DATABASE()
    AND table_name IN ('courses', 'questions', 'question_answers', 'exam_sessions', 'student_progress', 'daily_plans', 'course_enrollments')
ORDER BY table_name, index_name, seq_in_index;

-- 2. Find tables without primary keys (potential issues)
SELECT 
    tables.table_name
FROM information_schema.tables
LEFT JOIN information_schema.table_constraints 
    ON tables.table_name = table_constraints.table_name
    AND table_constraints.constraint_type = 'PRIMARY KEY'
WHERE tables.table_schema = DATABASE()
    AND table_constraints.constraint_name IS NULL
    AND tables.table_type = 'BASE TABLE';

-- 3. Find columns that should be indexed (foreign keys without indexes)
SELECT 
    table_name,
    column_name,
    referenced_table_name,
    referenced_column_name
FROM information_schema.key_column_usage
WHERE table_schema = DATABASE()
    AND referenced_table_name IS NOT NULL
    AND constraint_name NOT LIKE 'PRIMARY%'
ORDER BY table_name, column_name;

-- 4. Check index cardinality (low cardinality might indicate inefficient indexes)
SELECT 
    table_name,
    index_name,
    SUM(cardinality) as total_cardinality,
    COUNT(*) as column_count
FROM information_schema.statistics
WHERE table_schema = DATABASE()
    AND index_name != 'PRIMARY'
GROUP BY table_name, index_name
HAVING total_cardinality < 100
ORDER BY total_cardinality;

-- 5. Analyze table sizes and row counts
SELECT 
    table_name,
    table_rows,
    ROUND(data_length / 1024 / 1024, 2) AS data_size_mb,
    ROUND(index_length / 1024 / 1024, 2) AS index_size_mb,
    ROUND((data_length + index_length) / 1024 / 1024, 2) AS total_size_mb
FROM information_schema.tables
WHERE table_schema = DATABASE()
    AND table_type = 'BASE TABLE'
ORDER BY (data_length + index_length) DESC;

-- 6. Check for duplicate indexes (same columns, different names)
SELECT 
    a.table_name,
    a.index_name AS index1,
    b.index_name AS index2,
    GROUP_CONCAT(a.column_name ORDER BY a.seq_in_index) AS columns
FROM information_schema.statistics a
JOIN information_schema.statistics b 
    ON a.table_schema = b.table_schema
    AND a.table_name = b.table_name
    AND a.index_name < b.index_name
    AND a.column_name = b.column_name
    AND a.seq_in_index = b.seq_in_index
WHERE a.table_schema = DATABASE()
GROUP BY a.table_name, a.index_name, b.index_name
HAVING COUNT(*) > 0;

-- 7. Analyze slow queries that might benefit from indexes
-- Run this after enabling slow query log
-- SHOW VARIABLES LIKE 'slow_query_log%';
-- SET GLOBAL slow_query_log = 'ON';
-- SET GLOBAL long_query_time = 1;

-- 8. Check for unused indexes (requires performance_schema enabled)
-- SELECT 
--     object_schema,
--     object_name AS table_name,
--     index_name
-- FROM performance_schema.table_io_waits_summary_by_index_usage
-- WHERE index_name IS NOT NULL
--     AND index_name != 'PRIMARY'
--     AND count_star = 0
--     AND object_schema = DATABASE()
-- ORDER BY object_name, index_name;

-- 9. Find most queried tables (requires performance_schema)
-- SELECT 
--     object_name AS table_name,
--     count_read + count_write AS total_queries,
--     count_read,
--     count_write,
--     sum_timer_wait / 1000000000000 AS total_time_sec
-- FROM performance_schema.table_io_waits_summary_by_table
-- WHERE object_schema = DATABASE()
-- ORDER BY total_queries DESC
-- LIMIT 20;

-- 10. Verify all foreign key constraints have indexes
SELECT 
    kcu.table_name,
    kcu.column_name,
    kcu.referenced_table_name,
    kcu.referenced_column_name,
    CASE 
        WHEN s.index_name IS NULL THEN 'NO INDEX'
        ELSE s.index_name
    END AS index_status
FROM information_schema.key_column_usage kcu
LEFT JOIN information_schema.statistics s
    ON kcu.table_schema = s.table_schema
    AND kcu.table_name = s.table_name
    AND kcu.column_name = s.column_name
WHERE kcu.table_schema = DATABASE()
    AND kcu.referenced_table_name IS NOT NULL
ORDER BY kcu.table_name, kcu.column_name;
