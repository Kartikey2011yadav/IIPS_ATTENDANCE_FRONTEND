import React, { useState, useEffect } from 'react';
import './StudentDetail.css';
import Navbar from '../Navbar/Navbar';
import axios from 'axios';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import Loader from '../Loader/Loader';
import AlertModal from '../AlertModal/AlertModal';

const StudentDetail = () => {
  const { studentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { subject, semester, academicYear } = location.state || {};
  
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [summary, setSummary] = useState({ present: 0, absent: 0, total: 0, percentage: 0 });
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light'); // Initialize theme from local storage

  useEffect(() => {
    if (studentId && subject && semester && academicYear) {
      fetchStudentInfo();
      fetchAttendanceDetails();
    }
  }, [studentId, subject, semester, academicYear]);

  const fetchStudentInfo = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/attendance/students/${studentId}`);
      setStudentInfo(response.data);
    } catch (error) {
      console.error('Error fetching student information:', error);
      showAlert('Failed to fetch student information', true);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/attendance/detail/${studentId}/${subject}/${semester}/${academicYear}`
      );
      
      setAttendanceRecords(response.data);
      
      // Calculate summary
      const present = response.data.filter(record => record.present).length;
      const total = response.data.length;
      const absent = total - present;
      const percentage = total ? ((present / total) * 100).toFixed(2) : 0;
      
      setSummary({ present, absent, total, percentage });
    } catch (error) {
      console.error('Error fetching attendance details:', error);
      showAlert('Unable to fetch attendance details, or no class was conducted', true);
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (msg, error = false) => {
    setModalMessage(msg);
    setIsError(error);
    setIsModalOpen(true);
  };

  // Format date to DD/MM/YYYY
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Navigate back to records with state to trigger data reload
  const handleBackToRecords = () => {
    navigate('/attendance_record', { state: { returnFromDetail: true } });
  };

  const toggleTheme = () => {
    if(theme === 'light' || !theme){
      setTheme('dark');
      localStorage.setItem('theme', 'dark'); // Initialize theme in local storage
    }
    else{
      setTheme('light');
      localStorage.setItem('theme', 'light'); // Initialize theme in local storage
    }
  };

  if (!studentInfo && !loading) {
    return (
      <div className={`student-detail-container ${theme}`}>
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        <div className="student-detail-error">
          <h2>Student information not available</h2>
          <button onClick={handleBackToRecords} className="student-detail-back-btn">Back to Records</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`student-detail-container ${theme}`}>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      
      {loading && <Loader />}
      
      <AlertModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        message={modalMessage} 
        iserror={isError} 
      />
      
      <div className={`student-detail-content ${theme}`}>
        <button onClick={handleBackToRecords} className={`student-detail-back-btn ${theme}`}>Back to Records</button>
        <br />
        <br />
        <div className="student-detail-header">
          <h2>Student Attendance Details</h2>
        </div>
        
        {studentInfo && (
          <div className="student-info-card">
            <h3>Student Information</h3>
            <div className="student-info-grid">
              <div className="info-item">
                <span className="info-label">Name:</span>
                <span className="info-value">{studentInfo.fullName}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Roll Number:</span>
                <span className="info-value">{studentInfo.rollNumber}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Enrollment Number:</span>
                <span className="info-value">{studentInfo.enrollmentNumber}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">{studentInfo.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Phone:</span>
                <span className="info-value">{studentInfo.phoneNumber}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Course:</span>
                <span className="info-value">{studentInfo.className}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Semester:</span>
                <span className="info-value">{semester?.replace('th_sem', '')}</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="attendance-summary-card">
          <h3>Attendance Summary for {subject}</h3>
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-value">{summary.present}</span>
              <span className="stat-label">Present</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{summary.absent}</span>
              <span className="stat-label">Absent</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{summary.total}</span>
              <span className="stat-label">Total Classes</span>
            </div>
            <div className="stat-item">
              <span className={`stat-value ${
                summary.percentage >= 75 ? 'good-attendance' :
                summary.percentage >= 65 ? 'warning-attendance' :
                'critical-attendance'
              }`}>
                {summary.percentage}%
              </span>
              <span className="stat-label">Attendance</span>
            </div>
          </div>
        </div>
        
        <div className="attendance-records-section">
          <h3>Detailed Attendance Records</h3>
          
          {attendanceRecords.length > 0 ? (
            <table className="attendance-records-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((record, index) => (
                  <tr key={index} className={record.present ? 'present-row' : 'absent-row'}>
                    <td>{formatDate(record.date)}</td>
                    <td>
                      <span className={`status-badge ${record.present ? 'present' : 'absent'}`}>
                        {record.present ? 'Present' : 'Absent'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-records-message">
              No attendance records found for this student and subject.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;