const fs = require('fs');
const file = 'src/pages/MalariaReportsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const s = content.indexOf('      // Set role-based initial filters');
const e = content.indexOf('    } catch (err) {');

const patch = `      // Filters for PHC Controller only
      if (role !== 'subcentre_employee') {
        // ... anything to do for controller ...
      } else {
        // Employee doesn't need to manually filter themselves; they are locked to their UUID.
        setFilterEmployeeId('');
      }
`;

content = content.substring(0, s) + patch + content.substring(e);
fs.writeFileSync(file, content);
console.log('Fixed filters.');
