# DevCanvas

DevCanvas is a secure MERN web application built for the Secure Web Application Development assessment. The original assignment is based on a stall reservation platform. This project adapts that workflow into a student project showcase platform while keeping the same security, authentication, role-based access control, and management requirements.

## Assessment Mapping

| Assessment requirement | DevCanvas implementation |
| --- | --- |
| Stall Vendor | Student / Project Owner |
| Exhibition Organizer | Admin |
| Stall reservation request | Project submission |
| Vendor profile | Authenticated student profile |
| Vendor's own reservations | Student's own project submissions |
| Organizer manages all reservations | Admin manages all users and projects |
| Exhibition/Event name | Project category |
| Stall type | Project type |
| Preferred stall size | Technology stack / tags |
| Number of stalls required | Team member count |
| Business category | Project category |
| Special requirements/comments | Project description and special comments |

The required assessment roles are implemented as:

- `STUDENT`: can publish projects, edit/delete their own projects, and view their own submissions.
- `ADMIN`: can view users, disable/enable users, review projects, approve/reject projects, and delete projects.

The app also includes an extra `RECRUITER` role for browsing, liking, and following student work.

## Features

- Login and logout using Asgardeo OIDC.
- Authenticated profile display with username, name, email, contact number, and organization fields where available.
- Project submission with title, description, category, project type, team member count, submission date, tags, links, cover image, gallery images, and special comments.
- Student dashboard for viewing and editing the authenticated student's own projects.
- Admin dashboard for managing users and all project submissions.
- Secure API access using signed JWT bearer tokens after OIDC login.
- CSRF protection for unsafe requests.
- OWASP-focused controls for access control, injection, XSS, upload validation, security headers, CORS, rate limiting, and HTTPS configuration.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Zustand, Axios, React Router
- Backend: Node.js, Express, Mongoose, JWT, Asgardeo OIDC
- Database: MongoDB
- Image storage: Cloudinary, with safe fallback image support for local development
- Security: Helmet, CORS allow-list, CSRF checks, rate limiting, NoSQL operator rejection, file validation

## Project Structure

```text
dev-canvas/
  backend/
    scripts/
      init-db.js
      make-admin.js
    src/
      controllers/
      middleware/
      models/
      routes/
      services/
    .env.example
    package.json
  frontend/
    src/
      api/
      pages/
      components/
      store/
    package.json
```

## Prerequisites

- Node.js 18 or newer
- MongoDB local server or MongoDB Atlas database
- Asgardeo account and OIDC application
- Cloudinary account, optional for local testing

## Configuration

Do not commit real credentials to GitHub. Keep real values only in local `.env` files. Example placeholders are provided in `backend/.env.example`.

Create `backend/.env`:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/dev-canvas
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace_with_a_random_secret_at_least_32_characters
NODE_ENV=development
FORCE_HTTPS=false
HTTPS_ENABLED=false
HTTPS_KEY_PATH=./certs/localhost-key.pem
HTTPS_CERT_PATH=./certs/localhost.pem
ADMIN_EMAILS=admin@example.com

SERVER_URL=http://localhost:3000
ASGARDEO_ORG_NAME=replace_with_asgardeo_org_name
ASGARDEO_CLIENT_ID=replace_with_asgardeo_client_id
ASGARDEO_CLIENT_SECRET=replace_with_asgardeo_client_secret
ASGARDEO_CALLBACK_URL=http://localhost:3000/api/auth/asgardeo/callback
ASGARDEO_SCOPES=openid profile email
ASGARDEO_BASE_URL=https://api.asgardeo.io/t/replace_with_asgardeo_org_name
ASGARDEO_ACCOUNTS_BASE_URL=https://accounts.asgardeo.io/t/replace_with_asgardeo_org_name
ASGARDEO_AUTHORIZE_ENDPOINT=https://api.asgardeo.io/t/replace_with_asgardeo_org_name/oauth2/authorize
ASGARDEO_TOKEN_ENDPOINT=https://api.asgardeo.io/t/replace_with_asgardeo_org_name/oauth2/token
ASGARDEO_USERINFO_ENDPOINT=https://api.asgardeo.io/t/replace_with_asgardeo_org_name/oauth2/userinfo
ASGARDEO_LOGOUT_ENDPOINT=https://accounts.asgardeo.io/t/replace_with_asgardeo_org_name/authenticationendpoint/oauth2_logout.do

