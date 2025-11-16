import './BarChart.css';

const BarChart = ({ data, title, xLabel, yLabel }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <h3>{title}</h3>
        <p className="chart-empty">No data to display</p>
      </div>
    );
  }

  const width = 800;
  const height = 400;
  const padding = { top: 40, right: 40, bottom: 80, left: 80 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find max value
  const maxValue = Math.max(...data.map(d => d.value));
  const yScale = chartHeight / maxValue;

  // Calculate bar width
  const barWidth = chartWidth / data.length * 0.7;
  const barSpacing = chartWidth / data.length;

  return (
    <div className="chart-container">
      <h3>{title}</h3>
      <svg width={width} height={height} className="bar-chart">
        {/* Chart background */}
        <rect
          x={padding.left}
          y={padding.top}
          width={chartWidth}
          height={chartHeight}
          fill="#f9f9f9"
          stroke="#e0e0e0"
        />

        {/* Y-axis gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => {
          const y = padding.top + chartHeight * (1 - tick);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartWidth}
                y2={y}
                stroke="#ddd"
                strokeDasharray="4,4"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="12"
                fill="#666"
              >
                {Math.round(maxValue * tick)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((item, index) => {
          const barHeight = item.value * yScale;
          const x = padding.left + index * barSpacing + (barSpacing - barWidth) / 2;
          const y = padding.top + chartHeight - barHeight;

          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="#667eea"
                className="bar"
              />
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize="12"
                fill="#333"
                fontWeight="600"
              >
                {item.value}
              </text>
              <text
                x={x + barWidth / 2}
                y={padding.top + chartHeight + 20}
                textAnchor="end"
                fontSize="11"
                fill="#666"
                transform={`rotate(-45 ${x + barWidth / 2} ${padding.top + chartHeight + 20})`}
              >
                {item.label.length > 20 ? item.label.substring(0, 20) + '...' : item.label}
              </text>
            </g>
          );
        })}

        {/* Y-axis label */}
        <text
          x={20}
          y={height / 2}
          textAnchor="middle"
          fontSize="14"
          fill="#333"
          transform={`rotate(-90 20 ${height / 2})`}
          fontWeight="600"
        >
          {yLabel || 'Count'}
        </text>

        {/* X-axis label */}
        <text
          x={width / 2}
          y={height - 10}
          textAnchor="middle"
          fontSize="14"
          fill="#333"
          fontWeight="600"
        >
          {xLabel || 'Category'}
        </text>
      </svg>
    </div>
  );
};

export default BarChart;
