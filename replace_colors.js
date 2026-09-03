const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'apps/web');

function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        filelist = walkSync(dirFile, filelist);
      }
    } else {
      if (dirFile.endsWith('.tsx') || dirFile.endsWith('.ts')) {
        filelist.push(dirFile);
      }
    }
  }
  return filelist;
}

const files = walkSync(directoryPath);

let modifiedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Replace indigo variants with primary variants
  content = content.replace(/bg-indigo-600/g, 'bg-primary');
  content = content.replace(/text-indigo-600/g, 'text-primary');
  content = content.replace(/border-indigo-600/g, 'border-primary');
  content = content.replace(/ring-indigo-600/g, 'ring-primary');
  content = content.replace(/accent-indigo-600/g, 'accent-primary');
  content = content.replace(/fill-indigo-600/g, 'fill-primary');
  content = content.replace(/stroke-indigo-600/g, 'stroke-primary');
  
  content = content.replace(/bg-indigo-500/g, 'bg-primary');
  content = content.replace(/text-indigo-500/g, 'text-primary');

  content = content.replace(/bg-indigo-700/g, 'bg-primary-dark');
  content = content.replace(/text-indigo-700/g, 'text-primary-dark');
  content = content.replace(/border-indigo-700/g, 'border-primary-dark');

  content = content.replace(/bg-indigo-50/g, 'bg-primary-light');
  content = content.replace(/text-indigo-50/g, 'text-primary-light');
  
  content = content.replace(/bg-indigo-100/g, 'bg-primary-light');
  content = content.replace(/text-indigo-100/g, 'text-primary-light');
  content = content.replace(/border-indigo-100/g, 'border-primary-light');
  
  content = content.replace(/bg-indigo-200/g, 'bg-primary-light');
  
  content = content.replace(/bg-violet-600/g, 'bg-secondary');
  content = content.replace(/text-violet-600/g, 'text-secondary');
  content = content.replace(/bg-violet-50/g, 'bg-primary-light');
  content = content.replace(/bg-violet-100/g, 'bg-primary-light');

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    modifiedCount++;
  }
}

console.log(`Modified ${modifiedCount} files.`);
