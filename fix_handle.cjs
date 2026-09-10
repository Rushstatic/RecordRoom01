const fs = require('fs');
const file = 'src/pages/MalariaTargetsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const s = content.indexOf('  const handleResetFilters = () => {');
const e = content.indexOf('  // Target and Sample Period Filtering');

const properReset = `  const handleResetFilters = () => {
    setFilterType('Monthly');
    setFilterYear(currentYear);
    setFilterMonth(currentMonth);
    setSearchQuery('');
    setSortOption('progress-desc');
    if (isPhcController) {
      setSelectedPhcId('');
      setSelectedSubcentreId('');
      setSelectedVillageId('');
      setSelectedEmployeeId('');
    } else {
      setSelectedVillageId('');
      setSelectedEmployeeId('');
    }
  };

`;

content = content.substring(0, s) + properReset + content.substring(e);
fs.writeFileSync(file, content);
console.log('Fixed handleResetFilters again');
