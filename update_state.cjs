const fs = require('fs');
const file = './src/pages/TemplateFieldsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const newStates = `
  const [autoNumberConfig, setAutoNumberConfig] = useState<{
    prefix: string;
    format: string;
    scope: 'register' | 'employee' | 'village';
    reset: 'never' | 'yearly';
  }>({
    prefix: '',
    format: '0001',
    scope: 'register',
    reset: 'never'
  });
`;

content = content.replace(
  "  const [customOptions, setCustomOptions] = useState<{ value: string; label: string }[]>([]);",
  "  const [customOptions, setCustomOptions] = useState<{ value: string; label: string }[]>([]);" + newStates
);

fs.writeFileSync(file, content);
console.log('done');
