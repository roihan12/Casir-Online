# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A multi-branch Point of Sale (POS) system for retail management with inventory tracking, sales/purchase transactions, and customer relationship management. Built with React (Vite) frontend and Node.js/Express backend with PostgreSQL + Prisma ORM.

**Working Directory Structure:**
- `client-backup/` - React frontend (Vite + React 19 + Tailwind CSS)
- `server/` - Express.js backend with Prisma ORM

## Development Commands

### Backend (server/)
```bash
cd server
npm install
npm run dev          # Start development server with nodemon (port 3000)
npm start            # Start production server
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Run database migrations
npm run prisma:studio      # Open Prisma Studio for database inspection
npm run seed          # Run database seed script
```

### Frontend (client-backup/)
```bash
cd client-backup
npm install
npm run dev          # Start Vite dev server (port 5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Architecture

### Backend Architecture

**Entry Point:** `server/server.js` → `server/src/app.js`

**Core Configuration:**
- `src/config/db.js` - Prisma client configuration
- `src/config/initializer.js` - Application initialization services
- `prisma/schema.prisma` - Database schema with all models

**Design Pattern:** Route → Controller → Service → Prisma (database)

**Key Directories:**
- `src/routes/` - Express route definitions (auth, cabang, produk, transaksi, etc.)
- `src/controllers/` - Request handlers for each domain
- `src/services/` - Business logic layer
- `src/validation/` - Joi/express-validator schemas
- `src/middleware/` - Auth, validation, error handling
- `src/utils/` - Helper functions (logger, number generators, etc.)
- `src/schedulers/` - Cron jobs for notifications

**Database Views:** The application uses PostgreSQL views for dashboard reporting. The `viewRefreshService` listens for NOTIFY events to refresh materialized views when data changes.

**Authentication:** JWT-based with httpOnly cookies. Multi-role support: `super_admin`, `admin_cabang`, `kasir`. Users can have multiple roles across multiple branches.

### Frontend Architecture

**Entry Point:** `client-backup/src/main.jsx` → `App.jsx`

**Routing:** React Router v7 with custom route protection:
- `ProtectedRoute` - Auth wrapper with permission checks
- `WithoutAuth` - Public-only routes (login)
- `RoleBasedRoute` - Role-specific access
- `DynamicLayout` - Renders appropriate layout based on user role

**State Management:**
- Zustand for global auth state (`src/app/store/useAuthStore.js`)
- React Context for feature-specific state (POS, Cabang)
- TanStack Query (React Query) for server state management

**Feature Structure:** Each feature follows the pattern:
```
src/features/{feature-name}/
  pages/          # Page components
  components/     # Reusable feature components
  hooks/          # Custom hooks (queries, mutations)
  services/       # API service functions
  context/        # React Context providers
  index.js        # Feature exports
```

**Major Features:**
- `auth/` - Login, password reset
- `users/` - User, role, permission management
- `cabang/` - Branch management
- `products/` - Product master, categories, pricing
- `inventory/` - Stock management, transfers, batches
- `pos/` - Point of sale with context-based state management
- `transactions/` - Global transactions, returns
- `customers/` - Customer management, loyalty
- `suppliers/` - Supplier management, purchases
- `reports/` - Sales, finance, inventory reports

**UI Components:** Shadcn/UI-style components in `src/common/components/ui/` (button, card, dialog, form, etc.)

### Permission System

The app uses a granular permission system with format `{resource}:{action}` (e.g., `produk:read`, `user:write`). Permissions are checked:
- Backend: Middleware validates JWT and permissions
- Frontend: `ProtectedRoute` components prevent unauthorized navigation

**Important:** `requiredPermission` prop on routes specifies the minimum permission needed.

### Multi-Tenancy (Branches)

Users are associated with branches through `UserRole` junction table. Many operations (products, inventory, transactions) are branch-scoped. The frontend uses `CabangContext` to manage the currently selected branch.

## Key Implementation Notes

### Database Migrations
Always run `npm run prisma:migrate` after schema changes. The app uses `DIRECT_URL` environment variable for the database connection.

### API Communication
- Axios instance in `client-backup/src/common/utils/api.js` has `withCredentials: true` for cookie-based auth
- All API calls go through `/api` prefix
- 401 responses trigger automatic redirect to login

### Feature Exports
Features use `index.js` barrel exports. Import from feature root: `import { ProductManagement } from './features/products'`

### POS Module
The POS feature uses a comprehensive context/hook architecture documented in `client-backup/src/features/pos/README.md`.

### Validation
- Backend: Joi schemas in `src/validation/`
- Frontend: Zod + react-hook-form for form validation

### Dates
Use `date-fns` for date manipulation. Backend stores dates in UTC, frontend handles timezone conversion.

## Environment Setup

Backend requires `.env` file with:
- `DIRECT_URL` - PostgreSQL connection string
- `PORT` - Server port (default 3000)
- `JWT_SECRET` - JWT signing key
- `ENABLE_SCHEDULERS` - Set to "true" to enable cron jobs

Frontend environment variables (create `.env` in client-backup/):
- `VITE_API_URL` - Backend API URL (default http://localhost:3000/api)

## Common Patterns

**Adding a new feature:**
1. Create feature directory in both `src/features/{name}/`
2. Backend: routes → controller → service → validation
3. Frontend: pages, components, hooks, services
4. Add route in `App.jsx` with appropriate permissions
5. Export from `index.js` for clean imports

**Service layer:** All database operations go through service functions. Controllers should only handle HTTP concerns.

**Error handling:** Use the `responseError` utility for consistent error responses.
