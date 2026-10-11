import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/FormEntry.css';
const API_BASE = `http://${window.location.hostname}:5000`;


// 1. Strict Validation Schema with DYNAMIC ID REQUIREMENT
const schema = z.object({
    id_no: z.string().optional(),
    scholarship_type: z.enum(['New', 'Renewal']),
    school_year: z.string().min(1, "Required"),
    semester: z.string().min(1, "Required"),
    family_name: z.string().min(1, "Required"),
    first_name: z.string().min(1, "Required"),
    middle_name: z.string().optional(),
    extension: z.string().optional(),
    degree_program: z.string().min(1, "Required"),
    major: z.string().optional(),
    year_level: z.string().min(1, "Required"),
    age: z.number({ invalid_type_error: "Must be a number" }).int().positive(),
    gender: z.string().min(1, "Required"),
    civil_status: z.string().min(1, "Required"),
    place_of_birth: z.string().min(1, "Required"),
    date_of_birth: z.string().min(1, "Required"),
    nationality: z.string().min(1, "Required"),
    tribe: z.string().optional(),
    religion: z.string().optional(),
    contact_number: z.string().min(1, "Required"),
    email: z.string().email("Invalid email"),
    has_disability: z.string(),
    disability: z.string().optional(),
    boarding_house: z.string().optional(),
    parent_guardian: z.string().min(1, "Required"),
    annual_income: z.number().positive(),
    father_last_name: z.string().optional(),
    father_given_name: z.string().optional(),
    father_middle_name: z.string().optional(),
    father_occupation: z.string().optional(),
    mother_last_name: z.string().optional(),
    mother_given_name: z.string().optional(),
    mother_middle_name: z.string().optional(),
    mother_occupation: z.string().optional(),
    parents_contact: z.string().optional(),
    dswd_household: z.string().optional(),
    spouse: z.string().optional(),
    is_single_parent: z.boolean().default(false),
    street: z.string().min(1, "Required"),
    barangay: z.string().min(1, "Required"),
    city_municipality: z.string().min(1, "Required"),
    province: z.string().min(1, "Required"),
    region: z.string().min(1, "Required"),
    zip_code: z.string().min(1, "Required"),
    privilege_applied: z.string().min(1, "Required"),
    total_load: z.number().int().positive(),
    weighted_average: z.number().positive(),
    scholar_type: z.string().min(1, "Required"),
    grades: z.array(z.object({
        course_no: z.string(),
        descriptive_title: z.string(),
        units: z.number().int(),
        final_rating: z.number(),
        remarks: z.string()
    })).optional()
}).superRefine((data, ctx) => {
    // NEW: If Renewal is selected, id_no CANNOT be blank!
    if (data.scholarship_type === 'Renewal' && (!data.id_no || data.id_no.trim() === '')) {
        ctx.addIssue({
            path: ['id_no'],
            code: z.ZodIssueCode.custom,
            message: "ID No. is required for Renewal Applicants"
        });
    }
});

