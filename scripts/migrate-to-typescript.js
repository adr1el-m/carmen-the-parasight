#!/usr/bin/env node

/**
 * TypeScript Migration Script
 * Helps migrate JavaScript files to TypeScript with proper typing
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 TypeScript Migration Script');
console.log('================================\n');

// Files to migrate (in order of dependency)
const filesToMigrate = [
  // Core utilities (migrated first)
  'src/utils/environment.js',
  'src/utils/logger.js',
  'src/utils/validation.js',
  
  // Services (depend on utilities)
  'src/services/config.js',
  'src/services/auth-service.js',
  'src/services/secure-error-handler.js',
  'src/services/auth-error-handler.js',
  
  // Additional utilities
  'src/utils/security-middleware.js',
  'src/utils/db-sanitizer.js',
  'src/utils/file-security.js',
  'src/utils/input-validator.js',
  'src/utils/secure-session-manager.js',
  'src/utils/csrf-protection.js',
  'src/utils/jwt-helper.js',
  'src/utils/shared-header.js',
  'src/utils/config-validator.js',
  'src/utils/error-sanitizer.js',
  'src/utils/firebase-quota-helper.js',
  'src/utils/auth-guard.js',
  
  // Scripts
  'scripts/setup-firebase-security.js',
  'scripts/test-input-security.js',
  'scripts/test-security.js',
  'scripts/validate-env-secure.js',
  'scripts/verify-env.js'
];

// TypeScript templates for common patterns
const tsTemplates = {
  // Service class template
  serviceClass: `/**
 * Service Class Template
 * TypeScript implementation with proper typing
 */

export interface ServiceConfig {
  // Add configuration interface
}

export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ServiceClass {
  private config: ServiceConfig;

  constructor(config: ServiceConfig) {
    this.config = config;
  }

  // Add service methods with proper typing
}
`,

  // Utility function template
  utilityFunctions: `/**
 * Utility Functions Template
 * TypeScript implementation with proper typing
 */

export interface UtilityOptions {
  // Add options interface
}

export type UtilityResult<T = any> = T | null;

export const utilityFunction = (input: string, options?: UtilityOptions): UtilityResult<string> => {
  // Add utility logic with proper typing
  return input || null;
};

export default utilityFunction;
`,

  // Component template
  component: `import React, { useState, useEffect, ReactNode } from 'react';

interface ComponentProps {
  children?: ReactNode;
  // Add other props
}

interface ComponentState {
  // Add state interface
}

const Component: React.FC<ComponentProps> = ({ children, ...props }) => {
  const [state, setState] = useState<ComponentState>({
    // Initialize state
  });

  useEffect(() => {
    // Add effects
  }, []);

  return (
    <div>
      {children}
    </div>
  );
};

export default Component;
`
};

// Migration steps
const migrationSteps = [
  {
    name: 'Install TypeScript dependencies',
    command: 'npm install --save-dev typescript @types/node @types/react @types/react-dom'
  },
  {
    name: 'Install ESLint TypeScript support',
    command: 'npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin'
  },
  {
    name: 'Install Prettier TypeScript support',
    command: 'npm install --save-dev prettier @types/prettier'
  }
];

// Function to migrate a single file
function migrateFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const newPath = filePath.replace('.js', '.ts');
    const fullNewPath = path.join(process.cwd(), newPath);

    // Basic JavaScript to TypeScript conversion
    let tsContent = content;

    // Convert require statements to imports
    tsContent = tsContent.replace(
      /const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\)/g,
      'import $1 from \'$2\''
    );

    // Convert module.exports to export default
    tsContent = tsContent.replace(
      /module\.exports\s*=\s*(\w+)/g,
      'export default $1'
    );

    // Convert exports. to export
    tsContent = tsContent.replace(
      /exports\.(\w+)\s*=\s*(\w+)/g,
      'export { $2 as $1 }'
    );

    // Add basic type annotations
    tsContent = tsContent.replace(
      /function\s+(\w+)\s*\(([^)]*)\)/g,
      (match, funcName, params) => {
        if (params.trim() === '') {
          return `function ${funcName}(): void`;
        }
        const typedParams = params.split(',').map(param => {
          const trimmed = param.trim();
          if (trimmed.includes('=')) {
            const [name, defaultValue] = trimmed.split('=');
            return `${name.trim()}: any = ${defaultValue.trim()}`;
          }
          return `${trimmed}: any`;
        }).join(', ');
        return `function ${funcName}(${typedParams}): any`;
      }
    );

    // Add interface for common patterns
    if (tsContent.includes('class')) {
      tsContent = `// TypeScript interfaces for ${path.basename(filePath, '.js')}\n` + tsContent;
    }

    // Write TypeScript file
    fs.writeFileSync(fullNewPath, tsContent);
    
    // Remove original JavaScript file
    fs.unlinkSync(fullPath);
    
    console.log(`✅ Migrated: ${filePath} → ${newPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to migrate ${filePath}:`, error.message);
    return false;
  }
}

