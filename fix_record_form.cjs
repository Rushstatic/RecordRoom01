const fs = require('fs');
const file = './src/components/DynamicRecordForm.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  ") : f.field_type === 'dropdown' ? (",
  ") : ['dropdown', 'result'].includes(f.field_type) ? ("
);

fs.writeFileSync(file, content);
console.log('done');
