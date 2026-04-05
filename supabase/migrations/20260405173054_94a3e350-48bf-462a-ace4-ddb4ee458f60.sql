-- Delete 404 documents and their related data
DELETE FROM document_sections WHERE document_id IN (
  SELECT id FROM documents WHERE title LIKE '404%' OR title LIKE '%Not Found%'
);
DELETE FROM documents WHERE title LIKE '404%' OR title LIKE '%Not Found%';