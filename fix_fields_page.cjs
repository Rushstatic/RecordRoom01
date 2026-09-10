const fs = require('fs');
const file = './src/pages/TemplateFieldsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "checkbox: { label: 'Checkbox', desc: 'चेकबॉक्स', category: 'पर्याय' },",
  "checkbox: { label: 'Checkbox', desc: 'चेकबॉक्स', category: 'पर्याय' },\n  result: { label: 'Result / Outcome', desc: 'निकाल / निष्कर्ष', category: 'पर्याय' },"
);

content = content.replace(
  "{['dropdown', 'radio'].includes(editingField.field_type || '') && (",
  "{['dropdown', 'radio', 'result'].includes(editingField.field_type || '') && ("
);

fs.writeFileSync(file, content);
console.log('done');
