import './TimelineChart.css';

const TimelineChart = ({ data, title }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <h3>{title}</h3>
        <p className="chart-empty">No data to display</p>
      </div>
    );
  }

  const width = 900;
  const height = 400;
  const padding = { top: 40, right: 40, bottom: 80, left: 80 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find max value for Y-axis
  const maxValue = Math.max(
    ...data.map(d => Math.max(d.tasksCreated || 0, d.tasksCompleted || 0))
  );
  const yScale = chartHeight / maxValue;

  // Calculate point spacing
  const pointSpacing = chartWidth / (data.length - 1);

  // Generate points for lines
  const createdPoints = data.map((item, index) => ({
    x: padding.left + index * pointSpacing,
    y: padding.top + chartHeight - (item.tasksCreated || 0) * yScale,
    value: item.tasksCreated || 0,
    date: item.date
  }));

  const completedPoints = data.map((item, index) => ({
    x: padding.left + index * pointSpacing,
    y: padding.top + chartHeight - (item.tasksCompleted || 0) * yScale,
    value: item.tasksCompleted || 0,
    date: item.date
  }));

  // Create SVG path strings
  const createdPath = createdPoints
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const completedPath = completedPoints
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  return (
    <div className="chart-container">
      <h3>{title}</h3>
      <svg width={width} height={height} className="timeline-chart">
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

        {/* Created tasks line */}
        <path
          d={createdPath}
          fill="none"
          stroke="#667eea"
          strokeWidth="3"
          className="timeline-line"
        />

        {/* Completed tasks line */}
        <path
          d={completedPath}
          fill="none"
          stroke="#4CAF50"
          strokeWidth="3"
          className="timeline-line"
        />

        {/* Created tasks points */}
        {createdPoints.map((point, index) => (
          <circle
            key={`created-${index}`}
            cx={point.x}
            cy={point.y}
            r="5"
            fill="#667eea"
            className="timeline-point"
          >
            <title>{`${point.date}: ${point.value} tasks created`}</title>
          </circle>
        ))}

        {/* Completed tasks points */}
        {completedPoints.map((point, index) => (
          <circle
            key={`completed-${index}`}
            cx={point.x}
            cy={point.y}
            r="5"
            fill="#4CAF50"
            className="timeline-point"
          >
            <title>{`${point.date}: ${point.value} tasks completed`}</title>
          </circle>
        ))}

        {/* X-axis labels (dates) */}
        {data.map((item, index) => {
          // Only show every nth label to avoid crowding
          const showLabel = data.length <= 10 || index % Math.ceil(data.length / 10) === 0;
          if (!showLabel) return null;

          const x = padding.left + index * pointSpacing;
          const dateLabel = new Date(item.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          });

          return (
            <text
              key={`label-${index}`}
              x={x}
              y={padding.top + chartHeight + 20}
              textAnchor="end"
              fontSize="11"
              fill="#666"
              transform={`rotate(-45 ${x} ${padding.top + chartHeight + 20})`}
            >
              {dateLabel}
            </text>
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
          Number of Tasks
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
          Date
        </text>
      </svg>

      {/* Legend */}
      <div className="timeline-legend">
        <div className="timeline-legend-item">
          <div className="timeline-legend-color" style={{ backgroundColor: '#667eea' }} />
          <span>Tasks Created</span>
        </div>
        <div className="timeline-legend-item">
          <div className="timeline-legend-color" style={{ backgroundColor: '#4CAF50' }} />
          <span>Tasks Completed</span>
        </div>
      </div>
    </div>
  );
};

export default TimelineChart;
