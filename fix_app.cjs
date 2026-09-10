const fs = require('fs');
const file = './src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import DynamicReportPage from './pages/DynamicReportPage';",
  "import DynamicReportPage from './pages/DynamicReportPage';\nimport PendingDynamicRecordsPage from './pages/PendingDynamicRecordsPage';"
);

content = content.replace(
  "      case 'dynamic-report':\n        return <DynamicReportPage onNavigate={setCurrentPage} templateId={selectedTemplateId || storage.getItem('selectedTemplateId') || ''} />;",
  "      case 'dynamic-report':\n        return <DynamicReportPage onNavigate={setCurrentPage} templateId={selectedTemplateId || storage.getItem('selectedTemplateId') || ''} />;\n      case 'pending-dynamic-records':\n        return <PendingDynamicRecordsPage onNavigate={setCurrentPage} />;"
);

fs.writeFileSync(file, content);
console.log('done');
