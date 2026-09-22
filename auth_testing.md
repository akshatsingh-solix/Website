# Auth Testing Playbook (Solix admin)

Single admin credential seeded from `/app/backend/.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) into `users` collection with bcrypt hash. JWT (HS256, 12h) returned as `access_token` in JSON; frontend stores it in localStorage and sends `Authorization: Bearer <token>`.

## Step 1: MongoDB
```
mongosh
use test_database
db.users.find({role: "admin"}).pretty()   # password_hash starts with $2b$
db.login_attempts.find()
```

## Step 2: API
```
API=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
TOKEN=$(curl -s -X POST $API/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@solix.com","password":"SolixAdmin!2026"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
curl -s $API/api/auth/me -H "Authorization: Bearer $TOKEN"
curl -s $API/api/admin/stats -H "Authorization: Bearer $TOKEN"
curl -s "$API/api/admin/submissions?type=demo&q=acme" -H "Authorization: Bearer $TOKEN"
curl -s -o leads.csv "$API/api/admin/submissions/export" -H "Authorization: Bearer $TOKEN"
```
- Wrong password → 401; 5 failures from same IP+email → 429 for 15 minutes.
- Missing/invalid token on `/api/admin/*` → 401.