OIDC_ISSUER=https://api.asgardeo.io/t/replace_with_asgardeo_org_name/oauth2/token
OIDC_AUDIENCE=replace_with_asgardeo_client_id
OIDC_JWKS_URI=https://api.asgardeo.io/t/replace_with_asgardeo_org_name/oauth2/jwks

CLOUDINARY_CLOUD_NAME=replace_with_cloud_name
CLOUDINARY_API_KEY=replace_with_api_key
CLOUDINARY_API_SECRET=replace_with_api_secret
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

## Asgardeo OIDC Setup

1. Create an OIDC web application in Asgardeo.
2. Add this authorized redirect URL:

```text
http://localhost:3000/api/auth/asgardeo/callback
```

3. Copy the client ID, client secret, organization name, issuer, and JWKS URL into `backend/.env`.
4. Make sure the application requests these scopes:

```text
openid profile email
```

5. Create users in Asgardeo for testing.

To make a user an admin, add their email to `ADMIN_EMAILS` before they login:

```env
ADMIN_EMAILS=sachiniwijesingha80@gmail.com
```

If the user already exists in MongoDB, promote them manually:

```bash
cd backend
npm run admin:promote -- sachiniwijesingha80@gmail.com
```

## Install Dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Database Creation Script

The database initialization script is included at:

```text
backend/scripts/init-db.js
```

It connects to `MONGODB_URI`, creates the required MongoDB collections, and syncs Mongoose indexes for:

- users
- projects
- likes
- followers
- notifications

Run it before starting the app:

```bash
cd backend
npm run db:init
```

For a local MongoDB database, use:

```env
MONGODB_URI=mongodb://localhost:27017/dev-canvas
```

MongoDB creates the database automatically when collections are created.

## Run Locally

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Open the app:

```text
http://localhost:5173
```

Backend health check:

```text
http://localhost:3000/api/health
```

## HTTPS Configuration

The backend supports local HTTPS. Create local certificates, place them in `backend/certs`, then update `backend/.env`:

```env
HTTPS_ENABLED=true
HTTPS_KEY_PATH=./certs/localhost-key.pem
HTTPS_CERT_PATH=./certs/localhost.pem
SERVER_URL=https://localhost:3000
ASGARDEO_CALLBACK_URL=https://localhost:3000/api/auth/asgardeo/callback
```

Also add the HTTPS callback URL in Asgardeo:

```text
https://localhost:3000/api/auth/asgardeo/callback
```

If deploying behind a reverse proxy or hosted HTTPS platform, set:

```env
FORCE_HTTPS=true
NODE_ENV=production
```

## Build and Test

Backend syntax check:

```bash
cd backend
npm run build
```

Backend tests:

```bash
cd backend
npm run test
```

Frontend production build:

```bash
cd frontend
npm run build
```

## Deployment Instructions

1. Create a production MongoDB database, for example in MongoDB Atlas.
2. Configure a production Asgardeo OIDC application.
3. Configure production callback URLs in Asgardeo.
4. Set backend environment variables on the hosting platform.
5. Set frontend `VITE_API_URL` to the deployed backend API URL.
6. Build the frontend with `npm run build`.
7. Start the backend with `npm start`.
8. Serve the frontend `dist` directory using a static host such as Netlify, Vercel, Nginx, or the hosting provider of your choice.
9. Use HTTPS in production and set secure production values for `CLIENT_URL`, `SERVER_URL`, `FORCE_HTTPS`, and cookie settings.

Example production frontend variable:

```env
VITE_API_URL=https://your-backend-domain.com/api
```

Example production backend variables:

