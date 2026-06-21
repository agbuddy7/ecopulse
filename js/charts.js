/**
 * @fileoverview Chart rendering utilities for EcoPulse.
 */

/**
 * Renders an SVG horizontal bar chart for category breakdown.
 * @param {HTMLElement} container - The DOM element to append the SVG to.
 * @param {Object} breakdown - Object containing {transport, energy, diet, waste, total}.
 */
export function renderCategoryChart(container, breakdown) {
  container.innerHTML = '';
  
  if (!breakdown || breakdown.total === 0) return;

  const categories = [
    { label: 'Transport', val: breakdown.transport, color: 'var(--color-primary)' },
    { label: 'Energy', val: breakdown.energy, color: 'var(--color-warning)' },
    { label: 'Diet', val: breakdown.diet, color: 'var(--color-secondary)' },
    { label: 'Waste', val: breakdown.waste, color: 'var(--color-accent)' }
  ];

  // Sort descending
  categories.sort((a, b) => b.val - a.val);

  const maxVal = Math.max(...categories.map(c => c.val), 1); // fallback to 1 to avoid div by zero

  const svgW = 400;
  const svgH = 160;
  
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
  svg.setAttribute('class', 'chart-svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Bar chart showing carbon breakdown by category');

  let yOffset = 10;
  const barHeight = 24;
  const gap = 16;

  categories.forEach((item, index) => {
    const y = yOffset + index * (barHeight + gap);
    
    // Label
    const textLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textLabel.setAttribute('x', '0');
    textLabel.setAttribute('y', String(y + 16));
    textLabel.setAttribute('class', 'chart-label');
    textLabel.textContent = item.label;

    const labelWidth = 70;
    const maxBarW = svgW - labelWidth - 60; // Leave room for value text
    const barWidth = (item.val / maxVal) * maxBarW;

    // Track Background
    const rectTrack = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rectTrack.setAttribute('x', String(labelWidth));
    rectTrack.setAttribute('y', String(y));
    rectTrack.setAttribute('width', String(maxBarW));
    rectTrack.setAttribute('height', String(barHeight));
    rectTrack.setAttribute('rx', '4');
    rectTrack.setAttribute('fill', 'var(--bg-card)');

    // Filled Bar
    const rectBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rectBar.setAttribute('x', String(labelWidth));
    rectBar.setAttribute('y', String(y));
    rectBar.setAttribute('width', String(Math.max(4, barWidth))); // min width 4px
    rectBar.setAttribute('height', String(barHeight));
    rectBar.setAttribute('rx', '4');
    rectBar.setAttribute('fill', item.color);
    
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = `${item.label}: ${Math.round(item.val)} kg`;
    rectBar.appendChild(title);

    // Value text
    const textVal = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textVal.setAttribute('x', String(labelWidth + Math.max(12, barWidth) + 8));
    textVal.setAttribute('y', String(y + 16));
    textVal.setAttribute('fill', 'currentColor');
    textVal.setAttribute('font-family', 'var(--font-body)');
    textVal.setAttribute('font-size', '12px');
    textVal.setAttribute('font-weight', '700');
    textVal.textContent = `${Math.round(item.val)} kg`;

    svg.appendChild(textLabel);
    svg.appendChild(rectTrack);
    svg.appendChild(rectBar);
    svg.appendChild(textVal);
  });

  container.appendChild(svg);
}

/**
 * Renders SVG line chart of weekly net carbon totals.
 * @param {HTMLElement} container - The DOM element to append the SVG to.
 * @param {Array} dataPoints - Array of daily data points with properties total, date, and label.
 */
export function renderHistoryChart(container, dataPoints) {
  container.innerHTML = '';
  
  if (!dataPoints || dataPoints.length === 0) return;

  const maxVal = Math.max(...dataPoints.map(d => d.total), 5); // Fallback to 5 to avoid flat graph

  const svgW = 400;
  const svgH = 180;
  const paddingLeft = 40;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;

  const graphW = svgW - paddingLeft - paddingRight;
  const graphH = svgH - paddingTop - paddingBottom;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
  svg.setAttribute('class', 'chart-svg');
  svg.setAttribute('role', 'img');
  
  const formattedAriaLabel = dataPoints.map(dp => `${dp.label}: ${dp.total} kg`).join(', ');
  svg.setAttribute('aria-label', `Carbon emissions trend line for past 7 days: ${formattedAriaLabel}`);

  // Draw grid lines
  const gridLinesCount = 3;
  for (let i = 0; i <= gridLinesCount; i++) {
    const yVal = paddingTop + (graphH * i) / gridLinesCount;
    const gridVal = Math.round(maxVal - (maxVal * i) / gridLinesCount);
    
    // Grid Line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(paddingLeft));
    line.setAttribute('y1', String(yVal));
    line.setAttribute('x2', String(svgW - paddingRight));
    line.setAttribute('y2', String(yVal));
    line.setAttribute('class', 'chart-grid-line');
    
    // Axis numeric scale
    const textScale = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textScale.setAttribute('x', String(paddingLeft - 8));
    textScale.setAttribute('y', String(yVal + 4));
    textScale.setAttribute('text-anchor', 'end');
    textScale.setAttribute('fill', 'var(--text-muted)');
    textScale.setAttribute('font-size', '10px');
    textScale.textContent = String(gridVal);

    svg.appendChild(line);
    svg.appendChild(textScale);
  }

  // Draw Line path points
  let pathD = '';
  const points = [];

  dataPoints.forEach((dp, index) => {
    const x = paddingLeft + (index * graphW) / 6;
    const y = paddingTop + graphH - (dp.total / maxVal) * graphH;
    points.push({ x, y, val: dp.total, dateLabel: dp.label });

    if (index === 0) {
      pathD += `M ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
    }
  });

  // Render Line Path
  const linePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  linePath.setAttribute('d', pathD);
  linePath.setAttribute('class', 'chart-line');
  svg.appendChild(linePath);

  // Render nodes and text labels
  points.forEach((point, index) => {
    // Circle Node
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', String(point.x));
    circle.setAttribute('cy', String(point.y));
    circle.setAttribute('r', '5');
    circle.setAttribute('fill', 'var(--color-primary)');
    circle.setAttribute('stroke', 'var(--bg-app)');
    circle.setAttribute('stroke-width', '1.5');
    
    // Title tag inside node for basic mouse hover description
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = `${point.dateLabel}: ${point.val} kg CO2e`;
    circle.appendChild(title);

    // X-axis label
    const textLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textLabel.setAttribute('x', String(point.x));
    textLabel.setAttribute('y', String(svgH - 8));
    textLabel.setAttribute('class', 'chart-label');
    textLabel.textContent = point.dateLabel;

    svg.appendChild(circle);
    svg.appendChild(textLabel);
  });

  container.appendChild(svg);
}
