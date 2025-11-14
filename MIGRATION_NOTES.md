# Vite to Next.js Migration Notes

This document outlines the changes made during the migration from Vite to Next.js, designed to help team members understand the new structure.

## Key Changes

### 1. Project Structure

**Before (Vite):**
```
src/
  App.tsx          # Main app component with routing logic
  main.tsx         # Entry point
  components/      # All components
index.html         # HTML entry point
vite.config.ts    # Vite configuration
```

**After (Next.js):**
```
src/
  app/             # Next.js App Router directory
    layout.tsx     # Root layout (replaces App.tsx wrapper)
    page.tsx       # Home page (replaces App.tsx routing)
    providers.tsx  # Client component wrapper for providers
    create-election/page.tsx
    vote/[electionId]/page.tsx
    results/[electionId]/page.tsx
    admin/[electionId]/page.tsx
    not-found.tsx
  components/      # All components (unchanged)
next.config.js     # Next.js configuration
```

### 2. Routing Changes

**Before:** State-based routing in `App.tsx`
- Used `useState` to manage current screen
- Navigation via callback props

**After:** File-based routing with Next.js App Router
- Routes defined by file structure in `src/app/`
- Navigation using Next.js `useRouter` hook
- Dynamic routes: `[electionId]` folders

### 3. Entry Point Changes

**Before:**
- `index.html` → `src/main.tsx` → `src/App.tsx`

**After:**
- Next.js automatically handles entry point
- `src/app/layout.tsx` wraps all pages
- `src/app/page.tsx` is the home page

### 4. Component Structure

**No changes to component files!** All components in `src/components/` remain exactly the same. They still use callback props for navigation, which are now handled by Next.js page components.

### 5. Configuration Files

**Removed:**
- `vite.config.ts`
- `index.html`
- `src/main.tsx`
- `src/App.tsx`

**Added:**
- `next.config.js` - Next.js configuration
- `next-env.d.ts` - Next.js TypeScript definitions
- `tsconfig.json` - Updated for Next.js
- `postcss.config.js` - PostCSS configuration
- `tailwind.config.ts` - Tailwind configuration

**Updated:**
- `package.json` - Next.js dependencies and scripts
- `.gitignore` - Added `.next/` and `out/` directories

### 6. Import Changes

**Fixed:** Removed version numbers from imports
- `class-variance-authority@0.7.1` → `class-variance-authority`
- `lucide-react@0.487.0` → `lucide-react`
- All Radix UI imports cleaned up

### 7. CSS Changes

**Added:** Tailwind directives to `src/index.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 8. Removed Unused Files

- `src/components/LoadingSpinner.tsx` - Not imported anywhere
- `src/components/Footer.tsx` - Not imported anywhere
- `src/styles/globals.css` - Not imported anywhere

## How It Works Now

### Navigation Flow

1. **Home Page** (`/`) - `src/app/page.tsx`
   - Handles authentication state
   - Shows SignIn/SignUp/Verify2FA/Dashboard based on auth status
   - Redirects to `/vote/[electionId]` if election query param exists

2. **Create Election** (`/create-election`) - `src/app/create-election/page.tsx`
   - Wraps `CreateElection` component
   - Navigates back to `/` on cancel
   - Navigates to `/admin/[electionId]` on success

3. **Vote** (`/vote/[electionId]`) - `src/app/vote/[electionId]/page.tsx`
   - Wraps `ElectionView` component
   - Gets `electionId` from URL params
   - Navigates to `/results/[electionId]` for results

4. **Results** (`/results/[electionId]`) - `src/app/results/[electionId]/page.tsx`
   - Wraps `ResultsView` component
   - Navigates to `/admin/[electionId]` for management

5. **Admin** (`/admin/[electionId]`) - `src/app/admin/[electionId]/page.tsx`
   - Wraps `AdminPanel` component
   - Navigates to `/results/[electionId]` for results

### Client vs Server Components

- **Server Components** (default): `layout.tsx`, `not-found.tsx`
- **Client Components** (use `"use client"`): All page components, `providers.tsx`, `AuthContext.tsx`, and components using hooks

## Development Commands

**Before:**
```bash
npm run dev    # Started Vite dev server
npm run build  # Built with Vite
```

**After:**
```bash
npm run dev    # Starts Next.js dev server (port 3000)
npm run build  # Builds with Next.js
npm run start  # Starts production server
npm run lint   # Runs ESLint
```

## What Stayed the Same

✅ All component logic and functionality
✅ All API calls and data fetching
✅ All UI components and styling
✅ Authentication flow
✅ State management patterns
✅ Component props and interfaces

## What Changed

🔄 Routing mechanism (state-based → file-based)
🔄 Entry point (manual → automatic)
🔄 Build tool (Vite → Next.js)
🔄 Development server (Vite → Next.js)

## For Team Members New to Next.js

### Key Concepts

1. **File-based Routing**: The file structure in `src/app/` determines your routes
   - `app/page.tsx` = `/`
   - `app/create-election/page.tsx` = `/create-election`
   - `app/vote/[electionId]/page.tsx` = `/vote/123` (dynamic)

2. **Layout**: `app/layout.tsx` wraps all pages (like a persistent header/footer)

3. **Client Components**: Components using hooks or browser APIs need `"use client"` at the top

4. **Navigation**: Use `useRouter()` from `next/navigation` instead of callback props
   ```tsx
   const router = useRouter();
   router.push('/create-election');
   ```

5. **URL Parameters**: Use `useParams()` to get dynamic route params
   ```tsx
   const params = useParams();
   const electionId = params.electionId;
   ```

## Troubleshooting

- **"Module not found"**: Check import paths - Next.js uses `@/` alias for `src/`
- **"use client" errors**: Add `"use client"` to components using hooks
- **Routing issues**: Check file structure matches desired URL structure
- **Build errors**: Run `npm install` to ensure all dependencies are installed

