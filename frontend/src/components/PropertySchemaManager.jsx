import { useState } from 'react';
import { usePropertySchema } from '../context/PropertySchemaContext';
import { useTask } from '../context/TaskContext';
import './PropertySchemaManager.css';

const PropertySchemaManager = ({ onClose }) => {
  const { schemas, updateSchema, deleteSchema } = usePropertySchema();
  const { tasks, updateTask } = useTask();
  const [editingSchema, setEditingSchema] = useState(null);
  const [editOptions, setEditOptions] = useState([]);
  const [removingOption, setRemovingOption] = useState(null);
  const [affectedTasks, setAffectedTasks] = useState([]);

  const dataTypeLabels = {
    text: 'Text',
    number: 'Number',
    date: 'Date',
    boolean: 'True/False',
    select: 'Dropdown'
  };

  const handleEditOptions = (schema) => {
    setEditingSchema(schema);
    setEditOptions(schema.constraints?.options || []);
  };

  const handleAddOption = () => {
    setEditOptions([...editOptions, '']);
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...editOptions];
    newOptions[index] = value;
    setEditOptions(newOptions);
  };

  const handleRemoveOptionClick = (option) => {
    // Find all tasks that have this property with this value
    const affected = tasks.filter(task => {
      const propValue = task.customProperties?.[editingSchema.propertyName];
      return propValue === option;
    });

    setRemovingOption(option);
    setAffectedTasks(affected);
  };

  const handleConfirmRemoveOption = async () => {
    // Remove the option from schema
    const newOptions = editOptions.filter(opt => opt !== removingOption);
    setEditOptions(newOptions);

    // Remove the property from all affected tasks
    for (const task of affectedTasks) {
      try {
        const updatedProperties = { ...task.customProperties };
        delete updatedProperties[editingSchema.propertyName];

        await updateTask(task.id, {
          customProperties: updatedProperties
        });
      } catch (err) {
        console.error('Error removing property from task:', err);
      }
    }

    // Clear removal state
    setRemovingOption(null);
    setAffectedTasks([]);
  };

  const handleCancelRemoveOption = () => {
    setRemovingOption(null);
    setAffectedTasks([]);
  };

  const handleSaveOptions = async () => {
    try {
      // Filter out empty options
      const cleanedOptions = editOptions.filter(opt => opt.trim() !== '');

      await updateSchema(editingSchema.id, {
        constraints: {
          ...editingSchema.constraints,
          options: cleanedOptions
        }
      });

      setEditingSchema(null);
      setEditOptions([]);
    } catch (err) {
      console.error('Error saving options:', err);
      alert('Failed to save options: ' + err.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingSchema(null);
    setEditOptions([]);
    setRemovingOption(null);
    setAffectedTasks([]);
  };

  const renderConstraints = (schema) => {
    const constraints = schema.constraints || {};

    switch (schema.dataType) {
      case 'number':
        const parts = [];
        if (constraints.min !== undefined) parts.push(`Min: ${constraints.min}`);
        if (constraints.max !== undefined) parts.push(`Max: ${constraints.max}`);
        if (constraints.integer) parts.push('Integers only');
        return parts.length > 0 ? parts.join(', ') : 'No constraints';

      case 'date':
        const dateParts = [];
        if (constraints.minDate) dateParts.push(`After: ${constraints.minDate}`);
        if (constraints.maxDate) dateParts.push(`Before: ${constraints.maxDate}`);
        return dateParts.length > 0 ? dateParts.join(', ') : 'No constraints';

      case 'text':
        return constraints.maxLength ? `Max length: ${constraints.maxLength}` : 'No constraints';

      case 'select':
        const options = constraints.options || [];
        return `${options.length} option${options.length !== 1 ? 's' : ''}`;

      default:
        return 'No constraints';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content schema-manager-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Manage Property Schemas</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        {!editingSchema ? (
          <div className="schemas-list">
            {schemas.length === 0 ? (
              <p className="no-schemas">No property schemas defined yet. Create one by adding a property to a task!</p>
            ) : (
              <table className="schemas-table">
                <thead>
                  <tr>
                    <th>Property Name</th>
                    <th>Type</th>
                    <th>Constraints</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schemas.map(schema => (
                    <tr key={schema.id}>
                      <td><strong>{schema.propertyName}</strong></td>
                      <td>{dataTypeLabels[schema.dataType]}</td>
                      <td className="constraints-cell">{renderConstraints(schema)}</td>
                      <td className="actions-cell">
                        {schema.dataType === 'select' && (
                          <button
                            onClick={() => handleEditOptions(schema)}
                            className="edit-options-btn"
                          >
                            Edit Options
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="edit-options-section">
            <h3>Edit Options for "{editingSchema.propertyName}"</h3>

            {!removingOption ? (
              <>
                <div className="options-list">
                  {editOptions.map((option, index) => (
                    <div key={index} className="option-row">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder="Option value"
                      />
                      <button
                        onClick={() => handleRemoveOptionClick(option)}
                        className="remove-option-btn"
                        disabled={!option.trim()}
                        title="Remove this option"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <button onClick={handleAddOption} className="add-option-btn">
                  + Add Option
                </button>

                <div className="edit-actions">
                  <button onClick={handleSaveOptions} className="save-btn">
                    Save Changes
                  </button>
                  <button onClick={handleCancelEdit} className="cancel-btn">
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="removal-confirmation">
                <h4>Remove option "{removingOption}"?</h4>

                {affectedTasks.length > 0 ? (
                  <>
                    <p className="warning-text">
                      This option is used by {affectedTasks.length} task{affectedTasks.length !== 1 ? 's' : ''}.
                      The "{editingSchema.propertyName}" property will be removed from these tasks:
                    </p>

                    <div className="affected-tasks-list">
                      {affectedTasks.map(task => (
                        <div key={task.id} className="affected-task-item">
                          <span className="task-name">{task.name}</span>
                          <span className="task-value">
                            {editingSchema.propertyName}: {removingOption}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="confirmation-actions">
                      <button onClick={handleConfirmRemoveOption} className="confirm-remove-btn">
                        Remove Option & Clean Up Tasks
                      </button>
                      <button onClick={handleCancelRemoveOption} className="cancel-btn">
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="info-text">
                      No tasks are currently using this option. It's safe to remove.
                    </p>

                    <div className="confirmation-actions">
                      <button onClick={handleConfirmRemoveOption} className="confirm-remove-btn">
                        Remove Option
                      </button>
                      <button onClick={handleCancelRemoveOption} className="cancel-btn">
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertySchemaManager;
