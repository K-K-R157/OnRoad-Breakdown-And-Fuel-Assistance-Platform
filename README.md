# OnRoad Breakdown and Fuel Assistance Platform

Full-stack MERN project with 4 roles: `user`, `mechanic`, `fuelStation`, and `admin`.

## What is implemented

- JWT authentication and role-based authorization
- Mechanic and fuel station registration with admin approval flow
- Nearby provider search using geospatial queries
- Mechanic request workflow (pending -> accepted -> en-route -> arrived -> in-progress -> completed)
- Fuel request workflow (pending -> confirmed -> preparing -> out-for-delivery -> delivered)
- User request creation/history and cancellation support
- Feedback/rating module with provider responses and helpful votes
- Socket.IO realtime status updates (`request:status-updated`)
- React + Vite frontend scaffold connected to API

## Backend setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend URL: `http://localhost:5000`

Health endpoint: `GET /api/health`

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

To point frontend to another backend:

```bash
# frontend/.env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Main API routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/mechanics/nearby`
- `GET /api/fuel-stations/nearby`
- `GET|PUT /api/users/me`
- `POST /api/users/requests/mechanic`
- `POST /api/users/requests/fuel`
- `GET /api/mechanics/requests`
- `PATCH /api/mechanics/requests/:id/status`
- `GET /api/fuel-stations/requests`
- `PATCH /api/fuel-stations/requests/:id/status`
- `GET /api/admin/dashboard`
- `PATCH /api/admin/mechanics/:id/review`
- `PATCH /api/admin/fuel-stations/:id/review`
- `POST /api/feedback`
- `GET /api/feedback/provider/:providerId`

## Notes

- First admin can be created by registering with role `admin`.
- Mechanic and fuel station logins are blocked until admin approval.
