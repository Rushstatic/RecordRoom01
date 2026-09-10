const fs = require('fs');
const file = './src/services/templateService.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "const isPhcController = user?.role === 'phc_controller' || user?.role === 'PHC_CONTROLLER';",
  "const isPhcController = user?.role === 'phc_controller';"
);

fs.writeFileSync(file, content);
console.log('done');
