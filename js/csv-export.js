/**
 * @fileoverview Builds and triggers download of the logged-activity CSV export.
 */

/**
 * Converts the app's logged activities into a CSV data URI and triggers a download.
 * @param {Array<Object>} logs - state.logs from the store.
 */
export function downloadLogsAsCsv(logs) {
  if (logs.length === 0) {
    alert('No logged logs to export yet. Please add logs to build your history.');
    return;
  }

  const rows = logs.map((log) => {
    const noteField = (log.note || '').replace(/"/g, '""');
    return `"${log.id}","${log.date}","${log.category}","${log.subtype}",${log.value},${log.emissions},"${noteField}"`;
  });

  const csvContent = `data:text/csv;charset=utf-8,ID,Date,Category,Subtype,Value,Emissions (kg CO2e),Note\n${rows.join('\n')}\n`;
  const encodedUri = encodeURI(csvContent);

  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `ecopulse_carbon_audit_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
