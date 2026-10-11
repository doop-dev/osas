const express = require('express');
const router = express.Router();
const db = require('../db/database');

// POST: Submit a new scholarship application
// POST: Submit a new scholarship application
router.post('/', (req, res) => {
    const { grades, ...appData } = req.body;

    appData.is_single_parent = appData.is_single_parent === true ? 1 : 0;
    
    // Ensure all undefined values are null and strings are trimmed
    Object.keys(appData).forEach(key => {
        if (appData[key] === undefined) appData[key] = null;
        else if (typeof appData[key] === 'string') appData[key] = appData[key].trim();
    });
    if (!appData.id_no) appData.id_no = null;

    const gradesString = grades ? JSON.stringify(grades) : null;

    // --- DEBUGGING LOGS ---
    console.log("\n--- NEW SUBMISSION ATTEMPT ---");
    console.log(`Searching DB for Name: '${appData.first_name}' '${appData.family_name}'`);

    // We use TRIM() on both sides to completely ignore hidden spaces in the database
    const existingApp = db.prepare(`
        SELECT id, email, first_name, family_name 
        FROM applications 
        WHERE TRIM(LOWER(first_name)) = TRIM(LOWER(?)) 
        AND TRIM(LOWER(family_name)) = TRIM(LOWER(?))
    `).get(appData.first_name, appData.family_name);

    console.log("Database found this record:", existingApp || "None");

    if (existingApp) {
        const currentEmail = (existingApp.email || '').toLowerCase().trim();
        const newEmail = (appData.email || '').toLowerCase().trim();

        console.log(`Comparing Emails -> DB Email: '${currentEmail}' | New Email: '${newEmail}'`);

        // 1. Same Name, DIFFERENT Email -> Hard Block
        if (currentEmail !== newEmail) {
            console.log("🚨 BLOCKED: User tried to use a different email.");
            return res.status(403).json({
                status: 'error',
                message: `An application for ${existingApp.first_name} ${existingApp.family_name} already exists. You cannot submit a new one with a different email. Please use the original email (${currentEmail || 'no email provided'}) to update your record.`
            });
        } 
        
        // 2. Same Name, SAME Email -> Trigger Frontend Confirmation Popup
        console.log("⚠️ PROMPTING REPLACE: Emails match.");
        return res.status(409).json({
            status: 'error',
            existingId: existingApp.id,
            message: `You have already submitted an application using this email. Do you want to overwrite your previous submission with these new details?`
        });
    }

    console.log("✅ NO MATCH FOUND. Inserting as new record...");

    // 3. No match found -> Insert as new
    const insertApplication = db.prepare(`
        INSERT INTO applications (
            id_no, scholarship_type, school_year, semester, family_name, first_name,
            middle_name, extension, degree_program, major, year_level, age, gender, 
            civil_status, place_of_birth, date_of_birth, nationality, tribe, religion, 
            contact_number, email, disability, boarding_house, parent_guardian, 
            annual_income, father_last_name, father_given_name, father_middle_name, 
            father_occupation, mother_last_name, mother_given_name, mother_middle_name, 
            mother_occupation, parents_contact, dswd_household, spouse, is_single_parent, 
            street, barangay, city_municipality, province, region, zip_code, 
            privilege_applied, total_load, weighted_average, scholar_type, grades
        ) VALUES (
            @id_no, @scholarship_type, @school_year, @semester, @family_name, @first_name,
            @middle_name, @extension, @degree_program, @major, @year_level, @age, @gender, 
            @civil_status, @place_of_birth, @date_of_birth, @nationality, @tribe, @religion, 
            @contact_number, @email, @disability, @boarding_house, @parent_guardian, 
            @annual_income, @father_last_name, @father_given_name, @father_middle_name, 
            @father_occupation, @mother_last_name, @mother_given_name, @mother_middle_name, 
            @mother_occupation, @parents_contact, @dswd_household, @spouse, @is_single_parent, 
            @street, @barangay, @city_municipality, @province, @region, @zip_code, 
            @privilege_applied, @total_load, @weighted_average, @scholar_type, @gradesString
        )
    `);

    try {
        appData.gradesString = gradesString;
        const result = insertApplication.run(appData);
        res.status(201).json({ status: 'success', data: { applicationId: result.lastInsertRowid } });
    } catch (error) {
        console.error('Error on POST /:', error);
        res.status(500).json({ status: 'error', error: error.message });
    }
});
// PUT: Replace/Update an existing application (Called when student clicks OK on popup)
router.put('/replace', (req, res) => {
    const { existingId, grades, ...appData } = req.body;

    appData.is_single_parent = appData.is_single_parent === true ? 1 : 0;
    appData.existingId = existingId;
    appData.grades = grades ? JSON.stringify(grades) : null;

    Object.keys(appData).forEach(key => {
        if (appData[key] === undefined) appData[key] = null;
    });

    const updateApplication = db.prepare(`
        UPDATE applications SET
            id_no = @id_no, scholarship_type = @scholarship_type, school_year = @school_year, semester = @semester, 
            family_name = @family_name, first_name = @first_name, middle_name = @middle_name, extension = @extension, 
            degree_program = @degree_program, major = @major, year_level = @year_level, age = @age,
            gender = @gender, civil_status = @civil_status, place_of_birth = @place_of_birth, date_of_birth = @date_of_birth, 
            nationality = @nationality, tribe = @tribe, religion = @religion, contact_number = @contact_number, email = @email,
            disability = @disability, boarding_house = @boarding_house, parent_guardian = @parent_guardian, 
            annual_income = @annual_income, father_last_name = @father_last_name, father_given_name = @father_given_name,
            father_middle_name = @father_middle_name, father_occupation = @father_occupation, mother_last_name = @mother_last_name, 
            mother_given_name = @mother_given_name, mother_middle_name = @mother_middle_name, mother_occupation = @mother_occupation, 
            parents_contact = @parents_contact, dswd_household = @dswd_household, spouse = @spouse, is_single_parent = @is_single_parent, 
            street = @street, barangay = @barangay, city_municipality = @city_municipality, province = @province, region = @region, 
            zip_code = @zip_code, privilege_applied = @privilege_applied, total_load = @total_load,
            weighted_average = @weighted_average, scholar_type = @scholar_type, grades = @grades
        WHERE id = @existingId
    `);

    try {
        updateApplication.run(appData);
        res.status(200).json({ status: 'success', data: { applicationId: existingId } });
    } catch (error) {
        console.error('Error on PUT /replace:', error);
        res.status(500).json({ status: 'error', error: error.message });
    }
});

