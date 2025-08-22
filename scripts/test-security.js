#!/usr/bin/env node

/**
 * Security Testing Script
 * Validates security configurations and identifies potential vulnerabilities
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

class SecurityTester {
    constructor() {
        this.results = {
            passed: [],
            failed: [],
            warnings: [],
            recommendations: []
        };
        
        this.colors = {
            reset: '\x1b[0m',
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            magenta: '\x1b[35m',
            cyan: '\x1b[36m'
        };
    }

    /**
     * Run all security tests
     */
    async runAllTests() {
        console.log(`${this.colors.blue}🔒 Starting Security Tests...${this.colors.reset}\n`);
        
        // Test 1: Environment Variables
        this.testEnvironmentVariables();
        
        // Test 2: Password Requirements
        this.testPasswordRequirements();
        
        // Test 3: JWT Configuration
        this.testJWTConfiguration();
        
        // Test 4: CSRF Protection
        this.testCSRFProtection();
        
        // Test 5: Session Management
        this.testSessionManagement();
        
        // Test 6: File Permissions
        this.testFilePermissions();
        
        // Test 7: Dependencies
        await this.testDependencies();
        
        // Test 8: Code Analysis
        this.testCodeSecurity();
        
        // Generate report
        this.generateReport();
    }

    /**
     * Test environment variables
     */
    testEnvironmentVariables() {
        console.log(`${this.colors.cyan}📋 Testing Environment Variables...${this.colors.reset}`);
        
        const requiredVars = [
            'JWT_SECRET',
            'NODE_ENV'
        ];
        
        const optionalVars = [
            'JWT_ISSUER',
            'JWT_AUDIENCE',
            'CSRF_SECRET',
            'SESSION_SECRET'
        ];
        
        // Check required variables
        for (const varName of requiredVars) {
            const value = process.env[varName];
            if (!value) {
                this.addResult('failed', `Missing required environment variable: ${varName}`);
            } else if (varName === 'JWT_SECRET' && (value.length < 32 || value === 'your-jwt-secret-key')) {
                this.addResult('failed', `JWT_SECRET is too weak or using default value`);
            } else {
                this.addResult('passed', `Environment variable ${varName} is properly configured`);
            }
        }
        
        // Check optional variables
        for (const varName of optionalVars) {
            const value = process.env[varName];
            if (value && varName.includes('SECRET') && value.length < 32) {
                this.addResult('warning', `${varName} is too short (minimum 32 characters)`);
            } else if (value) {
                this.addResult('passed', `Optional environment variable ${varName} is configured`);
            }
        }
        
        console.log('');
    }

    /**
     * Test password requirements
     */
    testPasswordRequirements() {
        console.log(`${this.colors.cyan}🔐 Testing Password Requirements...${this.colors.reset}`);
        
        // Check validation.js file
        const validationPath = path.join(process.cwd(), 'src', 'utils', 'validation.js');
        if (fs.existsSync(validationPath)) {
            const content = fs.readFileSync(validationPath, 'utf8');
            
            if (content.includes('password.length < 8')) {
                this.addResult('passed', 'Password minimum length is set to 8 characters');
            } else {
                this.addResult('failed', 'Password minimum length should be 8 characters');
            }
            
            if (content.includes('requireUppercase') || content.includes('[A-Z]')) {
                this.addResult('passed', 'Password requires uppercase letters');
            } else {
                this.addResult('warning', 'Consider requiring uppercase letters in passwords');
            }
            
            if (content.includes('requireNumbers') || content.includes('\\d')) {
                this.addResult('passed', 'Password requires numbers');
            } else {
                this.addResult('warning', 'Consider requiring numbers in passwords');
            }
            
            if (content.includes('requireSpecialChars') || content.includes('[!@#$%^&*()')) {
                this.addResult('passed', 'Password requires special characters');
            } else {
                this.addResult('warning', 'Consider requiring special characters in passwords');
            }
        } else {
            this.addResult('failed', 'Password validation file not found');
        }
        
        console.log('');
    }

    /**
     * Test JWT configuration
     */
    testJWTConfiguration() {
        console.log(`${this.colors.cyan}🎫 Testing JWT Configuration...${this.colors.reset}`);
        
        // Check JWT helper file
        const jwtHelperPath = path.join(process.cwd(), 'src', 'utils', 'jwt-helper.js');
        if (fs.existsSync(jwtHelperPath)) {
            this.addResult('passed', 'JWT helper utility exists');
            
            const content = fs.readFileSync(jwtHelperPath, 'utf8');
            
            if (content.includes('algorithm: \'HS256\'')) {
                this.addResult('passed', 'JWT uses secure HS256 algorithm');
            } else {
                this.addResult('warning', 'Consider using HS256 algorithm for JWT');
            }
            
            if (content.includes('maxAge: 30 * 60')) {
                this.addResult('passed', 'JWT access token expiry is reasonable (30 minutes)');
            } else {
                this.addResult('warning', 'JWT access token expiry should be reasonable');
            }
            
            if (content.includes('tokenBlacklist')) {
                this.addResult('passed', 'JWT token blacklisting is implemented');
            } else {
                this.addResult('warning', 'Consider implementing JWT token blacklisting');
            }
        } else {
            this.addResult('failed', 'JWT helper utility not found');
        }
        
        console.log('');
    }

    /**
     * Test CSRF protection
     */
    testCSRFProtection() {
        console.log(`${this.colors.cyan}🛡️ Testing CSRF Protection...${this.colors.reset}`);
        
        // Check CSRF protection file
        const csrfPath = path.join(process.cwd(), 'src', 'utils', 'csrf-protection.js');
        if (fs.existsSync(csrfPath)) {
            this.addResult('passed', 'CSRF protection utility exists');
            
            const content = fs.readFileSync(csrfPath, 'utf8');
            
            if (content.includes('tokenLength: 32')) {
                this.addResult('passed', 'CSRF token length is secure (32 characters)');
            } else {
                this.addResult('warning', 'CSRF token length should be at least 32 characters');
            }
            
            if (content.includes('httpOnly: true')) {
                this.addResult('passed', 'CSRF tokens use HttpOnly cookies');
            } else {
                this.addResult('warning', 'Consider using HttpOnly cookies for CSRF tokens');
            }
            
            if (content.includes('sameSite: \'strict\'')) {
                this.addResult('passed', 'CSRF tokens use strict SameSite policy');
            } else {
                this.addResult('warning', 'Consider using strict SameSite policy for CSRF tokens');
            }
        } else {
            this.addResult('failed', 'CSRF protection utility not found');
        }
        
        console.log('');
    }

    /**
     * Test session management
     */
    testSessionManagement() {
        console.log(`${this.colors.cyan}🔑 Testing Session Management...${this.colors.reset}`);
        
        // Check secure session manager
        const sessionPath = path.join(process.cwd(), 'src', 'utils', 'secure-session-manager.js');
        if (fs.existsSync(sessionPath)) {
            this.addResult('passed', 'Secure session manager exists');
            
            const content = fs.readFileSync(sessionPath, 'utf8');
            
            if (content.includes('sensitiveData = new Map()')) {
                this.addResult('passed', 'Sensitive data stored in memory only');
            } else {
                this.addResult('warning', 'Consider storing sensitive data in memory only');
            }
            
            if (content.includes('sessionStorage.setItem')) {
                this.addResult('passed', 'Non-sensitive data uses sessionStorage');
            } else {
                this.addResult('warning', 'Consider using sessionStorage for non-sensitive data');
            }
            
            if (content.includes('beforeunload')) {
                this.addResult('passed', 'Session cleanup on page unload');
            } else {
                this.addResult('warning', 'Consider cleaning up sessions on page unload');
            }
        } else {
            this.addResult('failed', 'Secure session manager not found');
        }
        
        console.log('');
    }

    /**
     * Test file permissions
     */
    testFilePermissions() {
        console.log(`${this.colors.cyan}📁 Testing File Permissions...${this.colors.reset}`);
        
        const criticalFiles = [
            '.env',
            'package.json',
            'package-lock.json',
            'firebase.json'
        ];
        
        for (const file of criticalFiles) {
            const filePath = path.join(process.cwd(), file);
            if (fs.existsSync(filePath)) {
                try {
                    const stats = fs.statSync(filePath);
                    const mode = stats.mode.toString(8);
                    
                    if (mode.endsWith('600') || mode.endsWith('400')) {
                        this.addResult('passed', `File ${file} has secure permissions`);
                    } else {
                        this.addResult('warning', `File ${file} permissions could be more restrictive`);
                    }
                } catch (error) {
                    this.addResult('warning', `Could not check permissions for ${file}`);
                }
            }
        }
        
        console.log('');
    }

    /**
     * Test dependencies for known vulnerabilities
     */
    async testDependencies() {
        console.log(`${this.colors.cyan}📦 Testing Dependencies...${this.colors.reset}`);
        
        const packagePath = path.join(process.cwd(), 'package.json');
        if (fs.existsSync(packagePath)) {
            try {
                const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
                
                // Check for known vulnerable packages
                const vulnerablePackages = [
                    'lodash',
                    'moment',
                    'jquery',
                    'express'
                ];
                
                for (const pkg of vulnerablePackages) {
                    if (dependencies[pkg]) {
                        this.addResult('warning', `Package ${pkg} detected - check for known vulnerabilities`);
                    }
                }
                
                // Check for security-related packages
                const securityPackages = [
                    'helmet',
                    'express-rate-limit',
                    'express-mongo-sanitize',
                    'jsonwebtoken'
                ];
                
                for (const pkg of securityPackages) {
                    if (dependencies[pkg]) {
                        this.addResult('passed', `Security package ${pkg} is included`);
                    } else {
                        this.addResult('warning', `Consider adding security package ${pkg}`);
                    }
                }
                
            } catch (error) {
                this.addResult('failed', 'Could not parse package.json');
            }
        }
        
        console.log('');
    }

    /**
     * Test code security
     */
    testCodeSecurity() {
        console.log(`${this.colors.cyan}🔍 Testing Code Security...${this.colors.reset}`);
        
        const srcPath = path.join(process.cwd(), 'src');
        if (fs.existsSync(srcPath)) {
            this.scanDirectoryForSecurityIssues(srcPath);
        }
        
        console.log('');
    }

    /**
     * Scan directory for security issues
     */
    scanDirectoryForSecurityIssues(dirPath, depth = 0) {
        if (depth > 3) return; // Limit recursion depth
        
        try {
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                const stats = fs.statSync(fullPath);
                
                if (stats.isDirectory()) {
                    this.scanDirectoryForSecurityIssues(fullPath, depth + 1);
                } else if (item.endsWith('.js') || item.endsWith('.ts') || item.endsWith('.tsx')) {
                    this.scanFileForSecurityIssues(fullPath);
                }
            }
        } catch (error) {
            // Skip directories we can't read
        }
    }

    /**
     * Scan file for security issues
     */
    scanFileForSecurityIssues(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const fileName = path.basename(filePath);
            
            // Check for dangerous patterns
            const dangerousPatterns = [
                { pattern: /eval\s*\(/, description: 'eval() usage' },
                { pattern: /innerHTML\s*=/, description: 'innerHTML assignment' },
                { pattern: /document\.write/, description: 'document.write usage' },
                { pattern: /localStorage\.setItem.*password/i, description: 'Password in localStorage' },
                { pattern: /console\.log.*password/i, description: 'Password logging' }
            ];
            
            for (const { pattern, description } of dangerousPatterns) {
                if (pattern.test(content)) {
                    this.addResult('warning', `Potential security issue in ${fileName}: ${description}`);
                }
            }
            
            // Check for good security practices
            const goodPatterns = [
                { pattern: /input.*sanitize/i, description: 'Input sanitization' },
                { pattern: /csrf.*token/i, description: 'CSRF token usage' },
                { pattern: /rate.*limit/i, description: 'Rate limiting' },
                { pattern: /helmet/i, description: 'Security headers' }
            ];
            
            for (const { pattern, description } of goodPatterns) {
                if (pattern.test(content)) {
                    this.addResult('passed', `Good security practice in ${fileName}: ${description}`);
                }
            }
            
        } catch (error) {
            // Skip files we can't read
        }
    }

    /**
     * Add test result
     */
    addResult(type, message) {
        this.results[type].push(message);
        
        const color = this.colors[type === 'passed' ? 'green' : type === 'failed' ? 'red' : 'yellow'];
        const icon = type === 'passed' ? '✅' : type === 'failed' ? '❌' : '⚠️';
        
        console.log(`${color}${icon} ${message}${this.colors.reset}`);
    }

    /**
     * Generate security report
     */
    generateReport() {
        console.log(`\n${this.colors.blue}📊 Security Test Results${this.colors.reset}`);
        console.log('='.repeat(50));
        
        const totalTests = this.results.passed.length + this.results.failed.length + this.results.warnings.length;
        const passRate = totalTests > 0 ? ((this.results.passed.length / totalTests) * 100).toFixed(1) : 0;
        
        console.log(`${this.colors.green}✅ Passed: ${this.results.passed.length}${this.colors.reset}`);
        console.log(`${this.colors.red}❌ Failed: ${this.results.failed.length}${this.colors.reset}`);
        console.log(`${this.colors.yellow}⚠️ Warnings: ${this.results.warnings.length}${this.colors.reset}`);
        console.log(`${this.colors.blue}📈 Pass Rate: ${passRate}%${this.colors.reset}`);
        
        if (this.results.failed.length > 0) {
            console.log(`\n${this.colors.red}🚨 Critical Issues to Fix:${this.colors.reset}`);
            this.results.failed.forEach(issue => {
                console.log(`  • ${issue}`);
            });
        }
        
        if (this.results.warnings.length > 0) {
            console.log(`\n${this.colors.yellow}⚠️ Recommendations:${this.colors.reset}`);
            this.results.warnings.forEach(warning => {
                console.log(`  • ${warning}`);
            });
        }
        
        if (this.results.passed.length > 0) {
            console.log(`\n${this.colors.green}✅ Security Strengths:${this.colors.reset}`);
            this.results.passed.slice(0, 5).forEach(strength => {
                console.log(`  • ${strength}`);
            });
        }
        
        // Generate recommendations
        this.generateRecommendations();
        
        console.log('\n' + '='.repeat(50));
        
        if (this.results.failed.length === 0) {
            console.log(`${this.colors.green}🎉 All critical security tests passed!${this.colors.reset}`);
        } else {
            console.log(`${this.colors.red}🔒 Please fix the critical security issues above.${this.colors.reset}`);
        }
    }

    /**
     * Generate security recommendations
     */
    generateRecommendations() {
        console.log(`\n${this.colors.cyan}💡 Security Recommendations:${this.colors.reset}`);
        
        const recommendations = [
            'Enable HTTPS in production',
            'Implement proper logging and monitoring',
            'Regular security audits and penetration testing',
            'Keep all dependencies updated',
            'Use security headers (Helmet.js)',
            'Implement proper error handling without information disclosure',
            'Regular backup and disaster recovery testing',
            'Employee security training and awareness'
        ];
        
        recommendations.forEach(rec => {
            console.log(`  • ${rec}`);
        });
    }
}

// Run security tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const tester = new SecurityTester();
    tester.runAllTests().catch(console.error);
}

export default SecurityTester;



