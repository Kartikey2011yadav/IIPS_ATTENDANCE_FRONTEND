import React, { useState, useEffect, useRef } from 'react';
import './Record.css';
import Navbar from '../Navbar/Navbar';
import axios from 'axios';
import { subjectMapping } from '../utils/subjectMapping';
import Loader from '../Loader/Loader';
import AlertModal from '../AlertModal/AlertModal';

import { useNavigate, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import NotificationModal from '../NotificationModel/NotificationModel';

const Record = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [course, setCourse] = useState('');
  const [semester, setSemester] = useState('');
  const [subject, setSubject] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [academicYear, setAcademicYear] = useState('');
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const filtersLoaded = useRef(false);
  const subjectsLoaded = useRef(false);
  const shouldFetchData = useRef(false);

  // Generate academic year options
  const generateAcademicYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 5; i++) {
      const startYear = currentYear - i;
      const endYear = startYear + 1;
      years.push(`${startYear}-${endYear}`);
    }
    return years;
  };

  // Load saved filters on component mount only once
  useEffect(() => {
    const savedFilters = JSON.parse(localStorage.getItem('attendanceFilters')) || {};
    
    if (savedFilters.course && !filtersLoaded.current) {
      setCourse(savedFilters.course);
      if (savedFilters.semester) setSemester(savedFilters.semester);
      if (savedFilters.academicYear) setAcademicYear(savedFilters.academicYear);
      
      filtersLoaded.current = true;
      
      // Set flag to fetch data if coming from detail page
      if (location.state?.returnFromDetail) {
        shouldFetchData.current = true;
      }
    }
  }, [location.state]);

  // Update subjects when course or semester changes
  useEffect(() => {
    if (course && semester) {
      const key = `${course.toLowerCase()}_${semester}`;
      const subjectList = subjectMapping[key] || [];
      setSubjects(subjectList);
      
      // Load saved subject if available in the current subject list
      const savedFilters = JSON.parse(localStorage.getItem('attendanceFilters')) || {};
      if (savedFilters.subject && subjectList.some(s => s.code === savedFilters.subject) && !subjectsLoaded.current) {
        setSubject(savedFilters.subject);
        subjectsLoaded.current = true;
      } else if (!subjectList.some(s => s.code === subject)) {
        // Reset subject if current one is not valid for new course/semester
        setSubject('');
      }
    } else {
      setSubjects([]);
      setSubject('');
    }
  }, [course, semester]);

  // Auto fetch data when all prerequisites are met and flagged to fetch
  useEffect(() => {
    const allFiltersSelected = course && semester && subject && academicYear;
    
    if (allFiltersSelected && shouldFetchData.current) {
      fetchAttendanceSummary();
      shouldFetchData.current = false;
    }
  }, [course, semester, subject, academicYear]);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    if (course || semester || subject || academicYear) {
      const filtersToSave = {
        course,
        semester,
        subject,
        academicYear
      };
      localStorage.setItem('attendanceFilters', JSON.stringify(filtersToSave));
    }
  }, [course, semester, subject, academicYear]);

  const handleCourseChange = (e) => {
    setCourse(e.target.value);
    setAttendanceSummary([]);
    subjectsLoaded.current = false;
  };

  const handleSemesterChange = (e) => {
    setSemester(e.target.value);
    setAttendanceSummary([]);
    subjectsLoaded.current = false;
  };

  const handleSubjectChange = (e) => {
    setSubject(e.target.value);
  };

  const handleAcademicYearChange = (e) => {
    setAcademicYear(e.target.value);
  };

  const showAlert = (msg, error = false) => {
    setModalMessage(msg);
    setIsError(error);
    setIsModalOpen(true);
  };

  const fetchAttendanceSummary = async () => {
    if (!course || !semester || !academicYear || !subject) {
      showAlert('Please select Course, Semester, Subject, and Academic Year', true);
      return;
    }

    setLoading(true);
    
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/attendance/getAttendanceByCourseAndSubject`, {
        course: course,
        semester: `${semester}th_sem`,
        subject: subject,
        academicYear: academicYear
      });
      
      if (response.data.length === 0) {
        showAlert('No attendance records found for the selected criteria', true);
      } else {
        setAttendanceSummary(response.data);
      }
    } catch (error) {
      console.error('Error fetching attendance summary:', error);
      showAlert('Failed to fetch attendance summary. Please try again.', true);
    } finally {
      setLoading(false);
    }
  };

  // Calculate attendance percentage
  const calculatePercentage = (present, total) => {
    if (!total) return 0;
    return ((present / total) * 100).toFixed(2);
  };

  // Navigate to student detail page
  const viewStudentDetail = (studentId) => {
    navigate(`/student/${studentId}`, {
      state: {
        subject: subject,
        semester: `${semester}th_sem`,
        academicYear: academicYear
      }
    });
  };

  // Open notification modal
  const openNotificationModal = () => {
    if (attendanceSummary.length === 0) {
      showAlert('No student data available to send notifications', true);
      return;
    }
    setIsNotificationModalOpen(true);
  };

  // Export to Excel function
  const exportToExcel = () => {
    if (attendanceSummary.length === 0) {
        showAlert('No data to export', true);
        return;
    }

    try {
        const subjectName = subjects.find(s => s.code === subject)?.name || subject;

        const worksheetData = attendanceSummary.map(record => {
            const percentage = calculatePercentage(record.classesAttended, record.totalClasses);
            const status = percentage >= 75 ? 'Good' : percentage >= 65 ? 'Warning' : 'Critical';
            
            return {
                'Roll Number': record.rollNumber,
                'Student Name': record.studentName,
                'Subject': subjects.find(s => s.code === record.subject)?.name || record.subject,
                'Classes Attended': record.classesAttended,
                'Total Classes': record.totalClasses,
                'Attendance %': `${percentage}%`,
                'Status': status
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);

        // Make the first row bold
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
            if (!worksheet[cellAddress]) continue;
            worksheet[cellAddress].s = {
                font: { bold: true }
            };
        }

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Summary');

        const fileName = `${course}_${semester}Sem_${subjectName}_${academicYear}_Attendance.xlsx`;

        XLSX.writeFile(workbook, fileName);

        showAlert('Export successful!');
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        showAlert('Failed to export data. Please try again.', true);
    }
  };

  return (
    <div className="record_container">
      <Navbar />
      
      {loading && <Loader />}
      
      <AlertModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        message={modalMessage} 
        iserror={isError} 
      />
      
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        attendanceSummary={attendanceSummary}
      />
      
      <div className="record_summary-section">
        <h2>Attendance Record</h2>
        
        <div className="record_filter-row">
          <div className="record_filter-group">
            <label htmlFor="course">Course:</label>
            <select 
              id="course" 
              value={course} 
              onChange={handleCourseChange}
              className="record_filter-select"
            >
              <option value="">Select Course</option>
              <option value="MTECH">MTECH</option>
              <option value="MCA">MCA</option>
            </select>
          </div>
          
          <div className="record_filter-group">
            <label htmlFor="semester">Semester:</label>
            <select 
              id="semester" 
              value={semester} 
              onChange={handleSemesterChange}
              className="record_filter-select"
            >
              <option value="">Select Semester</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(sem => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>

          <div className="record_filter-group">
            <label htmlFor="subject">Subject:</label>
            <select 
              id="subject" 
              value={subject} 
              onChange={handleSubjectChange}
              className="record_filter-select"
              disabled={!semester || !course}
            >
              <option value="">Select Subject</option>
              {subjects.map(sub => (
                <option key={sub.code} value={sub.code}>{sub.name}</option>
              ))}
            </select>
          </div>

          <div className="record_filter-group">
            <label htmlFor="academicYear">Academic Year:</label>
            <select
              id="academicYear"
              value={academicYear}
              onChange={handleAcademicYearChange}
              className="record_filter-select"
            >
              <option value="">Select Academic Year</option>
              {generateAcademicYears().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <button 
            className="record_btn-fetch" 
            onClick={fetchAttendanceSummary}
            disabled={loading || !course || !semester || !academicYear || !subject}
          >
            Get Students
          </button>
        </div>
        
        {attendanceSummary.length > 0 && (
          <div className="record_summary-table-container">
            <div className="record_export-container">
              <button 
                className="record_btn-export" 
                onClick={exportToExcel}
              >
                Export to Excel
              </button>
              <button 
                className="record_btn-notify" 
                onClick={openNotificationModal}
              >
                Send Mail For Notification
              </button>
            </div>
            <table className="record_summary-table">
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Student Name</th>
                  <th>Subject</th>
                  <th>Classes Attended</th>
                  <th>Total Classes</th>
                  <th>Attendance %</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {attendanceSummary.map((record, index) => {
                  const percentage = calculatePercentage(record.classesAttended, record.totalClasses);
                  const status = percentage >= 75 ? 'Good' : percentage >= 65 ? 'Warning' : 'Critical';
                  
                  return (
                    <tr key={index} className={`record_status-${status.toLowerCase()}`}>
                      <td>{record.rollNumber}</td>
                      <td>{record.studentName}</td>
                      <td>{subjects.find(s => s.code === record.subject)?.name || record.subject}</td>
                      <td>{record.classesAttended}</td>
                      <td>{record.totalClasses}</td>
                      <td>{percentage}%</td>
                      <td>{status}</td>
                      <td>
                        <button 
                          className="record_btn-view-details"
                          onClick={() => viewStudentDetail(record.studentId)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Record;