const fs = require('fs');
const file = './src/pages/PendingDynamicRecordsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "                template={editRecord.template}\n                fields={editFields}",
  "                fields={editFields}\n                initialSubcentreId={editRecord.record.subcentre_id}\n                initialVillageId={editRecord.record.village_id}"
);

fs.writeFileSync(file, content);
console.log('done');
