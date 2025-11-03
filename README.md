Things Web (Next.js)

Tech stack
- Next.js 14, React 18, TypeScript
- Tailwind CSS
- Axios for HTTP
- TanStack Query for data fetching/cache
- Prisma ORM (PostgreSQL / Supabase)

Setup
- Install deps: npm install
- Create .env.local with:
  - NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
  - DATABASE_URL=postgresql://...
  - JWT_SECRET=dev_secret_change_me
  - CLOUD_NAME=, API_KEY=, API_SECRET=
  - (Optional) NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
- Generate Prisma client: npm run prisma:generate
- Create DB schema: npm run prisma:migrate -- --name init
- Dev server: npm run dev

Endpoints (REST via Next API)
- Things
  - GET /things?ownerId=&search=&category=&type=&status=&neLat=&neLng=&swLat=&swLng=
  - POST /things (multipart)
  - GET /things/:id
  - PATCH /things/:id (multipart)
  - DELETE /things/:id
- Users
  - GET /users
  - POST /users (multipart signup)
  - GET /users/:id
  - PATCH /users/:id (multipart)
  - DELETE /users/:id
- Auth
  - POST /auth/signin

Notes
- The API is hosted inside this Next.js app. For external clients, call the same routes at this server origin. If needed, override base URL via NEXT_PUBLIC_API_BASE_URL.
- Prisma now backs data with Postgres (Supabase-ready). Geospatial filters use simple bounding boxes (neLat/neLng, swLat/swLng).