```env
NODE_ENV=production
FORCE_HTTPS=true
CLIENT_URL=https://your-frontend-domain.com
SERVER_URL=https://your-backend-domain.com
ASGARDEO_CALLBACK_URL=https://your-backend-domain.com/api/auth/asgardeo/callback
```

## API Summary

| Endpoint | Method | Access | Description |
| --- | --- | --- | --- |
| `/api/health` | GET | Public | Backend health check |
| `/api/auth/asgardeo` | GET | Public | Start Asgardeo login |
| `/api/auth/asgardeo/callback` | GET | Public | OIDC callback |
| `/api/auth/logout` | GET | Authenticated | Logout |
| `/api/auth/me` | GET | Authenticated | Get logged-in user profile |
| `/api/auth/select-role` | PATCH | Authenticated | Select onboarding role |
| `/api/users/profile` | PUT | Authenticated | Update profile |
| `/api/projects` | GET | Authenticated | View all projects |
| `/api/projects` | POST | Student | Create project |
| `/api/projects/me` | GET | Student | View own projects |
| `/api/projects/:id` | PUT | Project owner | Update own project |
| `/api/projects/:id` | DELETE | Project owner | Delete own project |
| `/api/admin/users` | GET | Admin | View all users |
| `/api/admin/users/:id/toggle-status` | PUT | Admin | Enable or disable user |
| `/api/admin/projects` | GET | Admin | View all projects |
| `/api/admin/projects/:id/status` | PATCH | Admin | Approve or reject project |
| `/api/admin/projects/:id` | DELETE | Admin | Delete any project |

## OWASP Security Controls

| OWASP area | Implemented control |
| --- | --- |
| Broken Access Control | Backend role checks and project ownership checks |
| Cryptographic Failures | Secrets loaded from environment variables, JWT secret length enforcement, HTTPS support |
| Injection | Mongoose queries and NoSQL operator rejection for `$` and dotted keys |
| Insecure Design | Server-side role enforcement, admin self-disable prevention, status allow-listing |
| Security Misconfiguration | Helmet headers, CORS allow-list, request size limits, hidden Express header |
| Vulnerable Components | Dependencies managed through npm and lock files |
| Authentication Failures | Asgardeo OIDC login, state validation, token validation, signed API tokens |
| Software/Data Integrity | Server-side validation before database writes |
| Logging and Monitoring | Audit logs for admin and project mutation actions |
| SSRF/File Upload Risks | File type allow-list, image signature validation, 5MB upload limit |

## Security Testing Checklist

| Test case | Expected result |
| --- | --- |
| Protected API without bearer token | `401 Unauthorized` |
| Invalid or expired token | `403 Invalid token` |
| Unsafe request without CSRF token | `403 Invalid CSRF token` |
| Non-admin opening admin API | `403 Forbidden` |
| Student editing another student's project | `403 Forbidden` |
| Invalid MongoDB id in admin/project route | `400 Bad Request` |
| NoSQL operator payload such as `{ "$ne": "" }` | `400 Bad Request` |
| Non-image upload as project image | `400 Bad Request` |
| Oversized image upload | `400 Bad Request` |

## Submission Checklist

Before uploading the GitHub repository:

- Remove real credentials from `.env`.
- Keep placeholder values in `.env.example`.
- Make the GitHub repository public.
- Confirm `npm run build` passes in both `backend` and `frontend`.
- Confirm `npm run test` passes in `backend`.
- Run `npm run db:init` and verify the app can connect to MongoDB.
- Confirm Asgardeo callback URLs match the app URL.
- Publish the blog and include the GitHub repository link.
- Create the required `SE2022XXX.json` file.

Example JSON submission file:

```json
{
  "sid": "SE2022XXX",
  "name": "Name with Initials",
  "app-url": "http://localhost:5173",
  "git": "https://github.com/your-username/dev-canvas",
  "blog": ["https://your-blog-url"]
}
```

## Notes About Secrets

The repository must not include:

- MongoDB usernames or passwords
- Asgardeo client secrets
- JWT secret values
- Cloudinary API secrets
- Private certificate keys

Use `.env` locally and configure environment variables directly in the deployment platform for production.
