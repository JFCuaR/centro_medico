import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import AuthContext from './AuthContext';
import 'jspdf-autotable';
import './Home.css';
import Sidebar from './sidebar'; // ← Importar 
import Navbar from './Navbar';

const URL = process.env.REACT_APP_URL_BACKEND || 'http://localhost:3001'

function Ventas() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [medicamentos, setMedicamentos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [descriptionSearchTerm, setDescriptionSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);
  const [change, setChange] = useState(null);
  const [isPaymentEntered, setIsPaymentEntered] = useState(false);
  const [lowStockMedicamentos, setLowStockMedicamentos] = useState([]);
  const [nearExpiryMedicamentos, setNearExpiryMedicamentos] = useState([]);
  const [barcodeSearchTerm, setBarcodeSearchTerm] = useState('');
  const [quantities, setQuantities] = useState({}); // Estado para manejar las cantidades
  const { logout } = useContext(AuthContext);
  const [estadoCaja, setEstadoCaja] = useState(null);
  const [estadoCajaInfo, setEstadoCajaInfo] = useState(null);
  const [totalCaja, setTotalCaja] = useState(0);
  const [fechaApertura, setFechaApertura] = useState(null);

  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const fetchMedicamentos = async () => {
    try {
      const response = await axios.get(`${URL}/lote/todo`);
      const lotes = response.data;
      console.log("Lotes recibidos del backend:", lotes);

      // Filtrar lotes con stock > 0
      const lotesConStock = lotes.filter(lote => lote.stock > 0);

      // Identificar lote con fecha más cercana por cada código de barras
      const loteMasCercanoPorCodigo = lotesConStock.reduce((acc, lote) => {
        const key = lote.codigo_barra;
        if (!acc[key] || new Date(lote.fecha_vencimiento) < new Date(acc[key].fecha_vencimiento)) {
          acc[key] = lote;
        }
        return acc;
      }, {});

      // Marcar como bloqueados los lotes que no sean el más cercano
      const lotesActualizados = lotesConStock.map(lote => ({
        ...lote,
        bloqueado: loteMasCercanoPorCodigo[lote.codigo_barra].id_lote !== lote.id_lote
      }));

      // Detectar medicamentos con stock bajo (<=5)
      const lowStock = lotesActualizados.filter(lote => lote.stock <= 5);
      setLowStockMedicamentos(lowStock);

      // Detectar medicamentos cerca de vencer (dentro de 3 meses)
      const nearExpiry = lotesActualizados.filter(lote => {
        const expiryDate = new Date(lote.fecha_vencimiento);
        const today = new Date();
        const threeMonthsLater = new Date();
        threeMonthsLater.setMonth(today.getMonth() + 3);
        return expiryDate >= today && expiryDate <= threeMonthsLater;
      });
      setNearExpiryMedicamentos(nearExpiry);

      setMedicamentos(lotesActualizados);

    } catch (error) {
      console.error('Error al obtener los productos:', error);
    }
  };



  useEffect(() => {
    fetchMedicamentos();
  }, []);

  const clean = (text) => (text || '').trim().toLowerCase();

  const filteredMedicamentos = medicamentos
    .filter((lote) =>
      (!searchTerm || clean(lote.nombre).includes(clean(searchTerm))) &&
      (!descriptionSearchTerm || clean(lote.descripcion).includes(clean(descriptionSearchTerm))) &&
      (!barcodeSearchTerm || (lote.codigo_barra || '').includes(barcodeSearchTerm.trim()))
    )
    .sort((a, b) => new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento));





  // Función para manejar el cambio de cantidad
  const handleQuantityChange = (id_lote, value) => {
    setQuantities((prevQuantities) => ({
      ...prevQuantities,
      [id_lote]: value
    }));
  };


  // Función para manejar el enfoque (focus) en el input
  const handleFocus = (id_lote) => {
    setQuantities((prevQuantities) => ({
      ...prevQuantities,
      [id_lote]: ''
    }));
  };


  // Función para manejar cuando se pierde el enfoque (blur)
  const handleBlur = (id_lote) => {
    setQuantities((prevQuantities) => ({
      ...prevQuantities,
      [id_lote]: prevQuantities[id_lote] === '' ? 1 : prevQuantities[id_lote]
    }));
  };


  const addToCart = (lote, cantidad) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item.id_lote === lote.id_lote);

      if (existingItem) {
        return prevCart.map(item =>
          item.id_lote === lote.id_lote
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        );
      } else {
        return [...prevCart, { ...lote, cantidad }];
      }
    });
  };


  const removeFromCart = (id_lote) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.filter(item => item.id_lote !== id_lote);
      const updatedTotalPrice = updatedCart.reduce((sum, item) => sum + (parseFloat(item.precio_venta) * item.cantidad), 0);
      setTotalPrice(updatedTotalPrice);
      return updatedCart;
    });
  };


  const calculateChange = () => {
    if (paymentAmount !== '' && !isNaN(paymentAmount)) {
      const payment = parseFloat(paymentAmount);
      if (payment >= totalPrice) {
        const calculatedChange = payment - totalPrice;
        setChange(calculatedChange);
      } else {
        setChange(null);
      }
    }
  };

  useEffect(() => {
    if (isPaymentEntered) {
      calculateChange();
    }
  }, [paymentAmount, totalPrice, isPaymentEntered]);

  useEffect(() => {
    const total = cart.reduce((sum, item) => sum + (parseFloat(item.precio_venta) * item.cantidad), 0);
    setTotalPrice(total);
  }, [cart]);

  const handlePaymentAmountChange = (e) => {
    setPaymentAmount(e.target.value);
    if (e.target.value !== '' && !isNaN(e.target.value)) {
      setIsPaymentEntered(true);
    } else {
      setIsPaymentEntered(false);
    }
  };

  const handleSale = async () => {
    try {
      const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "Confirma si deseas realizar la venta",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, realizar venta',
        cancelButtonText: 'Cancelar',
        reverseButtons: true
      });

      if (result.isConfirmed) {
        if (estadoCaja !== 'abierta') {
          Swal.fire('Caja cerrada', 'No puedes realizar ventas si la caja está cerrada.', 'error');
          return;
        }

        if (change !== null) {
          const payload = cart.map(item => ({
            id_lote: item.id_lote,
            cantidad: item.cantidad || 1
          }));

          await axios.post(`${URL}/realizarventa`, payload, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });



          setCart([]);
          setTotalPrice(0);
          setPaymentAmount('');
          setChange(null);

          await fetchMedicamentos();

          const printReceipt = await Swal.fire({
            title: 'Venta realizada con éxito',
            text: "¿Deseas imprimir un recibo?",
            icon: 'success',
            showCancelButton: true,
            confirmButtonText: 'Imprimir Recibo',
            cancelButtonText: 'No Imprimir',
            reverseButtons: true
          });

          if (printReceipt.isConfirmed) {
            imprimirRecibo(cart);

          }
        }
      }
    } catch (error) {
      console.error('Error al realizar la venta:', error);
      Swal.fire('Error', 'Hubo un error al realizar la venta', 'error');
    }
  };

  const handleLogout = () => {
    logout();  // Llamar la función logout
    navigate('/login');  // Redirigir al login después de cerrar sesión
  };

  const imprimirRecibo = (venta) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Centro Médico Jerusalem - Recibo de Venta', 10, 10);
    doc.setFontSize(12);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 10, 20);

    const tableColumn = ["Nombre", "Cantidad", "Precio Unitario", "Total"];
    const tableRows = [];

    venta.forEach(item => {
      const rowData = [
        item.nombre,
        item.cantidad,
        `Q${parseFloat(item.precio_venta).toFixed(2)}`,
        `Q${(parseFloat(item.cantidad) * parseFloat(item.precio_venta)).toFixed(2)}`
      ];
      tableRows.push(rowData);
    });

    doc.autoTable(tableColumn, tableRows, { startY: 30 });
    doc.text(`Total: Q${totalPrice.toFixed(2)}`, 10, doc.autoTable.previous.finalY + 10);
    doc.text(`Pago: Q${parseFloat(paymentAmount).toFixed(2)}`, 10, doc.autoTable.previous.finalY + 20);
    doc.text(`Cambio: Q${change !== null ? change.toFixed(2) : 0}`, 10, doc.autoTable.previous.finalY + 30);

    doc.save('recibo_venta.pdf');
  };

 const abrirCajaManual = async () => {
  try {

    if (!estadoCajaInfo || !estadoCajaInfo.id_caja) {
      Swal.fire("Error", "No se encontró la caja pendiente.", "error");
      return;
    }

    const { value: monto } = await Swal.fire({
      title: 'Monto de apertura',
      input: 'number',
      inputAttributes: { min: 0 },
      showCancelButton: true,
      confirmButtonText: 'Abrir',
      cancelButtonText: 'Cancelar',
    });

    if (monto === '' || monto === null || isNaN(monto)) {
      return;
    }

    await axios.put(
      `${URL}/caja/abrir/${estadoCajaInfo.id_caja}`,
      { monto_apertura: monto },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }
    );

    await Swal.fire('Caja abierta', 'Puedes comenzar a vender.', 'success');

    const res = await axios.get(`${URL}/caja/estado`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    setEstadoCaja(res.data.estado);
    setEstadoCajaInfo(res.data.caja);

    if (res.data.caja) {
      setFechaApertura(res.data.caja.fecha_apertura);
      setTotalCaja(res.data.caja.total_ventas || 0);
    }

  } catch (error) {
    console.error(error);
    Swal.fire('Error', 'No se pudo abrir la caja', 'error');
  }
};

  useEffect(() => {
  const verificarCaja = async () => {
    try {
      const res = await axios.get(`${URL}/caja/estado`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      console.log('Estado caja:', res.data);

      const { estado, caja } = res.data;

      // 👉 Ya abierta
      if (estado === 'abierta') {
        setEstadoCaja('abierta');
        setEstadoCajaInfo(caja);   // <--- AQUI

        if (caja) {
          setFechaApertura(caja.fecha_apertura);
          setTotalCaja(caja.total_ventas || 0);
        }
        return;
      }

      // 👉 Pendiente
      if (estado === 'pendiente') {
        setEstadoCaja('pendiente');
        setEstadoCajaInfo(caja);  // <--- AQUI

        return; // No preguntamos nada aquí porque ya tienes el botón
      }

      // 👉 Cerrada o ninguna → crear pendiente
      if (estado === 'cerrada' || estado === 'ninguna') {
        await axios.post(
          `${URL}/caja/crear-pendiente`,
          {},
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );

        // Consultar de nuevo
        const res2 = await axios.get(`${URL}/caja/estado`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        setEstadoCaja(res2.data.estado);
        setEstadoCajaInfo(res2.data.caja);  // <--- AQUI TAMBIÉN

      }

    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo verificar la caja', 'error');
    }
  };

  verificarCaja();
}, []);



  return (
    <div>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Sidebar Template</title>
      <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet" />
      <div className={`d-flex ${isSidebarOpen ? 'toggled' : ''}`} id="wrapper">
        <Sidebar isOpen={isSidebarOpen} />
        {isSidebarOpen && (
          <div className="overlay" onClick={() => setSidebarOpen(false)}></div>
        )}
        <div id="page-content-wrapper">
          <Navbar toggleSidebar={toggleSidebar} />

          <div className="container-fluid">
            <h2>Medicamentos</h2>

            {estadoCaja && (
              <div className="alert alert-info text-center mt-3">
                <h5>
                  💼 Caja{' '}
                  <strong>
                    {estadoCaja === 'abierta'
                      ? 'Abierta'
                      : estadoCaja === 'pendiente'
                        ? 'Pendiente'
                        : estadoCaja === 'cerrada'
                          ? 'Cerrada'
                          : estadoCaja}
                  </strong>
                </h5>

                {fechaApertura && (
                  <p>📅 Apertura: {new Date(fechaApertura).toLocaleString()}</p>
                )}

                {estadoCaja === 'abierta' && (
                  <p>💰 Total actual: Q{Number(totalCaja).toFixed(2)}</p>
                )}

                {/* ⬇️ Mostrar BOTÓN solo si la caja está pendiente */}
                {estadoCaja === 'pendiente' && (
                  <button
                    className="btn btn-primary mt-2"
                    onClick={abrirCajaManual}
                  >
                    Abrir Caja
                  </button>
                )}
              </div>
            )}




            <div className="row">
              <div className="col-md-2 mb-3">
                <input
                  type="text"
                  placeholder="Buscar por código de barras..."
                  className="form-control"
                  value={barcodeSearchTerm}
                  onChange={(e) => setBarcodeSearchTerm(e.target.value)}
                />
              </div>

              <div className="col-md-4 mb-3">
                <input
                  type="text"
                  placeholder="Buscar por nombre..."
                  className="form-control"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-md-6 mb-3">
                <input
                  type="text"
                  placeholder="Buscar por descripción..."
                  className="form-control"
                  value={descriptionSearchTerm}
                  onChange={(e) => setDescriptionSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Módulo</th>
                    <th>Código de Barras</th>
                    <th>Nombre</th>
                    <th>Stock</th>
                    <th>Descripción</th>
                    <th>Precio Venta</th>
                    <th>Fecha de Vencimiento</th>
                    <th>Proveedor</th>
                    <th>Acción</th>
                  </tr>
                </thead>


                <tbody>
                  {filteredMedicamentos.map((lote) => {
                    const currentQuantity = quantities[lote.id_lote] ?? 1;

                    return (
                      <tr key={lote.id_lote}>
                        <td>{lote.modulo}</td>
                        <td>{lote.codigo_barra}</td>
                        <td>{lote.nombre}</td>
                        <td>{lote.stock}</td>
                        <td>{lote.descripcion}</td>
                        <td>Q{parseFloat(lote.precio_venta).toFixed(2)}</td>
                        <td>{new Date(lote.fecha_vencimiento).toLocaleDateString()}</td>
                        <td>{lote.proveedor_nombre}</td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            max={lote.stock}
                            value={currentQuantity}
                            onChange={(e) => handleQuantityChange(lote.id_lote, e.target.value)}
                            onFocus={() => handleFocus(lote.id_lote)}
                            onBlur={() => handleBlur(lote.id_lote)}
                            className="form-control"
                            style={{ width: '80px', display: 'inline-block', marginRight: '10px' }}
                          />
                          <button
                            className="btn btn-success"
                            onClick={() => addToCart(lote, parseInt(currentQuantity))}
                            disabled={lote.bloqueado} // <-- Bloquear si no es el más cercano
                          >
                            {lote.bloqueado ? 'Esperar turno' : 'Agregar al Carrito'}
                          </button>

                        </td>
                      </tr>
                    );
                  })
                  }
                </tbody>
              </table>
            </div>

            <h2>En Venta</h2>
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Cantidad</th>
                    <th>Precio Unitario</th>
                    <th>Precio Total</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.id_lote}>
                      <td>{item.nombre}</td>
                      <td>{item.cantidad}</td>
                      <td>Q{parseFloat(item.precio_venta).toFixed(2)}</td>
                      <td>Q{(parseFloat(item.cantidad) * parseFloat(item.precio_venta)).toFixed(2)}</td>
                      <td>
                        <button
                          className="btn btn-danger"
                          onClick={() => removeFromCart(item.id_lote)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3">
              <div className="form-group">
                <label htmlFor="paymentAmount">Monto Pagado:</label>
                <input
                  type="number"
                  id="paymentAmount"
                  className="form-control"
                  value={paymentAmount}
                  onChange={handlePaymentAmountChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="totalPrice">Total:</label>
                <input
                  type="text"
                  id="totalPrice"
                  className="form-control"
                  value={`Q${totalPrice.toFixed(2)}`}
                  readOnly
                />
              </div>
              {change !== null && (
                <div className="form-group">
                  <label htmlFor="change">Cambio:</label>
                  <input
                    type="text"
                    id="change"
                    className="form-control"
                    value={`Q${change.toFixed(2)}`}
                    readOnly
                  />
                </div>
              )}
              <button className="btn btn-primary" onClick={handleSale}>
                Realizar Venta
              </button>
            </div>
            <div>
              <div className="alert alert-danger mt-3">
                <h4 className="alert-heading">Medicamentos con Stock Bajo</h4>
                <ul>
                  {lowStockMedicamentos.map((lote) => (
                    <li key={lote.id_lote}>
                      {lote.nombre} - {lote.stock} unidades
                    </li>
                  ))
                  }
                </ul>
              </div>
              <div className="alert alert-warning mt-3">
                <h4 className="alert-heading">Medicamentos con Fecha de Vencimiento Cercana</h4>
                <ul>
                  {nearExpiryMedicamentos.map((lote) => (
                    <li key={lote.id_lote}>
                      {lote.nombre} - {new Date(lote.fecha_vencimiento).toLocaleDateString()}
                    </li>
                  ))
                  }
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Ventas;
