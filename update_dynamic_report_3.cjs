const fs = require('fs');
const file = './src/pages/DynamicReportPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const resultFieldsLogic = `
  const resultFields = useMemo(() => {
    return activeFields.filter(f => f.field_type === 'result');
  }, [activeFields]);
`;

content = content.replace(
  "const filteredRecords = useMemo(() => {",
  resultFieldsLogic + "\n  const filteredRecords = useMemo(() => {"
);

fs.writeFileSync(file, content);
console.log('done');
