import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './sidebar';
import Navbar from './Navbar';

const URL = process.env.REACT_APP_URL_BACKEND || 'http://localhost:3001';

function Proveedores() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [proveedores, setProveedores] = useState([]);
  const [nuevoProveedor, setNuevoProveedor] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    correo: ''
  });
  const [message, setMessage] = useState(null);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const fetchProveedores = async () => {
    try {
      const res = await axios.get(`${URL}/proveedores`);
      setProveedores(res.data);
    } catch (error) {
      console.error('Error al obtener proveedores:', error);
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNuevoProveedor({ ...nuevoProveedor, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${URL}/proveedores`, nuevoProveedor);
      setMessage({ type: 'success', text: 'Proveedor creado correctamente' });
      setNuevoProveedor({
        nombre: '',
        telefono: '',
        direccion: '',
        correo: ''
      });
      fetchProveedores();
    } catch (error) {
      console.error(error);
      setMessage({ type: 'danger', text: 'Error al crear proveedor' });
    }
  };

  return (
    <div>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Proveedores</title>
      <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet" />

      <div className={`d-flex ${isSidebarOpen ? 'toggled' : ''}`} id="wrapper">
        <Sidebar isOpen={isSidebarOpen} />
        {isSidebarOpen && (
          <div className="overlay" onClick={() => setSidebarOpen(false)}></div>
        )}

        <div id="page-content-wrapper">
          <Navbar toggleSidebar={toggleSidebar} />

          <div className="container mt-4">
            <div className="card shadow-lg">
              <div className="card-header bg-primary text-white">
                <h4 className="mb-0">➕ Registrar Proveedor</h4>
              </div>
              <div className="card-body">
                {message && (
                  <div
                    className={`alert alert-${message.type}`}
                    role="alert"
                  >
                    {message.text}
                  </div>
                )}
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Nombre</label>
                      <input
                        type="text"
                        className="form-control"
                        name="nombre"
                        value={nuevoProveedor.nombre}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Teléfono</label>
                      <input
                        type="text"
                        className="form-control"
                        name="telefono"
                        value={nuevoProveedor.telefono}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Correo</label>
                      <input
                        type="email"
                        className="form-control"
                        name="correo"
                        value={nuevoProveedor.correo}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Dirección</label>
                      <input
                        type="text"
                        className="form-control"
                        name="direccion"
                        value={nuevoProveedor.direccion}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-success">
                    Guardar Proveedor
                  </button>
                </form>
              </div>
            </div>

            <div className="card mt-4 shadow">
              <div className="card-header bg-secondary text-white">
                <h5 className="mb-0">📋 Lista de Proveedores</h5>
              </div>
              <div className="card-body p-0">
                <table className="table table-striped table-hover mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Teléfono</th>
                      <th>Correo</th>
                      <th>Dirección</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proveedores.map((prov) => (
                      <tr key={prov.id_proveedor}>
                        <td>{prov.id_proveedor}</td>
                        <td>{prov.nombre}</td>
                        <td>{prov.telefono}</td>
                        <td>{prov.correo}</td>
                        <td>{prov.direccion}</td>
                      </tr>
                    ))}
                    {proveedores.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-3">
                          No hay proveedores registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Proveedores;
