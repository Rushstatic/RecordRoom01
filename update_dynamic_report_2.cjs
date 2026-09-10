const fs = require('fs');
const file = './src/pages/DynamicReportPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const filterLogic = `
    // Result Fields filtering
    Object.entries(filterResultValues).forEach(([key, val]) => {
      if (val && val !== 'all') {
        result = result.filter(r => {
          const recData = r.record_data || {};
          return recData[key] === val;
        });
      }
    });
`;

content = content.replace(
  "// Subcentre",
  filterLogic + "\n    // Subcentre"
);

fs.writeFileSync(file, content);
console.log('done');
