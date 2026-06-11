import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AuthContext from './AuthContext';
import Sidebar from './sidebar';
import Navbar from './Navbar';

const URL = process.env.REACT_APP_URL_BACKEND || 'http://localhost:3001';

function AgregarUsuario() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState(null);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [formData, setFormData] = useState({
    nombre: '',
    usuario: '',
    contrasena: '',
    rol: 'empleado',
    estado: 'activa'
  });

  const [usuarios, setUsuarios] = useState([]);
  const [editUser, setEditUser] = useState(null);

  const fetchUsuarios = async () => {
    try {
      const res = await axios.get(`${URL}/usuarios`);
      setUsuarios(res.data);
    } catch (error) {
      console.error(error);
      setMessage({
        type: 'danger',
        text: '❌ Error al obtener usuarios.'
      });
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
  
    try {
      const res = await axios.post(`${URL}/agregar_usuario`, formData);
  
      console.log(res.data.message);
  
      setFormData({
        nombre: '',
        usuario: '',
        contrasena: '',
        rol: 'empleado',
        estado: 'activa'
      });
  
      setMessage({
        type: 'success',
        text: res.data.message || '✅ Usuario agregado exitosamente.'
      });
  
      fetchUsuarios();
    } catch (error) {
      console.error('Error al agregar el usuario', error);
      setMessage({
        type: 'danger',
        text: '❌ Hubo un error al agregar el usuario.'
      });
    }
  };
  

  const handleEditClick = (user) => {
    setEditUser({ ...user });
    const modal = new window.bootstrap.Modal(
      document.getElementById('editUserModal')
    );
    modal.show();
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditUser({
      ...editUser,
      [name]: value
    });
  };

  const handleUpdateUser = async () => {
    if (isUpdating) return;
  
    setIsUpdating(true);
    setMessage(null);
  
    try {
      const res = await axios.put(`${URL}/usuarios/${editUser.id_usuario}`, editUser);
  
      console.log(res.data.message);
  
      // ✅ CIERRA EL MODAL DE MANERA SEGURA
      document.querySelector('#editUserModal .btn-close')?.click();
  
      setEditUser(null);
      setMessage({
        type: 'success',
        text: '✅ Usuario actualizado correctamente.'
      });
  
      await fetchUsuarios();
    } catch (error) {
      console.error(error);
      setMessage({
        type: 'danger',
        text: '❌ Ocurrió un error al actualizar el usuario. Intenta de nuevo.'
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  
  
  
  

  return (
    <div>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Agregar Usuario</title>
      <link
        href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css"
        rel="stylesheet"
      />
      <script
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
        defer
      ></script>

      <div className={`d-flex ${isSidebarOpen ? 'toggled' : ''}`} id="wrapper">
        <Sidebar isOpen={isSidebarOpen} />
        {isSidebarOpen && (
          <div className="overlay" onClick={() => setSidebarOpen(false)}></div>
        )}

        <div id="page-content-wrapper">
          <Navbar toggleSidebar={toggleSidebar} />

          {message && (
            <div
              className={`alert alert-${message.type} mt-3 mx-3`}
              role="alert"
            >
              {message.text}
            </div>
          )}

          <div className="container mt-5">
            {/* FORMULARIO */}
            <div className="card shadow-lg mb-5">
              <div className="card-header bg-primary text-white">
                <h4 className="mb-0">➕ Agregar Nuevo Usuario</h4>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Nombre</label>
                      <input
                        type="text"
                        className="form-control"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Usuario</label>
                      <input
                        type="text"
                        className="form-control"
                        name="usuario"
                        value={formData.usuario}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Contraseña</label>
                      <input
                        type="password"
                        className="form-control"
                        name="contrasena"
                        value={formData.contrasena}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">Rol</label>
                      <select
                        className="form-select"
                        name="rol"
                        value={formData.rol}
                        onChange={handleChange}
                        required
                      >
                        <option value="admin">Admin</option>
                              <option value="farmaceutico">Farmaceutico</option>
                              <option value="doctor">Doctor</option>
                              <option value="enfermero">Emfermero</option>
                              <option value="TV">TV</option>
                      </select>
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">Estado</label>
                      <select
                        className="form-select"
                        name="estado"
                        value={formData.estado}
                        onChange={handleChange}
                        required
                      >
                        <option value="activa">Activa</option>
                        <option value="desactivada">Desactivada</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-success">
                    Guardar Usuario
                  </button>
                </form>
              </div>
            </div>

            {/* LISTADO DE USUARIOS */}
            <div className="card shadow">
              <div className="card-header bg-secondary text-white">
                <h5 className="mb-0">👥 Usuarios Registrados</h5>
              </div>
              <div className="card-body p-0">
                <table className="table table-striped table-hover mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Usuario</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((user) => (
                      <tr key={user.id_usuario}>
                        <td>{user.id_usuario}</td>
                        <td>{user.nombre}</td>
                        <td>{user.usuario}</td>
                        <td>{user.rol}</td>
                        <td>{user.estado}</td>
                        <td>
                          <button
                            className="btn btn-warning btn-sm"
                            onClick={() => handleEditClick(user)}
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                    {usuarios.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-3">
                          No hay usuarios registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MODAL EDITAR USUARIO */}
            <div
              className="modal fade"
              id="editUserModal"
              tabIndex="-1"
              aria-hidden="true"
            >
              <div className="modal-dialog modal-lg">
                <div className="modal-content">
                  <div className="modal-header bg-info text-white">
                    <h5 className="modal-title">Editar Usuario</h5>
                    <button
                      type="button"
                      className="btn-close"
                      data-bs-dismiss="modal"
                      aria-label="Close"
                    ></button>
                  </div>
                  <div className="modal-body">
                    {editUser && (
                      <form>
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label className="form-label">Nombre</label>
                            <input
                              type="text"
                              className="form-control"
                              name="nombre"
                              value={editUser.nombre}
                              onChange={handleEditChange}
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">Usuario</label>
                            <input
                              type="text"
                              className="form-control"
                              name="usuario"
                              value={editUser.usuario}
                              onChange={handleEditChange}
                            />
                          </div>
                          <div className="col-md-4 mb-3">
                            <label className="form-label">Rol</label>
                            <select
                              className="form-select"
                              name="rol"
                              value={editUser.rol}
                              onChange={handleEditChange}
                            >
                              <option value="admin">Admin</option>
                              <option value="farmaceutico">Farmaceutico</option>
                              <option value="doctor">Doctor</option>
                              <option value="enfermero">Emfermero</option>
                              <option value="TV">TV</option>
                            </select>
                          </div>
                          <div className="col-md-4 mb-3">
                            <label className="form-label">Estado</label>
                            <select
                              className="form-select"
                              name="estado"
                              value={editUser.estado}
                              onChange={handleEditChange}
                            >
                              <option value="activa">Activa</option>
                              <option value="desactivada">Desactivada</option>
                            </select>
                          </div>
                        </div>
                      </form>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button
                      className="btn btn-success"
                      onClick={handleUpdateUser}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      data-bs-dismiss="modal"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default AgregarUsuario;
