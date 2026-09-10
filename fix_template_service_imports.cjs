const fs = require('fs');
const file = './src/services/templateService.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { isDemoMode } from '../lib/env';",
  "import { isDemoMode } from '../lib/env';\nimport { authService } from './authService';"
);

fs.writeFileSync(file, content);
console.log('done');
