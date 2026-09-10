const fs = require('fs');
const file = './src/types/index.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "  register_type?: string;",
  "  register_type?: string;\n  usage_type?: string;\n  requires_result?: boolean;"
);

fs.writeFileSync(file, content);
console.log('done');
