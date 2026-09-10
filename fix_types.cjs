const fs = require('fs');
const file = './src/types/index.ts';
let content = fs.readFileSync(file, 'utf8');

// Add register_type to RecordRegisterTemplate
content = content.replace("icon: string | null;\n  is_active: boolean;", "icon: string | null;\n  register_type?: string;\n  is_active: boolean;");

fs.writeFileSync(file, content);
console.log('done');
