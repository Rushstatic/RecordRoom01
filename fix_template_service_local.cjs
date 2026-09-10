const fs = require('fs');
const file = './src/services/templateService.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "    if (index >= 0) {\n      records[index] = cleanRecord;\n    } else {",
  "    if (index >= 0) {\n      records[index] = { ...cleanRecord, created_at: records[index].created_at || cleanRecord.created_at };\n    } else {"
);

fs.writeFileSync(file, content);
console.log('done');
