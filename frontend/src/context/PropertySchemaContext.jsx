import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const PropertySchemaContext = createContext();

export const usePropertySchema = () => {
  const context = useContext(PropertySchemaContext);
  if (!context) {
    throw new Error('usePropertySchema must be used within PropertySchemaProvider');
  }
  return context;
};

export const PropertySchemaProvider = ({ children }) => {
  const { user } = useAuth();
  const [schemas, setSchemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load schemas when user changes
  useEffect(() => {
    if (user) {
      loadSchemas();
    } else {
      setSchemas([]);
      setLoading(false);
    }
  }, [user]);

  const loadSchemas = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const userSchemas = await api.getUserPropertySchemas(user.id);
      setSchemas(userSchemas);
    } catch (err) {
      setError(err.message);
      console.error('Error loading property schemas:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSchema = (propertyName) => {
    return schemas.find(s => s.propertyName === propertyName);
  };

  const createSchema = async (propertyName, dataType = 'text', constraints = {}) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const schema = await api.createPropertySchema({
        userId: user.id,
        propertyName,
        dataType,
        constraints
      });

      setSchemas(prev => [...prev, schema]);
      return schema;
    } catch (err) {
      // If schema already exists, just return it
      if (err.message.includes('already exists')) {
        const existing = await api.getUserPropertySchemas(user.id);
        const found = existing.find(s => s.propertyName === propertyName);
        if (found) {
          // Update our local state
          setSchemas(existing);
          return found;
        }
      }
      throw err;
    }
  };

  const updateSchema = async (id, updates) => {
    try {
      const updated = await api.updatePropertySchema(id, updates);
      setSchemas(prev => prev.map(s => s.id === id ? updated : s));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteSchema = async (id) => {
    try {
      await api.deletePropertySchema(id);
      setSchemas(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const validateValue = async (propertyName, value) => {
    if (!user) return { valid: true };

    try {
      return await api.validatePropertyValue(user.id, propertyName, value);
    } catch (err) {
      console.error('Error validating property value:', err);
      return { valid: false, error: 'Validation failed' };
    }
  };

  const value = {
    schemas,
    loading,
    error,
    getSchema,
    createSchema,
    updateSchema,
    deleteSchema,
    validateValue,
    loadSchemas
  };

  return (
    <PropertySchemaContext.Provider value={value}>
      {children}
    </PropertySchemaContext.Provider>
  );
};
