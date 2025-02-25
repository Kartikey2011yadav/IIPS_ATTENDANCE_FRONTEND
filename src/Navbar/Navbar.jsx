import React, { useEffect, useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { FaPowerOff } from "react-icons/fa";
import "./Navbar.css";
import defaultPhoto from "../Assets/profile_photo.png";
import axios from "axios";

const Navbar = ({ theme, toggleTheme }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [photo, setPhoto] = useState("");
  useEffect(() => {
    axios
      .post(`${process.env.REACT_APP_BACKEND_URL}/teacher/getteacherDetails`, {
        teacherId: localStorage.getItem("teacherId"),
      })
      .then((res) => {
        setPhoto(
          localStorage.getItem("photo") || res.data.teacher.photo || defaultPhoto
        );
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  const responsive = () => {
    const sidebar = document.getElementsByClassName("navbar-sidebar")[0];
    if (!open) {
      sidebar.style.transform = "translateX(0%)";
      setOpen(true);
    } else {
      sidebar.style.transform = "translateX(100%)";
      setOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("sessionId");
    navigate("/");
  };

  return (
    <>
      <div className={`navbar ${theme}`}>
        <div className="navbar-contents navbar-left-margin">
          <img
            className="pfp"
            src={photo}
            width="35"
            height="35"
            alt="profile"
          />
          <div>{localStorage.getItem("name")}</div>
        </div>
        <div className="navbar-contents navbar-displayed">
          <p
            className={`navbar-links ${
              location.pathname === `/Dashboard` ? "active" : ""
            }`}
            onClick={() => navigate(`/Dashboard`)}
          >
            Dashboard
          </p>
          <p
            className={`navbar-links ${
              location.pathname === `/attendance_record` ? "active" : ""
            }`}
            onClick={() => navigate(`/attendance_record`)}
          >
            Attendance Record
          </p>
        </div>
        <div className="navbar-right-margin navbar-displayed">
          <label className="switch">
            <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
            <span className="slider round"></span>
          </label>
          <p className="navbar-logout" onClick={handleLogout}>
            <span className="logbut">
              <FaPowerOff size={15} /> Logout
            </span>
          </p>
        </div>
        <div className="navbar-menu navbar-right-margin">
          <div
            className={`icon-container ${open ? "open" : ""}`}
            onClick={responsive}
          >
            {!open ? <FaBars size={24} /> : <FaTimes size={24} />}
          </div>
        </div>
      </div>
      <div className={`navbar-sidebar ${theme}`}>
        <ul type="none" className="navbar-sidebar-ul">
          <li>
            <p
              className={`navbar-links ${
                location.pathname === `/Dashboard` ? "active" : ""
              }`}
              onClick={() => {
                navigate(`/Dashboard`);
                responsive(); // close sidebar after click
              }}
            >
              Dashboard
            </p>
          </li>
          <li>
            <p
              className={`navbar-links ${
                location.pathname === `/attendance_record` ? "active" : ""
              }`}
              onClick={() => {
                navigate(`/attendance_record`);
                responsive(); // close sidebar after click
              }}
            >
              Attendance Record
            </p>
          </li>
          <hr />
          <li>
            <p className="toggle-head">Toggle Theme
            <label className="switch">
              <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
              <span className="slider round"></span>
            </label>
            </p>
            <p
              className="navbar-logout navbar-logout-menu"
              onClick={() => {
                handleLogout();
                responsive(); // close sidebar after logout
              }}
            >
              <span className="logbut">
                <FaPowerOff size={15} /> Logout
              </span>
            </p>
          </li>
        </ul>
      </div>
    </>
  );
};

export default Navbar;
