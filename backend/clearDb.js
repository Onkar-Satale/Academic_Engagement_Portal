import { db } from "./config/db.js";

async function clearDatabase() {
  console.log("Starting database wipe...");
  try {
    const [tables] = await db.query("SHOW TABLES");
    console.log("Found tables:", tables);

    await db.query("SET FOREIGN_KEY_CHECKS = 0");

    // Clear every table found except 'role'
    for (const row of tables) {
      const tableName = Object.values(row)[0];
      if (tableName === "role_handover" || tableName === "role_invite_key") {
        try {
          await db.query(`DROP TABLE IF EXISTS \`${tableName}\``);
          console.log(`✓ Dropped deprecated table: ${tableName}`);
        } catch (err) {
          console.warn(`! Warning on dropping ${tableName}:`, err.message);
        }
      } else if (tableName !== "role") {
        try {
          await db.query(`TRUNCATE TABLE \`${tableName}\``);
          console.log(`✓ Cleared table: ${tableName}`);
        } catch (err) {
          console.warn(`! Warning on clearing ${tableName}:`, err.message);
        }
      }
    }

    // Ensure roles are seeded properly
    await db.query(`
      CREATE TABLE IF NOT EXISTS role (
        role_id INT PRIMARY KEY AUTO_INCREMENT,
        role_name VARCHAR(50) NOT NULL UNIQUE
      )
    `);

    await db.query(`
      INSERT IGNORE INTO role (role_id, role_name) VALUES
      (1, 'Student'),
      (2, 'Teacher'),
      (3, 'Admin'),
      (4, 'Club Head'),
      (5, 'Club Mentor'),
      (6, 'Estate Manager'),
      (7, 'Principal'),
      (8, 'Director')
    `);
    console.log("✓ Verified default roles");

    await db.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("\nTable status after wipe:");
    const [activeTables] = await db.query("SHOW TABLES");
    for (const row of activeTables) {
      const tableName = Object.values(row)[0];
      const [[res]] = await db.query(`SELECT COUNT(*) as cnt FROM \`${tableName}\``);
      console.log(`- ${tableName}: ${res.cnt} rows`);
    }

    console.log("\n==========================================");
    console.log(" DATABASE SUCCESSFULLY CLEARED AND RESET! ");
    console.log("==========================================");
  } catch (error) {
    console.error("Error while clearing database:", error);
  } finally {
    await db.end();
  }
}

clearDatabase();
