import React, { useState } from 'react';
import './NotificationModel.css';
import axios from 'axios';
import AlertModal from '../AlertModal/AlertModal'; // Import the AlertModal

const NotificationModal = ({ isOpen, onClose, attendanceSummary }) => {
  const [threshold, setThreshold] = useState(75);
  const [sending, setSending] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const theme = localStorage.getItem('theme') || 'light'; // Initialize theme from local storage

  if (!isOpen) return null;

  const handleThresholdChange = (e) => {
    setThreshold(Number(e.target.value));
  };

  const handleSendNotifications = async () => {
    setSending(true);
    setShowAlert(false);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/attendance/sendLowAttendanceNotifications`,
        { attendanceSummary, threshold }
      );

      setSending(false);
      setAlertMessage(`Successfully sent notifications to ${response.data.sentCount} students.`);
      setIsError(false);
      setShowAlert(true);
      onClose(); // Close the NotificationModal when successful
    } catch (error) {
      setSending(false);
      setAlertMessage(`Error: ${error.response?.data?.message || 'Failed to send notifications'}`);
      setIsError(true);
      setShowAlert(true);
      onClose(); // Close the NotificationModal on error as well
    }
  };

  // Calculate number of students below threshold
  const studentsBelow = attendanceSummary ? attendanceSummary.filter(record => {
    const percentage = ((record.classesAttended / record.totalClasses) * 100);
    return percentage < threshold;
  }).length : 0;

  return (
    <>
      <div className={`notification-modal-overlay ${theme}`}>
        <div className={`notification-modal ${theme}`}>
          <div className="notification-modal-header">
            <h3>Send Low Attendance Notifications</h3>
            <button className="notification-modal-close" onClick={onClose}>×</button>
          </div>
          <div className="notification-modal-body">
            <p>Send email notifications to students whose attendance falls below a specified threshold.</p>
            
            <div className="notification-threshold-container">
              <label htmlFor="thresholdInput">Attendance Threshold (%)</label>
              <input 
                id="thresholdInput"
                type="range" 
                min="0" 
                max="100" 
                step="5"
                value={threshold} 
                onChange={handleThresholdChange}
                className="notification-threshold-slider"
              />
              <span className="notification-threshold-value">{threshold}%</span>
            </div>
            
            <div className={`notification-info ${theme}`}>
              <p>Students below threshold: <strong>{studentsBelow}</strong></p>
              <p className="notification-warning">
                {studentsBelow > 0 ? 
                  "These students will receive a detailed email about their low attendance and potential consequences." :
                  "No students are below this threshold."}
              </p>
            </div>
          </div>
          <div className="notification-modal-footer">
            <button 
              className="notification-cancel-btn" 
              onClick={onClose}
              disabled={sending}
            >
              Cancel
            </button>
            <button 
              className={`notification-send-btn `}
              onClick={handleSendNotifications}
              disabled={sending || studentsBelow === 0}
            >
              {sending ? 'Sending...' : `Send Notifications (${studentsBelow})`}
            </button>
          </div>
        </div>
      </div>

      {/* Alert Modal */}
      <AlertModal 
        isOpen={showAlert} 
        onClose={() => setShowAlert(false)} 
        message={alertMessage} 
        iserror={isError}
      />
    </>
  );
};

export default NotificationModal;
