const fs = require('fs');
const file = './src/pages/PendingDynamicRecordsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// I will re-create the file content from scratch just to be safe.
