import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import AuthContext from './AuthContext';
import 'jspdf-autotable';
import './Home.css';

const URL = process.env.REACT_APP_URL_BACKEND || 'http://localhost:3001'

function Home() {
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
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const fetchMedicamentos = async () => {
    try {
      const response = await axios.get(`${URL}/vermedicamentos`);
      const allMedicamentos = response.data;

      const groupedByNameAndBarcode = allMedicamentos.reduce((acc, medicamento) => {
        const key = `${medicamento.nombre.trim()}_${medicamento.codigo_barra}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(medicamento);
        return acc;
      }, {});

      const updatedMedicamentos = Object.values(groupedByNameAndBarcode)
        .flatMap(group => {
          const sortedGroup = group.sort((a, b) => new Date(a.Fecha_vencimiento) - new Date(b.Fecha_vencimiento));
          return sortedGroup.map((medicamento, index) => ({
            ...medicamento,
            isButtonEnabled: index === 0
          }));
        });

      setMedicamentos(updatedMedicamentos);

      const lowStock = updatedMedicamentos.filter(medicamento => medicamento.stock > 0 && medicamento.stock <= 5);
      setLowStockMedicamentos(lowStock);

      const nearExpiry = updatedMedicamentos.filter(med => {
        const expiryDate = new Date(med.Fecha_vencimiento);
        const today = new Date();
        const threeMonthsLater = new Date();
        threeMonthsLater.setMonth(today.getMonth() + 3);
        return expiryDate >= today && expiryDate <= threeMonthsLater;
      });
      setNearExpiryMedicamentos(nearExpiry);

    } catch (error) {
      console.error('Error al obtener los productos:', error);
    }
  };

  useEffect(() => {
    fetchMedicamentos();
  }, []);

  const filteredMedicamentos = medicamentos
  .filter((medicamento) =>
    (!searchTerm || medicamento.nombre?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!descriptionSearchTerm || medicamento.Descripcion?.toLowerCase().includes(descriptionSearchTerm.toLowerCase())) &&
    (!barcodeSearchTerm || medicamento.codigo_barra?.includes(barcodeSearchTerm)) &&
    medicamento.stock > 0
  )
  .sort((a, b) => new Date(a.Fecha_vencimiento) - new Date(b.Fecha_vencimiento));


  // Función para manejar el cambio de cantidad
  const handleQuantityChange = (id_medicamento, value) => {
    setQuantities((prevQuantities) => ({
      ...prevQuantities,
      [id_medicamento]: value // Almacena el valor actual, incluso si es vacío
    }));
  };

  // Función para manejar el enfoque (focus) en el input
  const handleFocus = (id_medicamento) => {
    setQuantities((prevQuantities) => ({
      ...prevQuantities,
      [id_medicamento]: '' // Borra el valor cuando el campo recibe el foco
    }));
  };

  // Función para manejar cuando se pierde el enfoque (blur)
  const handleBlur = (id_medicamento) => {
    setQuantities((prevQuantities) => ({
      ...prevQuantities,
      [id_medicamento]: prevQuantities[id_medicamento] === '' ? 1 : prevQuantities[id_medicamento] // Si está vacío, vuelve a 1
    }));
  };

  const addToCart = (medicamento, cantidad) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item.nombre.trim().toLowerCase() === medicamento.nombre.trim().toLowerCase());

      if (existingItem) {
        return prevCart.map(item =>
          item.nombre.trim().toLowerCase() === medicamento.nombre.trim().toLowerCase()
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        );
      } else {
        return [...prevCart, { ...medicamento, cantidad: cantidad }];
      }
    });
  };

  const removeFromCart = (id_medicamento) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.filter(item => item.id_medicamento !== id_medicamento);

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
        if (change !== null) {
          const consolidatedCart = cart.map(item => ({
            ...item,
            cantidad: item.cantidad || 1
          }));
          await axios.post(`${URL}/realizarventa`, consolidatedCart);
  
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
            imprimirRecibo(consolidatedCart);
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

  return (
    <div>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Sidebar Template</title>
      <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet" />
      <div className={`d-flex ${isSidebarOpen ? 'toggled' : ''}`} id="wrapper">
        <div className={`bg-dark border-right ${isSidebarOpen ? 'sidebar-open' : ''}`} id="sidebar-wrapper">
          <div className="sidebar-heading text-white"><br /><br />CENTRO MEDICO</div>
          <div className="sidebar-heading text-white"> JERUSALEM <br /><br /></div>
          <div className="list-group list-group-flush">
            <Link to="/HomeFarmacia" className="list-group-item list-group-item-action bg-dark text-white">
              Inicio
             </Link>
            <Link to="/ventas2" className="list-group-item list-group-item-action bg-dark text-white">
              Farmacia
            </Link>
          </div>         
        </div>
        <div id="page-content-wrapper">
          <nav className="navbar navbar-expand-lg navbar-light bg-light border-bottom">
            <button className="btn btn-primary" id="menu-toggle" onClick={toggleSidebar}>
              Menu
            </button>
            <button className="btn btn-danger ml-auto" onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </nav>
          <div className="container-fluid">
            <h2>Medicamentos</h2>

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
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMedicamentos.map((medicamento) => {
                    const currentQuantity = quantities[medicamento.id_medicamento] ?? 1; // Muestra 1 si no hay un valor actual

                    return (
                      <tr key={medicamento.id_medicamento}>
                        <td>{medicamento.modulo}</td>
                        <td>{medicamento.codigo_barra}</td>
                        <td>{medicamento.nombre}</td>
                        <td>{medicamento.stock}</td>
                        <td>{medicamento.Descripcion}</td>
                        <td>Q{parseFloat(medicamento.precio_venta).toFixed(2)}</td>
                        <td>{new Date(medicamento.Fecha_vencimiento).toLocaleDateString()}</td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            max={medicamento.stock}
                            value={currentQuantity}
                            onChange={(e) => handleQuantityChange(medicamento.id_medicamento, e.target.value)}
                            onFocus={() => handleFocus(medicamento.id_medicamento)} // Borra el valor al hacer clic
                            onBlur={() => handleBlur(medicamento.id_medicamento)} // Vuelve a 1 si está vacío al perder el foco
                            className="form-control"
                            style={{ width: '80px', display: 'inline-block', marginRight: '10px' }}
                          />
                          <button
                            className="btn btn-success"
                            onClick={() => addToCart(medicamento, currentQuantity)}
                            disabled={!medicamento.isButtonEnabled}
                          >
                            Agregar al Carrito
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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
                    <tr key={item.id_medicamento}>
                      <td>{item.nombre}</td>
                      <td>{item.cantidad}</td>
                      <td>Q{parseFloat(item.precio_venta).toFixed(2)}</td>
                      <td>Q{(parseFloat(item.cantidad) * parseFloat(item.precio_venta)).toFixed(2)}</td>
                      <td>
                        <button
                          className="btn btn-danger"
                          onClick={() => removeFromCart(item.id_medicamento)}
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
                  {lowStockMedicamentos.map((medicamento) => (
                    <li key={medicamento.id_medicamento}>{medicamento.nombre} - {medicamento.stock} unidades</li>
                  ))}
                </ul>
              </div>
              <div className="alert alert-warning mt-3">
                <h4 className="alert-heading">Medicamentos con Fecha de Vencimiento Cercana</h4>
                <ul>
                  {nearExpiryMedicamentos.map((medicamento) => (
                    <li key={medicamento.id_medicamento}>{medicamento.nombre} - {new Date(medicamento.Fecha_vencimiento).toLocaleDateString()}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
