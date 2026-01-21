const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Dependency Security Checker
 * Checks for vulnerable dependencies in backend and frontend
 */

const SEVERITY_LEVELS = {
  info: 0,
  low: 1,
  moderate: 2,
  high: 3,
  critical: 4
};

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkDependencies(directory) {
  log(`\n🔍 Checking ${directory}...`, 'blue');
  
  const packageJsonPath = path.join(process.cwd(), directory, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    log(`⚠️  No package.json found in ${directory}`, 'yellow');
    return { vulnerabilities: {}, total: 0 };
  }

  try {
    const output = execSync(`cd ${directory} && npm audit --json`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    const auditData = JSON.parse(output);
    const vulns = auditData.metadata?.vulnerabilities || {};
    
    log(`✅ ${directory}: No vulnerabilities found`, 'green');
    
    return { vulnerabilities: vulns, total: 0 };
    
  } catch (error) {
    try {
      const auditData = JSON.parse(error.stdout);
      const vulns = auditData.metadata?.vulnerabilities || {};
      
      const total = Object.entries(vulns)
        .filter(([level]) => level !== 'info' && level !== 'low')
        .reduce((sum, [, count]) => sum + count, 0);
      
      if (total > 0) {
        log(`❌ ${directory}: Vulnerabilities detected`, 'red');
        log(`   Info: ${vulns.info || 0}`, 'blue');
        log(`   Low: ${vulns.low || 0}`, 'yellow');
        log(`   Moderate: ${vulns.moderate || 0}`, 'yellow');
        log(`   High: ${vulns.high || 0}`, 'red');
        log(`   Critical: ${vulns.critical || 0}`, 'red');
      }
      
      return { vulnerabilities: vulns, total };
      
    } catch (parseError) {
      log(`❌ ${directory}: Error parsing audit results`, 'red');
      return { vulnerabilities: {}, total: 0 };
    }
  }
}

function generateReport(results) {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('📊 Dependency Security Report', 'blue');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  
  let totalIssues = 0;
  let criticalIssues = 0;
  let highIssues = 0;
  
  Object.entries(results).forEach(([dir, data]) => {
    totalIssues += data.total;
    criticalIssues += data.vulnerabilities.critical || 0;
    highIssues += data.vulnerabilities.high || 0;
  });
  
  log(`\nTotal Issues: ${totalIssues}`, totalIssues > 0 ? 'red' : 'green');
  log(`Critical: ${criticalIssues}`, criticalIssues > 0 ? 'red' : 'green');
  log(`High: ${highIssues}`, highIssues > 0 ? 'red' : 'green');
  
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');
  
  return { totalIssues, criticalIssues, highIssues };
}

function main() {
  log('🔒 Starting Dependency Security Check...', 'blue');
  
  const directories = ['backend', 'frontend'];
  const results = {};
  
  directories.forEach(dir => {
    results[dir] = checkDependencies(dir);
  });
  
  const summary = generateReport(results);
  
  // Decide exit code based on severity
  if (summary.criticalIssues > 0) {
    log('❌ CRITICAL vulnerabilities found! Failing build...', 'red');
    process.exit(1);
  } else if (summary.highIssues > 5) {
    log('⚠️  Multiple HIGH vulnerabilities found. Please review.', 'yellow');
    process.exit(0); // Don't fail build, but warn
  } else if (summary.totalIssues > 0) {
    log('⚠️  Some vulnerabilities found. Please review when possible.', 'yellow');
    process.exit(0);
  } else {
    log('✅ All dependencies are secure!', 'green');
    process.exit(0);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { checkDependencies, generateReport };
