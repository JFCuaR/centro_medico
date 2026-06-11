import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import miImagen from './logo.jpg';
import axios from 'axios';
import './Home.css';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import Sidebar from './sidebar'; // ← Importar 
import Navbar from './Navbar'; 

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const URL = process.env.REACT_APP_URL_BACKEND || 'http://localhost:3001';


function Home() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [salesData, setSalesData] = useState(null);
  const [salesDetails, setSalesDetails] = useState([]); // Inicializamos como un array vacío
  const [reportType, setReportType] = useState('day');

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const handleReportTypeChange = (e) => {
    setReportType(e.target.value);
  };

  // Función para convertir la fecha a formato YYYY-MM-DD
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

const fetchSalesData = async (date) => {
  const formattedDate = formatDate(date);
  let url = `${URL}/sales/${formattedDate}`;

  if (reportType === 'week') {
    url = `${URL}/sales/week/${formattedDate}`;
  } else if (reportType === 'month') {
    url = `${URL}/sales/month/${formattedDate}`;
  }

  try {
    const response = await axios.get(url);
    const data = response.data;

    // 👇 Asegúrate de convertir strings a números si fuera necesario
    setSalesData({
      totalSales: Number(data.totalSales) || 0,
      totalCost: Number(data.totalCost) || 0,
      profit: Number(data.profit) || 0,
    });

    setSalesDetails(data.details || []);
  } catch (error) {
    console.error('Error al obtener los datos:', error);
  }
};


  useEffect(() => {
    if (selectedDate) {
      fetchSalesData(selectedDate);
    }
  }, [selectedDate, reportType]);

  // Datos del gráfico de barras
  const chartData = {
    labels: ['Total Ventas', 'Total Costo', 'Ganancia Neta'],
    datasets: [
      {
        label: 'Ventas y Costos',
        data: salesData
          ? [salesData.totalSales, salesData.totalCost, salesData.profit]
          : [0, 0, 0],
        backgroundColor: ['rgba(75, 192, 192, 0.2)', 'rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)'],
        borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)'],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Sidebar Template</title>
      <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet" />
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
            <div className="image-container">
              <img src={miImagen} alt="logo" />
            </div>

            {/* Selector para el tipo de reporte */}
            <div className="mt-4">
              <h4>Selecciona el tipo de reporte</h4>
              <select value={reportType} onChange={handleReportTypeChange} className="form-control">
                <option value="day">Diario</option>
                <option value="week">Semanal</option>
                <option value="month">Mensual</option>
              </select>
            </div>

            {/* Calendario para seleccionar la fecha */}
            <div className="mt-4">
              <h4>Selecciona una fecha para ver las ventas y ganancias</h4>
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                dateFormat="yyyy/MM/dd"
                className="form-control"
              />
            </div>

            {/* Mostrar los resultados de las ventas */}
            <div className="mt-4">
              {salesData ? (
                <>
                  <h5>Resumen de ventas</h5>
                  <p><strong>Total de ventas:</strong> Q. {salesData.totalSales}</p>
                  <p><strong>Total de costo:</strong> Q. {salesData.totalCost}</p>
                  <p><strong>Ganancia neta:</strong> Q. {salesData.profit}</p>

                  {/* Mostrar gráfico de barras */}
                  <div className="mt-4">
                    <Bar data={chartData} options={chartOptions} />
                  </div>

                  {/* Tabla con el desglose de las ventas */}
                  <div className="mt-4">
                    <h5>Desglose de Ventas</h5>
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>Medicamento</th>
                          <th>Cantidad</th>
                          <th>Precio Unitario</th>
                          <th>Total Venta</th>
                          <th>Devuelto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesDetails.length > 0 ? (
                          salesDetails.map((item, index) => (
                            <tr key={index}>
                              <td>{item.medicamento}</td>
                              <td>{item.cantidad}</td>
                              <td>Q. {item.precio_unitario}</td>
                              <td>Q. {(item.cantidad * item.precio_unitario).toFixed(2)}</td>
                              <td>{item.devuelto === 1 ? 'Sí' : 'No'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center">No hay detalles de ventas disponibles</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p>No hay datos de ventas para la fecha seleccionada.</p>
              )}
            </div>
          </div>
        </div>
        {/* /#page-content-wrapper */}
      </div>
    </div>
  );
}

export default Home;
