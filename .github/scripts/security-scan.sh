#!/bin/bash

set -e

echo "🔒 Running security scans..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track issues found
TOTAL_ISSUES=0

# Dependency check - Backend
echo -e "${YELLOW}📦 Checking backend dependencies...${NC}"
cd backend
npm audit --audit-level=moderate || {
    echo -e "${RED}⚠️  Backend vulnerabilities detected${NC}"
    TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
}
cd ..

# Dependency check - Frontend
echo -e "${YELLOW}📦 Checking frontend dependencies...${NC}"
cd frontend
npm audit --audit-level=moderate || {
    echo -e "${RED}⚠️  Frontend vulnerabilities detected${NC}"
    TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
}
cd ..

# Check for hardcoded secrets
echo -e "${YELLOW}🔑 Checking for hardcoded secrets...${NC}"
if command -v git-secrets &> /dev/null; then
    git secrets --scan || {
        echo -e "${RED}⚠️  Potential secrets detected${NC}"
        TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
    }
else
    echo -e "${YELLOW}ℹ️  git-secrets not installed, skipping...${NC}"
fi

# Check for .env files in git
echo -e "${YELLOW}📄 Checking for exposed .env files...${NC}"
if git ls-files | grep -E '\.env$|\.env\.local$|\.env\.production$' | grep -v '\.env\.example$' | grep -v '\.env\.testing\.example$'; then
    echo -e "${RED}⚠️  .env files found in git history!${NC}"
    TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
else
    echo -e "${GREEN}✅ No .env files in git${NC}"
fi

# Check for common security issues in code
echo -e "${YELLOW}🔍 Scanning for security patterns...${NC}"

# Check for eval() usage
if grep -r "eval(" backend/src frontend/src 2>/dev/null; then
    echo -e "${RED}⚠️  Found eval() usage - potential security risk${NC}"
    TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
fi

# Check for console.log with potential sensitive data
if grep -r "console\.log.*password\|console\.log.*secret\|console\.log.*key" backend/src frontend/src 2>/dev/null; then
    echo -e "${RED}⚠️  Found console.log with potential sensitive data${NC}"
    TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $TOTAL_ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ Security scan completed - No critical issues found${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Security scan completed - $TOTAL_ISSUES issue(s) found${NC}"
    echo -e "${YELLOW}Please review the issues above before deploying${NC}"
    exit 0  # Don't fail the build, just warn
fi
