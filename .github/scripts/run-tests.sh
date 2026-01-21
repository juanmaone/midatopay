#!/bin/bash

set -e

echo "🧪 Running comprehensive tests..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Backend tests
echo -e "${YELLOW}📦 Testing backend...${NC}"
cd backend
npm test -- --coverage --maxWorkers=2 --passWithNoTests
BACKEND_TEST_STATUS=$?
cd ..

print_status $BACKEND_TEST_STATUS "Backend tests"

# Frontend tests
echo -e "${YELLOW}🎨 Testing frontend...${NC}"
cd frontend
npm test -- --coverage --passWithNoTests
FRONTEND_TEST_STATUS=$?
cd ..

print_status $FRONTEND_TEST_STATUS "Frontend tests"

# Check overall status
if [ $BACKEND_TEST_STATUS -eq 0 ] && [ $FRONTEND_TEST_STATUS -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed successfully!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
