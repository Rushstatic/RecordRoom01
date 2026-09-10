const fs = require('fs');
const file = 'src/pages/MalariaReportsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const s = content.indexOf('      if (role === \'subcentre_employee\') {\n        const allowedScSet = new Set(applicableSubcentreIds);');
const e = content.indexOf('      setPhcs(phcList);');

const patch = `      if (role === 'subcentre_employee') {
        const allowedScSet = new Set(applicableSubcentreIds || []);
        if (allowedScSet.size > 0) {
          filteredScList = scList.filter((s) => allowedScSet.has(s.id));
          filteredVilList = vilList.filter((v) => allowedScSet.has(v.subcentre_id));
          filteredEmpList = empList.filter(
            (e) => allowedScSet.has(e.subcentre_id) || e.id === user?.employeeId
          );
        }
        // STRICT EMPLOYEE SCOPE RULE:
        if (user?.employeeId) {
          sampleList = rawSampleList.filter((s) => s.employee_id === user.employeeId);
        } else {
          sampleList = [];
        }
      }
`;

content = content.substring(0, s) + patch + content.substring(e);
fs.writeFileSync(file, content);
console.log('Fixed Employee Scope.');
