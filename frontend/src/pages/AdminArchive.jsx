import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import '../styles/Admin.css';
const API_BASE = `http://${window.location.hostname}:5000`;


const AdminArchive = () => {
    const [archivedApps, setArchivedApps] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchArchives = async () => {
            try {
                const response = await axios.get(`${API_BASE}/api/applications/archived`);
                if (response.data.status === 'success') {
                    setArchivedApps(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching archives", error);
            }
        };
        fetchArchives();
    }, []);

    // Group the applications into "Folders" based on School Year and Semester
    const folders = archivedApps.reduce((acc, app) => {
        // Fixed: Removed the hardcoded word "Semester" here because app.semester already contains it
        const folderName = `SY ${app.school_year} | ${app.semester}`;
        if (!acc[folderName]) {
            acc[folderName] = [];
        }
        acc[folderName].push(app);
        return acc;
    }, {});

    const folderNames = Object.keys(folders);

    // --- NEW: PERMANENTLY DELETE FOLDER ---
    const handleDeleteFolder = async (e, folderName) => {
        e.stopPropagation(); // Prevents the folder from opening when clicking the delete button

        const appsInFolder = folders[folderName];
        if (!appsInFolder || appsInFolder.length === 0) return;

        const school_year = appsInFolder[0].school_year;
        const semester = appsInFolder[0].semester;

        if (window.confirm(`🚨 WARNING: Are you sure you want to PERMANENTLY delete the "${folderName}" archive?\n\nThis will erase ${appsInFolder.length} applications forever. This action CANNOT be undone.`)) {
            try {
                const response = await axios.delete(`${API_BASE}/api/applications/archived-folder`, {
                    data: { school_year, semester }
                });

                if (response.data.status === 'success') {
                    // Instantly remove the deleted applications from the screen
                    setArchivedApps(archivedApps.filter(app => !(app.school_year === school_year && app.semester === semester)));
                    if (selectedFolder === folderName) setSelectedFolder(null);
                }
            } catch (error) {
                console.error("Error deleting folder", error);
                alert("Failed to delete the archive folder.");
            }
        }
    };

    // EXCEL EXPORT FOR SPECIFIC ARCHIVE FOLDER
    const exportArchiveToExcel = () => {
        if (!selectedFolder || !folders[selectedFolder] || folders[selectedFolder].length === 0) {
            alert("No data to export in this archive!");
            return;
        }

        const archiveData = folders[selectedFolder];

        const exportData = archiveData.map(app => ({
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

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        
        const wscols = Object.keys(exportData[0]).map(() => ({ wch: 18 }));
        worksheet['!cols'] = wscols;

        XLSX.utils.book_append_sheet(workbook, worksheet, "Archived Applicants");

        const safeFolderName = selectedFolder.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `OSAS_Archive_${safeFolderName}.xlsx`;
        
        XLSX.writeFile(workbook, fileName);
    };

    return (
        <div className="admin-layout" style={{ flexDirection: 'column', alignItems: 'center' }}>
            <div className="dashboard-card">
                <header className="dashboard-header" style={{ borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                    <div>
                        <h2 style={{ margin: 0, color: '#2c3e50' }}>🗄️ Application Archives</h2>
                        <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '14px' }}>Secure storage of past semester applications.</p>
                    </div>
                    <button 
                        onClick={() => navigate('/admin/dashboard')} 
                        className="btn btn-secondary"
                        style={{ border: '1px solid #ddd' }}
                    >
                        ⬅️ Back to Dashboard
                    </button>
                </header>

                {/* VIEW 1: THE FOLDER GRID */}
                {!selectedFolder && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
                        {folderNames.length > 0 ? folderNames.map((folder) => (
                            <div 
                                key={folder} 
                                onClick={() => setSelectedFolder(folder)}
                                style={{ 
                                    border: '1px solid #e2e8f0', 
                                    borderRadius: '8px', 
                                    padding: '20px', 
                                    textAlign: 'center', 
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, boxShadow 0.2s',
                                    backgroundColor: '#f8f9fa',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📁</div>
                                <h3 style={{ fontSize: '1.1rem', color: '#2b6cb0', margin: '0 0 10px 0' }}>{folder}</h3>
                                <span style={{ fontSize: '0.85rem', color: '#718096', backgroundColor: '#e2e8f0', padding: '4px 8px', borderRadius: '12px', marginBottom: '15px' }}>
                                    {folders[folder].length} Applications
                                </span>

                                {/* NEW DELETE BUTTON */}
                                <button
                                    onClick={(e) => handleDeleteFolder(e, folder)}
                                    style={{
                                        marginTop: 'auto',
                                        padding: '6px 12px',
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        fontWeight: 'bold',
                                        width: '100%'
                                    }}
                                >
                                    🗑️ Delete Permanently
                                </button>
                            </div>
                        )) : (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#718096' }}>
                                <h3>No archives found.</h3>
                                <p>When you archive a semester, it will appear here as a folder.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* VIEW 2: INSIDE A SPECIFIC FOLDER */}
                {selectedFolder && (
                    <div style={{ marginTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: '#2b6cb0' }}>📁 Inside Folder: {selectedFolder}</h3>
                            
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                    onClick={exportArchiveToExcel} 
                                    className="btn"
                                    style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    📥 Export Folder to Excel
                                </button>
                                <button 
                                    onClick={() => setSelectedFolder(null)} 
                                    className="btn"
                                    style={{ backgroundColor: '#e2e8f0', color: '#4a5568', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    🔙 Close Folder
                                </button>
                            </div>
                        </div>
                        
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Course & Year</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {folders[selectedFolder].map((app) => (
                                    <tr key={app.id}>
                                        <td><strong>{app.family_name}, {app.first_name}</strong></td>
                                        <td>{app.degree_program} - {app.year_level}</td>
                                        <td>
                                            <button 
                                                onClick={() => navigate(`/document/${app.id}`)} 
                                                className="btn btn-view"
                                            >
                                                View Form
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminArchive;