# File Structure Documentation

## New Organized Structure

The codebase has been reorganized to follow modern web development best practices with clear separation of concerns:

```
carmen-para-sight/
├── public/                          # Static HTML files & assets
│   ├── *.html                       # All HTML pages
│   └── vite.svg                     # Static assets
│
├── src/                             # Source code
│   ├── components/                  # React components
│   ├── pages/                       # Page-specific JavaScript
│   │   ├── dashboard.js
│   │   ├── index.js
│   │   ├── patientPortal.js
│   │   ├── patientSign-in.js
│   │   └── patientSign-up.js
│   ├── services/                    # API services & data handling
│   │   ├── auth-service.js
│   │   ├── config.js
│   │   ├── firestoredb.js
│   │   ├── geminiService.ts
│   │   └── llamaService.ts
│   ├── utils/                       # Utility functions
│   │   ├── auth-guard.js
│   │   ├── shared-header.js
│   │   └── validation.js
│   ├── styles/                      # CSS files
│   │   ├── ai-assistant.css
│   │   ├── dashboard.css
│   │   ├── index.css
│   │   ├── patientPortal.css
│   │   ├── patientSign-in.css
│   │   ├── patientSign-up.css
│   │   ├── portal.css
│   │   └── shared-header.css
│   ├── config/                      # Configuration files
│   │   └── firebase.ts
│   ├── types/                       # TypeScript type definitions
│   ├── lib/                         # Third-party libraries
│   └── index.css                    # Global styles
│
├── api/                             # Express API server
│   └── index.js
│
├── scripts/                         # Build & utility scripts
│   └── verify-env.js
│
├── package.json                     # Dependencies & scripts
├── vite.config.js                   # Build configuration
├── tsconfig.json                    # TypeScript configuration
└── README files & config files
```

## Key Improvements

### 1. **Clear Separation of Concerns**
- **Pages**: Page-specific JavaScript logic
- **Services**: API communication, authentication, database operations
- **Utils**: Reusable utility functions and validation
- **Styles**: All CSS files in one location

### 2. **Modern Build Configuration**
- Updated `vite.config.js` with proper multi-page support
- Path aliases for clean imports:
  - `@` → `src/`
  - `@services` → `src/services/`
  - `@utils` → `src/utils/`
  - `@styles` → `src/styles/`

### 3. **Consistent Import Patterns**
- All imports use relative paths from their new locations
- Service imports: `import { auth } from '../services/auth-service.js'`
- Utility imports: `import { validation } from '../utils/validation.js'`

### 4. **Static Assets Organization**
- All HTML files in `public/` directory
- CSS and JavaScript properly separated in `src/`
- Build assets will be generated in `dist/`

## Migration Summary

### Files Moved:
- `public/js/auth-service.js` → `src/services/auth-service.js`
- `public/js/firestoredb.js` → `src/services/firestoredb.js`
- `public/js/config.js` → `src/services/config.js`
- `public/js/validation.js` → `src/utils/validation.js`
- `public/js/auth-guard.js` → `src/utils/auth-guard.js`
- `public/js/shared-header.js` → `src/utils/shared-header.js`
- `public/js/[page].js` → `src/pages/[page].js`
- `public/pages/css/*.css` → `src/styles/*.css`
- `public/pages/*.html` → `public/*.html`

### Updated References:
- All HTML script/link tags updated to new paths
- All JavaScript imports updated to new locations
- Build configuration updated for multi-page support

## Benefits

1. **Maintainability**: Clear organization makes code easier to find and modify
2. **Scalability**: Structure supports growth with proper separation
3. **Developer Experience**: Modern tooling with path aliases and clear imports
4. **Build Optimization**: Proper asset organization for efficient bundling
5. **Team Collaboration**: Standard structure familiar to developers

## Next Steps

1. Update any remaining hardcoded paths in documentation
2. Consider migrating to TypeScript for better type safety
3. Implement proper component architecture for reusable UI elements
4. Add unit tests following the new structure 