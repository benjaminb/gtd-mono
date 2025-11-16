import { useState } from 'react';
import { usePropertySchema } from '../context/PropertySchemaContext';
import './PropertyEditor.css';

const PropertyEditor = ({ properties, onChange }) => {
  const { schemas, createSchema, getSchema } = usePropertySchema();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newPropertyName, setNewPropertyName] = useState('');
  const [newPropertyType, setNewPropertyType] = useState('text');
  const [newPropertyValue, setNewPropertyValue] = useState('');
  const [newPropertyConstraints, setNewPropertyConstraints] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

  const dataTypes = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'boolean', label: 'True/False' },
    { value: 'select', label: 'Dropdown' }
  ];

  const handleAddProperty = async () => {
    if (!newPropertyName.trim()) {
      return;
    }

    try {
      // Create schema if it doesn't exist
      let schema = getSchema(newPropertyName);
      if (!schema) {
        schema = await createSchema(newPropertyName, newPropertyType, newPropertyConstraints);
      }

      // Add property with value
      const updatedProperties = {
        ...properties,
        [newPropertyName]: newPropertyValue
      };

      onChange(updatedProperties);

      // Reset form
      setNewPropertyName('');
      setNewPropertyType('text');
      setNewPropertyValue('');
      setNewPropertyConstraints({});
      setIsAddingNew(false);
    } catch (err) {
      console.error('Error adding property:', err);
      alert('Failed to add property: ' + err.message);
    }
  };

  const handlePropertyChange = (propertyName, value) => {
    const updatedProperties = {
      ...properties,
      [propertyName]: value
    };
    onChange(updatedProperties);
  };

  const handleRemoveProperty = (propertyName) => {
    const updatedProperties = { ...properties };
    delete updatedProperties[propertyName];
    onChange(updatedProperties);
  };

  const renderInput = (propertyName, value) => {
    const schema = getSchema(propertyName);
    const dataType = schema?.dataType || 'text';

    switch (dataType) {
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handlePropertyChange(propertyName, e.target.value)}
            min={schema?.constraints?.min}
            max={schema?.constraints?.max}
            step={schema?.constraints?.integer ? 1 : 'any'}
            placeholder="Enter number"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => handlePropertyChange(propertyName, e.target.value)}
            min={schema?.constraints?.minDate}
            max={schema?.constraints?.maxDate}
          />
        );

      case 'boolean':
        return (
          <select
            value={value === true || value === 'true' ? 'true' : 'false'}
            onChange={(e) => handlePropertyChange(propertyName, e.target.value === 'true')}
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );

      case 'select':
        const options = schema?.constraints?.options || [];
        return (
          <select
            value={value || ''}
            onChange={(e) => handlePropertyChange(propertyName, e.target.value)}
          >
            <option value="">Select...</option>
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'text':
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handlePropertyChange(propertyName, e.target.value)}
            maxLength={schema?.constraints?.maxLength}
            placeholder="Enter text"
          />
        );
    }
  };

  const renderNewPropertyInput = () => {
    switch (newPropertyType) {
      case 'number':
        return (
          <>
            <input
              type="number"
              value={newPropertyValue}
              onChange={(e) => setNewPropertyValue(e.target.value)}
              placeholder="Enter initial value"
            />
            <div className="constraints-inputs">
              <input
                type="number"
                placeholder="Min (optional)"
                onChange={(e) => setNewPropertyConstraints({
                  ...newPropertyConstraints,
                  min: e.target.value ? parseFloat(e.target.value) : undefined
                })}
              />
              <input
                type="number"
                placeholder="Max (optional)"
                onChange={(e) => setNewPropertyConstraints({
                  ...newPropertyConstraints,
                  max: e.target.value ? parseFloat(e.target.value) : undefined
                })}
              />
              <label>
                <input
                  type="checkbox"
                  checked={newPropertyConstraints.integer || false}
                  onChange={(e) => setNewPropertyConstraints({
                    ...newPropertyConstraints,
                    integer: e.target.checked
                  })}
                />
                Integers only
              </label>
            </div>
          </>
        );

      case 'date':
        return (
          <input
            type="date"
            value={newPropertyValue}
            onChange={(e) => setNewPropertyValue(e.target.value)}
          />
        );

      case 'boolean':
        return (
          <select
            value={newPropertyValue}
            onChange={(e) => setNewPropertyValue(e.target.value === 'true')}
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );

      case 'select':
        return (
          <div className="select-options-input">
            <input
              type="text"
              placeholder="Enter options (comma-separated)"
              onChange={(e) => {
                const options = e.target.value.split(',').map(o => o.trim()).filter(Boolean);
                setNewPropertyConstraints({ options });
              }}
            />
            <select
              value={newPropertyValue}
              onChange={(e) => setNewPropertyValue(e.target.value)}
            >
              <option value="">Select initial value...</option>
              {(newPropertyConstraints.options || []).map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        );

      case 'text':
      default:
        return (
          <input
            type="text"
            value={newPropertyValue}
            onChange={(e) => setNewPropertyValue(e.target.value)}
            placeholder="Enter initial value"
          />
        );
    }
  };

  return (
    <div className="property-editor">
      <h4>Custom Properties</h4>

      {/* Existing properties */}
      {Object.entries(properties || {}).map(([key, value]) => {
        const schema = getSchema(key);
        return (
          <div key={key} className="property-row">
            <label>
              <strong>{key}</strong>
              {schema && <span className="property-type">({schema.dataType})</span>}
            </label>
            <div className="property-input-group">
              {renderInput(key, value)}
              <button
                type="button"
                onClick={() => handleRemoveProperty(key)}
                className="remove-property-btn"
                title="Remove property"
              >
                ×
              </button>
            </div>
            {validationErrors[key] && (
              <span className="validation-error">{validationErrors[key]}</span>
            )}
          </div>
        );
      })}

      {/* Add new property */}
      {!isAddingNew && (
        <button
          type="button"
          onClick={() => setIsAddingNew(true)}
          className="add-property-btn"
        >
          + Add Property
        </button>
      )}

      {isAddingNew && (
        <div className="new-property-form">
          <input
            type="text"
            value={newPropertyName}
            onChange={(e) => setNewPropertyName(e.target.value)}
            placeholder="Property name"
            className="property-name-input"
          />

          <select
            value={newPropertyType}
            onChange={(e) => {
              setNewPropertyType(e.target.value);
              setNewPropertyValue('');
              setNewPropertyConstraints({});
            }}
            className="property-type-select"
          >
            {dataTypes.map(dt => (
              <option key={dt.value} value={dt.value}>{dt.label}</option>
            ))}
          </select>

          {renderNewPropertyInput()}

          <div className="new-property-actions">
            <button
              type="button"
              onClick={handleAddProperty}
              className="save-property-btn"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(false);
                setNewPropertyName('');
                setNewPropertyType('text');
                setNewPropertyValue('');
                setNewPropertyConstraints({});
              }}
              className="cancel-property-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyEditor;
