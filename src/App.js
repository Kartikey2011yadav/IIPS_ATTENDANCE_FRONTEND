import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import Login from './Login/Login';

import SignUp from './Sign_up/SignUp';
import VerifyOtp from './Sign_up/VerifyOtp';
import Forgot_Password from './Forgot_Password/Forgot_Password';
import Reset_Password from './Reset_Password/Reset_Password';
import axios from 'axios';

import Error404 from './error/error404';
import Dashboard from './Dashboard/Dashboard';
import Record from './Attendance_Record/Record';
import StudentDetail from './StudentDetail/StudentDetail';



const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // Get the current location

  useEffect(() => {
    const publicRoutes = ["/sign_up", "/verify_passcode","/forgot_password","/reset_password"];
    const sessionId = localStorage.getItem("sessionId");

    // If the current route is public, skip the authentication check
    if (publicRoutes.includes(location.pathname)) {
      return;
    }

    if (sessionId) {
      axios
        .post(`${process.env.REACT_APP_BACKEND_URL}/teacher/verify-session`, { sessionId })
        .then((response) => {
          if (response.data.valid) {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem("sessionId");
            setIsAuthenticated(false);
            navigate("/"); 
          }
        })
        .catch(() => {
          localStorage.removeItem("sessionId");
          setIsAuthenticated(false);
          navigate("/"); 
        });
    } else {
      setIsAuthenticated(false);
      navigate("/"); 
    }
  }, [navigate, location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/sign_up" element={<SignUp />} />
      <Route path="/verify_passcode" element={<VerifyOtp />} />
      <Route path="/forgot_password" element={<Forgot_Password />} />
      <Route path='/reset_password' element={<Reset_Password />} />

      {isAuthenticated && (
        // All protected routes should be placed here 
        <>
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/attendance_record" element={<Record />} />
        <Route path="/student/:studentId" element={<StudentDetail />} />
        </>
      )}

      {/* Error404 Route */}
      <Route path="/*" element={<Error404/>}/> 
    </Routes>
  );
};

const WrappedApp = () => (
  <Router>
    <App />
  </Router>
);

export default WrappedApp;