const FormEntry = () => {
    const navigate = useNavigate();
    const [settings, setSettings] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            scholarship_type: "New", // Default to New so ID is disabled initially
            has_disability: "No",
            is_single_parent: false,
            grades: [{ course_no: '', descriptive_title: '', units: 0, final_rating: 0, remarks: 'Passed' }]
        }
    });

    const { fields, append, remove } = useFieldArray({ control, name: "grades" });

    // Watch values to create dynamic UI
    const hasDisability = watch("has_disability");
    const scholarshipType = watch("scholarship_type"); // WATCHING THE STATUS

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await axios.get(`${API_BASE}/api/settings`);
                if (response.data.status === 'success') {
                    const sysSettings = response.data.data;
                    setSettings(sysSettings);
                    
                    if (sysSettings.is_open) {
                        // UPDATE THESE TWO LINES:
                        setValue('school_year', sysSettings.school_year, { shouldValidate: true, shouldDirty: true });
                        setValue('semester', sysSettings.semester, { shouldValidate: true, shouldDirty: true });
                    }
                }
            } catch (error) {
                console.error("Error fetching system settings:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, [setValue]);

    useEffect(() => {
        if (hasDisability === "No") {
            setValue("disability", "None"); 
        }
    }, [hasDisability, setValue]);

    // NEW: If they switch back to "New", instantly clear out the ID field so it saves blank
    useEffect(() => {
        if (scholarshipType === "New") {
            setValue("id_no", "");
        }
    }, [scholarshipType, setValue]);

    const onSubmit = async (data) => {
        // NEW: Forcefully attach the locked settings to the payload
        if (settings) {
            data.school_year = settings.school_year;
            data.semester = settings.semester;
        }

        try {
            const response = await axios.post(`${API_BASE}/api/applications`, data);
            if (response.data.status === 'success') {
                navigate(`/document/${response.data.data.applicationId}`, { state: { autoDownload: false } });
            }
        } catch (error) {
            // 409 = Duplicate application detected by the server (SAME EMAIL)
            if (error.response?.status === 409) {
                const { existingId, message } = error.response.data;
                const confirmed = window.confirm(`⚠️ Existing Application Found\n\n${message}`);

                if (confirmed) {
                    try {
                        const replaceResponse = await axios.put(`${API_BASE}/api/applications/replace`, {
                            ...data,
                            existingId
                        });
                        if (replaceResponse.data.status === 'success') {
                            navigate(`/document/${replaceResponse.data.data.applicationId}`, { state: { autoDownload: false } });
                        }
                    } catch (replaceError) {
                        alert("Failed to replace your application. Please try again.");
                        console.error(replaceError);
                    }
                }
            
            // NEW: 403 = Different email used for the same name
            } else if (error.response?.status === 403) {
                alert(`⚠️ ${error.response.data.message}`);
            
            } else {
                alert("Error submitting form. Please check your connection and try again.");
            }
            console.error(error);
        }
    };

    if (isLoading) return <div className="form-loading">Loading Secure Application Portal...</div>;

    if (!settings?.is_open) {
        return (
            <div className="form-wrapper closed-wrapper">
                <div className="closed-card">
                    <div className="closed-image">
                        <img src="/close.png" alt="Portal Closed" className="closed-img" />
                    </div>
                    <h1 className="closed-title">Portal Closed</h1>
                    <p className="closed-text">
                        The CFCST Scholarship Application system is not currently accepting responses for the <strong>{settings?.semester} Semester, SY {settings?.school_year}</strong>. 
                        Please wait for the official announcement from the OSAS office.
                    </p>
                    <div className="closed-links">
                        <p className="closed-note">For real-time updates, please visit our official page:</p>
                        <a href="https://www.facebook.com/share/1KunJruW2R/" target="_blank" rel="noopener noreferrer" className="fb-link">
                            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                            CFCST OSAS Facebook Page
                        </a>
                    </div>
                    <button type="button" onClick={() => navigate('/')} className="btn-submit btn-auto">Return to Homepage</button>
                </div>
            </div>
        );
    }

    return (
        <div className="form-wrapper">
            <div className="form-header">
                <button type="button" className="btn-back" onClick={() => navigate('/')}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                    Back
                </button>
                <h2>CFCST Scholarship Application</h2>
                <p className="form-subtitle">Please fill out all required fields professionally.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                
                {/* Application Context */}
                <div className="form-section">
                    <div className="section-title">Application Context</div>
                    <div className="grid-row">
                        <div className="form-group">
                            <label>Status</label>
                            <select {...register("scholarship_type")}>
                                <option value="New">New Applicant</option>
                                <option value="Renewal">Renewal</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>School Year (Locked)</label>
                            <input {...register("school_year")} readOnly className="locked-input" />
                        </div>
                        <div className="form-group">
                            <label>Semester (Locked)</label>
                            <input {...register("semester")} readOnly className="locked-input" />
                        </div>
                        
                        {/* THE NEW DYNAMIC ID NUMBER BOX */}
                        <div className="form-group">
                            <label className={scholarshipType === 'Renewal' ? 'label-required' : ''}>
                                ID No. {scholarshipType === 'Renewal' ? '*' : ''}
                            </label>
                            <input 
                                {...register("id_no")} 
                                disabled={scholarshipType === 'New'} 
                                placeholder={scholarshipType === 'New' ? "Not required for New Applicants" : "e.g. 2023-0145"} 
                                className={errors.id_no ? 'input-error' : ''}
                            />
                            {errors.id_no && <span className="error-msg">{errors.id_no.message}</span>}
                        </div>
                    </div>
                </div>

                {/* Personal Information */}
                <div className="form-section">
                    <div className="section-title">Personal Information</div>
                    <div className="grid-row">
                        <div className="form-group">
                            <label>Family Name *</label>
                            <input {...register("family_name")} />
                            {errors.family_name && <span className="error-msg">{errors.family_name.message}</span>}
                        </div>
                        <div className="form-group">
                            <label>First Name *</label>
                            <input {...register("first_name")} />
                        </div>
                        <div className="form-group">
                            <label>Middle Name</label>
                            <input {...register("middle_name")} />
                        </div>
                        <div className="form-group">
                            <label>Extension</label>
                            <input {...register("extension")} placeholder="e.g. JR, SR" />
                        </div>
                    </div>

                    <div className="grid-row">
                        <div className="form-group">
                            <label>Age *</label>
                            <input type="number" {...register("age", { valueAsNumber: true })} />
                            {errors.age && <span className="error-msg">{errors.age.message}</span>}
                        </div>
                        <div className="form-group">
                            <label>Gender *</label>
                            <select {...register("gender")}>
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Civil Status *</label>
                            <select {...register("civil_status")}>
                                <option value="">Select</option>
                                <option value="Single">Single</option>
                                <option value="Married">Married</option>
                                <option value="Widowed">Widowed</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid-row">
                        <div className="form-group"><label>Date of Birth *</label><input type="date" {...register("date_of_birth")} /></div>
                        <div className="form-group"><label>Place of Birth *</label><input {...register("place_of_birth")} /></div>
                        <div className="form-group"><label>Nationality *</label><input {...register("nationality")} /></div>
                    </div>

                    <div className="grid-row">
                        <div className="form-group"><label>Tribe</label><input {...register("tribe")} /></div>
                        <div className="form-group"><label>Religion</label><input {...register("religion")} /></div>
                        <div className="form-group"><label>Contact Number *</label><input {...register("contact_number")} /></div>
                        <div className="form-group"><label>Email Address</label><input type="email" {...register("email")} /></div>
                    </div>

                    <div className="grid-row">
                        <div className="form-group">
                            <label>Do you have a disability?</label>
                            <select {...register("has_disability")}>
                                <option value="No">No</option>
                                <option value="Yes">Yes</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Specify Disability</label>
                            <input {...register("disability")} disabled={hasDisability === "No"} placeholder={hasDisability === "No" ? "Field Disabled" : "Enter disability"} />
                        </div>
                        <div className="form-group"><label>Boarding House</label><input {...register("boarding_house")} placeholder="Leave blank if N/A" /></div>
                    </div>
                </div>

                {/* Family Background */}
                <div className="form-section">
                    <div className="section-title">Family Background</div>
                    <div className="grid-row">
                        <div className="form-group"><label>Parent/Guardian Name *</label><input {...register("parent_guardian")} /></div>
                        <div className="form-group"><label>Parents' Contact No.</label><input {...register("parents_contact")} /></div>
                        <div className="form-group"><label>Annual Family Income *</label><input type="number" {...register("annual_income", { valueAsNumber: true })} /></div>
                    </div>
                    <div className="grid-row">
                        <div className="form-group"><label>Father's Last Name</label><input {...register("father_last_name")} /></div>
                        <div className="form-group"><label>Father's Given Name</label><input {...register("father_given_name")} /></div>
                        <div className="form-group"><label>Father's Middle Name</label><input {...register("father_middle_name")} /></div>
                        <div className="form-group"><label>Occupation</label><input {...register("father_occupation")} /></div>
                    </div>
                    <div className="grid-row">
                        <div className="form-group"><label>Mother's Last Name</label><input {...register("mother_last_name")} /></div>
                        <div className="form-group"><label>Mother's Given Name</label><input {...register("mother_given_name")} /></div>
                        <div className="form-group"><label>Mother's Middle Name</label><input {...register("mother_middle_name")} /></div>
                        <div className="form-group"><label>Occupation</label><input {...register("mother_occupation")} /></div>
                    </div>
                    <div className="grid-row">
                        <div className="form-group"><label>DSWD Household No.</label><input {...register("dswd_household")} placeholder="Leave blank if N/A" /></div>
                        <div className="form-group"><label>Spouse (if married)</label><input {...register("spouse")} placeholder="Leave blank if N/A" /></div>
                        <div className="form-group checkbox-group">
                            <input type="checkbox" {...register("is_single_parent")} id="singleParent" />
                            <label htmlFor="singleParent">Is Single Parent?</label>
                        </div>
                    </div>
                </div>

                {/* Academic & Scholarship Details */}
                <div className="form-section">
                    <div className="section-title">Academic & Scholarship Details</div>
                    <div className="grid-row">
                        <div className="form-group"><label>Degree Program *</label><input {...register("degree_program")} placeholder="e.g. BSIT" /></div>
                        <div className="form-group"><label>Major</label><input {...register("major")} /></div>
                        <div className="form-group"><label>Year Level *</label><input {...register("year_level")} placeholder="e.g. 3rd Year" /></div>
                    </div>
                    <div className="grid-row">
                        <div className="form-group"><label>Privilege Applied For *</label><input {...register("privilege_applied")} placeholder="e.g. Academic Scholarship" /></div>
                        <div className="form-group"><label>Scholar Type *</label><input {...register("scholar_type")} placeholder="e.g. Full / Half" /></div>
                        <div className="form-group"><label>Total Load (Units) *</label><input type="number" {...register("total_load", { valueAsNumber: true })} /></div>
                        <div className="form-group"><label>Weighted Average (GWA) *</label><input type="number" step="0.01" {...register("weighted_average", { valueAsNumber: true })} /></div>
                    </div>
                </div>

                {/* Academic Subjects / Grades */}
                <div className="form-section">
                    <div className="section-title">Subjects Taken & Grades</div>
                    <div className="grades-table-container">
                        <table className="grades-table">
                            <thead>
                                <tr>
                                    <th>Course No.</th>
                                    <th>Descriptive Title</th>
                                    <th>Units</th>
                                    <th>Final Rating</th>
                                    <th>Remarks</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fields.map((item, index) => (
                                    <tr key={item.id}>
                                        <td><input {...register(`grades.${index}.course_no`)} placeholder="e.g. IT 101" /></td>
                                        <td><input {...register(`grades.${index}.descriptive_title`)} placeholder="Intro to Computing" /></td>
                                        <td><input type="number" {...register(`grades.${index}.units`, { valueAsNumber: true })} /></td>
                                        <td><input type="number" step="0.01" {...register(`grades.${index}.final_rating`, { valueAsNumber: true })} /></td>
                                        <td><input {...register(`grades.${index}.remarks`)} placeholder="e.g. Passed" /></td>
                                        <td className="cell-action"><button type="button" onClick={() => remove(index)} className="btn-remove">Remove</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button type="button" onClick={() => append({ course_no: '', descriptive_title: '', units: 0, final_rating: 0, remarks: 'Passed' })} className="btn-add">+ Add Subject</button>
                    </div>
                </div>

                {/* Permanent Address */}
                <div className="form-section">
                    <div className="section-title">Permanent Address</div>
                    <div className="grid-row">
                        <div className="form-group"><label>Street *</label><input {...register("street")} /></div>
                        <div className="form-group"><label>Barangay *</label><input {...register("barangay")} /></div>
                        <div className="form-group"><label>City/Municipality *</label><input {...register("city_municipality")} /></div>
                    </div>
                    <div className="grid-row">
                        <div className="form-group"><label>Province *</label><input {...register("province")} /></div>
                        <div className="form-group"><label>Region *</label><input {...register("region")} placeholder="e.g. XII" /></div>
                        <div className="form-group"><label>Zip Code *</label><input {...register("zip_code")} /></div>
                    </div>
                </div>

                <button type="submit" className="btn-submit">Submit Application</button>
            </form>
        </div>
    );
};

export default FormEntry;