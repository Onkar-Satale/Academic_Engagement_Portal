import { db } from "../config/db.js";

async function resetAllUsers() {
  console.log("Starting full user cleanup and reset...");

  try {
    // 1. Clear audit logs
    await db.query("DELETE FROM audit_log");
    console.log("✓ Cleared audit_log table");

    // 2. Clear feedback
    await db.query("DELETE FROM feedback");
    console.log("✓ Cleared feedback table");

    // 3. Clear notifications
    await db.query("DELETE FROM notification");
    console.log("✓ Cleared notification table");

    // 4. Clear permission approvals & requests
    await db.query("DELETE FROM permission_approval");
    await db.query("DELETE FROM permission_request");
    console.log("✓ Cleared permission requests & approvals");

    // 5. Clear event registrations
    await db.query("DELETE FROM event_registration");
    console.log("✓ Cleared event_registration table");

    // 6. Clear club members & applications
    await db.query("DELETE FROM club_member");
    console.log("✓ Cleared club_member table");

    // 7. Reset club head/mentor assignments & restore initial default keys
    await db.query(`
      UPDATE club 
      SET club_head_id = NULL, 
          club_mentor_id = NULL,
          club_head_key = CASE 
            WHEN club_id = 1 THEN 'HEAD_KEY_CODING'
            WHEN club_id = 2 THEN 'HEAD_KEY_ROBOTICS'
            WHEN club_id = 3 THEN 'HEAD_KEY_CULTURAL'
            ELSE CONCAT('HEAD_KEY_CLUB_', club_id)
          END,
          club_mentor_key = CASE 
            WHEN club_id = 1 THEN 'MENTOR_KEY_CODING'
            WHEN club_id = 2 THEN 'MENTOR_KEY_ROBOTICS'
            WHEN club_id = 3 THEN 'MENTOR_KEY_CULTURAL'
            ELSE CONCAT('MENTOR_KEY_CLUB_', club_id)
          END
    `);
    console.log("✓ Reset club assignments and restored club registration keys");

    // 8. Clear role invite keys (so admin can start fresh)
    await db.query("DELETE FROM role_invite_key");
    console.log("✓ Cleared role_invite_key table");

    // 9. Delete all users and reset auto_increment
    await db.query("DELETE FROM user");
    await db.query("ALTER TABLE user AUTO_INCREMENT = 1");
    console.log("✓ Deleted all user accounts and reset user ID counter to 1");

    console.log("\n All accounts and user data successfully wiped for fresh testing!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Reset failed:", err);
    process.exit(1);
  }
}

resetAllUsers();
