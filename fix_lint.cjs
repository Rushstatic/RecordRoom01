const fs = require('fs');
const file = 'src/pages/MalariaTargetsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/} as TargetProgressItem;/g, ', scopeLevel: "village", status: "PENDING"} as unknown as TargetProgressItem;');

fs.writeFileSync(file, content);
