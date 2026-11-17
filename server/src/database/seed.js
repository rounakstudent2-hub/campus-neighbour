import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from './db.js';

export async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  await db.initSchema();

  // Check if categories already seeded
  const existingCat = await db.get('SELECT COUNT(*) as count FROM task_categories');
  if (existingCat && existingCat.count > 0) {
    console.log('⚡ Database already seeded. Skipping initial seed.');
    return;
  }

  const now = new Date().toISOString();
  const salt = await bcrypt.genSalt(10);
  const commonHash = await bcrypt.hash('password123', salt);
  const adminHash = await bcrypt.hash('admin123', salt);
  const studentHash = await bcrypt.hash('student123', salt);
  const neighborHash = await bcrypt.hash('neighbor123', salt);

  // 1. Initial 9 Categories
  const categories = [
    { id: 'cat-1', name: 'Grocery and Shopping Assistance', slug: 'grocery-shopping', icon: 'ShoppingCart', description: 'Assistance with buying daily groceries, market pickup, or specialized shopping.' },
    { id: 'cat-2', name: 'Home Assistance', slug: 'home-assistance', icon: 'Home', description: 'Light furniture rearranging, closet organizing, gardening, or garage cleaning.' },
    { id: 'cat-3', name: 'Pet Care', slug: 'pet-care', icon: 'PawPrint', description: 'Dog walking, cat sitting, pet feeding, and playtime companionship.' },
    { id: 'cat-4', name: 'Tutoring and Academic Help', slug: 'tutoring-academics', icon: 'GraduationCap', description: 'School homework guidance, math/science coaching, and language practice.' },
    { id: 'cat-5', name: 'Document Delivery', slug: 'document-delivery', icon: 'FileText', description: 'Urgent document dispatch, bank submission, or courier drop-off.' },
    { id: 'cat-6', name: 'Technology Assistance', slug: 'tech-assistance', icon: 'Laptop', description: 'Smartphone troubleshooting, Wi-Fi setup, printer config, or computer help for seniors.' },
    { id: 'cat-7', name: 'Event Assistance', slug: 'event-assistance', icon: 'PartyPopper', description: 'Help with birthday party decor, guest registration, photography, or catering setup.' },
    { id: 'cat-8', name: 'Errands and Personal Assistance', slug: 'errands-personal', icon: 'CheckSquare', description: 'Post office trips, bill payments, pharmacy pickups, and local errands.' },
    { id: 'cat-9', name: 'Other Local Tasks', slug: 'other-local-tasks', icon: 'Tag', description: 'Any miscellaneous custom task needing an honest pair of neighborhood hands.' }
  ];

  for (const cat of categories) {
    await db.run(
      'INSERT INTO task_categories (id, name, slug, description, icon, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)',
      [cat.id, cat.name, cat.slug, cat.description, cat.icon, now]
    );
  }
  console.log(`✅ Seeded ${categories.length} categories.`);

  // 2. Seed Users
  // Admin
  const adminId = 'usr-admin-01';
  await db.run(
    `INSERT INTO users (id, email, password_hash, full_name, phone, role, avatar_url, address, locality, city, pincode, latitude, longitude, is_verified, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'admin', ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)`,
    [adminId, 'admin@marketplace.local', adminHash, 'Admin Superuser', '+91 9876543210', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin', 'City Operations HQ', 'Indiranagar', 'Bengaluru', '560038', 12.9784, 77.6408, now, now]
  );

  // Neighbors
  const neighbor1Id = 'usr-neighbor-01'; // Priya Sharma (Indiranagar)
  await db.run(
    `INSERT INTO users (id, email, password_hash, full_name, phone, role, avatar_url, address, locality, city, pincode, latitude, longitude, is_verified, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'neighbor', ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)`,
    [neighbor1Id, 'priya.neighbor@gmail.com', neighborHash, 'Priya Sharma', '+91 9886012345', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya', 'Flat 402, Green Glen Apts, 12th Main', 'Indiranagar', 'Bengaluru', '560038', 12.9784, 77.6408, now, now]
  );
  await db.run(
    'INSERT INTO customer_profiles (id, user_id, bio, default_address, total_tasks_posted, created_at) VALUES (?, ?, ?, ?, 3, ?)',
    ['cp-01', neighbor1Id, 'Busy product manager with a golden retriever and a love for local community support.', 'Flat 402, Green Glen Apts, 12th Main', now]
  );

  const neighbor2Id = 'usr-neighbor-02'; // Arun Patel (Koramangala)
  await db.run(
    `INSERT INTO users (id, email, password_hash, full_name, phone, role, avatar_url, address, locality, city, pincode, latitude, longitude, is_verified, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'neighbor', ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)`,
    [neighbor2Id, 'arun.neighbor@outlook.com', neighborHash, 'Arun Patel', '+91 9741234567', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arun', '14, 5th Block, near Sony World Signal', 'Koramangala', 'Bengaluru', '560095', 12.9352, 77.6245, now, now]
  );
  await db.run(
    'INSERT INTO customer_profiles (id, user_id, bio, default_address, total_tasks_posted, created_at) VALUES (?, ?, ?, ?, 2, ?)',
    ['cp-02', neighbor2Id, 'Senior citizen needing periodic tech assistance and supermarket errands.', '14, 5th Block, near Sony World Signal', now]
  );

  // Students
  const student1Id = 'usr-student-01'; // Rahul Verma (IISc)
  await db.run(
    `INSERT INTO users (id, email, password_hash, full_name, phone, role, avatar_url, address, locality, city, pincode, latitude, longitude, is_verified, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'student', ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)`,
    [student1Id, 'rahul.student@iisc.edu.in', studentHash, 'Rahul Verma', '+91 9123456780', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul', 'Student Hostel B, CV Raman Road', 'Malleswaram / IISc', 'Bengaluru', '560012', 12.9716, 77.5946, now, now]
  );
  await db.run(
    `INSERT INTO student_profiles (id, user_id, bio, college_name, education_level, skills, working_radius_km, is_guardian_approved, is_available, total_tasks_completed, total_earnings, average_rating, ratings_count, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 8.0, 1, 1, 4, 3200, 4.9, 4, ?)`,
    ['sp-01', student1Id, 'Third year Computer Science student. Patient, punctual, and tech-savvy. Love pets and teaching mathematics.', 'Indian Institute of Science (IISc)', 'Undergraduate (3rd Year)', JSON.stringify(['Tech Support', 'Math Tutoring', 'Dog Walking', 'Errands', 'Physics']), now]
  );

  const student2Id = 'usr-student-02'; // Ananya Iyer (Christ Univ)
  await db.run(
    `INSERT INTO users (id, email, password_hash, full_name, phone, role, avatar_url, address, locality, city, pincode, latitude, longitude, is_verified, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'student', ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)`,
    [student2Id, 'ananya.student@christ.edu.in', studentHash, 'Ananya Iyer', '+91 9988776655', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya', 'Hosur Road, near Dairy Circle', 'Koramangala / BTM', 'Bengaluru', '560029', 12.9340, 77.6101, now, now]
  );
  await db.run(
    `INSERT INTO student_profiles (id, user_id, bio, college_name, education_level, skills, working_radius_km, is_guardian_approved, is_available, total_tasks_completed, total_earnings, average_rating, ratings_count, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 6.0, 1, 1, 3, 2400, 5.0, 3, ?)`,
    ['sp-02', student2Id, 'Literature & Psychology major. Highly organized, warm, experienced in grocery runs, plant care, and English coaching.', 'Christ University', 'Undergraduate (2nd Year)', JSON.stringify(['English Tutoring', 'Grocery Shopping', 'Plant Care', 'Document Delivery', 'Organizing']), now]
  );

  console.log('✅ Seeded users (Admin, 2 Neighbors, 2 Students).');

  // 3. Seed Realistic Tasks across all statuses
  const task1Id = 'task-01-open'; // Open for students to browse and apply
  await db.run(
    `INSERT INTO tasks (id, customer_id, category_id, title, description, budget, deadline, address, locality, city, pincode, latitude, longitude, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Bengaluru', '560038', 12.9784, 77.6408, 'Open', ?, ?)`,
    [task1Id, neighbor1Id, 'cat-1', 'Weekend Organic Grocery Shopping & Veggie Pickup', 'Need a student to visit the local Namdhari organic store on 100ft Road and pick up a list of fresh veggies and dairy products. Will provide clear handwritten checklist.', 450, 'Tomorrow at 4:00 PM', '100ft Road, Indiranagar', 'Indiranagar', now, now]
  );

  const task2Id = 'task-02-applied'; // Has application from Rahul, ready for Priya to hire
  await db.run(
    `INSERT INTO tasks (id, customer_id, category_id, title, description, budget, deadline, address, locality, city, pincode, latitude, longitude, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Bengaluru', '560038', 12.9790, 77.6395, 'Applied', ?, ?)`,
    [task2Id, neighbor1Id, 'cat-3', 'Evening Golden Retriever Dog Walking (3 Days)', 'Looking for an animal lover to walk my friendly 3-year-old Golden Retriever "Bruno" for 45 minutes in Defense Colony Park for 3 consecutive evenings.', 900, 'This Friday, 6:00 PM', 'Defense Colony, Indiranagar', 'Indiranagar', now, now]
  );

  // Application for task 2
  await db.run(
    `INSERT INTO applications (id, task_id, student_id, proposed_fee, pitch_note, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?)`,
    ['app-01', task2Id, student1Id, 850, 'Hi Priya! I grew up with two dogs and adore Golden Retrievers. I live nearby and can be there promptly at 6 PM. Looking forward to meeting Bruno!', now, now]
  );

  const task3Id = 'task-03-assigned'; // Assigned to Rahul, ready to start & chat
  await db.run(
    `INSERT INTO tasks (id, customer_id, category_id, title, description, budget, deadline, address, locality, city, pincode, latitude, longitude, status, assigned_student_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Bengaluru', '560095', 12.9352, 77.6245, 'Assigned', ?, ?, ?)`,
    [task3Id, neighbor2Id, 'cat-6', 'Home Wi-Fi Router & Smart TV Configuration', 'Need help troubleshooting my slow Wi-Fi mesh network and configuring streaming apps on the new Samsung Smart TV. Easy task for any tech student.', 600, 'Tomorrow at 11:00 AM', '5th Block, Koramangala', 'Koramangala', student1Id, now, now]
  );

  // Assignment record
  await db.run(
    `INSERT INTO assignments (id, task_id, student_id, agreed_fee, assigned_at, status)
     VALUES (?, ?, ?, 600, ?, 'Assigned')`,
    ['asgn-01', task3Id, student1Id, now]
  );

  // Escrow Payment record
  await db.run(
    `INSERT INTO payments (id, task_id, customer_id, student_id, amount, currency, status, payment_gateway, gateway_order_id, transaction_type, created_at, updated_at)
     VALUES (?, ?, ?, ?, 600, 'INR', 'escrow_held', 'Razorpay', 'order_demo_escrow_01', 'escrow_hold', ?, ?)`,
    ['pay-01', task3Id, neighbor2Id, student1Id, now, now]
  );

  // Conversation for task 3
  const conv1Id = 'conv-01';
  await db.run(
    `INSERT INTO conversations (id, task_id, customer_id, student_id, last_message_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [conv1Id, task3Id, neighbor2Id, student1Id, now, now]
  );
  await db.run(
    `INSERT INTO messages (id, conversation_id, sender_id, message_text, is_read, created_at)
     VALUES (?, ?, ?, ?, 1, ?)`,
    ['msg-01', conv1Id, neighbor2Id, 'Hello Rahul, thank you for accepting! When you arrive tomorrow, buzz at gate 14.', now]
  );
  await db.run(
    `INSERT INTO messages (id, conversation_id, sender_id, message_text, is_read, created_at)
     VALUES (?, ?, ?, ?, 1, ?)`,
    ['msg-02', conv1Id, student1Id, 'Will do Mr. Patel! I will bring an extra CAT6 Ethernet cable just in case as well. See you at 11 AM.', now]
  );

  const task4Id = 'task-04-completed'; // Completed task with reviews & released payment
  await db.run(
    `INSERT INTO tasks (id, customer_id, category_id, title, description, budget, deadline, address, locality, city, pincode, latitude, longitude, status, assigned_student_id, completion_proof, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Bengaluru', '560038', 12.9784, 77.6408, 'Completed', ?, ?, ?, ?)`,
    [task4Id, neighbor1Id, 'cat-4', 'Class 9 CBSE Mathematics Doubt Clearing Session', '2-hour weekend revision session for linear equations and coordinate geometry for my daughter.', 800, 'Last Saturday', '12th Main, Indiranagar', 'Indiranagar', student2Id, 'Conducted 2.5 hour interactive coaching session covering NCERT problem sets.', now, now]
  );

  await db.run(
    `INSERT INTO assignments (id, task_id, student_id, agreed_fee, assigned_at, started_at, completed_at, status)
     VALUES (?, ?, ?, 800, ?, ?, ?, 'Completed')`,
    ['asgn-02', task4Id, student2Id, now, now, now]
  );

  await db.run(
    `INSERT INTO payments (id, task_id, customer_id, student_id, amount, currency, status, payment_gateway, gateway_order_id, gateway_payment_id, transaction_type, created_at, updated_at)
     VALUES (?, ?, ?, ?, 800, 'INR', 'released', 'Razorpay', 'order_demo_rel_02', 'pay_demo_success_02', 'student_payout', ?, ?)`,
    ['pay-02', task4Id, neighbor1Id, student2Id, now, now]
  );

  // Review for task 4
  await db.run(
    `INSERT INTO reviews (id, task_id, reviewer_id, reviewee_id, rating, comment, is_moderated, created_at)
     VALUES (?, ?, ?, ?, 5, 'Ananya was exceptional! Extremely patient, thorough, and my daughter scored an A in her class test on Monday. Highly recommended helper!', 0, ?)`,
    ['rev-01', task4Id, neighbor1Id, student2Id, now]
  );

  console.log('✅ Seeded realistic tasks, applications, conversations, payments, and reviews.');
  console.log('🚀 Database seeding complete!');
}

// Run directly if invoked from command line
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}