router.get('/', (req, res) => {
    try {
        const query = `
            SELECT * FROM applications 
            ORDER BY created_at DESC
        `;
        const applications = db.prepare(query).all();
        
        // Convert the JSON string back to an array for the frontend
        applications.forEach(app => {
            if (app.grades) {
                try {
                    app.grades = JSON.parse(app.grades);
                } catch(e) {
                    app.grades = [];
                }
            }
        });

        res.status(200).json({
            status: 'success',
            data: applications
        });
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// GET: Fetch a single application AND its grades by ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    
    try {
        const appQuery = `SELECT * FROM applications WHERE id = ?`;
        const application = db.prepare(appQuery).get(id);

        if (!application) {
            return res.status(404).json({ status: 'error', message: 'Application not found' });
        }

        // Parse the grades string back to an array
        if (application.grades) {
             try {
                 application.grades = JSON.parse(application.grades);
             } catch(e) {
                 application.grades = [];
             }
        } else {
             application.grades = [];
        }

        res.status(200).json({
            status: 'success',
            data: application
        });
    } catch (error) {
        console.error('Error fetching single application:', error);
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// GET: Fetch all ARCHIVED applications grouped for the folders
router.get('/archived', (req, res) => {
    try {
        const query = `
            SELECT * FROM applications 
            WHERE is_archived = 1 
            ORDER BY school_year DESC, semester DESC, family_name ASC
        `;
        const applications = db.prepare(query).all();
        
        res.status(200).json({
            status: 'success',
            data: applications
        });
    } catch (error) {
        console.error('Error fetching archived applications:', error);
        res.status(500).json({ status: 'error', error: error.message });
    }
});

module.exports = router;