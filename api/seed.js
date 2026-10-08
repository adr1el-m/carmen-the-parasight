require('dotenv').config();
const { query, initializeDatabase } = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('🌱 Initializing database...');
  await initializeDatabase();
  console.log('🌱 Seeding database...');

  try {
    // 1. Clear existing users to avoid conflicts (optional, but good for clean mock)
    // await query('DELETE FROM users WHERE email IN ($1, $2)', ['patient@haliya.ph', 'provider@haliya.ph']);

    // 2. Hash passwords
    const patientPassword = await bcrypt.hash('patient123', 10);
    const providerPassword = await bcrypt.hash('provider123', 10);

    // 3. Create Patient User
    console.log('Creating mock patient...');
    const patientResult = await query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET password_hash = $2 RETURNING id',
      ['patient@haliya.ph', patientPassword, 'patient']
    );
    const patientUserId = patientResult.rows[0].id;

    // Create Patient Profile
    const patientId = patientUserId; // Use same ID as user for simplicity in mock
    await query(
      'INSERT INTO patients (id, user_id, email, personal_info) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
      [patientId, patientUserId, 'patient@haliya.ph', { 
        firstName: 'Mock', 
        lastName: 'Patient', 
        fullName: 'Mock Patient',
        dateOfBirth: '1990-01-01',
        phone: '+639123456789',
        address: '123 Haliya St, Quezon City'
      }]
    );

    // 4. Create Provider User
    console.log('Creating mock provider...');
    const providerResult = await query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET password_hash = $2 RETURNING id',
      ['provider@haliya.ph', providerPassword, 'admin']
    );
    const providerUserId = providerResult.rows[0].id;

    // 5. Create Healthcare Facilities
    console.log('Creating mock facilities...');
    
    // St. Luke's Medical Center
    await query(
      `INSERT INTO facilities (
        uid, user_id, name, type, email, phone, address, city, province, postal_code, 
        website, specialties, services, operating_hours, staff, capacity, 
        languages, accreditation, insurance_accepted, license_number, description,
        is_active, is_searchable, is_verified, profile_complete
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
      ON CONFLICT (uid) DO UPDATE SET user_id = $2, updated_at = CURRENT_TIMESTAMP`,
      [
        'slmc-1',
        providerUserId,
        "St. Luke's Medical Center",
        'Hospital',
        'info@stluke.com.ph',
        '+632-8789-7700',
        '279 E. Rodriguez Sr. Ave',
        'Quezon City',
        'Metro Manila',
        '1102',
        'https://www.stluke.com.ph',
        JSON.stringify(['Cardiology', 'Oncology', 'Neurology']),
        JSON.stringify(['Emergency Care', 'Surgery', 'Diagnostics']),
        JSON.stringify({
          monday: { open: '08:00', close: '17:00', closed: false },
          tuesday: { open: '08:00', close: '17:00', closed: false },
          wednesday: { open: '08:00', close: '17:00', closed: false },
          thursday: { open: '08:00', close: '17:00', closed: false },
          friday: { open: '08:00', close: '17:00', closed: false },
          saturday: { open: '08:00', close: '12:00', closed: false },
          sunday: { open: '00:00', close: '00:00', closed: true }
        }),
        JSON.stringify({ totalStaff: 2500, doctors: 500, nurses: 1200, supportStaff: 800 }),
        JSON.stringify({ bedCapacity: 650, consultationRooms: 50 }),
        JSON.stringify(['English', 'Filipino']),
        JSON.stringify(['DOH', 'PhilHealth']),
        JSON.stringify(['PhilHealth', 'Maxicare', 'Medicard']),
        'LIC-SLMC-001',
        'Leading tertiary hospital in the Philippines',
        true,
        true,
        true,
        true
      ]
    );

    // The Medical City
    await query(
      `INSERT INTO facilities (
        uid, user_id, name, type, email, phone, address, city, province, postal_code,
        website, specialties, services, operating_hours, staff, capacity,
        languages, accreditation, insurance_accepted, license_number, description,
        is_active, is_searchable, is_verified, profile_complete
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
      ON CONFLICT (uid) DO UPDATE SET updated_at = CURRENT_TIMESTAMP`,
      [
        'tmc-1',
        providerUserId,
        'The Medical City',
        'Hospital',
        'info@themedicalcity.com',
        '+632-8988-1000',
        'Ortigas Avenue',
        'Pasig City',
        'Metro Manila',
        '1605',
        'https://www.themedicalcity.com',
        JSON.stringify(['Orthopedics', 'Pediatrics', 'Internal Medicine']),
        JSON.stringify(['Emergency Care', 'Laboratory', 'Radiology']),
        JSON.stringify({
          monday: { open: '00:00', close: '23:59', closed: false },
          tuesday: { open: '00:00', close: '23:59', closed: false },
          wednesday: { open: '00:00', close: '23:59', closed: false },
          thursday: { open: '00:00', close: '23:59', closed: false },
          friday: { open: '00:00', close: '23:59', closed: false },
          saturday: { open: '00:00', close: '23:59', closed: false },
          sunday: { open: '00:00', close: '23:59', closed: false }
        }),
        JSON.stringify({ totalStaff: 3000, doctors: 600, nurses: 1500, supportStaff: 900 }),
        JSON.stringify({ bedCapacity: 700, consultationRooms: 60 }),
        JSON.stringify(['English', 'Filipino']),
        JSON.stringify(['DOH', 'PhilHealth', 'JCI']),
        JSON.stringify(['PhilHealth', 'Maxicare', 'Medicard', 'AXA']),
        'LIC-TMC-001',
        'Premier healthcare institution with 24/7 services',
        true,
        true,
        true,
        true
      ]
    );

    console.log('✅ Seeding complete!');
    console.log('--------------------------------------------------');
    console.log('Patient Credentials:');
    console.log('Email: patient@haliya.ph');
    console.log('Password: patient123');
    console.log('--------------------------------------------------');
    console.log('Provider Credentials:');
    console.log('Email: provider@haliya.ph');
    console.log('Password: provider123');
    console.log('Role: admin (can manage both facilities)');
    console.log('--------------------------------------------------');
    console.log('Facilities Created:');
    console.log('1. St. Luke\'s Medical Center (slmc-1)');
    console.log('2. The Medical City (tmc-1)');
    console.log('--------------------------------------------------');

  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    process.exit();
  }
}

seed();
