import React, { useState } from 'react';
import Sidebar from './sidebar';
import Navbar from './Navbar';
import './Home.css';
import axios from 'axios';

const URL = process.env.REACT_APP_URL_BACKEND || 'http://localhost:3001';

function GenerarTurno() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [motivo, setMotivo] = useState('');

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const turno = { nombre_paciente: nombre, motivo };

    try {
      const res = await axios.post(`${URL}/api/turnos`, turno);
      if (res.status === 201) {
        // Soporta res.data o res.data.turno sin romper
        const creado = res.data?.turno ? res.data.turno : res.data;
        imprimirTicket({
          nombre_paciente: creado?.nombre_paciente ?? nombre,
          motivo: creado?.motivo ?? motivo,
        });
        setNombre('');
        setMotivo('');
        alert('Turno generado correctamente');
      } else {
        alert('El servidor no devolvió 201. Revisa tu backend.');
      }
    } catch (error) {
      console.error('Error al crear turno:', error);
      alert('No se pudo conectar al servidor');
    }
  };

  const imprimirTicket = (turno) => {
    const ventana = window.open('', '_blank', 'width=400,height=600');

    if (!ventana) {
      alert('Por favor, permite las ventanas emergentes para imprimir el ticket.');
      return;
    }

    const html = `
      <html>
        <head>
          <title>Turno</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              margin-top: 50px;
            }
            .ticket {
              padding: 20px;
              border: 1px dashed #000;
              width: 250px;
              margin: auto;
            }
            h2 { margin: 0 0 10px 0; }
            p { margin: 6px 0; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <h2>CLÍNICA JERUSALEM</h2>
            <p><strong>Paciente:</strong> ${turno.nombre_paciente || ''}</p>
            <p><strong>Motivo:</strong> ${turno.motivo || ''}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
            <p>Gracias por su espera</p>
          </div>
          <script>
            window.onload = function () {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `;

    ventana.document.write(html);
    ventana.document.close();
  };

  return (
    <div className={`d-flex ${isSidebarOpen ? 'toggled' : ''}`} id="wrapper">
      <link
        href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css"
        rel="stylesheet"
      />
      <Sidebar isOpen={isSidebarOpen} />
      {isSidebarOpen && <div className="overlay" onClick={toggleSidebar}></div>}
      <div id="page-content-wrapper">
        <Navbar toggleSidebar={toggleSidebar} />
        <div className="container mt-4">
          <h3>Generar Turno</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre del paciente</label>
              <input
                type="text"
                className="form-control"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Motivo</label>
              <input
                type="text"
                className="form-control"
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Crear Turno</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default GenerarTurno;
