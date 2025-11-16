const { v4: uuidv4 } = require('uuid');
const driver = require('../utils/database');

/**
 * PropertySchema Model
 * Defines metadata for custom task properties
 */
class PropertySchema {
  /**
   * Create a new property schema
   * @param {Object} data
   * @param {string} data.userId - Owner of this schema
   * @param {string} data.propertyName - Name of the property
   * @param {string} data.dataType - 'text', 'number', 'date', 'boolean', 'select'
   * @param {Object} data.constraints - Optional constraints (min, max, options, etc.)
   * @returns {Promise<Object>} Created property schema
   */
  static async create({ userId, propertyName, dataType = 'text', constraints = {} }) {
    const session = driver.session();

    try {
      const id = uuidv4();
      const createdAt = new Date().toISOString();

      const result = await session.run(
        `MATCH (u:User {id: $userId})
         CREATE (ps:PropertySchema {
           id: $id,
           userId: $userId,
           propertyName: $propertyName,
           dataType: $dataType,
           constraints: $constraints,
           createdAt: $createdAt,
           updatedAt: $createdAt
         })
         CREATE (u)-[:HAS_PROPERTY_SCHEMA]->(ps)
         RETURN ps`,
        {
          id,
          userId,
          propertyName,
          dataType,
          constraints: JSON.stringify(constraints),
          createdAt
        }
      );

      if (result.records.length === 0) {
        return null;
      }

      const schema = result.records[0].get('ps').properties;
      schema.constraints = JSON.parse(schema.constraints || '{}');
      return schema;
    } finally {
      await session.close();
    }
  }

  /**
   * Find property schema by ID
   */
  static async findById(id) {
    const session = driver.session();

    try {
      const result = await session.run(
        `MATCH (ps:PropertySchema {id: $id})
         RETURN ps`,
        { id }
      );

      if (result.records.length === 0) {
        return null;
      }

      const schema = result.records[0].get('ps').properties;
      schema.constraints = JSON.parse(schema.constraints || '{}');
      return schema;
    } finally {
      await session.close();
    }
  }

  /**
   * Find property schema by user and property name
   */
  static async findByName(userId, propertyName) {
    const session = driver.session();

    try {
      const result = await session.run(
        `MATCH (ps:PropertySchema {userId: $userId, propertyName: $propertyName})
         RETURN ps`,
        { userId, propertyName }
      );

      if (result.records.length === 0) {
        return null;
      }

      const schema = result.records[0].get('ps').properties;
      schema.constraints = JSON.parse(schema.constraints || '{}');
      return schema;
    } finally {
      await session.close();
    }
  }

  /**
   * Get all property schemas for a user
   */
  static async getUserSchemas(userId) {
    const session = driver.session();

    try {
      const result = await session.run(
        `MATCH (u:User {id: $userId})-[:HAS_PROPERTY_SCHEMA]->(ps:PropertySchema)
         RETURN ps
         ORDER BY ps.propertyName`,
        { userId }
      );

      return result.records.map(record => {
        const schema = record.get('ps').properties;
        schema.constraints = JSON.parse(schema.constraints || '{}');
        return schema;
      });
    } finally {
      await session.close();
    }
  }

  /**
   * Update property schema
   */
  static async update(id, updates) {
    const session = driver.session();

    try {
      const allowedUpdates = ['dataType', 'constraints'];
      const setClause = [];
      const params = { id, updatedAt: new Date().toISOString() };

      Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key)) {
          setClause.push(`ps.${key} = $${key}`);
          params[key] = key === 'constraints' ? JSON.stringify(updates[key]) : updates[key];
        }
      });

      if (setClause.length === 0) {
        return null;
      }

      setClause.push('ps.updatedAt = $updatedAt');

      const result = await session.run(
        `MATCH (ps:PropertySchema {id: $id})
         SET ${setClause.join(', ')}
         RETURN ps`,
        params
      );

      if (result.records.length === 0) {
        return null;
      }

      const schema = result.records[0].get('ps').properties;
      schema.constraints = JSON.parse(schema.constraints || '{}');
      return schema;
    } finally {
      await session.close();
    }
  }

  /**
   * Delete property schema
   */
  static async delete(id) {
    const session = driver.session();

    try {
      await session.run(
        `MATCH (ps:PropertySchema {id: $id})
         DETACH DELETE ps`,
        { id }
      );
    } finally {
      await session.close();
    }
  }

  /**
   * Validate a property value against its schema
   * @param {Object} schema - The property schema
   * @param {*} value - The value to validate
   * @returns {Object} { valid: boolean, error: string }
   */
  static validateValue(schema, value) {
    if (value === null || value === undefined || value === '') {
      return { valid: true }; // Allow empty values
    }

    switch (schema.dataType) {
      case 'text':
        if (typeof value !== 'string') {
          return { valid: false, error: 'Value must be text' };
        }
        if (schema.constraints.maxLength && value.length > schema.constraints.maxLength) {
          return { valid: false, error: `Text must be at most ${schema.constraints.maxLength} characters` };
        }
        return { valid: true };

      case 'number':
        const num = typeof value === 'number' ? value : parseFloat(value);
        if (isNaN(num)) {
          return { valid: false, error: 'Value must be a number' };
        }
        if (schema.constraints.min !== undefined && num < schema.constraints.min) {
          return { valid: false, error: `Value must be at least ${schema.constraints.min}` };
        }
        if (schema.constraints.max !== undefined && num > schema.constraints.max) {
          return { valid: false, error: `Value must be at most ${schema.constraints.max}` };
        }
        if (schema.constraints.integer && !Number.isInteger(num)) {
          return { valid: false, error: 'Value must be an integer' };
        }
        return { valid: true, value: num }; // Return normalized number

      case 'date':
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return { valid: false, error: 'Value must be a valid date' };
        }
        if (schema.constraints.minDate && date < new Date(schema.constraints.minDate)) {
          return { valid: false, error: `Date must be after ${schema.constraints.minDate}` };
        }
        if (schema.constraints.maxDate && date > new Date(schema.constraints.maxDate)) {
          return { valid: false, error: `Date must be before ${schema.constraints.maxDate}` };
        }
        return { valid: true, value: date.toISOString().split('T')[0] }; // Return YYYY-MM-DD

      case 'boolean':
        if (typeof value === 'boolean') {
          return { valid: true };
        }
        if (value === 'true' || value === 'false') {
          return { valid: true, value: value === 'true' };
        }
        return { valid: false, error: 'Value must be true or false' };

      case 'select':
        if (!schema.constraints.options || !Array.isArray(schema.constraints.options)) {
          return { valid: false, error: 'No options defined for this property' };
        }
        if (!schema.constraints.options.includes(value)) {
          return { valid: false, error: `Value must be one of: ${schema.constraints.options.join(', ')}` };
        }
        return { valid: true };

      default:
        return { valid: true }; // Unknown type, allow anything
    }
  }
}

module.exports = PropertySchema;
