const fs = require('fs');
const file = 'src/pages/MalariaTargetsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `
  // Target and Sample Period Filtering
  const activeTargetsInPeriod = useMemo(() => {
    return targets.filter(t => {
      if (t.target_year !== filterYear) return false;
      if (filterType === 'Monthly' && t.target_month !== filterMonth) return false;
      if (filterType === 'Yearly' && t.target_type === 'Monthly') return false;
      return true;
    });
  }, [targets, filterYear, filterMonth, filterType]);

  const samplesInPeriod = useMemo(() => {
    return samples.filter(s => {
      if (!s.sample_collection_date) return false;
      const dt = new Date(s.sample_collection_date);
      if (isNaN(dt.getTime())) return false;
      if (dt.getFullYear() !== filterYear) return false;
      if (filterType === 'Monthly' && (dt.getMonth() + 1) !== filterMonth) return false;
      return true;
    });
  }, [samples, filterYear, filterMonth, filterType]);

  // Village Progress Items
  const villageProgressItems = useMemo(() => {
    return villages.map(v => {
      const vTargets = activeTargetsInPeriod.filter(t => t.village_id === v.id);
      const targetValue = vTargets.reduce((sum, t) => sum + t.target_value, 0);
      
      const vSamples = samplesInPeriod.filter(s => s.village_id === v.id);
      const actualSamples = vSamples.length;
      const sentSamples = vSamples.filter(s => !!s.sent_date).length;
      const pendingSamples = actualSamples - sentSamples;
      
      const remainingTarget = Math.max(0, targetValue - actualSamples);
      const progressPercent = targetValue > 0 ? Math.round((actualSamples / targetValue) * 100) : 0;
      
      return {
        id: v.id,
        entityId: v.id,
        entityName: v.village_name,
        entityType: 'village',
        targetValue,
        actualSamples,
        sentSamples,
        pendingSamples,
        remainingTarget,
        progressPercent
      };
    });
  }, [villages, activeTargetsInPeriod, samplesInPeriod]);

  // Employee Progress Items
  const employeeProgressItems = useMemo(() => {
    return employees.map(e => {
      const eTargets = activeTargetsInPeriod.filter(t => t.employee_id === e.id);
      const targetValue = eTargets.reduce((sum, t) => sum + t.target_value, 0);
      
      const eSamples = samplesInPeriod.filter(s => s.employee_id === e.id);
      const actualSamples = eSamples.length;
      const sentSamples = eSamples.filter(s => !!s.sent_date).length;
      const pendingSamples = actualSamples - sentSamples;
      
      const remainingTarget = Math.max(0, targetValue - actualSamples);
      const progressPercent = targetValue > 0 ? Math.round((actualSamples / targetValue) * 100) : 0;
      
      return {
        id: e.id,
        entityId: e.id,
        entityName: e.employee_name,
        entityType: 'employee',
        targetValue,
        actualSamples,
        sentSamples,
        pendingSamples,
        remainingTarget,
        progressPercent
      };
    });
  }, [employees, activeTargetsInPeriod, samplesInPeriod]);

  // Subcentre Progress Items
  const subcentreProgressItems = useMemo(() => {
    return subcentres.map(sc => {
      const scTargets = activeTargetsInPeriod.filter(t => t.subcentre_id === sc.id);
      const targetValue = scTargets.reduce((sum, t) => sum + t.target_value, 0);
      
      // Calculate actuals from samples in this subcentre (by village)
      const scSamples = samplesInPeriod.filter(s => {
        const v = villages.find(v => v.id === s.village_id);
        return v && v.subcentre_id === sc.id;
      });
      const actualSamples = scSamples.length;
      const sentSamples = scSamples.filter(s => !!s.sent_date).length;
      const pendingSamples = actualSamples - sentSamples;
      
      const remainingTarget = Math.max(0, targetValue - actualSamples);
      const progressPercent = targetValue > 0 ? Math.round((actualSamples / targetValue) * 100) : 0;
      
      return {
        id: sc.id,
        entityId: sc.id,
        entityName: sc.subcentre_name,
        entityType: 'subcentre',
        targetValue,
        actualSamples,
        sentSamples,
        pendingSamples,
        remainingTarget,
        progressPercent
      };
    });
  }, [subcentres, villages, activeTargetsInPeriod, samplesInPeriod]);

  // PHC Progress Items
  const phcProgressItems = useMemo(() => {
    return phcs.map(p => {
      const pTargets = activeTargetsInPeriod.filter(t => t.phc_id === p.id);
      const targetValue = pTargets.reduce((sum, t) => sum + t.target_value, 0);
      
      const pSamples = samplesInPeriod.filter(s => {
        const v = villages.find(v => v.id === s.village_id);
        if (!v) return false;
        const sc = subcentres.find(sc => sc.id === v.subcentre_id);
        return sc && sc.phc_id === p.id;
      });
      const actualSamples = pSamples.length;
      const sentSamples = pSamples.filter(s => !!s.sent_date).length;
      const pendingSamples = actualSamples - sentSamples;
      
      const remainingTarget = Math.max(0, targetValue - actualSamples);
      const progressPercent = targetValue > 0 ? Math.round((actualSamples / targetValue) * 100) : 0;
      
      return {
        id: p.id,
        entityId: p.id,
        entityName: p.phc_name,
        entityType: 'phc',
        targetValue,
        actualSamples,
        sentSamples,
        pendingSamples,
        remainingTarget,
        progressPercent
      };
    });
  }, [phcs, subcentres, villages, activeTargetsInPeriod, samplesInPeriod]);

  // KPI Summary
  const kpiSummary = useMemo(() => {
    let targetSum = 0;
    const actualSum = samplesInPeriod.length;
    const sentSum = samplesInPeriod.filter(s => !!s.sent_date).length;
    const pendingSum = actualSum - sentSum;
    
    if (activeTab === 'employees') {
      targetSum = employeeProgressItems.reduce((a, b) => a + b.targetValue, 0);
    } else if (activeTab === 'villages') {
      targetSum = villageProgressItems.reduce((a, b) => a + b.targetValue, 0);
    } else if (activeTab === 'subcentres') {
      targetSum = subcentreProgressItems.reduce((a, b) => a + b.targetValue, 0);
    } else if (activeTab === 'phcs') {
      targetSum = phcProgressItems.reduce((a, b) => a + b.targetValue, 0);
    }
    
    const remaining = Math.max(0, targetSum - actualSum);
    const progressPercent = targetSum > 0 ? Math.round((actualSum / targetSum) * 100) : 0;

    return {
      target: targetSum,
      actual: actualSum,
      sent: sentSum,
      pending: pendingSum,
      remaining,
      progressPercent
    };
  }, [samplesInPeriod, activeTab, employeeProgressItems, villageProgressItems, subcentreProgressItems, phcProgressItems]);
`;

// Insert it back where it belongs!
// The point where I deleted it was inside handleSetCurrentMonth.
// Actually, it was just in the component body. Let's insert it before `// Sorted and searched lists`.
content = content.replace(
  "  // Sorted and searched lists",
  replacement + "\n  // Sorted and searched lists"
);

fs.writeFileSync(file, content);
console.log('done');
