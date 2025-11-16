import './PieChart.css';

const PieChart = ({ data, title }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <h3>{title}</h3>
        <p className="chart-empty">No data to display</p>
      </div>
    );
  }

  const width = 600;
  const height = 400;
  const radius = 120;
  const centerX = width / 2 - 100;
  const centerY = height / 2;

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const colors = [
    '#667eea', '#4CAF50', '#ff9800', '#f44336',
    '#9c27b0', '#00bcd4', '#8bc34a', '#ffc107',
    '#3f51b5', '#e91e63'
  ];

  // Calculate pie slices
  let currentAngle = -Math.PI / 2; // Start at top
  const slices = data.map((item, index) => {
    const sliceAngle = (item.value / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    // Calculate arc path
    const startX = centerX + radius * Math.cos(startAngle);
    const startY = centerY + radius * Math.sin(startAngle);
    const endX = centerX + radius * Math.cos(endAngle);
    const endY = centerY + radius * Math.sin(endAngle);

    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${startX} ${startY}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      'Z'
    ].join(' ');

    // Calculate label position (middle of slice, slightly outside)
    const midAngle = startAngle + sliceAngle / 2;
    const labelRadius = radius + 40;
    const labelX = centerX + labelRadius * Math.cos(midAngle);
    const labelY = centerY + labelRadius * Math.sin(midAngle);

    const percentage = ((item.value / total) * 100).toFixed(1);

    return {
      pathData,
      color: colors[index % colors.length],
      label: item.label,
      value: item.value,
      percentage,
      labelX,
      labelY
    };
  });

  return (
    <div className="chart-container">
      <h3>{title}</h3>
      <div className="pie-chart-wrapper">
        <svg width={width} height={height} className="pie-chart">
          {/* Pie slices */}
          {slices.map((slice, index) => (
            <g key={index}>
              <path
                d={slice.pathData}
                fill={slice.color}
                className="pie-slice"
                stroke="white"
                strokeWidth="2"
              />
            </g>
          ))}

          {/* Labels */}
          {slices.map((slice, index) => (
            <text
              key={`label-${index}`}
              x={slice.labelX}
              y={slice.labelY}
              textAnchor="middle"
              fontSize="12"
              fill="#333"
              fontWeight="600"
            >
              {slice.percentage}%
            </text>
          ))}
        </svg>

        {/* Legend */}
        <div className="pie-legend">
          {slices.map((slice, index) => (
            <div key={index} className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: slice.color }}
              />
              <div className="legend-text">
                <div className="legend-label">{slice.label}</div>
                <div className="legend-value">{slice.value} ({slice.percentage}%)</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PieChart;
