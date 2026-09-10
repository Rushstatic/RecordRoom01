const fs = require('fs');
const file = 'src/pages/MalariaReportsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const s = content.indexOf('  useEffect(() => {\n    loadData();\n  }, [loadData]);');

if (s === -1) {
    console.log("Could not find useEffect");
} else {
    const patch = `  useEffect(() => {
    loadData();
    const handleSync = () => loadData();
    window.addEventListener('arogya-sample-saved', handleSync);
    window.addEventListener('arogya-sync-status-changed', handleSync);
    return () => {
      window.removeEventListener('arogya-sample-saved', handleSync);
      window.removeEventListener('arogya-sync-status-changed', handleSync);
    };
  }, [loadData]);`;
    content = content.substring(0, s) + patch + content.substring(s + '  useEffect(() => {\n    loadData();\n  }, [loadData]);'.length);
    fs.writeFileSync(file, content);
    console.log('Fixed useEffect.');
}
