import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Admin.css';
import * as XLSX from 'xlsx';
const API_BASE = "";


const iconProps = { viewBox: '0 0 24 24', width: 18, height: 18, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
const LogoutIcon = () => (<svg {...iconProps}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>);
const ArchiveIcon = () => (<svg {...iconProps}><rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" /><path d="M10 12h4" /></svg>);
const FolderIcon = () => (<svg {...iconProps}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" /></svg>);
const DownloadIcon = () => (<svg {...iconProps}><path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M5 21h14" /></svg>);

const AdminDashboard = () => {
    const [applications, setApplications] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [settings, setSettings] = useState({ school_year: '', semester: '', is_open: false });
    const navigate = useNavigate();

    const fetchDashboardData = async () => {
        try {
            const [appRes, settingsRes] = await Promise.all([
                axios.get(`${API_BASE}/api/applications`),
                axios.get(`${API_BASE}/api/settings`)
            ]);
            
            if (appRes.data.status === 'success') setApplications(appRes.data.data);
            if (settingsRes.data.status === 'success') setSettings(settingsRes.data.data);
        } catch (error) {
            console.error("Error fetching data", error);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // SYSTEM CONTROL LOGIC
    const handleSettingsChange = async (newSettings) => {
        try {
            await axios.post(`${API_BASE}/api/settings`, newSettings);
            setSettings(newSettings);
            alert("System settings updated successfully!");
        } catch (error) {
            alert("Failed to update settings.");
        }
    };

    const toggleSystemStatus = () => {
        const confirmMsg = settings.is_open 
            ? "Are you sure you want to CLOSE applications? Students will not be able to submit forms." 
            : "Are you sure you want to OPEN applications for the public?";
        
        if (window.confirm(confirmMsg)) {
            handleSettingsChange({ ...settings, is_open: !settings.is_open });
        }
    };

    const handleArchive = async () => {
        if (window.confirm("WARNING: This will archive all current applications. They will be removed from this dashboard and securely stored in the Archive Folders. Do you want to proceed?")) {
            try {
                const response = await axios.post(`${API_BASE}/api/settings/archive`);
                
                if (response.data.status === 'success') {
                    alert("Semester Archived Successfully! Dashboard cleared for new applications.");
                    fetchDashboardData(); 
                } else {
                    alert("Archive failed: " + response.data.message);
                }
            } catch (error) {
                console.error("Archive Error Details:", error);
                const errorMsg = error.response?.data?.error || "Make sure your backend server is running.";
                alert("Archive failed: " + errorMsg);
            }
        }
    };

    // LOGOUT LOGIC
    const handleLogout = () => {
        if (window.confirm("Are you sure you want to log out of the Admin Portal?")) {
            // If you add real authentication tokens later, you would clear them here!
            navigate('/');
        }
    };

    const filteredApps = applications
        .filter(app => {
            const fullName = `${app.family_name} ${app.first_name}`.toLowerCase();
            const course = app.degree_program?.toLowerCase() || '';
            const term = searchTerm.toLowerCase();
            return fullName.includes(term) || course.includes(term); 
        })
        .sort((a, b) => {
            // Sort alphabetically by Family Name, then First Name
            const nameA = `${a.family_name} ${a.first_name}`.toLowerCase();
            const nameB = `${b.family_name} ${b.first_name}`.toLowerCase();
            return nameA.localeCompare(nameB);
        });

    // --- NEW: FULL DATA EXCEL EXPORT ---
    const exportToExcel = () => {
        if (filteredApps.length === 0) {
            alert("No data to export!");
            return;
        }

        // Map every single database field to a clear column name
        const exportData = filteredApps.map(app => ({
            "ID No.": app.id_no || 'N/A',
            "School Year": app.school_year,
            "Semester": app.semester,
            "Scholarship Type": app.scholarship_type,
            "Last Name": app.family_name,
            "First Name": app.first_name,
            "Middle Name": app.middle_name,
            "Extension": app.extension,
            "Degree Program": app.degree_program,
            "Major": app.major,
            "Year Level": app.year_level,
            "Age": app.age,
            "Gender": app.gender,
            "Civil Status": app.civil_status,
            "Date of Birth": app.date_of_birth,
            "Place of Birth": app.place_of_birth,
            "Nationality": app.nationality,
            "Tribe": app.tribe,
            "Religion": app.religion,
            "Student Contact": app.contact_number,
            "Email Address": app.email,
            "Disability": app.disability,
            "Boarding House": app.boarding_house,
            "Parent/Guardian": app.parent_guardian,
            "Annual Income": app.annual_income,
            "Father's Last Name": app.father_last_name,
            "Father's Given Name": app.father_given_name,
            "Father's Middle Name": app.father_middle_name,
            "Father's Occupation": app.father_occupation,
            "Mother's Last Name": app.mother_last_name,
            "Mother's Given Name": app.mother_given_name,
            "Mother's Middle Name": app.mother_middle_name,
            "Mother's Occupation": app.mother_occupation,
            "Parents Contact": app.parents_contact,
            "DSWD Household No": app.dswd_household,
            "Spouse": app.spouse,
            "Single Parent": app.is_single_parent ? "Yes" : "No",
            "Street": app.street,
            "Barangay": app.barangay,
            "City/Municipality": app.city_municipality,
            "Province": app.province,
            "Region": app.region,
            "Zip Code": app.zip_code,
            "Privilege Applied": app.privilege_applied,
            "Total Load": app.total_load,
            "Weighted Average": app.weighted_average,
            "Scholar Type": app.scholar_type,
            "Date Applied": new Date(app.created_at).toLocaleDateString()
        }));

        // Convert the JSON to a worksheet
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        
        // Automatically make all columns wide enough to read
        const wscols = Object.keys(exportData[0]).map(() => ({ wch: 18 }));
        worksheet['!cols'] = wscols;

        XLSX.utils.book_append_sheet(workbook, worksheet, "Applicants");

        // Download the file
        const fileName = `OSAS_Full_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    return (
        <div className="admin-layout admin-page">
            
            {/* --- TOP ADMIN NAVIGATION BAR --- */}
            <div className="admin-topbar">
                <div className="admin-brand">
                    <span className="logo-well-sm">
                        <img src="/cfcst.png" alt="CFCST Logo" className="admin-brand-logo" />
                    </span>
                    <h2>OSAS Administration</h2>
                </div>

                <button type="button" onClick={handleLogout} className="btn-control btn-logout">
                    <LogoutIcon /> Log Out
                </button>
            </div>

            {/* --- SYSTEM CONTROL PANEL --- */}
            <div className="dashboard-card control-panel">
                <div className="control-row">
                    <div className="control-main">
                        <h3>System Control Panel</h3>
                        <div className="control-fields">
                            <div className="control-field">
                                <label htmlFor="setting-school-year">School Year</label>
                                <input 
                                    id="setting-school-year"
                                    type="text" 
                                    value={settings.school_year} 
                                    onChange={(e) => setSettings({...settings, school_year: e.target.value})}
                                    onBlur={() => handleSettingsChange(settings)}
                                />
                            </div>
                            <div className="control-field">
                                <label htmlFor="setting-semester">Semester</label>
                                <select 
                                    id="setting-semester"
                                    value={settings.semester} 
                                    onChange={(e) => handleSettingsChange({...settings, semester: e.target.value})}
                                >
                                    <option value="1st">1st Semester</option>
                                    <option value="2nd">2nd Semester</option>
                                    <option value="Summer">Summer</option>
                                </select>
                            </div>
                            <div className="control-status">
                                <span className={`status-pill ${settings.is_open ? 'is-open' : 'is-closed'}`}>
                                    <span className="status-dot" aria-hidden="true" />
                                    Status: {settings.is_open ? "ACCEPTING APPLICATIONS" : "SYSTEM CLOSED"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="control-actions">
                        <button 
                            type="button"
                            onClick={toggleSystemStatus}
                            className={`btn-control ${settings.is_open ? 'btn-close-portal' : 'btn-open-portal'}`}
                        >
                            {settings.is_open ? "Close Application Portal" : "Open Application Portal"}
                        </button>
                        
                        <button 
                            type="button"
                            onClick={handleArchive}
                            className="btn-control btn-archive"
                            title="Export data and clear dashboard for a new semester"
                        >
                            <ArchiveIcon /> Archive Semester
                        </button>

                        <button 
                            type="button"
                            onClick={() => navigate('/admin/archive')}
                            className="btn-control btn-view-archives"
                        >
                            <FolderIcon /> View Archives
                        </button>
                    </div>
                </div>
            </div>

            {/* --- EXISTING DASHBOARD --- */}
            <div className="dashboard-card">
                <header className="dashboard-header">
                    <h2>CFCST Applicants List</h2>
                    <div className="dashboard-actions">
                        <button className="btn btn-export" onClick={exportToExcel}><DownloadIcon /> Export Full Data to Excel</button>
                        <input type="text" className="search-bar" placeholder="Search name, course, or status..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </header>
                <table className="admin-table">
                    <thead><tr><th>Name</th><th>Course & Year</th><th>Action</th></tr></thead>
                    <tbody>
                        {filteredApps.length > 0 ? (
                            filteredApps.map((app) => (
                                <tr key={app.id}>
                                    <td><strong>{app.family_name}, {app.first_name}</strong></td>
                                    <td>{app.degree_program} - {app.year_level}</td>
                                    <td><button onClick={() => navigate(`/document/${app.id}`)} className="btn btn-view">View Full App</button></td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="4" className="empty-row">No active applications found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboard;