export function exportToCSV(filename: string, data: any[]) {
  if (!data || !data.length) {
    alert('No data to export');
    return;
  }

  // Flatten nested objects (like category.name)
  const flattenedData = data.map(item => {
    const flat: any = {};
    for (const key in item) {
      if (typeof item[key] === 'object' && item[key] !== null && !Array.isArray(item[key])) {
        for (const subKey in item[key]) {
          flat[`${key}.${subKey}`] = item[key][subKey];
        }
      } else {
        flat[key] = item[key];
      }
    }
    return flat;
  });

  // Get all unique keys
  const keys = Array.from(new Set(flattenedData.flatMap(d => Object.keys(d))));

  const csvContent = [
    keys.join(','), // Header row
    ...flattenedData.map(row =>
      keys.map(k => {
        let val = row[k];
        if (val === null || val === undefined) val = '';
        else if (Array.isArray(val)) val = val.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join('; ');
        else if (typeof val === 'object') val = JSON.stringify(val);
        
        // Escape quotes
        const str = String(val).replace(/"/g, '""');
        // Wrap in quotes if contains comma, newline or quotes
        if (str.search(/("|,|\n)/g) >= 0) {
          return `"${str}"`;
        }
        return str;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
