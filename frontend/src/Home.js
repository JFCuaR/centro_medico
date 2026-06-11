import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import miImagen from './logo.jpg';
import './Home.css';
import AuthContext from './AuthContext';  // Importar AuthContext para manejar el logout
import Sidebar from './sidebar'; // ← Importar
import Navbar from './Navbar'; 


function Home() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showUpdateMessage, setShowUpdateMessage] = useState(false); // NUEVO
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Mostrar mensaje de sistema actualizado solo la primera vez
  useEffect(() => {
    const hasSeenUpdate = localStorage.getItem('hasSeenSystemUpdate');
    if (!hasSeenUpdate) {
      setShowUpdateMessage(true);
      localStorage.setItem('hasSeenSystemUpdate', 'true');
    }
  }, []);

  return (
    <div>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Sidebar Template</title>
      <link
        href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css"
        rel="stylesheet"
      />
      <div className={`d-flex ${isSidebarOpen ? 'toggled' : ''}`} id="wrapper">
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} />
        {isSidebarOpen && (
  <div className="overlay" onClick={() => setSidebarOpen(false)}></div>
)}

        {/* /#sidebar-wrapper */}
        
        {/* Page Content */}
        <div id="page-content-wrapper">
          <Navbar toggleSidebar={toggleSidebar} />


          <div className="container-fluid">
            {/* Aquí mostramos el mensaje si aplica */}
            {showUpdateMessage && (
              <div className="alert alert-success mt-4 text-center" role="alert">
                🚀 ¡Sistema actualizado! Disfruta de las nuevas funciones del sistema en la busqueda y actualizacion de pacientes.
              </div>
            )}
            {/* Imagen */}
            <div className="image-container mt-4">
              <img src={miImagen} alt="logo" />
            </div>
          </div>
        </div>
        {/* /#page-content-wrapper */}
      </div>
    </div>
  );
}

export default Home;


