import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';
import AuthContext from './AuthContext';
import './Sidebar.css';

const URL = process.env.REACT_APP_URL_BACKEND || 'http://localhost:3001';

const Sidebar = ({ isOpen }) => {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [cerrando, setCerrando] = useState(false);

  const handleCerrarSesion = async () => {
    const result = await Swal.fire({
      title: '¿Deseas cerrar sesión?',
      text:
        user?.rol === 'farmaceutico' || user?.rol === 'empleado'
          ? 'Esto también cerrará la caja actual.'
          : 'Tu sesión será cerrada.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    try {
      setCerrando(true);

      if (['farmaceutico', 'empleado'].includes(user?.rol)) {
        await axios.post(`${URL}/caja/cerrar`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire('✅ Caja cerrada', 'Se cerró el turno correctamente.', 'success');
      }

      logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      Swal.fire('Error', 'No se pudo cerrar sesión correctamente.', 'error');
    } finally {
      setCerrando(false);
    }
  };

  // 🧭 Renderizado por rol
  const renderMenuPorRol = () => {
    const rol = user?.rol;

    // 🔹 Definición de secciones
    const secciones = {
      farmacia: [
        { path: '/Home', label: '🏠 Inicio' },
        { path: '/ventas', label: '🛒 Ventas' },
        { path: '/cierres', label: '💰 Cierres de Caja' },
        { path: '/Reportes', label: '📊 Reportes' },
        { path: '/Turnos', label: '🎟️ Turnos' },
      ],
      clinica: [
        { path: '/Historial', label: '📄 Historial Médico' },
        { path: '/Buscar_paciente', label: '🔍 Buscar Paciente' },
        { path: '/Agenda', label: '📅 Agenda' },
        { path: '/Encamamiento', label: '🏥 Encamamiento' },
        { path: '/HistorialEncamaciento', label: '📺 Buscar paciente en encamamiento' },
      ],
      admin: [
        { path: '/AgregarUsuario', label: '👥 Usuarios' },
        { path: '/Proveedores', label: '🚚 Proveedores' },
        { path: '/Agregar_productos', label: '➕ Agregar Medicamentos' },
        { path: '/Medicamentos', label: '💊 Inventario' },
        { path: '/Devoluciones', label: '↩️ Devoluciones' },
      ],
    
      enfermero: [
        { path: '/enfermero', label: '👥 enfermero' },
        
      ],
    
    };

    // 🔸 Si es TV
    if (rol === 'TV') {
      return (
        <Link to="/VerTurnosPublico" className="list-group-item list-group-item-action bg-dark text-white">
          📺 Ver Turnos Público
        </Link>
      );
    }

    // 🔸 Admin ve todo
  // 🔸 Admin ve todo excepto la opción de Ventas
if (rol === 'admin') {
  // Clonamos las secciones pero quitamos solo "ventas"
  const seccionesAdmin = {
    ...secciones,
    farmacia: secciones.farmacia.filter(link => link.path !== '/ventas'),
  };

  return (
    <>
      {Object.entries(seccionesAdmin).map(([key, links]) => (
        <div key={key} className="menu-section">
          <div className="menu-title">{key.toUpperCase()}</div>
          <div className="menu-content">
            {links.map((link) => (
              <Link key={link.path} to={link.path} className="submenu-item">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}


    // 🔸 Farmacéutico
    if (rol === 'farmaceutico' || rol === 'empleado') {
      return (
        <div className="menu-section">
          <div className="menu-title">💊 FARMACIA</div>
          <div className="menu-content">
            {secciones.farmacia.map((link) => (
              <Link key={link.path} to={link.path} className="submenu-item">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      );
    }

    // 🔸 Doctor
    if (rol === 'doctor') {
      return (
        <div className="menu-section">
          <div className="menu-title">🩺 CLÍNICA</div>
          <div className="menu-content">
            {secciones.clinica.map((link) => (
              <Link key={link.path} to={link.path} className="submenu-item">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      );
    }

    return <p className="text-white text-center mt-3">Rol no reconocido</p>;
  };

  return (
    <div
      id="sidebar-wrapper"
      className={`d-flex flex-column bg-dark ${isOpen ? 'open' : ''}`}
      style={{ minHeight: '100vh' }}
    >
      {/* ENCABEZADO */}
      <div className="sidebar-header text-white text-center py-4 border-bottom border-secondary">
        <h5 className="mb-1">CENTRO MÉDICO</h5>
        <h6 className="text-warning">JERUSALEM</h6>
      </div>

      {/* USUARIO */}
      {user && (
        <div className="text-white text-center p-3 border-bottom border-secondary">
          <p className="mb-1"><strong>{user.nombre}</strong></p>
          <small className="text-muted">Rol: {user.rol?.toUpperCase()}</small>
        </div>
      )}

      {/* MENÚ PRINCIPAL */}
      <div className="list-group list-group-flush flex-grow-1">
        {renderMenuPorRol()}
      </div>

      {/* PIE DE SESIÓN */}
      <div className="sidebar-footer text-white text-center p-3 mt-auto border-top border-secondary">
        
        <small className="d-block">Sistema clínico</small>
        <small className="d-block">JFCuaR</small>
        <small className="d-block">Contacto: (+502) 4746-1123</small>
      </div>
    </div>
  );
};

export default Sidebar;
