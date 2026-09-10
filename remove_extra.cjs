const fs = require('fs');
const file = 'src/pages/MalariaTargetsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `    if (!isPhcController) {
    const mySubcentreItem = subcentreProgressItems.find(s => s.entityId === user?.assignedSubcentre);`;

// Find where the messed up one is inside handleResetFilters
// It is around line 185
// We can just find the actual handleResetFilters block and replace it correctly.

const regex = /  const handleResetFilters = \(\) => \{[\s\S]*?  \/\/ Target and Sample Period Filtering/g;

const matches = content.match(regex);
console.log('Matches found:', matches ? matches.length : 0);

if (matches && matches.length > 0) {
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

  // Target and Sample Period Filtering`;
    
    content = content.replace(regex, properReset);
    fs.writeFileSync(file, content);
    console.log('Fixed handleResetFilters');
}

