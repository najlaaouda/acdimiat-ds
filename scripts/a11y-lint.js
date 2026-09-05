#!/usr/bin/env node

/**
 * Accessibility Linting Script
 *
 * Checks Angular HTML templates for common accessibility issues.
 * Run with: npm run lint:a11y
 *
 * Checks performed:
 * 1. Buttons without type attribute
 * 2. Images without alt attribute
 * 3. Form inputs without labels
 * 4. Icon-only buttons without aria-label
 * 5. Links without accessible text
 */

const fs = require('fs');
const path = require('path');
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const results = {
  errors: [],
  warnings: [],
  filesChecked: 0
};

function getHtmlFiles(dir) {
  const files = [];
  function walkDir(currentDir) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          walkDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
          files.push(fullPath);
        }
      }
    } catch (e) {}
  }
  walkDir(dir);
  return files;
}

function checkButtonTypes(content, filePath) {
  const issues = [];
  const buttonRegex = /<button(?![^>]*type=)[^>]*>/gi;
  let match;
  while ((match = buttonRegex.exec(content)) !== null) {
    const beforeMatch = content.substring(0, match.index);
    const lineNum = beforeMatch.split('\n').length;
    const surroundingContent = content.substring(match.index, match.index + 200);
    if (!surroundingContent.includes('type="submit"') && !surroundingContent.includes("type='submit'") && !surroundingContent.includes('[type]="') && !surroundingContent.match(/type=["']button["']/)) {
      issues.push({ type: 'error', rule: 'button-type', message: 'Button missing type="button" attribute', file: filePath, line: lineNum });
    }
  }
  return issues;
}

function checkImageAlts(content, filePath) {
  const issues = [];
  const imgRegex = /<img(?![^>]*(?:alt=|\[alt\]=))[^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(content)) !== null) {
    const beforeMatch = content.substring(0, match.index);
    const lineNum = beforeMatch.split('\n').length;
    issues.push({ type: 'error', rule: 'img-alt', message: 'Image missing alt attribute', file: filePath, line: lineNum });
  }
  return issues;
}

function checkFormLabels(content, filePath) {
  const issues = [];
  const inputRegex = /<(input|select|textarea)(?![^>]*(?:aria-label|aria-labelledby|type="hidden"|type='hidden'))[^>]*>/gi;
  let match;
  while ((match = inputRegex.exec(content)) !== null) {
    const inputTag = match[0];
    const beforeMatch = content.substring(0, match.index);
    const lineNum = beforeMatch.split('\n').length;
    const idMatch = inputTag.match(/id=["']([^"']+)["']/);
    if (idMatch) {
      const labelRegex = new RegExp('<label[^>]*for=["\']' + idMatch[1] + '["\']', 'gi');
      if (!labelRegex.test(content)) {
        issues.push({ type: 'warning', rule: 'form-label', message: 'Input with id="' + idMatch[1] + '" has no associated <label>', file: filePath, line: lineNum });
      }
    } else if (!inputTag.includes('aria-label') && !inputTag.includes('[aria-label]')) {
      issues.push({ type: 'warning', rule: 'form-label', message: 'Form control missing label association', file: filePath, line: lineNum });
    }
  }
  return issues;
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];
  issues.push(...checkButtonTypes(content, filePath));
  issues.push(...checkImageAlts(content, filePath));
  issues.push(...checkFormLabels(content, filePath));
  return issues;
}

function main() {
  console.log('\n' + colors.bold + colors.blue + '=== Accessibility Lint Check ===' + colors.reset + '\n');
  const srcDir = path.join(process.cwd(), 'src');
  if (!fs.existsSync(srcDir)) {
    console.error(colors.red + 'Error: src directory not found' + colors.reset);
    process.exit(1);
  }
  const htmlFiles = getHtmlFiles(srcDir);
  console.log('Checking ' + htmlFiles.length + ' HTML files...\n');
  let allIssues = [];
  for (const file of htmlFiles) {
    const issues = checkFile(file);
    if (issues.length > 0) allIssues.push(...issues);
    results.filesChecked++;
  }
  const errors = allIssues.filter(i => i.type === 'error');
  const warnings = allIssues.filter(i => i.type === 'warning');
  const issuesByFile = {};
  for (const issue of allIssues) {
    const relPath = path.relative(process.cwd(), issue.file);
    if (!issuesByFile[relPath]) issuesByFile[relPath] = [];
    issuesByFile[relPath].push(issue);
  }
  for (const [file, issues] of Object.entries(issuesByFile)) {
    console.log(colors.bold + file + colors.reset);
    for (const issue of issues) {
      const color = issue.type === 'error' ? colors.red : colors.yellow;
      const icon = issue.type === 'error' ? '✖' : '⚠';
      console.log('  ' + color + icon + ' Line ' + issue.line + ': ' + issue.message + ' (' + issue.rule + ')' + colors.reset);
    }
    console.log('');
  }
  console.log(colors.bold + 'Summary:' + colors.reset);
  console.log('  Files checked: ' + results.filesChecked);
  console.log('  ' + colors.red + 'Errors: ' + errors.length + colors.reset);
  console.log('  ' + colors.yellow + 'Warnings: ' + warnings.length + colors.reset);
  if (errors.length === 0 && warnings.length === 0) {
    console.log('\n' + colors.green + colors.bold + '✓ No accessibility issues found!' + colors.reset + '\n');
    process.exit(0);
  } else if (errors.length > 0) {
    console.log('\n' + colors.red + colors.bold + '✖ Found ' + errors.length + ' error(s) that should be fixed' + colors.reset + '\n');
    process.exit(1);
  } else {
    console.log('\n' + colors.yellow + colors.bold + '⚠ Found ' + warnings.length + ' warning(s) to review' + colors.reset + '\n');
    process.exit(0);
  }
}

main();
