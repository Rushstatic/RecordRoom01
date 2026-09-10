const fs = require('fs');
const file = './src/pages/TemplateFieldsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// In openNewFieldModal
content = content.replace(
  "    setCondAction('show');\n    setShowModal(true);",
  "    setCondAction('show');\n    setAutoNumberConfig({ prefix: '', format: '0001', scope: 'register', reset: 'never' });\n    setShowModal(true);"
);

// In openEditModal
const editAutoNum = `
    // Auto Number
    if (f.field_type === 'auto_number' && f.automation_json) {
       let parsedAuto = { prefix: '', format: '0001', scope: 'register', reset: 'never' };
       if (typeof f.automation_json === 'string') {
          try { parsedAuto = JSON.parse(f.automation_json); } catch(e){}
       } else {
          parsedAuto = f.automation_json;
       }
       setAutoNumberConfig(parsedAuto as any);
    } else {
       setAutoNumberConfig({ prefix: '', format: '0001', scope: 'register', reset: 'never' });
    }
`;

content = content.replace(
  "    // Conditional",
  editAutoNum + "\n    // Conditional"
);

fs.writeFileSync(file, content);
console.log('done');
