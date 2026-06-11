import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import AuthContext from './AuthContext';
import Sidebar from './sidebar'; // ← Importar 
import './Home.css';
import Navbar from './Navbar'; 

const URL = process.env.REACT_APP_URL_BACKEND || 'http://localhost:3001';

function Home() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [ventas, setVentas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeSearchTerm, setBarcodeSearchTerm] = useState('');
  const [mensaje, setMensaje] = useState('');
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  // Función para buscar ventas
  const fetchVentas = async () => {
    try {
      const response = await axios.get(`${URL}/buscar_ventas`, {
        params: {
          searchTerm,
          barcodeSearchTerm,
        },
      });

      setVentas(response.data.ventas);
      setMensaje('');
    } catch (error) {
      setMensaje('Error al buscar ventas');
      console.error('Error al buscar ventas:', error);
    }
  };

  useEffect(() => {
    fetchVentas(); // Cargar las ventas cuando se monta el componente
  }, []);

  // Función para devolver un producto
  const handleDevolverProducto = async (id_venta, id_medicamento, cantidad_devuelta) => {
    try {
      console.log('Datos para devolución:', { id_venta, id_medicamento, cantidad_devuelta }); // Verificar los datos antes de enviarlos
  
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: 'Confirma si deseas devolver este producto',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, devolver',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
      });
  
      if (result.isConfirmed) {
        // Llamada al endpoint para devolver el producto
        await axios.post(`${URL}/devolver_producto`, {
          id_venta,
          id_medicamento,
          cantidad_devuelta,
        });
  
        Swal.fire('Devolución realizada', 'El producto ha sido devuelto y el stock actualizado', 'success');
  
        // Recargar las ventas después de la devolución
        fetchVentas();
      }
    } catch (error) {
      console.error('Error al devolver el producto:', error);
      Swal.fire('Error', 'Hubo un error al realizar la devolución', 'error');
    }
  };

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
        {/* /#sidebar-wrapper */}
        {isSidebarOpen && (
  <div className="overlay" onClick={() => setSidebarOpen(false)}></div>
)}
        {/* Page Content */}
        <div id="page-content-wrapper">
        <Navbar toggleSidebar={toggleSidebar} />


          <div className="container-fluid">
            <h2>Buscar Ventas Realizadas</h2>

            {/* Barra de búsqueda */}
            <div className="row mb-3">
              <div className="col-md-4">
                <input
                  type="text"
                  placeholder="Buscar por código de barras..."
                  className="form-control"
                  value={barcodeSearchTerm}
                  onChange={(e) => setBarcodeSearchTerm(e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <input
                  type="text"
                  placeholder="Buscar por nombre de producto..."
                  className="form-control"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <button onClick={fetchVentas} className="btn btn-primary">
                  Buscar
                </button>
              </div>
            </div>

            {/* Mensaje de error */}
            {mensaje && <p className="text-danger">{mensaje}</p>}

            {/* Tabla de ventas */}
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>ID Venta</th>
                    <th>Nombre Producto</th>
                    <th>Código de Barras</th>
                    <th>Cantidad Vendida</th>
                    <th>Precio Unitario</th>
                    <th>Fecha Venta</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {ventas.length > 0 ? (
                    ventas.map((venta) => (
                        <tr key={venta.id_venta}>
    <td>{venta.id_venta}</td>
    <td>{venta.nombre}</td>
    <td>{venta.codigo_barra}</td>
    <td>{venta.cantidad}</td>
    <td>{`Q${parseFloat(venta.precio_unitario).toFixed(2)}`}</td>
    <td>{new Date(venta.fecha).toLocaleDateString()}</td>
    <td>
      <button
        className="btn btn-warning"
        onClick={() => handleDevolverProducto(venta.id_venta, venta.id_medicamento, venta.cantidad)}
        disabled={venta.devuelto === true} // El botón se desactiva si devuelto es true
      >
        {venta.devuelto ? 'Devuelto' : 'Devolver'}
      </button>
    </td>
  </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center">
                        No se encontraron ventas para este producto
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* /#page-content-wrapper */}
      </div>
    </div>
  );
}

export default Home;
