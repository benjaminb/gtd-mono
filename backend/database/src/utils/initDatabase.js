const driver = require('./database');

/**
 * Initialize database with constraints and indexes
 */
async function initDatabase() {
  const session = driver.session();

  try {
    console.log('Initializing database...');

    // Create uniqueness constraints (these also create indexes)
    console.log('Creating constraints...');

    // User constraints
    await session.run(
      'CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE'
    );

    await session.run(
      'CREATE CONSTRAINT user_email_unique IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE'
    );

    await session.run(
      'CREATE CONSTRAINT user_username_unique IF NOT EXISTS FOR (u:User) REQUIRE u.username IS UNIQUE'
    );

    // Task constraints
    await session.run(
      'CREATE CONSTRAINT task_id_unique IF NOT EXISTS FOR (t:Task) REQUIRE t.id IS UNIQUE'
    );

    // PropertySchema constraints
    await session.run(
      'CREATE CONSTRAINT property_schema_id_unique IF NOT EXISTS FOR (ps:PropertySchema) REQUIRE ps.id IS UNIQUE'
    );

    console.log('Creating indexes...');

    // Additional indexes for common queries
    await session.run(
      'CREATE INDEX task_done_index IF NOT EXISTS FOR (t:Task) ON (t.done)'
    );

    await session.run(
      'CREATE INDEX task_created_at_index IF NOT EXISTS FOR (t:Task) ON (t.createdAt)'
    );

    console.log('Database initialization complete!');
    console.log('Constraints and indexes created successfully.');

  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    await session.close();
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to initialize database:', error);
      process.exit(1);
    });
}

module.exports = initDatabase;
