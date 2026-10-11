import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import '../styles/DocumentView.css';
const API_BASE = "";


const DocumentView = () => {
    const { id } = useParams(); 
    const location = useLocation(); 
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApplicationData = async () => {
            try {
                const response = await axios.get(`${API_BASE}/api/applications/${id}`);
                if (response.data.status === 'success') {
                    setData(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching document data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchApplicationData();
    }, [id]);

    const handleDownloadPDF = () => {
        const element = document.getElementById('pdf-document');
        
        window.scrollTo(0, 0);
        
        const opt = {
            margin:       0, 
            filename:     `Scholarship_Form_${data?.family_name}_${data?.first_name}.pdf`,
            image:        { type: 'jpeg', quality: 1 },
            html2canvas:  { scale: 2, useCORS: true, scrollY: 0 }, 
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
    };

    const handleBack = () => {
        // Students land here right after submitting, so send them home; admins go back to the list
        if (location.state?.autoDownload) navigate('/');
        else navigate(-1);
    };

    useEffect(() => {
        if (data && location.state?.autoDownload) {
            const timer = setTimeout(() => {
                handleDownloadPDF();
            }, 1200);
            window.history.replaceState({}, document.title);
            return () => clearTimeout(timer);
        }
    }, [data, location.state]);

    if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading official document...</div>;
    if (!data) return <div style={{ padding: '50px', textAlign: 'center', color: 'red' }}>Document not found.</div>;

    const gradesList = data.grades || [];

    // --- NEW: Calculate Total Units and GPA dynamically ---
    const totalUnits = gradesList.reduce((sum, grade) => sum + (Number(grade.units) || 0), 0);
    
    // Calculate Weighted Average: (Sum of (Grade * Units)) / Total Units
    const totalPoints = gradesList.reduce((sum, grade) => {
        const units = Number(grade.units) || 0;
        const rating = Number(grade.final_rating) || 0;
        return sum + (units * rating);
    }, 0);
    
    const calculatedGPA = totalUnits > 0 ? (totalPoints / totalUnits).toFixed(2) : "";

    return (
        <div className="print-container" style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', paddingBottom: '40px' }}>
            
            {/* EXACT CSS FROM YOUR TEMPLATE + Print Hiding Fix */}
            <style>
                {`
                    :root {
                        --c-black: #000000;
                        --c-white: #ffffff;
                        --font-main: Arial, Helvetica, sans-serif;
                        --font-serif: "Times New Roman", serif;
                        --border-width: 1px;
                        --cell-pad: 2px; 
                    }

                    * {
                        box-sizing: border-box;
                    }

                    .doc-body {
                        margin: 0;
                        padding: 0;
                        font-family: var(--font-main);
                        font-size: 10pt;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        display: flex;
                        justify-content: center;
                    }

                    .page {
                        width: 210mm;
                        height: 297mm;
                        background: var(--c-white);
                        margin: 20px auto;
                        padding: 10mm 12mm; 
                        position: relative;
                        box-shadow: 0 0 10px rgba(0,0,0,0.1);
                        overflow: hidden; 
                        display: flex;
                        flex-direction: column;
                    }

                    header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin-bottom: 10px; 
                        font-family: var(--font-main);
                    }

                    .logo-box {
                        width: 70px;
                        height: 70px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .logo-box img {
                        max-width: 100%;
                        max-height: 100%;
                        object-fit: contain;
                    }

                    .header-text {
                        text-align: center;
                        flex: 1;
                        padding: 0 10px;
                    }

                    .header-text h3 {
                        margin: 0;
                        font-weight: normal;
                        font-size: 10pt;
                        line-height: 1.2;
                    }

                    .header-text h1 {
                        margin: 2px 0;
                        font-size: 11pt; 
                        font-weight: bold;
                        line-height: 1.1;
                    }

                    .header-text p {
                        margin: 0;
                        font-size: 9pt;
                    }

                    .form-container {
                        border: 2px solid var(--c-black); 
                        display: flex;
                        flex-direction: column;
                    }

                    .row {
                        display: flex;
                        border-bottom: 1px solid var(--c-black);
                        width: 100%;
                    }
                    .row:last-child {
                        border-bottom: none;
                    }

                    .col {
                        padding: var(--cell-pad);
                        border-right: 1px solid var(--c-black);
                        display: flex;
                        flex-direction: column;
                        justify-content: center; 
                        position: relative;
                    }
                    .col:last-child {
                        border-right: none;
                    }

                    .id-picture {
                        width: 100px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                        font-weight: bold;
                        border-right: 1px solid var(--c-black);
                    }

                    .title-block {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                    }

                    .main-title {
                        text-align: center;
                        font-weight: 900;
                        font-size: 13pt;
                        padding: 4px 0;
                        text-transform: uppercase;
                    }

                    .sy-sem {
                        display: flex;
                        justify-content: center;
                        gap: 20px;
                        padding-bottom: 2px;
                        font-size: 9pt;
                    }
                    .sy-sem span {
                        border-bottom: 1px solid black;
                        min-width: 60px;
                        display: inline-block;
                        text-align: center;
                        font-weight: bold;
                    }

                    .status-block {
                        width: 100px;
                        font-size: 9pt;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        padding-left: 5px;
                    }

                    .label {
                        font-weight: bold;
                        font-size: 9pt;
                        margin-bottom: 0; 
                        line-height: 1.1;
                    }
                    
                    .sub-label {
                        font-size: 7pt; 
                        margin-top: 0; 
                        font-style: italic; 
                        line-height: 1;
                    }

                    .w-full { width: 100%; }
                    .flex-1 { flex: 1; }
                    .flex-2 { flex: 2; }
                    .flex-3 { flex: 3; }
                    
                    .row-writing { height: 24px; }
                    .row-writing .col { justify-content: flex-start; padding-top: 2px; padding-left: 4px; }
                    .row-sublabel { height: 14px; }
                    .row-sublabel .col { justify-content: center; padding: 0; }

                    .body-text {
                        margin-top: 10px; 
                        line-height: 2.0; 
                        text-align: justify;
                        font-size: 10pt;
                        text-indent: 40px; 
                    }

                    .inline-input {
                        border-bottom: 1px solid black;
                        display: inline-block;
                        min-width: 50px;
                        text-align: center;
                        font-weight: bold;
                    }
                    
                    .grades-table-container { margin-top: 5px; }
                    .grades-header { text-align: center; font-weight: bold; margin-bottom: 2px; font-size: 10pt; }

                    table.grades {
                        width: 100%;
                        border-collapse: collapse;
                        border: 2px solid black;
                        font-size: 9pt;
                    }
                    table.grades th, table.grades td {
                        border: 1px solid black;
                        padding: 2px;
                        text-align: center;
                        height: 14px; 
                    }
                    table.grades th { background: transparent; font-weight: bold; }

                    .col-course { width: 15%; }
                    .col-desc { width: 45%; }
                    .col-units { width: 10%; }
                    .col-rating { width: 15%; }
                    .col-remarks { width: 15%; }

                    .footer {
                        margin-top: 0px; 
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        font-size: 10pt;
                    }

                    .sig-block {
                        display: flex;
                        flex-direction: column;
                        align-items: center; 
                        width: 35%;
                    }

                    .sig-line {
                        width: 100%;
                        border-top: 1px solid black;
                        margin-top: 30px; 
                        text-align: center;
                        padding-top: 2px;
                        font-weight: bold;
                    }

                    .sig-label {
                        text-align: left;
                        width: 100%;
                        margin-bottom: 2px;
                    }

                    .document-footer {
                        position: absolute;
                        bottom: 2mm;
                        left: 12mm; 
                        right: 12mm; 
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                        font-size: 5pt;
                    }

                    .doc-control {
                        display: flex;
                        flex-direction: column;
                        line-height: 1.4;
                    }

                    .doc-row { display: flex; }
                    .doc-label { width: 50px; }

                    .footer-logo {
                        width: 140px;
                        height: 65px;
                        display: flex;
                        align-items: flex-end;
                        justify-content: flex-end;
                    }

                    .footer-logo img {
                        max-width: 100%;
                        max-height: 100%;
                        object-fit: contain;
                    }

                    @media print {
    /* 1. This strips the gray background and the 40px padding that was spilling to page 2 */
    .print-container { 
        background-color: white !important; 
        padding-bottom: 0 !important; 
    }
    
    body { background: white !important; }
    .no-print { display: none !important; }
    
    .page { 
        margin: 0 !important; 
        box-shadow: none !important; 
        width: 210mm !important; 
        /* 2. Shaving exactly 1mm off the height guarantees it never triggers a second page */
        height: 296mm !important; 
        page-break-after: avoid !important;
    }
}
                `}
            </style>

            <div 
                className="no-print" 
                data-html2canvas-ignore="true"
                style={{ 
                    backgroundColor: 'white', 
                    padding: '15px 40px', 
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)', 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                }}
            >
                <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                    Document Viewer: {data.family_name}, {data.first_name}
                </div>
                <button 
                    type="button"
                    onClick={handleBack} 
                    style={{ padding: '10px 24px', backgroundColor: '#4a5568', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    ← Back
                </button>
            </div>

            <div className="doc-body" id="pdf-document">
                <div className="page">
                    <header>
                        <div className="logo-box">
                            <img src="/cfcst.png" alt="CFCST Logo" crossOrigin="anonymous" />
                        </div>
                        <div className="header-text">
                            <h3>Republic of the Philippines</h3>
                            <h1>COTABATO FOUNDATION COLLEGE OF SCIENCE AND TECHNOLOGY</h1>
                            <p>Barangay Doroluman, Arakan, Cotabato</p>
                            <p>Contact No: +639905311496</p>
                            <p>Email Address: admin@cfcst.edu.ph &nbsp;&nbsp; Website: www.cfcst.edu.ph</p>
                        </div>
                        <div className="logo-box">
                             <img src="/logo2.jpeg" alt="Bago Logo" crossOrigin="anonymous" />
                        </div>
                    </header>

                    <div className="form-container">
                        <div className="row" style={{ height: '50px' }}>
                            <div className="id-picture">ID Picture</div>
                            <div className="title-block">
                                <div className="main-title">SCHOLARSHIP FORM</div>
                                <div className="sy-sem">
                                    School Year <span>{data.school_year}</span> Semester <span>{data.semester}</span>
                                </div>
                            </div>
                            <div className="status-block" style={{ borderLeft: '1px solid black' }}>
                                <div style={{ marginBottom: '2px' }}>New {data.scholarship_type === 'New' ? <span style={{fontWeight: 'bold'}}>✓</span> : '______'}</div>
                                <div>Renewal {data.scholarship_type === 'Renewal' ? <span style={{fontWeight: 'bold'}}>✓</span> : '___'}</div>
                            </div>
                        </div>

                        <div className="row row-writing">
                            <div className="col w-full" style={{ borderRight: 'none' }}>
                                <span className="label" style={{ fontSize: '8pt', position: 'absolute', left: '4px', top: '2px' }}>Name:</span>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 0.5fr', width: '100%', paddingLeft: '50px', textAlign: 'center', fontWeight: 'bold' }}>
                                    <span style={{ textAlign: 'right', paddingRight: '15px', textTransform: 'uppercase' }}>{data.family_name}</span>
                                    <span style={{ textTransform: 'uppercase' }}>{data.first_name}</span>
                                    <span style={{ textAlign: 'left', paddingLeft: '15px', textTransform: 'uppercase' }}>{data.middle_name}</span>
                                    <span style={{ textTransform: 'uppercase' }}>{data.extension}</span>
                                </div>
                            </div>
                        </div>
                        <div className="row row-sublabel">
                            <div className="col w-full" style={{ borderRight: 'none', paddingBottom: '2px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 0.5fr', width: '100%', paddingLeft: '50px' }}>
                                    <span className="sub-label" style={{ textAlign: 'right', paddingRight: '15px' }}>Family Name</span>
                                    <span className="sub-label" style={{ textAlign: 'center' }}>First Name</span>
                                    <span className="sub-label" style={{ textAlign: 'left', paddingLeft: '15px' }}>Middle Name</span>
                                    <span className="sub-label" style={{ textAlign: 'center' }}>Extension</span>
                                </div>
                            </div>
                        </div>

                        <div className="row row-writing">
                            <div className="col w-full" style={{ borderRight: 'none' }}>
                                <span className="label" style={{ fontSize: '8pt', position: 'absolute', left: '4px', top: '2px' }}>Course & Year:</span>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', width: '100%', paddingLeft: '90px', textAlign: 'center', fontWeight: 'bold' }}>
                                    <span>{data.degree_program}</span>
                                    <span>{data.major}</span>
                                    <span>{data.year_level}</span>
                                </div>
                            </div>
                        </div>
                        <div className="row row-sublabel">
                            <div className="col w-full" style={{ borderRight: 'none', paddingBottom: '2px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', width: '100%', paddingLeft: '90px' }}>
                                    <span className="sub-label" style={{ textAlign: 'center' }}>Degree Program</span>
                                    <span className="sub-label" style={{ textAlign: 'center' }}>Major</span>
                                    <span className="sub-label" style={{ textAlign: 'center' }}>Year Level</span>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col flex-1" style={{ flexDirection: 'row', justifyContent: 'start', alignItems: 'center', borderRight: 'none' }}>
                                <span className="label">Age: <span style={{fontWeight: 'normal'}}>{data.age}</span></span>
                            </div>
                            <div className="col flex-1" style={{ flexDirection: 'row', justifyContent: 'start', alignItems: 'center', borderRight: 'none' }}>
                                <span className="label">Gender: <span style={{fontWeight: 'normal'}}>{data.gender}</span></span>
                            </div>
                            <div className="col flex-1" style={{ flexDirection: 'row', justifyContent: 'start', alignItems: 'center', borderRight: 'none' }}>
                                <span className="label">Civil Status: <span style={{fontWeight: 'normal'}}>{data.civil_status}</span></span>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col flex-2" style={{ flexDirection: 'row', justifyContent: 'start', alignItems: 'center', borderRight: 'none' }}>
                                <span className="label">Place of Birth: <span style={{fontWeight: 'normal'}}>{data.place_of_birth}</span></span>
                            </div>
                            <div className="col flex-1" style={{ flexDirection: 'row', justifyContent: 'start', alignItems: 'center', borderRight: 'none' }}>
                                <span className="label">Date of Birth: <span style={{fontWeight: 'normal'}}>{data.date_of_birth}</span></span>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col flex-1" style={{ flexDirection: 'row', justifyContent: 'start', alignItems: 'center', borderRight: 'none' }}>
                                <span className="label">Nationality: <span style={{fontWeight: 'normal'}}>{data.nationality}</span></span>
                            </div>
                            <div className="col flex-1" style={{ flexDirection: 'row', justifyContent: 'start', alignItems: 'center', borderRight: 'none' }}>
                                <span className="label">Tribe: <span style={{fontWeight: 'normal'}}>{data.tribe}</span></span>
                            </div>
                            <div className="col flex-1" style={{ flexDirection: 'row', justifyContent: 'start', alignItems: 'center', borderRight: 'none' }}>
                                <span className="label">Religion: <span style={{fontWeight: 'normal'}}>{data.religion}</span></span>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col flex-1" style={{ flexDirection: 'row', justifyContent: 'start', alignItems: 'center', borderRight: 'none' }}>
                                <span className="label">Student contact Number: <span style={{fontWeight: 'normal'}}>{data.contact_number}</span></span>
                            </div>
                            <div className="col flex-1" style={{ flexDirection: 'row', justifyContent: 'start', alignItems: 'center', borderRight: 'none' }}>
                                <span className="label">E-mail Address: <span style={{fontWeight: 'normal'}}>{data.email}</span></span>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col flex-1" style={{ flexDirection: 'row', justifyContent: 'start', alignItems: 'center', borderRight: 'none' }}>
                                <span className="label">Disability (if any): <span style={{fontWeight: 'normal'}}>{data.disability}</span></span>
                            </div>
                            <div className="col flex-1" style={{ flexDirection: 'row', justifyContent: 'start', alignItems: 'center', borderRight: 'none' }}>
                                <span className="label">Boarding House: <span style={{fontWeight: 'normal'}}>{data.boarding_house}</span></span>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col flex-1" style={{ flexDirection: 'row', justifyContent: 'start', alignItems: 'center', borderRight: 'none' }}>
                                <span className="label">Parent/Guardian: <span style={{fontWeight: 'normal'}}>{data.parent_guardian}</span></span>
                            </div>
                            <div className="col flex-1" style={{ flexDirection: 'row', justifyContent: 'start', alignItems: 'center', borderRight: 'none' }}>
                                <span className="label">Annual Income: <span style={{fontWeight: 'normal'}}>{data.annual_income}</span></span>
                            </div>
                        </div>

                        <div className="row row-writing">
                            <div className="col flex-3" style={{ borderRight: 'none' }}>
                                <span className="label" style={{ fontSize: '8pt', position: 'absolute', left: '4px', top: '2px' }}>Father's Name:</span>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', width: '100%', paddingLeft: '90px', textAlign: 'center', fontWeight: 'bold' }}>
                                    <span style={{ textAlign: 'right', paddingRight: '15px' }}>{data.father_last_name}</span>
                                    <span>{data.father_given_name}</span>
                                    <span style={{ textAlign: 'left', paddingLeft: '15px' }}>{data.father_middle_name}</span>
                                </div>
                            </div>
                            <div className="col flex-1" style={{ borderRight: 'none' }}>
                                <span className="label" style={{ fontSize: '8pt', display: 'flex', alignItems: 'baseline' }}>Occupation: &nbsp;<span style={{borderBottom: '1px solid black', flex: 1, textAlign: 'center', fontWeight: 'bold'}}>{data.father_occupation}</span></span>
                            </div>
                        </div>
                        <div className="row row-sublabel">
                            <div className="col flex-3" style={{ borderRight: 'none', paddingBottom: '2px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', width: '100%', paddingLeft: '90px' }}>
                                    <span className="sub-label" style={{ textAlign: 'right', paddingRight: '15px' }}>Last Name</span>
                                    <span className="sub-label" style={{ textAlign: 'center' }}>Given Name</span>
                                    <span className="sub-label" style={{ textAlign: 'left', paddingLeft: '15px' }}>Middle Name</span>
                                </div>
                            </div>
                            <div className="col flex-1" style={{ borderRight: 'none' }}></div> 
                        </div>

                        <div className="row row-writing">
                            <div className="col flex-3" style={{ borderRight: 'none' }}>
                                <span className="label" style={{ fontSize: '8pt', position: 'absolute', left: '4px', top: '2px' }}>Mother's Maiden Name:</span>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', width: '100%', paddingLeft: '130px', textAlign: 'center', fontWeight: 'bold' }}>
                                    <span style={{ textAlign: 'right', paddingRight: '15px' }}>{data.mother_last_name}</span>
                                    <span>{data.mother_given_name}</span>
                                    <span style={{ textAlign: 'left', paddingLeft: '15px' }}>{data.mother_middle_name}</span>
                                </div>
                            </div>
                            <div className="col flex-1" style={{ borderRight: 'none' }}>
                                <span className="label" style={{ fontSize: '8pt', display: 'flex', alignItems: 'baseline' }}>Occupation: &nbsp;<span style={{borderBottom: '1px solid black', flex: 1, textAlign: 'center', fontWeight: 'bold'}}>{data.mother_occupation}</span></span>
                            </div>
                        </div>
                        <div className="row row-sublabel">
                            <div className="col flex-3" style={{ borderRight: 'none', paddingBottom: '2px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', width: '100%', paddingLeft: '130px' }}>
                                    <span className="sub-label" style={{ textAlign: 'right', paddingRight: '15px' }}>Last Name</span>
                                    <span className="sub-label" style={{ textAlign: 'center' }}>Given Name</span>
                                    <span className="sub-label" style={{ textAlign: 'left', paddingLeft: '15px' }}>Middle Name</span>
                                </div>
                            </div>
                            <div className="col flex-1" style={{ borderRight: 'none' }}></div>
                        </div>

                        <div className="row">
                            <div className="col flex-1" style={{ flexDirection: 'row', justifyContent: 'start', alignItems: 'center', borderRight: 'none' }}>
                                <span className="label">Parents Contact Number: <span style={{fontWeight: 'normal'}}>{data.parents_contact}</span></span>
                            </div>
                            <div className="col flex-1" style={{ flexDirection: 'row', justifyContent: 'start', alignItems: 'center', borderRight: 'none' }}>
                                <span className="label">DSWD Household Number (4Ps): <span style={{fontWeight: 'normal'}}>{data.dswd_household}</span></span>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col flex-1" style={{ flexDirection: 'row', justifyContent: 'start', alignItems: 'center', borderRight: 'none' }}>
                                <span className="label">Spouse: <span style={{fontWeight: 'normal'}}>{data.spouse}</span></span>
                            </div>
                            <div className="col flex-1" style={{ flexDirection: 'row', justifyContent: 'start', alignItems: 'center', borderRight: 'none' }}>
                                <span className="label">Single Parent: Yes ({data.is_single_parent ? '✓' : '\u00A0\u00A0'}) &nbsp;&nbsp; No ({!data.is_single_parent ? '✓' : '\u00A0\u00A0'})</span>
                            </div>
                        </div>

                        <div className="row" style={{ paddingTop: '2px', flexDirection: 'column' }}>
                            <div style={{ width: '100%', padding: '0 2px' }}>
                                <span className="label">Permanent Address:</span>
                            </div>
                            
                            <div className="col w-full" style={{ display: 'flex', flexWrap: 'wrap', padding: '2px 0 0 0', borderRight: 'none' }}>
                                <div style={{ display: 'flex', width: '100%' }}>
                                    <div style={{ flex: 1, padding: '2px 4px', display: 'flex', alignItems: 'baseline' }}>
                                        <span style={{ fontSize: '9pt' }}>Street:</span>
                                        <div style={{ borderBottom: '1px solid black', flex: 1, textAlign: 'center', fontWeight: 'bold' }}>{data.street}</div>
                                    </div>
                                    <div style={{ flex: 1, padding: '2px 4px', display: 'flex', alignItems: 'baseline' }}>
                                        <span style={{ fontSize: '9pt' }}>Barangay:</span>
                                        <div style={{ borderBottom: '1px solid black', flex: 1, textAlign: 'center', fontWeight: 'bold' }}>{data.barangay}</div>
                                    </div>
                                    <div style={{ flex: 1, padding: '2px 4px', display: 'flex', alignItems: 'baseline' }}>
                                        <span style={{ fontSize: '9pt' }}>City/Municipality:</span>
                                        <div style={{ borderBottom: '1px solid black', flex: 1, textAlign: 'center', fontWeight: 'bold' }}>{data.city_municipality}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="col w-full" style={{ display: 'flex', flexWrap: 'wrap', padding: '0 0 2px 0', borderRight: 'none' }}>
                                <div style={{ display: 'flex', width: '100%' }}>
                                    <div style={{ flex: 1, padding: '2px 4px', display: 'flex', alignItems: 'baseline' }}>
                                        <span style={{ fontSize: '9pt' }}>Zip Code:</span>
                                        <div style={{ borderBottom: '1px solid black', flex: 1, textAlign: 'center', fontWeight: 'bold' }}>{data.zip_code}</div>
                                    </div>
                                    <div style={{ flex: 1, padding: '2px 4px', display: 'flex', alignItems: 'baseline' }}>
                                        <span style={{ fontSize: '9pt' }}>Province:</span>
                                        <div style={{ borderBottom: '1px solid black', flex: 1, textAlign: 'center', fontWeight: 'bold' }}>{data.province}</div>
                                    </div>
                                    <div style={{ flex: 1, padding: '2px 4px', display: 'flex', alignItems: 'baseline' }}>
                                        <span style={{ fontSize: '9pt' }}>Region:</span>
                                        <div style={{ borderBottom: '1px solid black', flex: 1, textAlign: 'center', fontWeight: 'bold' }}>{data.region}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div> 
                    
                    <div className="body-text">
                        I have the honor to apply for scholarship/grants/privilege 
                        <span className="inline-input" style={{ width: '300px' }}>{data.privilege_applied}</span>.
                        <br />
                        My total load last semester was <span className="inline-input">{data.total_load}</span> units with a weighted average of <span className="inline-input">{data.weighted_average}</span> and no grade of 5.0 in any subject and qualified as <span className="inline-input" style={{ width: '150px' }}>{data.scholar_type}</span> scholar.
                    </div>

                    <div className="grades-table-container">
                        <div className="grades-header">Subject Taken</div>
                        <table className="grades">
                            <thead>
                                <tr>
                                    <th className="col-course">Course<br />No.</th>
                                    <th className="col-desc">Descriptive Title</th>
                                    <th className="col-units">Units</th>
                                    <th className="col-rating">Final Rating</th>
                                    <th className="col-remarks">Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gradesList.map((grade, index) => (
                                    <tr key={index}>
                                        <td style={{ fontWeight: 'bold' }}>{grade.course_no}</td>
                                        <td style={{ fontWeight: 'bold' }}>{grade.descriptive_title}</td>
                                        <td style={{ fontWeight: 'bold' }}>{grade.units}</td>
                                        <td style={{ fontWeight: 'bold' }}>{grade.final_rating}</td>
                                        <td style={{ fontWeight: 'bold' }}>{grade.remarks}</td>
                                    </tr>
                                ))}
                                
                                {/* We changed 9 to 8 here to leave the last row for our Totals */}
                                {[...Array(Math.max(0, 8 - gradesList.length))].map((_, i) => (
                                    <tr key={`empty-${i}`}>
                                        <td>&nbsp;</td><td></td><td></td><td></td><td></td>
                                    </tr>
                                ))}

                                {/* --- NEW: TOTALS & GPA ROW --- */}
                                <tr>
                                    {/* 1. Empty Course No. */}
                                    <td></td>
                                    
                                    {/* 2. Empty Descriptive Title */}
                                    <td></td>
                                    
                                    {/* 3. Units Column (Label on left, Number on right) */}
                                    <td style={{ fontWeight: '900', fontSize: '9pt', padding: '2px 4px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '7pt', color: '#000000' }}>Total:</span>
                                            <span>{totalUnits > 0 ? totalUnits : ''}</span>
                                        </div>
                                    </td>
                                    
                                    {/* 4. Final Rating Column (Label on left, Number on right) */}
                                    <td style={{ fontWeight: '900', fontSize: '9pt', padding: '2px 4px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '7pt', color: '#000000' }}>GPA:</span>
                                            <span>{calculatedGPA}</span>
                                        </div>
                                    </td>
                                    
                                    {/* 5. Empty grey box for Remarks */}
                                    <td style={{ backgroundColor: '#ffffff' }}></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="footer" style={{ justifyContent: 'flex-start', alignItems: 'flex-end' }}>
                        <div className="sig-block" style={{ width: '35%' }}>
                            <div className="sig-line">Student Signature</div>
                        </div>

                        <div style={{ width: '20%', marginLeft: '1.5in', display: 'flex', alignItems: 'flex-end', marginBottom: '2px' }}>
                            <span style={{ marginRight: '5px', fontWeight: 'bold' }}>I.D No.</span>
                            <div style={{ borderBottom: '1px solid black', flex: 1, textAlign: 'center', fontWeight: 'bold' }}>{data.id_no}</div>
                        </div>
                    </div>

                    <div className="footer" style={{ marginTop: '10px' }}>
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            
                            <div style={{ width: '55%', display: 'flex', alignItems: 'flex-start', marginBottom: '4px' }}>
                                <span style={{ marginRight: '19px', paddingTop: '2px' }}>Noted:</span>
                                
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: '19px' }}>
                                    <div style={{ borderBottom: '1px solid black', height: '14px' }}></div>
                                    <div style={{ textAlign: 'center', paddingTop: '2px', fontWeight: 'bold' }}>College Dean/Campus Director</div>
                                </div>
                            </div>

                            <div style={{ position: 'absolute', bottom: '0.9in', right: '1in', width: '2.8in', display: 'flex', alignItems: 'flex-start' }}>
                                <span style={{ marginRight: '5px', paddingTop: '2px' }}>Approved:</span>

                                <div style={{ position: 'absolute', bottom: '0in', left: '-100mm', display: 'flex', alignItems: 'flex-end' }}>
                                
                                <span style={{ marginRight: '5px', fontWeight: 'bold' }}>SBO</span>
                                <div style={{ borderBottom: '1px solid black', width: '1in', marginRight: '20px' }}></div>

                                <span style={{ marginRight: '5px', fontWeight: 'bold' }}>SSC</span>
                                <div style={{ borderBottom: '1px solid black', width: '1in' }}></div>
                                
                            </div>
                                
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: '5px' }}>
                                    <div style={{ textAlign: 'center', paddingTop: '2px', fontWeight: 'bold', textTransform: 'uppercase' }}>Musa M. Tagal, PhD</div>
                                    <div style={{ textAlign: 'center', fontSize: '9pt', marginTop: '2px' }}>Director, Student Affairs</div>
                                </div>
                            </div>
                            
                        </div>
                    </div>

                    <div className="document-footer">
                        <div className="doc-control">
                            <div className="doc-row">
                                <span className="doc-label">Form No.</span>
                                <span>: FM-DPM-CFCST-AAS-04</span>
                            </div>
                            <div className="doc-row">
                                <span className="doc-label">Revision No.</span>
                                <span>: 02</span>
                            </div>
                            <div className="doc-row">
                                <span className="doc-label">Date Effective</span>
                                <span>: 25 October 2024</span>
                            </div>
                        </div>
                        <div className="footer-logo">
                            <img src="/socotec.png" alt="SOCOTEC Logo" crossOrigin="anonymous" />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default DocumentView;