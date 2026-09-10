const fs = require('fs');
const file = './src/pages/DynamicReportPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "const [customToDate, setCustomToDate] = useState<string>('');",
  "const [customToDate, setCustomToDate] = useState<string>('');\n  const [filterResultValues, setFilterResultValues] = useState<Record<string, string>>({});"
);

fs.writeFileSync(file, content);
console.log('done');
