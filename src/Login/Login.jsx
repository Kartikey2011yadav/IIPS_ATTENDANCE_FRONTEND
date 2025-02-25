import React, { useState, useEffect } from "react";
import "./Login.css";
import logo from "../Assets/iips_logo2.png";
import { FaEye } from "react-icons/fa";
import { FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AlertModal from "../AlertModal/AlertModal";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Teacher:login";

    // Check if session ID exists in local storage and is still valid
    const sessionId = localStorage.getItem("sessionId");
    if (sessionId) {
      // Verify the session ID with the backend
      axios
        .post(`${process.env.REACT_APP_BACKEND_URL}/teacher/verify-session`, { sessionId })
        .then((response) => {
          if (response.data.valid) {
            navigate("/Dashboard"); // Navigate to dashboard if session is valid
          } else {
            handleLogout();
          }
        })
        .catch(() => handleLogout());
    }
  }, [navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);

    axios
      .post(`${process.env.REACT_APP_BACKEND_URL}/teacher/login`, { email, password })
      .then((response) => {
        const { sessionId, message, teacherId, name, email, mobileNumber, photo } = response.data;

        // Set modal state for success
        setModalMessage(message || "Login successful");
        setIsError(false);
        setModalIsOpen(true);

        // Store session ID and teacher's details in local storage
        localStorage.setItem("sessionId", sessionId);
        localStorage.setItem("teacherId", teacherId);
        localStorage.setItem("name", name);
        localStorage.setItem("email", email);
        localStorage.setItem("photo", photo);
        localStorage.setItem("mobileNumber", mobileNumber);

        // Navigate after a short delay to ensure modal is shown
        setTimeout(() => {
          navigate("/Dashboard");
        }, 1000);
      })
      .catch((error) => {
        console.log(error);
        setModalMessage(error.response?.data?.error || "Login failed");
        setIsError(true);
        setModalIsOpen(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleLogout = () => {
    localStorage.removeItem("sessionId");
    navigate("/");
  };

  const handleCloseModal = () => {
    setModalIsOpen(false);
  };

  return (
    <div className={`login-container-main ${theme}`}>
      <div className={`login-container ${theme}`}>
        <img src={logo} alt="Logo" />
        <h2>Teacher : Login</h2>
        <form onSubmit={handleLogin}>
          <div>
            <label>Email:</label>
            <div>
              <input
                type="email"
                value={email}
                placeholder="Enter your Email"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label>Password:</label>
            <div className="eye-container">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter Your Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="password-eye"
              />
              {showPassword ? (
                <FaEye
                  className="eyes"
                  onClick={() => setShowPassword(false)}
                />
              ) : (
                <FaEyeSlash
                  className="eyes"
                  onClick={() => setShowPassword(true)}
                />
              )}
            </div>
          </div>
          <p
            className="login_forgot_password"
            onClick={() => navigate("/forgot_password")}
          >
            Forgot Password?
          </p>
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
          <p
            className="signup_text_redirect"
            onClick={() => navigate("/sign_up")}
          >
            {" "}
            Want to create Account? Signup.{" "}
          </p>
        </form>
        <AlertModal
          isOpen={modalIsOpen}
          onClose={handleCloseModal}
          message={modalMessage}
          iserror={isError}
        />
      </div>
    </div>
  );
}

export default Login;