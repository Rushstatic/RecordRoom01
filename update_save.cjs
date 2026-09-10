const fs = require('fs');
const file = './src/pages/TemplateFieldsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const autoNumberLogic = `
    let automationJson = editingField.automation_json || null;
    if (editingField.field_type === 'auto_number') {
      automationJson = {
        type: 'auto_number',
        prefix: autoNumberConfig.prefix,
        format: autoNumberConfig.format,
        scope: autoNumberConfig.scope,
        reset: autoNumberConfig.reset
      };
    }
`;

content = content.replace(
  "    try {\n      const newFieldId = editingField.id || crypto.randomUUID();",
  autoNumberLogic + "\n    try {\n      const newFieldId = editingField.id || crypto.randomUUID();"
);

content = content.replace(
  "        automation_json: editingField.automation_json || null,",
  "        automation_json: automationJson,"
);

fs.writeFileSync(file, content);
console.log('done');
