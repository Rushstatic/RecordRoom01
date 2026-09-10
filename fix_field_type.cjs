const fs = require('fs');
const file = './src/types/index.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("| 'mobile' | 'dropdown' | 'radio' | 'checkbox'", "| 'mobile' | 'dropdown' | 'radio' | 'checkbox' | 'result'");

fs.writeFileSync(file, content);
console.log('done');
