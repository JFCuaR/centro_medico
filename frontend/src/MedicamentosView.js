import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './sidebar';
import Navbar from './Navbar';
import './Home.css';

const URL = process.env.REACT_APP_URL_BACKEND || 'http://localhost:3001';

function MedicamentosView() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [medicamentos, setMedicamentos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const fetchMedicamentos = async () => {
    try {
      const response = await axios.get(`${URL}/medicamentos/lista`);
      setMedicamentos(response.data);
    } catch (error) {
      console.error('Error al obtener medicamentos:', error);
    }
  };

  useEffect(() => {
    fetchMedicamentos();
  }, []);

  const clean = (text) => (text || '').toString().trim().toLowerCase();

  const filteredMedicamentos = medicamentos.filter((med) => 
    clean(med.nombre_medicamento).includes(clean(searchTerm)) ||
    clean(med.codigo_barra).includes(clean(searchTerm)) ||
    clean(med.proveedor_nombre).includes(clean(searchTerm))
  );

  return (
    <div>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Lista de Medicamentos</title>
      <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet" />
      <div className={`d-flex ${isSidebarOpen ? 'toggled' : ''}`} id="wrapper">
        <Sidebar isOpen={isSidebarOpen} />
        {isSidebarOpen && (
          <div className="overlay" onClick={() => setSidebarOpen(false)}></div>
        )}
        <div id="page-content-wrapper">
          <Navbar toggleSidebar={toggleSidebar} />
          <div className="container-fluid mt-4">
            <h2>Lista de Medicamentos</h2>
            <input
              type="text"
              placeholder="Buscar por código, nombre o proveedor..."
              className="form-control my-3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Código de Barras</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Stock</th>
                    <th>Precio Venta</th>
                    <th>Fecha de Vencimiento</th>
                    <th>Proveedor</th>
                    <th>Teléfono Proveedor</th>
                    <th>Correo Proveedor</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMedicamentos.map((med) => (
                    <tr key={med.id_lote}>
                      <td>{med.codigo_barra}</td>
                      <td>{med.nombre_medicamento}</td>
                      <td>{med.descripcion}</td>
                      <td>{med.stock}</td>
                      <td>Q{parseFloat(med.precio_venta).toFixed(2)}</td>
                      <td>{new Date(med.fecha_vencimiento).toLocaleDateString()}</td>
                      <td>{med.proveedor_nombre}</td>
                      <td>{med.proveedor_telefono}</td>
                      <td>{med.proveedor_correo}</td>
                    </tr>
                  ))}
                  {filteredMedicamentos.length === 0 && (
                    <tr>
                      <td colSpan="9" className="text-center">No se encontraron medicamentos</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MedicamentosView;
