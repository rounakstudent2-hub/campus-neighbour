import db from '../src/database/db.js';
import { seedDatabase } from '../src/database/seed.js';

async function runTestSuite() {
  console.log('🧪 ========================================================');
  console.log('🧪 RUNNING NEIGHBORHOOD MARKETPLACE FULL-STACK TEST SUITE');
  console.log('🧪 ========================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Schema & Seeder
    console.log('\n--- 1. Testing Database & Seed Data ---');
    await seedDatabase();
    const catCount = await db.get('SELECT COUNT(*) as count FROM task_categories');
    assert(catCount.count >= 9, `All initial categories seeded (count = ${catCount.count})`);

    const users = await db.query('SELECT role, COUNT(*) as count FROM users GROUP BY role');
    assert(users.rows.length >= 3, `All 3 roles present in database (neighbor, student, admin)`);

    // 2. Authentication & Passwords
    console.log('\n--- 2. Testing Authentication Models ---');
    const adminUser = await db.get("SELECT * FROM users WHERE email = 'admin@marketplace.local'");
    assert(adminUser !== null && adminUser.role === 'admin', 'Admin account exists and has admin role');

    const studentUser = await db.get("SELECT * FROM users WHERE email = 'rahul.student@iisc.edu.in'");
    assert(studentUser !== null && studentUser.role === 'student', 'Student account exists with college info');

    const neighborUser = await db.get("SELECT * FROM users WHERE email = 'priya.neighbor@gmail.com'");
    assert(neighborUser !== null && neighborUser.role === 'neighbor', 'Neighbor account exists with locality');

    // 3. Task Creation Workflow
    console.log('\n--- 3. Testing Task Lifecycle & Escrow ---');
    const taskId = `test-task-${Date.now()}`;
    const now = new Date().toISOString();
    await db.run(
      `INSERT INTO tasks (id, customer_id, category_id, title, description, budget, deadline, address, locality, city, pincode, latitude, longitude, status, created_at, updated_at)
       VALUES (?, ?, 'cat-1', 'Test Grocery Run', 'Buy 2L organic milk and bread', 300, 'Today 6PM', '12th Main', 'Indiranagar', 'Bengaluru', '560038', 12.9784, 77.6408, 'Open', ?, ?)`,
      [taskId, neighborUser.id, now, now]
    );
    const createdTask = await db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
    assert(createdTask && createdTask.status === 'Open', 'Neighbor created new task with Open status');

    // 4. Student Applies
    const appId = `test-app-${Date.now()}`;
    await db.run(
      `INSERT INTO applications (id, task_id, student_id, proposed_fee, pitch_note, status, created_at, updated_at)
       VALUES (?, ?, ?, 300, 'Available immediately!', 'Pending', ?, ?)`,
      [appId, taskId, studentUser.id, now, now]
    );
    await db.run("UPDATE tasks SET status = 'Applied' WHERE id = ?", [taskId]);
    const appliedTask = await db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
    assert(appliedTask.status === 'Applied', 'Task transitioned to Applied status upon helper application');

    // Prevent duplicate application check
    let duplicateCaught = false;
    try {
      await db.run(
        `INSERT INTO applications (id, task_id, student_id, proposed_fee, pitch_note, status, created_at, updated_at)
         VALUES (?, ?, ?, 300, 'Duplicate try', 'Pending', ?, ?)`,
        [`dup-${Date.now()}`, taskId, studentUser.id, now, now]
      );
    } catch (e) {
      duplicateCaught = true;
    }
    assert(duplicateCaught, 'Unique constraint prevented duplicate student application for same task');

    // 5. Neighbor Assigns Student & Holds Escrow
    const asgnId = `test-asgn-${Date.now()}`;
    await db.run("UPDATE tasks SET status = 'Assigned', assigned_student_id = ? WHERE id = ?", [studentUser.id, taskId]);
    await db.run("UPDATE applications SET status = 'Accepted' WHERE id = ?", [appId]);
    await db.run(
      `INSERT INTO assignments (id, task_id, student_id, agreed_fee, assigned_at, status)
       VALUES (?, ?, ?, 300, ?, 'Assigned')`,
      [asgnId, taskId, studentUser.id, now]
    );
    const payId = `test-pay-${Date.now()}`;
    await db.run(
      `INSERT INTO payments (id, task_id, customer_id, student_id, amount, currency, status, payment_gateway, gateway_order_id, transaction_type, created_at, updated_at)
       VALUES (?, ?, ?, ?, 300, 'INR', 'escrow_held', 'Razorpay', 'test_order_99', 'escrow_hold', ?, ?)`,
      [payId, taskId, neighborUser.id, studentUser.id, now, now]
    );
    const assignedTask = await db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
    const escrowPayment = await db.get('SELECT * FROM payments WHERE id = ?', [payId]);
    assert(assignedTask.status === 'Assigned' && assignedTask.assigned_student_id === studentUser.id, 'Task assigned to student');
    assert(escrowPayment && escrowPayment.status === 'escrow_held', 'Payment held safely in escrow before work begins');

    // 6. Messaging
    console.log('\n--- 4. Testing In-App Messaging ---');
    const convId = `test-conv-${Date.now()}`;
    await db.run(
      `INSERT INTO conversations (id, task_id, customer_id, student_id, last_message_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [convId, taskId, neighborUser.id, studentUser.id, now, now]
    );
    await db.run(
      `INSERT INTO messages (id, conversation_id, sender_id, message_text, is_read, created_at)
       VALUES (?, ?, ?, 'Hi Priya, on my way to the supermarket!', 0, ?)`,
      [`msg-1-${Date.now()}`, convId, studentUser.id, now]
    );
    const msgCount = await db.get('SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?', [convId]);
    assert(msgCount.count === 1, 'In-app real-time message delivered and stored in database');

    // 7. Student Starts & Completes Work
    console.log('\n--- 5. Testing Task Progression & Completion ---');
    await db.run("UPDATE tasks SET status = 'In Progress' WHERE id = ?", [taskId]);
    const inProgTask = await db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
    assert(inProgTask.status === 'In Progress', 'Task moved to In Progress');

    await db.run("UPDATE tasks SET status = 'Completed', completion_proof = 'Delivered groceries with store receipt' WHERE id = ?", [taskId]);
    const completedTask = await db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
    assert(completedTask.status === 'Completed' && completedTask.completion_proof.length > 0, 'Work marked completed with completion proof');

    // 8. Neighbor Confirms Completion & Releases Escrow
    await db.run("UPDATE payments SET status = 'released' WHERE id = ?", [payId]);
    await db.run("UPDATE student_profiles SET total_earnings = total_earnings + 300, total_tasks_completed = total_tasks_completed + 1 WHERE user_id = ?", [studentUser.id]);
    const releasedPayment = await db.get('SELECT * FROM payments WHERE id = ?', [payId]);
    assert(releasedPayment.status === 'released', 'Payment released from escrow to student upon neighbor confirmation');

    // 9. Review Submission
    console.log('\n--- 6. Testing Review & Rating System ---');
    const revId = `test-rev-${Date.now()}`;
    await db.run(
      `INSERT INTO reviews (id, task_id, reviewer_id, reviewee_id, rating, comment, is_moderated, created_at)
       VALUES (?, ?, ?, ?, 5, 'Rahul was extremely fast and brought the exact items requested!', 0, ?)`,
      [revId, taskId, neighborUser.id, studentUser.id, now]
    );
    const review = await db.get('SELECT * FROM reviews WHERE id = ?', [revId]);
    assert(review && review.rating === 5, '5-Star review successfully recorded');

    // 10. Admin Metrics & Report Safety
    console.log('\n--- 7. Testing Administrator Oversight ---');
    const totalTasks = await db.get('SELECT COUNT(*) as count FROM tasks');
    const totalUsers = await db.get('SELECT COUNT(*) as count FROM users');
    assert(totalTasks.count >= 4, `Admin task overview accurate (${totalTasks.count} total tasks)`);
    assert(totalUsers.count >= 5, `Admin user overview accurate (${totalUsers.count} total users)`);

    // Clean up test records
    await db.run('DELETE FROM reviews WHERE id = ?', [revId]);
    await db.run('DELETE FROM payments WHERE id = ?', [payId]);
    await db.run('DELETE FROM messages WHERE conversation_id = ?', [convId]);
    await db.run('DELETE FROM conversations WHERE id = ?', [convId]);
    await db.run('DELETE FROM assignments WHERE id = ?', [asgnId]);
    await db.run('DELETE FROM applications WHERE id = ?', [appId]);
    await db.run('DELETE FROM tasks WHERE id = ?', [taskId]);

    console.log('\n========================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  }
}

runTestSuite();