// Function to update import statements
function updateImports() {
  console.log('\n🔄 Updating import statements...');
  
  const tsFiles = getAllTypeScriptFiles('src');
  
  tsFiles.forEach(filePath => {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let updated = false;
      
      // Update .js imports to .ts
      if (content.includes('.js\'')) {
        content = content.replace(/\.js'/g, '.ts\'');
        updated = true;
      }
      
      if (updated) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Updated imports in: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Failed to update imports in ${filePath}:`, error.message);
    }
  });
}

// Function to get all TypeScript files
function getAllTypeScriptFiles(dir) {
  const files = [];
  
  function scanDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(fullPath);
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        files.push(fullPath);
      }
    });
  }
  
  scanDirectory(dir);
  return files;
}

// Function to create type definition files
function createTypeDefinitions() {
  console.log('\n📝 Creating type definition files...');
  
  const typeDefs = [
    {
      path: 'src/types/global.d.ts',
      content: `/**
 * Global Type Definitions
 */

declare global {
  interface Window {
    env?: Record<string, string>;
  }
  
  interface ImportMetaEnv {
    VITE_FIREBASE_API_KEY: string;
    VITE_FIREBASE_AUTH_DOMAIN: string;
    VITE_FIREBASE_PROJECT_ID: string;
    VITE_FIREBASE_STORAGE_BUCKET: string;
    VITE_FIREBASE_MESSAGING_SENDER_ID: string;
    VITE_FIREBASE_APP_ID: string;
    VITE_FIREBASE_MEASUREMENT_ID?: string;
    VITE_GEMINI_API_KEY: string;
    NODE_ENV: string;
    MODE: string;
    PROD: boolean;
    DEV: boolean;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
`
    },
    {
      path: 'src/types/modules.d.ts',
      content: `/**
 * Module Type Definitions
 */

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

declare module '*.ico' {
  const content: string;
  export default content;
}

declare module '*.bmp' {
  const content: string;
  export default content;
}
`
    }
  ];
  
  typeDefs.forEach(({ path: filePath, content }) => {
    const fullPath = path.join(process.cwd(), filePath);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Created: ${filePath}`);
  });
}

// Main migration function
async function runMigration() {
  try {
    console.log('🚀 Starting TypeScript migration...\n');
    
    // Step 1: Install dependencies
    console.log('📦 Installing TypeScript dependencies...');
    for (const step of migrationSteps) {
      console.log(`\n🔧 ${step.name}...`);
      try {
        execSync(step.command, { stdio: 'inherit' });
        console.log(`✅ ${step.name} completed`);
      } catch (error) {
        console.error(`❌ ${step.name} failed:`, error.message);
        console.log('⚠️  Continuing with migration...');
      }
    }
    
    // Step 2: Create type definitions
    createTypeDefinitions();
    
    // Step 3: Migrate files
    console.log('\n🔄 Migrating JavaScript files to TypeScript...');
    let successCount = 0;
    
    for (const file of filesToMigrate) {
      if (migrateFile(file)) {
        successCount++;
      }
    }
    
    // Step 4: Update imports
    updateImports();
    
    // Step 5: Run TypeScript compilation
    console.log('\n🔍 Running TypeScript compilation...');
    try {
      execSync('npx tsc --noEmit', { stdio: 'inherit' });
      console.log('✅ TypeScript compilation successful');
    } catch (error) {
      console.log('⚠️  TypeScript compilation found errors (this is expected during migration)');
    }
    
    // Summary
    console.log('\n🎉 Migration completed!');
    console.log(`✅ Successfully migrated: ${successCount}/${filesToMigrate.length} files`);
    console.log('\n📋 Next steps:');
    console.log('1. Fix TypeScript compilation errors');
    console.log('2. Add proper type annotations');
    console.log('3. Update ESLint configuration for TypeScript');
    console.log('4. Run tests to ensure functionality');
    console.log('5. Commit changes to version control');
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration, migrateFile, createTypeDefinitions };



