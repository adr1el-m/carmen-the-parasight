const { Pool } = require('@neondatabase/serverless');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.VITE_DATABASE_URL,
});

async function query(text, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}

async function initializeDatabase() {
  const initSql = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'patient',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS patients (
      id UUID PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL,
      personal_info JSONB DEFAULT '{}'::jsonb,
      medical_info JSONB DEFAULT '{"conditions": {}, "allergies": [], "medications": [], "surgeries": []}'::jsonb,
      settings JSONB DEFAULT '{}'::jsonb,
      activity JSONB DEFAULT '{"consultationHistory": []}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS consultations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
      doctor_name VARCHAR(255),
      specialty VARCHAR(255),
      date TIMESTAMP WITH TIME ZONE,
      status VARCHAR(50),
      notes TEXT,
      data JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS facilities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      uid VARCHAR(255) UNIQUE NOT NULL,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(100),
      email VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      city VARCHAR(100),
      province VARCHAR(100),
      postal_code VARCHAR(20),
      country VARCHAR(100) DEFAULT 'Philippines',
      website VARCHAR(255),
      specialties JSONB DEFAULT '[]'::jsonb,
      services JSONB DEFAULT '[]'::jsonb,
      operating_hours JSONB DEFAULT '{}'::jsonb,
      staff JSONB DEFAULT '{}'::jsonb,
      capacity JSONB DEFAULT '{}'::jsonb,
      languages JSONB DEFAULT '[]'::jsonb,
      accreditation JSONB DEFAULT '[]'::jsonb,
      insurance_accepted JSONB DEFAULT '[]'::jsonb,
      license_number VARCHAR(100),
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      is_searchable BOOLEAN DEFAULT true,
      is_verified BOOLEAN DEFAULT false,
      profile_complete BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
      facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
      doctor_name VARCHAR(255),
      specialty VARCHAR(255),
      appointment_type VARCHAR(100),
      appointment_date DATE,
      appointment_time TIME,
      status VARCHAR(50) DEFAULT 'pending',
      notes TEXT,
      data JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  try {
    await query(initSql);
    console.log('Database tables initialized successfully.');
  } catch (err) {
    console.error('Error initializing database tables:', err);
  }
}

module.exports = {
  query,
  pool,
  initializeDatabase
};
