#!/usr/bin/env node

/**
 * Input Security Testing Script
 * Tests input validation, sanitization, and security measures
 */

import fs from 'fs';
import path from 'path';

class InputSecurityTester {
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
            cyan: '\x1b[36m'
        };
    }

    /**
     * Run all input security tests
     */
    async runAllTests() {
        console.log(`${this.colors.blue}🔒 Starting Input Security Tests...${this.colors.reset}\n`);
        
        // Test 1: Input Validation Utilities
        this.testInputValidationUtilities();
        
        // Test 2: Database Sanitization
        this.testDatabaseSanitization();
        
        // Test 3: File Upload Security
        this.testFileUploadSecurity();
        
        // Test 4: XSS Protection
        this.testXSSProtection();
        
        // Test 5: SQL Injection Protection
        this.testSQLInjectionProtection();
        
        // Test 6: Component Validation
        this.testComponentValidation();
        
        // Generate report
        this.generateReport();
    }

    /**
     * Test input validation utilities
     */
    testInputValidationUtilities() {
        console.log(`${this.colors.cyan}📋 Testing Input Validation Utilities...${this.colors.reset}`);
        
        const validationPath = path.join(process.cwd(), 'src', 'utils', 'input-validator.js');
        if (fs.existsSync(validationPath)) {
            this.addResult('passed', 'Input validator utility exists');
            
            const content = fs.readFileSync(validationPath, 'utf8');
            
            // Check for XSS protection
            if (content.includes('DOMPurify') || content.includes('xss')) {
                this.addResult('passed', 'XSS protection libraries are imported');
            } else {
                this.addResult('warning', 'Consider adding XSS protection libraries');
            }
            
            // Check for comprehensive validation
            if (content.includes('validateEmail') && content.includes('validatePassword')) {
                this.addResult('passed', 'Comprehensive validation methods exist');
            } else {
                this.addResult('failed', 'Missing essential validation methods');
            }
            
            // Check for input sanitization
            if (content.includes('sanitizeText') || content.includes('sanitizeHTML')) {
                this.addResult('passed', 'Input sanitization methods exist');
            } else {
                this.addResult('failed', 'Missing input sanitization methods');
            }
            
        } else {
            this.addResult('failed', 'Input validator utility not found');
        }
        
        console.log('');
    }

    /**
     * Test database sanitization
     */
    testDatabaseSanitization() {
        console.log(`${this.colors.cyan}🗄️ Testing Database Sanitization...${this.colors.reset}`);
        
        const dbSanitizerPath = path.join(process.cwd(), 'src', 'utils', 'db-sanitizer.js');
        if (fs.existsSync(dbSanitizerPath)) {
            this.addResult('passed', 'Database sanitizer utility exists');
            
            const content = fs.readFileSync(dbSanitizerPath, 'utf8');
            
            // Check for SQL injection protection
            if (content.includes('dangerousPatterns') && content.includes('union|select|insert')) {
                this.addResult('passed', 'SQL injection protection patterns defined');
            } else {
                this.addResult('failed', 'SQL injection protection patterns missing');
            }
            
            // Check for parameter sanitization
            if (content.includes('sanitizeParam') || content.includes('sanitizeParams')) {
                this.addResult('passed', 'Parameter sanitization methods exist');
            } else {
                this.addResult('failed', 'Parameter sanitization methods missing');
            }
            
            // Check for query validation
            if (content.includes('validateQueryStructure')) {
                this.addResult('passed', 'Query structure validation exists');
            } else {
                this.addResult('warning', 'Consider adding query structure validation');
            }
            
        } else {
            this.addResult('failed', 'Database sanitizer utility not found');
        }
        
        console.log('');
    }

    /**
     * Test file upload security
     */
    testFileUploadSecurity() {
        console.log(`${this.colors.cyan}📁 Testing File Upload Security...${this.colors.reset}`);
        
        const fileSecurityPath = path.join(process.cwd(), 'src', 'utils', 'file-security.js');
        if (fs.existsSync(fileSecurityPath)) {
            this.addResult('passed', 'File security manager exists');
            
            const content = fs.readFileSync(fileSecurityPath, 'utf8');
            
            // Check for dangerous extension blocking
            if (content.includes('dangerousExtensions') && content.includes('exe')) {
                this.addResult('passed', 'Dangerous file extensions are blocked');
            } else {
                this.addResult('failed', 'Dangerous file extension blocking missing');
            }
            
            // Check for file content validation
            if (content.includes('validateFileContent') || content.includes('getFileSignature')) {
                this.addResult('passed', 'File content validation exists');
            } else {
                this.addResult('warning', 'Consider adding file content validation');
            }
            
            // Check for filename sanitization
            if (content.includes('sanitizeFilename')) {
                this.addResult('passed', 'Filename sanitization exists');
            } else {
                this.addResult('failed', 'Filename sanitization missing');
            }
            
            // Check for virus scan simulation
            if (content.includes('simulateVirusScan')) {
                this.addResult('passed', 'Virus scan simulation exists');
            } else {
                this.addResult('warning', 'Consider adding virus scanning');
            }
            
        } else {
            this.addResult('failed', 'File security manager not found');
        }
        
        console.log('');
    }

    /**
     * Test XSS protection
     */
    testXSSProtection() {
        console.log(`${this.colors.cyan}🛡️ Testing XSS Protection...${this.colors.reset}`);
        
        const srcPath = path.join(process.cwd(), 'src');
        if (fs.existsSync(srcPath)) {
            this.scanForXSSVulnerabilities(srcPath);
        }
        
        console.log('');
    }

    /**
     * Scan for XSS vulnerabilities
     */
    scanForXSSVulnerabilities(dirPath, depth = 0) {
        if (depth > 3) return;
        
        try {
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                const stats = fs.statSync(fullPath);
                
                if (stats.isDirectory()) {
                    this.scanForXSSVulnerabilities(fullPath, depth + 1);
                } else if (item.endsWith('.js') || item.endsWith('.ts') || item.endsWith('.tsx')) {
                    this.checkFileForXSSVulnerabilities(fullPath);
                }
            }
        } catch (error) {
            // Skip directories we can't read
        }
    }

    /**
     * Check file for XSS vulnerabilities
     */
    checkFileForXSSVulnerabilities(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const fileName = path.basename(filePath);
            
            // Check for dangerous XSS patterns
            const xssPatterns = [
                { pattern: /innerHTML\s*=/, description: 'innerHTML assignment' },
                { pattern: /outerHTML\s*=/, description: 'outerHTML assignment' },
                { pattern: /document\.write/, description: 'document.write usage' },
                { pattern: /eval\s*\(/, description: 'eval() usage' },
                { pattern: /setTimeout\s*\(\s*['"`][^'"`]*['"`]/, description: 'Dynamic setTimeout' },
                { pattern: /setInterval\s*\(\s*['"`][^'"`]*['"`]/, description: 'Dynamic setInterval' }
            ];
            
            for (const { pattern, description } of xssPatterns) {
                if (pattern.test(content)) {
                    this.addResult('warning', `Potential XSS vulnerability in ${fileName}: ${description}`);
                }
            }
            
            // Check for good XSS protection practices
            const goodPatterns = [
                { pattern: /textContent\s*=/, description: 'textContent usage (safe)' },
                { pattern: /createTextNode/, description: 'createTextNode usage (safe)' },
                { pattern: /DOMPurify/, description: 'DOMPurify usage' },
                { pattern: /xss/, description: 'XSS library usage' },
                { pattern: /sanitizeHTML/, description: 'HTML sanitization' }
            ];
            
            for (const { pattern, description } of goodPatterns) {
                if (pattern.test(content)) {
                    this.addResult('passed', `Good XSS protection in ${fileName}: ${description}`);
                }
            }
            
        } catch (error) {
            // Skip files we can't read
        }
    }

    /**
     * Test SQL injection protection
     */
    testSQLInjectionProtection() {
        console.log(`${this.colors.cyan}💉 Testing SQL Injection Protection...${this.colors.reset}`);
        
        const srcPath = path.join(process.cwd(), 'src');
        if (fs.existsSync(srcPath)) {
            this.scanForSQLInjectionVulnerabilities(srcPath);
        }
        
        console.log('');
    }

    /**
     * Scan for SQL injection vulnerabilities
     */
    scanForSQLInjectionVulnerabilities(dirPath, depth = 0) {
        if (depth > 3) return;
        
        try {
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                const stats = fs.statSync(fullPath);
                
                if (stats.isDirectory()) {
                    this.scanForSQLInjectionVulnerabilities(fullPath, depth + 1);
                } else if (item.endsWith('.js') || item.endsWith('.ts') || item.endsWith('.tsx')) {
                    this.checkFileForSQLInjectionVulnerabilities(fullPath);
                }
            }
        } catch (error) {
            // Skip directories we can't read
        }
    }

    /**
     * Check file for SQL injection vulnerabilities
     */
    checkFileForSQLInjectionVulnerabilities(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const fileName = path.basename(filePath);
            
            // Check for dangerous SQL patterns
            const sqlPatterns = [
                { pattern: /query\s*\(\s*['"`][^'"`]*\$\{/, description: 'Template literal in SQL query' },
                { pattern: /query\s*\(\s*['"`][^'"`]*\s*\+\s*/, description: 'String concatenation in SQL' },
                { pattern: /execute\s*\(\s*['"`][^'"`]*\$\{/, description: 'Template literal in SQL execute' },
                { pattern: /run\s*\(\s*['"`][^'"`]*\$\{/, description: 'Template literal in SQL run' }
            ];
            
            for (const { pattern, description } of sqlPatterns) {
                if (pattern.test(content)) {
                    this.addResult('warning', `Potential SQL injection in ${fileName}: ${description}`);
                }
            }
            
            // Check for good SQL protection practices
            const goodPatterns = [
                { pattern: /parameterized/, description: 'Parameterized queries' },
                { pattern: /prepared/, description: 'Prepared statements' },
                { pattern: /sanitizeSQLParam/, description: 'SQL parameter sanitization' },
                { pattern: /dbSanitizer/, description: 'Database sanitizer usage' }
            ];
            
            for (const { pattern, description } of goodPatterns) {
                if (pattern.test(content)) {
                    this.addResult('passed', `Good SQL protection in ${fileName}: ${description}`);
                }
            }
            
        } catch (error) {
            // Skip files we can't read
        }
    }

    /**
     * Test component validation
     */
    testComponentValidation() {
        console.log(`${this.colors.cyan}🧩 Testing Component Validation...${this.colors.reset}`);
        
        const componentsPath = path.join(process.cwd(), 'src', 'components');
        if (fs.existsSync(componentsPath)) {
            this.scanComponentValidation(componentsPath);
        }
        
        console.log('');
    }

    /**
     * Scan component validation
     */
    scanComponentValidation(dirPath) {
        try {
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                const stats = fs.statSync(fullPath);
                
                if (stats.isDirectory()) {
                    this.scanComponentValidation(fullPath);
                } else if (item.endsWith('.tsx') || item.endsWith('.jsx')) {
                    this.checkComponentValidation(fullPath);
                }
            }
        } catch (error) {
            // Skip directories we can't read
        }
    }

    /**
     * Check component validation
     */
    checkComponentValidation(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const fileName = path.basename(filePath);
            
            // Check for input validation usage
            if (content.includes('inputValidator') || content.includes('validateForm')) {
                this.addResult('passed', `Component ${fileName} uses input validation`);
            } else {
                this.addResult('warning', `Component ${fileName} should use input validation`);
            }
            
            // Check for secure session management
            if (content.includes('secureSessionManager') || content.includes('setSessionData')) {
                this.addResult('passed', `Component ${fileName} uses secure session management`);
            } else if (content.includes('localStorage.setItem')) {
                this.addResult('warning', `Component ${fileName} uses localStorage (consider secure alternatives)`);
            }
            
            // Check for form validation
            if (content.includes('validateForm') || content.includes('validationErrors')) {
                this.addResult('passed', `Component ${fileName} has form validation`);
            } else {
                this.addResult('warning', `Component ${fileName} should have form validation`);
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
        console.log(`\n${this.colors.blue}📊 Input Security Test Results${this.colors.reset}`);
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
        
        // Generate recommendations
        this.generateRecommendations();
        
        console.log('\n' + '='.repeat(50));
        
        if (this.results.failed.length === 0) {
            console.log(`${this.colors.green}🎉 All critical input security tests passed!${this.colors.reset}`);
        } else {
            console.log(`${this.colors.red}🔒 Please fix the critical input security issues above.${this.colors.reset}`);
        }
    }

    /**
     * Generate security recommendations
     */
    generateRecommendations() {
        console.log(`\n${this.colors.cyan}💡 Input Security Recommendations:${this.colors.reset}`);
        
        const recommendations = [
            'Always validate and sanitize user input before processing',
            'Use parameterized queries to prevent SQL injection',
            'Implement comprehensive file upload validation',
            'Use secure alternatives to localStorage for sensitive data',
            'Regularly update security libraries and dependencies',
            'Implement input length limits and character restrictions',
            'Use Content Security Policy (CSP) headers',
            'Test input validation with malicious payloads'
        ];
        
        recommendations.forEach(rec => {
            console.log(`  • ${rec}`);
        });
    }
}

// Run input security tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const tester = new InputSecurityTester();
    tester.runAllTests().catch(console.error);
}

export default InputSecurityTester;



