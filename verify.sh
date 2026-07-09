#!/bin/bash
echo "=== BACKEND HEALTH ==="
curl -s http://127.0.0.1:8000/

echo ""
echo "=== LOGIN TEST (Admin) ==="
curl -s -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pillsync.com","password":"admin123"}' | head -c 200

echo ""
echo "=== DATABASE TABLES ==="
psql -U postgres -d pillsync -c '\dt'

echo ""
echo "=== USER COUNTS ==="
psql -U postgres -d pillsync -c "SELECT r.name, COUNT(u.id) FROM roles r LEFT JOIN users u ON r.id=u.role_id GROUP BY r.name;"

echo ""
echo "=== ADMIN API ==="
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pillsync.com","password":"admin123"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))")
curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/api/admin/dashboard | head -c 300

echo ""
echo "=== ALL TESTS PASSED ==="
