import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePropertySchema } from '../context/PropertySchemaContext';
import api from '../services/api';
import BarChart from './charts/BarChart';
import PieChart from './charts/PieChart';
import TimelineChart from './charts/TimelineChart';
import './ReportsView.css';

const ReportsView = () => {
  const { user } = useAuth();
  const { schemas } = usePropertySchema();
  const [reportType, setReportType] = useState('completion-by-parent');
  const [timeRange, setTimeRange] = useState('last-30-days');
  const [selectedProperty, setSelectedProperty] = useState('');
  const [inactivityDays, setInactivityDays] = useState(30);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get list of properties with select type for filtering
  const selectProperties = schemas.filter(s => s.dataType === 'select');

  useEffect(() => {
    if (user) {
      loadReportData();
    }
  }, [user, reportType, timeRange, selectedProperty, inactivityDays]);

  const getDateRange = () => {
    const endDate = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case 'last-7-days':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'last-30-days':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case 'last-90-days':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case 'last-year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'all-time':
        return { startDate: null, endDate: null };
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
  };

  const loadReportData = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { startDate, endDate } = getDateRange();

      switch (reportType) {
        case 'completion-by-parent': {
          const result = await api.getCompletionAnalytics(user.id, {
            startDate,
            endDate,
            groupBy: 'parent'
          });

          setChartData({
            type: 'bar',
            title: 'Task Completion by Parent Task',
            data: result.data.map(item => ({
              label: item.parentName,
              value: item.totalTasks,
              completed: item.completedTasks
            }))
          });
          break;
        }

        case 'completion-by-property': {
          if (!selectedProperty) {
            setChartData(null);
            break;
          }

          const result = await api.getCompletionAnalytics(user.id, {
            startDate,
            endDate,
            groupBy: 'property',
            propertyName: selectedProperty
          });

          setChartData({
            type: 'pie',
            title: `Tasks by ${selectedProperty}`,
            data: result.data.map(item => ({
              label: item.groupName,
              value: item.totalTasks
            }))
          });
          break;
        }

        case 'property-distribution': {
          if (!selectedProperty) {
            setChartData(null);
            break;
          }

          const result = await api.getPropertyDistribution(user.id, selectedProperty);

          setChartData({
            type: 'bar',
            title: `Distribution of ${selectedProperty}`,
            data: result.data.map(item => ({
              label: item.value,
              value: item.count
            }))
          });
          break;
        }

        case 'timeline': {
          const result = await api.getTimelineAnalytics(user.id, {
            startDate,
            endDate
          });

          setChartData({
            type: 'timeline',
            title: 'Task Activity Timeline',
            data: result.data
          });
          break;
        }

        case 'inactive-projects': {
          const result = await api.getInactiveProjects(user.id, {
            daysSinceUpdate: inactivityDays,
            minSubtasks: 2
          });

          setChartData({
            type: 'list',
            title: `Projects Inactive for ${inactivityDays}+ Days`,
            data: result.data
          });
          break;
        }

        default:
          setChartData(null);
      }
    } catch (err) {
      console.error('Error loading report data:', err);
      setError('Failed to load report data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    if (loading) {
      return <div className="report-loading">Loading report data...</div>;
    }

    if (error) {
      return <div className="report-error">{error}</div>;
    }

    if (!chartData) {
      return <div className="report-empty">Select a report type to view analytics</div>;
    }

    switch (chartData.type) {
      case 'bar':
        return (
          <BarChart
            data={chartData.data}
            title={chartData.title}
            xLabel="Category"
            yLabel="Count"
          />
        );

      case 'pie':
        return (
          <PieChart
            data={chartData.data}
            title={chartData.title}
          />
        );

      case 'timeline':
        return (
          <TimelineChart
            data={chartData.data}
            title={chartData.title}
          />
        );

      case 'list':
        return (
          <div className="chart-container">
            <h3>{chartData.title}</h3>
            {chartData.data.length === 0 ? (
              <p className="chart-empty">No inactive projects found</p>
            ) : (
              <div className="inactive-projects-list">
                {chartData.data.map(project => (
                  <div key={project.projectId} className="inactive-project-item">
                    <div className="project-name">{project.projectName}</div>
                    <div className="project-stats">
                      <span className="stat">
                        {project.subtaskCount} subtasks
                      </span>
                      <span className="stat warning">
                        {project.daysSinceActivity
                          ? `${project.daysSinceActivity} days inactive`
                          : 'Never updated'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="reports-view">
      <div className="reports-header">
        <h2>Reports & Analytics</h2>
      </div>

      <div className="reports-controls">
        <div className="control-group">
          <label>Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="report-select"
          >
            <option value="completion-by-parent">Tasks by Parent</option>
            <option value="completion-by-property">Tasks by Property</option>
            <option value="property-distribution">Property Distribution</option>
            <option value="timeline">Activity Timeline</option>
            <option value="inactive-projects">Inactive Projects</option>
          </select>
        </div>

        {(reportType === 'completion-by-parent' ||
          reportType === 'timeline') && (
          <div className="control-group">
            <label>Time Range</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="report-select"
            >
              <option value="last-7-days">Last 7 Days</option>
              <option value="last-30-days">Last 30 Days</option>
              <option value="last-90-days">Last 90 Days</option>
              <option value="last-year">Last Year</option>
              <option value="all-time">All Time</option>
            </select>
          </div>
        )}

        {(reportType === 'completion-by-property' ||
          reportType === 'property-distribution') && (
          <div className="control-group">
            <label>Property</label>
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="report-select"
            >
              <option value="">Select a property...</option>
              {schemas.map(schema => (
                <option key={schema.id} value={schema.propertyName}>
                  {schema.propertyName}
                </option>
              ))}
            </select>
          </div>
        )}

        {reportType === 'inactive-projects' && (
          <div className="control-group">
            <label>Inactive Days</label>
            <input
              type="number"
              value={inactivityDays}
              onChange={(e) => setInactivityDays(parseInt(e.target.value) || 30)}
              min="1"
              max="365"
              className="report-input"
            />
          </div>
        )}
      </div>

      <div className="reports-content">
        {renderChart()}
      </div>
    </div>
  );
};

export default ReportsView;
