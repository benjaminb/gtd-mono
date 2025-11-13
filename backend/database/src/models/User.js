const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const driver = require('../utils/database');

class User {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {string} userData.username - Username
   * @param {string} userData.email - Email address
   * @param {string} userData.password - Plain text password (will be hashed)
   * @returns {Promise<Object>} Created user (without password)
   */
  static async create({ username, email, password }) {
    const session = driver.session();
    try {
      const passwordHash = await bcrypt.hash(password, 10);
      const id = uuidv4();
      const createdAt = new Date().toISOString();

      const result = await session.run(
        `CREATE (u:User {
          id: $id,
          username: $username,
          email: $email,
          passwordHash: $passwordHash,
          createdAt: $createdAt
        })
        RETURN u`,
        { id, username, email, passwordHash, createdAt }
      );

      const user = result.records[0].get('u').properties;
      delete user.passwordHash;
      return user;
    } finally {
      await session.close();
    }
  }

  /**
   * Find user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  static async findById(id) {
    const session = driver.session();
    try {
      const result = await session.run(
        'MATCH (u:User {id: $id}) RETURN u',
        { id }
      );

      if (result.records.length === 0) {
        return null;
      }

      const user = result.records[0].get('u').properties;
      delete user.passwordHash;
      return user;
    } finally {
      await session.close();
    }
  }

  /**
   * Find user by email
   * @param {string} email - Email address
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByEmail(email) {
    const session = driver.session();
    try {
      const result = await session.run(
        'MATCH (u:User {email: $email}) RETURN u',
        { email }
      );

      if (result.records.length === 0) {
        return null;
      }

      const user = result.records[0].get('u').properties;
      delete user.passwordHash;
      return user;
    } finally {
      await session.close();
    }
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByUsername(username) {
    const session = driver.session();
    try {
      const result = await session.run(
        'MATCH (u:User {username: $username}) RETURN u',
        { username }
      );

      if (result.records.length === 0) {
        return null;
      }

      const user = result.records[0].get('u').properties;
      delete user.passwordHash;
      return user;
    } finally {
      await session.close();
    }
  }

  /**
   * Verify user password
   * @param {string} email - Email address
   * @param {string} password - Plain text password
   * @returns {Promise<Object|null>} User object if password matches, null otherwise
   */
  static async verifyPassword(email, password) {
    const session = driver.session();
    try {
      const result = await session.run(
        'MATCH (u:User {email: $email}) RETURN u',
        { email }
      );

      if (result.records.length === 0) {
        return null;
      }

      const user = result.records[0].get('u').properties;
      const isValid = await bcrypt.compare(password, user.passwordHash);

      if (!isValid) {
        return null;
      }

      delete user.passwordHash;
      return user;
    } finally {
      await session.close();
    }
  }

  /**
   * Update user
   * @param {string} id - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated user
   */
  static async update(id, updates) {
    const session = driver.session();
    try {
      // Build SET clause dynamically from updates
      const allowedFields = ['username', 'email'];
      const setClause = [];
      const params = { id };

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          setClause.push(`u.${key} = $${key}`);
          params[key] = updates[key];
        }
      });

      if (setClause.length === 0) {
        throw new Error('No valid fields to update');
      }

      const result = await session.run(
        `MATCH (u:User {id: $id})
         SET ${setClause.join(', ')}
         RETURN u`,
        params
      );

      if (result.records.length === 0) {
        return null;
      }

      const user = result.records[0].get('u').properties;
      delete user.passwordHash;
      return user;
    } finally {
      await session.close();
    }
  }

  /**
   * Delete user and all their tasks
   * @param {string} id - User ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(id) {
    const session = driver.session();
    try {
      await session.run(
        `MATCH (u:User {id: $id})
         OPTIONAL MATCH (u)-[:OWNS]->(t:Task)
         DETACH DELETE u, t`,
        { id }
      );
      return true;
    } finally {
      await session.close();
    }
  }

  /**
   * Get all tasks for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of tasks
   */
  static async getTasks(userId) {
    const session = driver.session();
    try {
      const result = await session.run(
        `MATCH (u:User {id: $userId})-[:OWNS]->(t:Task)
         RETURN t
         ORDER BY t.createdAt DESC`,
        { userId }
      );

      return result.records.map(record => record.get('t').properties);
    } finally {
      await session.close();
    }
  }
}

module.exports = User;
