const fs = require('fs');
const file = 'src/pages/MalariaReportsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const s1 = content.indexOf('  const [loading, setLoading] = useState<boolean>(true);');
if (s1 === -1) {
   console.log("Could not find loading state");
} else {
   content = content.substring(0, s1) + '  const [error, setError] = useState<string | null>(null);\n' + content.substring(s1);
}

const s2 = content.indexOf('    } catch (err) {');
const e2 = content.indexOf('    } finally {', s2);

if (s2 !== -1) {
    const patch = `    } catch (err: any) {
      console.error('Failed to load malaria report data:', err);
      setError(err.message || 'अहवाल लोड करता आला नाही. कृपया पुन्हा प्रयत्न करा.');
`;
    content = content.substring(0, s2) + patch + content.substring(e2);
}

const s3 = content.indexOf('  if (loading) {');
const patch3 = `  if (error) {
    return (
      <div className="p-8 text-center text-rose-500 font-bold bg-rose-50 rounded-xl border border-rose-200">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
        {error}
      </div>
    );
  }
`;
if (s3 !== -1) {
    content = content.substring(0, s3) + patch3 + content.substring(s3);
}

// Ensure AlertTriangle is imported from lucide-react if not already
if (!content.includes('AlertTriangle')) {
    content = content.replace('HelpCircle,', 'HelpCircle, AlertTriangle,');
}

fs.writeFileSync(file, content);
console.log('Fixed error state.');
