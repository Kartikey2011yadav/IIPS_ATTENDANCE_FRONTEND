import React from 'react';
import './error.css';
import panda from "../Assets/pandu.png";
import { useNavigate } from 'react-router-dom'; 

export default function Error404() {
  const navigate = useNavigate(); 
  const sessionId = localStorage.getItem('sessionId');
  const theme = localStorage.getItem('theme') || 'light'; // Initialize theme from local storage

  const handleGoBack = () => {
    if (sessionId) {
      navigate('/teacherDashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <>
    {/* {sessionId} */}
      <div className={`error-container ${theme}`}>
        <h1 className="error404-heading">Error 404</h1>
        <img src={panda} alt="panda" className="panda-image" />
        <p className="error404-text">Oops! Page not found.</p>
        <button className="go-back-button" onClick={handleGoBack}>
          Go Back
        </button>
      </div>
    </>
  );
}
