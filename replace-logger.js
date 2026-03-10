const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'server', 'src');

function findJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findJsFiles(filePath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const jsFiles = findJsFiles(srcDir);

let modifiedCount = 0;

for (const file of jsFiles) {
  // skip the logger itself
  if (file.endsWith('logger.js')) continue;

  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // check if file has console statements
  if (!/console\.(log|error|warn|info)/.test(content)) continue;

  // Add logger import if not present
  if (!content.includes('const { logger } = require(')) {
    // determine relative path to utils/logger
    const loggerPath = path.join(srcDir, 'utils', 'logger');
    let relativePath = path.relative(path.dirname(file), loggerPath).replace(/\\/g, '/');
    if (!relativePath.startsWith('.')) {
      relativePath = './' + relativePath;
    }
    
    // Add import statement after the last require block or at the top
    const importStatement = `const { logger } = require("${relativePath}");\n`;
    
    const lines = content.split('\n');
    let insertIndex = 0;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('require(')) {
            insertIndex = i + 1;
        }
    }
    lines.splice(insertIndex, 0, importStatement);
    content = lines.join('\n');
  }

  // Replace console.log/error/warn but not console.time etc
  content = content.replace(/console\.log/g, 'logger.info');
  content = content.replace(/console\.error/g, 'logger.error');
  content = content.replace(/console\.warn/g, 'logger.warn');
  content = content.replace(/console\.info/g, 'logger.info');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
  }
}

console.log(`Updated ${modifiedCount} files to use logger.`);
