const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const os = require('os');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());

// Create the .data directory automatically if it is missing
const dbDir = path.join(__dirname, '.data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Connect to the SQLite database using an absolute path
const db = new Database(path.join(dbDir, 'cfcst_scholarship.db'), {
    verbose: console.log
});

// --- 1. DATABASE SETUP ---

db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY,
        school_year TEXT,
        semester TEXT,
        is_open INTEGER
    );

    CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_no TEXT,
        scholarship_type TEXT,
        school_year TEXT,
        semester TEXT,
        family_name TEXT,
        first_name TEXT,
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
        is_single_parent INTEGER,
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
        grades TEXT,
        application_status TEXT DEFAULT 'Pending',
        is_archived INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

const checkSettings = db.prepare(
    'SELECT * FROM settings WHERE id = 1'
).get();

if (!checkSettings) {
    db.prepare(`
        INSERT INTO settings
        (id, school_year, semester, is_open)
        VALUES (1, ?, ?, ?)
    `).run('2026-2027', '1st', 0);
}

// --- 2. SETTINGS ROUTES ---

app.get('/api/settings', (req, res) => {
    try {
        const settings = db.prepare(
            'SELECT * FROM settings WHERE id = 1'
        ).get();

        if (!settings) {
            return res.status(404).json({
                status: 'error',
                message: 'Settings not found.'
            });
        }

        settings.is_open = settings.is_open === 1;

        res.json({
            status: 'success',
            data: settings
        });
    } catch (error) {
        console.error('Error fetching settings:', error);

        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

app.post('/api/settings', (req, res) => {
    try {
        const { school_year, semester, is_open } = req.body;

        const stmt = db.prepare(`
            UPDATE settings
            SET school_year = ?, semester = ?, is_open = ?
            WHERE id = 1
        `);

        const result = stmt.run(
            school_year,
            semester,
            is_open ? 1 : 0
        );

        if (result.changes === 0) {
            db.prepare(`
                INSERT INTO settings
                (id, school_year, semester, is_open)
                VALUES (1, ?, ?, ?)
            `).run(
                school_year,
                semester,
                is_open ? 1 : 0
            );
        }

        res.json({
            status: 'success',
            message: 'Settings updated'
        });
    } catch (error) {
        console.error('Error updating settings:', error);

        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// --- 3. ARCHIVE APPLICATIONS ---

app.post('/api/settings/archive', (req, res) => {
    try {
        const currentSettings = db.prepare(`
            SELECT school_year, semester
            FROM settings
            WHERE id = 1
        `).get();

        if (!currentSettings) {
            return res.status(404).json({
                status: 'error',
                message: 'Settings not found.'
            });
        }

        const stmt = db.prepare(`
            UPDATE applications
            SET is_archived = 1
            WHERE school_year = ?
              AND semester = ?
              AND is_archived = 0
        `);

        const result = stmt.run(
            currentSettings.school_year,
            currentSettings.semester
        );

        res.json({
            status: 'success',
            message: `Successfully archived ${result.changes} applications.`
        });
    } catch (error) {
        console.error('Error archiving applications:', error);

        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// --- 4. SUBMIT APPLICATION WITH DUPLICATE PREVENTION ---

app.post('/api/applications', (req, res) => {
    try {
        const data = req.body;

        const firstName =
            typeof data.first_name === 'string'
                ? data.first_name.trim()
                : '';

        const familyName =
            typeof data.family_name === 'string'
                ? data.family_name.trim()
                : '';

        const email =
            typeof data.email === 'string'
                ? data.email.trim().toLowerCase()
                : '';

        // Basic validation before checking duplicates.
        if (!firstName || !familyName) {
            return res.status(400).json({
                status: 'error',
                message: 'First name and family name are required.'
            });
        }

        if (!data.school_year || !data.semester) {
            return res.status(400).json({
                status: 'error',
                message: 'School year and semester are required.'
            });
        }

        // DUPLICATE CHECK 1:
        // Same first name and family name in the same active semester.
        // Ignore capitalization and surrounding spaces.
        const existingByName = db.prepare(`
            SELECT id, email, first_name, family_name
            FROM applications
            WHERE LOWER(TRIM(COALESCE(first_name, ''))) = LOWER(TRIM(?))
              AND LOWER(TRIM(COALESCE(family_name, ''))) = LOWER(TRIM(?))
              AND school_year = ?
              AND semester = ?
              AND is_archived = 0
            LIMIT 1
        `).get(
            firstName,
            familyName,
            data.school_year,
            data.semester
        );

        if (existingByName) {
            const existingEmail = (
                existingByName.email || ''
            ).trim().toLowerCase();

            // Same name, different email: block the submission.
            if (existingEmail !== email) {
                return res.status(403).json({
                    status: 'error',
                    message:
                        `An application for ${existingByName.first_name} ` +
                        `${existingByName.family_name} already exists for ` +
                        `${data.school_year}, ${data.semester} semester. ` +
                        'Please use the original email address.'
                });
            }

            // Same name, same email: ask the frontend to confirm replacement.
            return res.status(409).json({
                status: 'duplicate',
                existingId: existingByName.id,
                message:
                    'An application with this name already exists for ' +
                    'this school year and semester. Do you want to replace ' +
                    'the previous submission?'
            });
        }

        // DUPLICATE CHECK 2:
        // New applicants cannot submit a second application using
        // the same email in the same active semester.
        if (data.scholarship_type === 'New' && email) {
            const existingByEmail = db.prepare(`
                SELECT id
                FROM applications
                WHERE LOWER(TRIM(COALESCE(email, ''))) = LOWER(TRIM(?))
                  AND school_year = ?
                  AND semester = ?
                  AND is_archived = 0
                LIMIT 1
            `).get(
                email,
                data.school_year,
                data.semester
            );

            if (existingByEmail) {
                return res.status(409).json({
                    status: 'duplicate',
                    existingId: existingByEmail.id,
                    message:
                        'You have already submitted an application this ' +
                        'semester using this email. Do you want to replace ' +
                        'your previous application?'
                });
            }
        }

        // DUPLICATE CHECK 3:
        // Renewal applicants cannot submit a second application using
        // the same ID number in the same active semester.
        if (data.scholarship_type === 'Renewal') {
            const idNo =
                typeof data.id_no === 'string'
                    ? data.id_no.trim()
                    : '';

            if (!idNo) {
                return res.status(400).json({
                    status: 'error',
                    message: 'ID number is required for renewal applicants.'
                });
            }

            const existingById = db.prepare(`
                SELECT id
                FROM applications
                WHERE TRIM(COALESCE(id_no, '')) = TRIM(?)
                  AND school_year = ?
                  AND semester = ?
                  AND is_archived = 0
                LIMIT 1
            `).get(
                idNo,
                data.school_year,
                data.semester
            );

            if (existingById) {
                return res.status(409).json({
                    status: 'duplicate',
                    existingId: existingById.id,
                    message:
                        'You have already submitted a renewal application ' +
                        'this semester using this ID number. Do you want ' +
                        'to replace your previous application?'
                });
            }
        }

        // Insert only when none of the duplicate checks match.
        const stmt = db.prepare(`
            INSERT INTO applications (
                id_no,
                scholarship_type,
                school_year,
                semester,
                family_name,
                first_name,
                middle_name,
                extension,
                degree_program,
                major,
                year_level,
                age,
                gender,
                civil_status,
                place_of_birth,
                date_of_birth,
                nationality,
                tribe,
                religion,
                contact_number,
                email,
                disability,
                boarding_house,
                parent_guardian,
                annual_income,
                father_last_name,
                father_given_name,
                father_middle_name,
                father_occupation,
                mother_last_name,
                mother_given_name,
                mother_middle_name,
                mother_occupation,
                parents_contact,
                dswd_household,
                spouse,
                is_single_parent,
                street,
                barangay,
                city_municipality,
                province,
                region,
                zip_code,
                privilege_applied,
                total_load,
                weighted_average,
                scholar_type,
                grades
            
            
            ) VALUES (${Array(48).fill('?').join(', ')})
        `);

        const result = stmt.run(
            data.id_no || null,
            data.scholarship_type,
            data.school_year,
            data.semester,
            familyName,
            firstName,
            data.middle_name || null,
            data.extension || null,
            data.degree_program || null,
            data.major || null,
            data.year_level || null,
            data.age ?? null,
            data.gender || null,
            data.civil_status || null,
            data.place_of_birth || null,
            data.date_of_birth || null,
            data.nationality || null,
            data.tribe || null,
            data.religion || null,
            data.contact_number || null,
            email || null,
            data.disability || null,
            data.boarding_house || null,
            data.parent_guardian || null,
            data.annual_income ?? null,
            data.father_last_name || null,
            data.father_given_name || null,
            data.father_middle_name || null,
            data.father_occupation || null,
            data.mother_last_name || null,
            data.mother_given_name || null,
            data.mother_middle_name || null,
            data.mother_occupation || null,
            data.parents_contact || null,
            data.dswd_household || null,
            data.spouse || null,
            data.is_single_parent ? 1 : 0,
            data.street || null,
            data.barangay || null,
            data.city_municipality || null,
            data.province || null,
            data.region || null,
            data.zip_code || null,
            data.privilege_applied || null,
            data.total_load ?? null,
            data.weighted_average ?? null,
            data.scholar_type || null,
            JSON.stringify(data.grades || [])
        );

        return res.status(201).json({
            status: 'success',
            data: {
                applicationId: result.lastInsertRowid
            }
        });
    } catch (error) {
        console.error('Error submitting application:', error);

        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// --- 5. GET ACTIVE APPLICATIONS ---

app.get('/api/applications', (req, res) => {
    try {
        const activeApps = db.prepare(`
            SELECT *
            FROM applications
            WHERE is_archived = 0
            ORDER BY created_at DESC
        `).all();

        activeApps.forEach(application => {
            try {
                application.grades = JSON.parse(
                    application.grades || '[]'
                );
            } catch {
                application.grades = [];
            }
        });

        res.json({
            status: 'success',
            data: activeApps
        });
    } catch (error) {
        console.error('Error fetching applications:', error);

        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// --- 6. GET ARCHIVED APPLICATIONS ---
// Keep this route before the /:id route.

app.get('/api/applications/archived', (req, res) => {
    try {
        const archivedApps = db.prepare(`
            SELECT *
            FROM applications
            WHERE is_archived = 1
            ORDER BY school_year DESC, semester DESC, family_name ASC
        `).all();

        res.json({
            status: 'success',
            data: archivedApps
        });
    } catch (error) {
        console.error('Error fetching archived applications:', error);

        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// --- 7. DELETE ARCHIVED FOLDER PERMANENTLY ---

app.delete('/api/applications/archived-folder', (req, res) => {
    try {
        const { school_year, semester } = req.body;

        if (!school_year || !semester) {
            return res.status(400).json({
                status: 'error',
                message: 'School year and semester are required.'
            });
        }

        const stmt = db.prepare(`
            DELETE FROM applications
            WHERE school_year = ?
              AND semester = ?
              AND is_archived = 1
        `);

        const result = stmt.run(school_year, semester);

        res.json({
            status: 'success',
            message:
                `Permanently deleted ${result.changes} applications.`
        });
    } catch (error) {
        console.error('Error deleting archived applications:', error);

        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// --- 8. REPLACE EXISTING APPLICATION ---
// Called when the student confirms the replacement prompt.

app.put('/api/applications/replace', (req, res) => {
    const transaction = db.transaction(() => {
        const { existingId, ...data } = req.body;

        if (!existingId) {
            throw new Error('existingId is required for replacement.');
        }

        const existing = db.prepare(`
            SELECT id
            FROM applications
            WHERE id = ? AND is_archived = 0
        `).get(existingId);

        if (!existing) {
            throw new Error(
                'The application to replace was not found or is archived.'
            );
        }

        // Preserve the existing record if the replacement insert fails.
        db.prepare(`
            DELETE FROM applications
            WHERE id = ? AND is_archived = 0
        `).run(existingId);

        const stmt = db.prepare(`
            INSERT INTO applications (
                id_no,
                scholarship_type,
                school_year,
                semester,
                family_name,
                first_name,
                middle_name,
                extension,
                degree_program,
                major,
                year_level,
                age,
                gender,
                civil_status,
                place_of_birth,
                date_of_birth,
                nationality,
                tribe,
                religion,
                contact_number,
                email,
                disability,
                boarding_house,
                parent_guardian,
                annual_income,
                father_last_name,
                father_given_name,
                father_middle_name,
                father_occupation,
                mother_last_name,
                mother_given_name,
                mother_middle_name,
                mother_occupation,
                parents_contact,
                dswd_household,
                spouse,
                is_single_parent,
                street,
                barangay,
                city_municipality,
                province,
                region,
                zip_code,
                privilege_applied,
                total_load,
                weighted_average,
                scholar_type,
                grades
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
        `);

        const result = stmt.run(
            data.id_no || null,
            data.scholarship_type,
            data.school_year,
            data.semester,
            data.family_name || '',
            data.first_name || '',
            data.middle_name || null,
            data.extension || null,
            data.degree_program || null,
            data.major || null,
            data.year_level || null,
            data.age ?? null,
            data.gender || null,
            data.civil_status || null,
            data.place_of_birth || null,
            data.date_of_birth || null,
            data.nationality || null,
            data.tribe || null,
            data.religion || null,
            data.contact_number || null,
            data.email || null,
            data.disability || null,
            data.boarding_house || null,
            data.parent_guardian || null,
            data.annual_income ?? null,
            data.father_last_name || null,
            data.father_given_name || null,
            data.father_middle_name || null,
            data.father_occupation || null,
            data.mother_last_name || null,
            data.mother_given_name || null,
            data.mother_middle_name || null,
            data.mother_occupation || null,
            data.parents_contact || null,
            data.dswd_household || null,
            data.spouse || null,
            data.is_single_parent ? 1 : 0,
            data.street || null,
            data.barangay || null,
            data.city_municipality || null,
            data.province || null,
            data.region || null,
            data.zip_code || null,
            data.privilege_applied || null,
            data.total_load ?? null,
            data.weighted_average ?? null,
            data.scholar_type || null,
            JSON.stringify(data.grades || [])
        );

        return result.lastInsertRowid;
    });

    try {
        const applicationId = transaction();

        res.json({
            status: 'success',
            data: { applicationId }
        });
    } catch (error) {
        console.error('Error replacing application:', error);

        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// --- 9. GET A SINGLE APPLICATION ---

app.get('/api/applications/:id', (req, res) => {
    try {
        const application = db.prepare(`
            SELECT *
            FROM applications
            WHERE id = ?
        `).get(req.params.id);

        if (!application) {
            return res.status(404).json({
                status: 'error',
                message: 'Application not found'
            });
        }

        try {
            application.grades = JSON.parse(
                application.grades || '[]'
            );
        } catch {
            application.grades = [];
        }

        application.is_single_parent =
            application.is_single_parent === 1;

        res.json({
            status: 'success',
            data: application
        });
    } catch (error) {
        console.error('Error fetching application:', error);

        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});
// --- 9.5 SERVE FRONTEND ---
app.use(express.static(path.join(process.cwd(), 'frontend/dist')));

app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend/dist/index.html'));
});

// --- 10. START SERVER ---
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('');
    console.log('🚀 OSAS Backend Server is running!');
    console.log(`   Listening on port: ${PORT}`);
    console.log('');
});