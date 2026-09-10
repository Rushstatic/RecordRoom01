const fs = require('fs');
const file = './src/pages/TemplateFieldsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "  auto_date: { label: 'Auto Date', desc: 'स्वयंचलित तारीख', category: 'प्रगत' },",
  "  auto_date: { label: 'Auto Date', desc: 'स्वयंचलित तारीख', category: 'प्रगत' },\n  auto_number: { label: 'Auto Number', desc: 'स्वयंचलित क्रमांक', category: 'प्रगत' },"
);

fs.writeFileSync(file, content);
console.log('done');
