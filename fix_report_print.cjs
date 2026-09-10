const fs = require('fs');
const file = 'src/components/reports/MalariaPrintReportView.tsx';
let content = fs.readFileSync(file, 'utf8');

const s = content.indexOf('return (');
const patch = `return (
    <>
      <style type="text/css">
        {\`
          @media print {
            @page { size: A4 portrait; margin: 10mm; }
          }
        \`}
      </style>
`;
content = content.substring(0, s) + patch + content.substring(s + 'return ('.length);
content = content.replace(/<\/div>\n  \);\n};/, '</div>\n    </>\n  );\n};');

fs.writeFileSync(file, content);
console.log('Fixed Print View.');
