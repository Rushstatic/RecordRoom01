const fs = require('fs');
const file = './src/pages/TemplateBuilderPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "          help_text: null,\n          options_json: resultOptions.filter(o => o.label.trim() !== ''),\n          is_active: true\n        });",
  "          help_text: null,\n          options_json: resultOptions.filter(o => o.label.trim() !== ''),\n          is_active: true,\n          validation_json: null,\n          automation_json: null,\n          conditional_json: null\n        });"
);

fs.writeFileSync(file, content);
console.log('done');
