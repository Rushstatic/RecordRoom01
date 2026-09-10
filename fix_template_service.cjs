const fs = require('fs');
const file = './src/services/templateService.ts';
let content = fs.readFileSync(file, 'utf8');

// Add register_type to dbPayload
content = content.replace(
  "icon: cleanTemplate.icon || 'FileText',",
  "icon: cleanTemplate.icon || 'FileText',\n        register_type: cleanTemplate.register_type || null,"
);

fs.writeFileSync(file, content);
console.log('done');
