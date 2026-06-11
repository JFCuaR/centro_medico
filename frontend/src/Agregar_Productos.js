import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from './AuthContext';
import Sidebar from './sidebar'; // ← Importar 
import './AgregarProduc.css';
import Navbar from './Navbar';

const URL = process.env.REACT_APP_URL_BACKEND || 'http://localhost:3001'

function Home() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [codigo_barra, setCodigoBarra] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio_compra, setPrecioCompra] = useState('');
  const [precio_venta, setPrecioVenta] = useState('');
  const [stock, setStock] = useState('');
  const [modulo, setModulo] = useState('');
  const [tipo_venta, setTipoVenta] = useState('');
  const [fecha_vencimiento, setFechaVencimiento] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [relatedMedicamentos, setRelatedMedicamentos] = useState([]);
  const { logout } = useContext(AuthContext);  // Extraer la función logout del contexto
  const navigate = useNavigate();
  const [proveedores, setProveedores] = useState([]);
  const [proveedorId, setProveedorId] = useState('');
  const [loteFechaVencimiento, setLoteFechaVencimiento] = useState('');
  const [lotePrecioCompra, setLotePrecioCompra] = useState('');
  const [lotePrecioVenta, setLotePrecioVenta] = useState('');
  const [loteStock, setLoteStock] = useState('');


  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        const response = await axios.get(`${URL}/proveedores`);
        setProveedores(response.data);
      } catch (error) {
        console.error('Error al obtener proveedores:', error);
      }
    };

    fetchProveedores();
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    logout();  // Llamar la función logout
    navigate('/login');  // Redirigir al login después de cerrar sesión
  };

  // Buscar sugerencias cuando el nombre tiene más de 2 caracteres
  useEffect(() => {
    if (nombre.length > 2) {
      const fetchSuggestions = async () => {
        try {
          const response = await axios.get(`${URL}/buscar_medicamentos`, {
            params: { nombre }
          });
          setSuggestions(response.data);
        } catch (error) {
          console.error('Error al buscar medicamentos:', error);
        }
      };
      fetchSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [nombre]);

  // Buscar medicamentos relacionados cuando se selecciona o ingresa un nombre
  const fetchRelatedMedicamentos = async (nombre) => {
    try {
      const response = await axios.get(`${URL}/medicamentos/relacionados/${nombre}`);
      setRelatedMedicamentos(response.data);
    } catch (error) {
      console.error('Error al buscar medicamentos relacionados:', error);
    }
  };

  const handleSelectRelatedMedicamento = (medicamento) => {
    // Completar los campos con los datos del medicamento seleccionado
    setNombre(medicamento.nombre);
    setDescripcion(medicamento.descripcion);
    setModulo(medicamento.modulo);
    setTipoVenta(medicamento.tipo_venta);
    setRelatedMedicamentos([]); // Limpiar los medicamentos relacionados después de la selección
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Primero crea medicamento
      const resMed = await axios.post(`${URL}/medicamentos`, {
        codigo_barra,
        nombre,
        descripcion,
        modulo,
        tipo_venta,
      });

      const id_medicamento = resMed.data.id_medicamento;

      // Luego crea el lote
      await axios.post(`${URL}/lotes`, {
        id_medicamento,
        id_proveedor: proveedorId,
        fecha_vencimiento: loteFechaVencimiento,
        precio_compra: lotePrecioCompra,
        precio_venta: lotePrecioVenta,
        stock: loteStock,
      });

      alert('Medicamento y lote registrados correctamente');
    } catch (error) {
      console.error(error);
      alert('Error al registrar medicamento o lote');
    }
  };


  return (
    <div>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Agregar Medicamento</title>
      <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet" />
      <script
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
        defer
      ></script>

      <div className={`d-flex ${isSidebarOpen ? 'toggled' : ''}`} id="wrapper">
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} />
        {/* /#sidebar-wrapper */}

        {isSidebarOpen && (
          <div className="overlay" onClick={() => setSidebarOpen(false)}></div>
        )}

        {/* Page Content */}
        <div id="page-content-wrapper">
          <Navbar toggleSidebar={toggleSidebar} />

          <div className="container mt-4">
            <div className="card shadow-lg">
              <div className="card-header bg-primary text-white">
                <h4 className="mb-0">➕ Agregar Medicamento</h4>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Código de Barra</label>
                      <input
                        type="text"
                        className="form-control"
                        value={codigo_barra}
                        onChange={(e) => setCodigoBarra(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Proveedor</label>
                      <select
                        className="form-select"
                        value={proveedorId}
                        onChange={(e) => setProveedorId(e.target.value)}
                        required
                      >
                        <option value="">Seleccione un proveedor</option>
                        {proveedores.map((prov) => (
                          <option key={prov.id_proveedor} value={prov.id_proveedor}>
                            {prov.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-8 mb-3">
                      <label className="form-label">Nombre</label>
                      <input
                        type="text"
                        className="form-control"
                        value={nombre}
                        onChange={(e) => {
                          setNombre(e.target.value);
                          if (e.target.value.length > 2) {
                            fetchRelatedMedicamentos(e.target.value);
                          }
                        }}
                        required
                      />
                      {relatedMedicamentos.length > 0 && (
                        <div className="mt-2 border rounded p-2 bg-light">
                          <strong>Medicamentos relacionados:</strong>
                          <ul className="list-group list-group-flush mt-2">
                            {relatedMedicamentos.map((medicamento, index) => (
                              <li
                                key={index}
                                className="list-group-item list-group-item-action"
                                onClick={() =>
                                  handleSelectRelatedMedicamento(medicamento)
                                }
                                style={{ cursor: 'pointer' }}
                              >
                                {medicamento.nombre}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="col-md-12 mb-3">
                      <label className="form-label">Descripción</label>
                      <input
                        type="text"
                        className="form-control"
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-md-4 mb-3">
                      <label className="form-label">Precio de Compra</label>
                      <input
                        type="number"
                        className="form-control"
                        value={lotePrecioCompra}
                        onChange={(e) => setLotePrecioCompra(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-md-4 mb-3">
                      <label className="form-label">Precio de Venta</label>
                      <input
                        type="number"
                        className="form-control"
                        value={lotePrecioVenta}
                        onChange={(e) => setLotePrecioVenta(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-md-4 mb-3">
                      <label className="form-label">Stock</label>
                      <input
                        type="number"
                        className="form-control"
                        value={loteStock}
                        onChange={(e) => setLoteStock(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Módulo</label>
                      <input
                        type="text"
                        className="form-control"
                        value={modulo}
                        onChange={(e) => setModulo(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Tipo de Venta</label>
                      <input
                        type="text"
                        className="form-control"
                        value={tipo_venta}
                        onChange={(e) => setTipoVenta(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-md-4 mb-3">
                      <label className="form-label">Fecha de Vencimiento</label>
                      <input
                        type="date"
                        className="form-control"
                        value={loteFechaVencimiento}
                        onChange={(e) => setLoteFechaVencimiento(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-success">
                    Guardar Medicamento
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
}

export default Home;
