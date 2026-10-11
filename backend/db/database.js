const Database = require('better-sqlite3');
const path = require('path');

// Initialize database file in the db directory
const dbPath = path.join(__dirname, '../.data/cfcst_scholarship');
const db = new Database(dbPath, { verbose: console.log });

// Enable Write-Ahead Logging (WAL) for better concurrent performance
db.pragma('journal_mode = WAL');

// Define Database Schema
// Define Database Schema
const initSchema = () => {
    const schema = `
        CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_no TEXT,
            application_status TEXT DEFAULT 'Pending',
            scholarship_type TEXT CHECK(scholarship_type IN ('New', 'Renewal')),
            school_year TEXT,
            semester TEXT,
            
            /* ... (keep all your other existing columns here like family_name, age, etc.) ... */
            family_name TEXT NOT NULL,
            first_name TEXT NOT NULL,
            middle_name TEXT,
            extension TEXT,
            degree_program TEXT,
            major TEXT,
            year_level TEXT,
            age INTEGER,
            gender TEXT,
            civil_status TEXT,
            place_of_birth TEXT,
            date_of_birth TEXT,
            nationality TEXT,
            tribe TEXT,
            religion TEXT,
            contact_number TEXT,
            email TEXT,
            disability TEXT,
            boarding_house TEXT,
            parent_guardian TEXT,
            annual_income REAL,
            father_last_name TEXT,
            father_given_name TEXT,
            father_middle_name TEXT,
            father_occupation TEXT,
            mother_last_name TEXT,
            mother_given_name TEXT,
            mother_middle_name TEXT,
            mother_occupation TEXT,
            parents_contact TEXT,
            dswd_household TEXT,
            spouse TEXT,
            is_single_parent BOOLEAN DEFAULT 0,
            street TEXT,
            barangay TEXT,
            city_municipality TEXT,
            province TEXT,
            region TEXT,
            zip_code TEXT,
            privilege_applied TEXT,
            total_load INTEGER,
            weighted_average REAL,
            scholar_type TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            -- NEW ARCHIVE COLUMN
            is_archived BOOLEAN DEFAULT 0 
        );

        CREATE TABLE IF NOT EXISTS grades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            application_id INTEGER NOT NULL,
            course_no TEXT,
            descriptive_title TEXT,
            units INTEGER,
            final_rating REAL,
            remarks TEXT,
            FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
        );

        -- NEW SYSTEM SETTINGS TABLE
        CREATE TABLE IF NOT EXISTS system_settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            school_year TEXT DEFAULT '2026-2027',
            semester TEXT DEFAULT '1st',
            is_open BOOLEAN DEFAULT 0
        );

        -- Insert the default settings row automatically
        INSERT OR IGNORE INTO system_settings (id, school_year, semester, is_open) 
        VALUES (1, '2026-2027', '1st', 0);
    `;

    try {
        db.exec(schema);
        console.log('Database schema validated successfully.');
    } catch (error) {
        console.error('Failed to initialize database schema:', error);
        process.exit(1);
    }
};

initSchema();

module.exports = db;