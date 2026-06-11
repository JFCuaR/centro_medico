import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import miImagen from './logo.jpg';
import './Home.css';
import AuthContext from './AuthContext';
import Sidebar from './sidebar';
import Navbar from './Navbar';

function Home() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Inicio</title>

      <link
        href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css"
        rel="stylesheet"
      />

      <div className={`d-flex ${isSidebarOpen ? 'toggled' : ''}`} id="wrapper">
        <Sidebar isOpen={isSidebarOpen} />

        {isSidebarOpen && (
          <div className="overlay" onClick={() => setSidebarOpen(false)}></div>
        )}

        <div id="page-content-wrapper">
          <Navbar toggleSidebar={toggleSidebar} />

          <div className="container-fluid">
            <div className="image-container mt-4">
              <img src={miImagen} alt="logo" />
            </div>

            {/* MENSAJE DE NUEVA ACTUALIZACIÓN */}
            <div className="alert alert-success mt-4 text-center" role="alert">
              🚀 <strong>Nueva actualización:</strong> el sistema cuenta con mejoras en la búsqueda y actualización de pacientes.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
