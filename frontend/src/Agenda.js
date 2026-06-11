import React, { useState, useEffect, useContext } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Modal, Button, Form } from 'react-bootstrap';
import Sidebar from './sidebar';
import Navbar from './Navbar';
import './Home.css';
import axios from 'axios';
import AuthContext from './AuthContext';
import miImagen from './logo.jpg';

const URL = process.env.REACT_APP_URL_BACKEND || 'http://localhost:3001';

moment.locale('es');
const localizer = momentLocalizer(moment);

const imprimirTicket = (cita) => {
  const ventana = window.open('', '_blank', 'width=300,height=600');
  ventana.document.write(`
    <html>
      <head>
        <title>Ticket de Cita</title>
        <style>
          body {
            font-family: monospace;
            font-size: 12px;
            padding: 10px;
            text-align: center;
          }
          img {
            width: 150px;
            margin-bottom: 10px;
          }
          h3, h4 {
            margin: 2px 0;
          }
          .section {
            text-align: left;
            margin: 10px 0;
          }
          hr {
            border-top: 1px dashed #000;
          }
        </style>
      </head>
      <body>
        <img src="${miImagen}" alt="Logo" />
        <h3>Dr. Oscar Herrera</h3>
        <h4>CENTRO MÉDICO JERUSALEM</h4>
        <div style="font-size:10px; margin-bottom: 10px;">
          CONSULTAS • RECIÉN NACIDOS • NIÑOS • ADOLESCENTES • ADULTOS
        </div>
        <hr />
        <div class="section">
          <p><strong>Paciente:</strong> ${cita.paciente}</p>
          <p><strong>Fecha:</strong> ${cita.fecha}</p>
          <p><strong>Hora:</strong> ${cita.hora}</p>
          <p><strong>Motivo:</strong> ${cita.motivo}</p>
          <p><strong>Observaciones:</strong> ${cita.observaciones || 'N/A'}</p>
        </div>
        <hr />
        <div style="text-align: left; font-size: 10px;">
          <p><strong>Médico Responsable:</strong> ${cita.medico}</p>
        </div>
        <div style="font-size: 10px; margin-top: 20px; text-align: left;">
          <p>CENTRO MÉDICO JERUSALEM</p>
          <p>Camino a aldea Lolemi, Chocola</p>
          <p>San Pablo Jocopilas, Suchitepéquez</p>
          <p>Tel: 3161 2260</p>
        </div>
        <script>
          setTimeout(() => { window.print(); window.close(); }, 500);
        </script>
      </body>
    </html>
  `);
};



function Agenda() {
  const { user, token } = useContext(AuthContext);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [eventos, setEventos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedCita, setSelectedCita] = useState(null);
  const [pacienteInput, setPacienteInput] = useState('');
  const [pacienteSuggestions, setPacienteSuggestions] = useState([]);
  const [idPacienteSeleccionado, setIdPacienteSeleccionado] = useState(null);

  const [formData, setFormData] = useState({
    motivo: '',
    observaciones: '',
    hora: ''
  });

  const mensajes = {
    today: 'Hoy',
    previous: 'Anterior',
    next: 'Siguiente',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'No hay eventos en este rango.',
    showMore: total => `+ Ver más (${total})`
  };

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    cargarCitas();
  }, []);

  const cargarCitas = () => {
    fetch(`${URL}/api/citas`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        const eventosFormat = data.map(cita => {
          try {
            const fecha = moment(`${cita.fecha}T${cita.hora}`, 'YYYY-MM-DDTHH:mm:ss');
            const start = fecha.toDate();
            const end = moment(start).add(30, 'minutes').toDate();
  
            return {
              title: `${cita.hora.slice(0, 5)} - ${cita.paciente}`,
              start,
              end,
              allDay: false,
              ...cita
            };
          } catch (error) {
            console.error('❌ Error formateando cita:', cita, error);
            return null;
          }
        }).filter(Boolean);
  
        setEventos(eventosFormat);
      })
      .catch(err => console.error('❌ Error cargando citas:', err));
  };


  const handleSelectSlot = ({ start }) => {
    setSelectedDate(start);
    setFormData(prev => ({ ...prev, hora: moment(start).format('HH:mm') }));
    setShowModal(true);
  };

  const handlePacienteInputChange = async (e) => {
    const value = e.target.value;
    setPacienteInput(value);
    setIdPacienteSeleccionado(null);

    if (value.length >= 2) {
      try {
        const res = await axios.get(`${URL}/api/pacientes`, { params: { nombre: value } });
        setPacienteSuggestions(res.data);
      } catch (err) {
        console.error('Error buscando pacientes:', err);
      }
    } else {
      setPacienteSuggestions([]);
    }
  };

  const handleSelectPaciente = (paciente) => {
    setPacienteInput(paciente.nombre);
    setIdPacienteSeleccionado(paciente.id_paciente);
    setPacienteSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      id_paciente: idPacienteSeleccionado,
      id_usuario: user.id,
      fecha: moment(selectedDate).format('YYYY-MM-DD'),
      hora: formData.hora,
      motivo: formData.motivo,
      observaciones: formData.observaciones
    };

    const res = await fetch(`${URL}/api/citas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    

    if (res.ok) {
      const nuevaCita = {
        ...payload,
        paciente: pacienteInput,
        medico: user.nombre
      };
      imprimirTicket(nuevaCita);  // ⬅ Aquí imprimimos el ticket
      setShowModal(false);
      cargarCitas();
    }
    else {
      alert('Error al registrar cita');
    }
  };

  return (
    
    <div className={`d-flex ${isSidebarOpen ? 'toggled' : ''}`} id="wrapper">
      <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet" />
      <Sidebar isOpen={isSidebarOpen} />
      {isSidebarOpen && <div className="overlay" onClick={toggleSidebar}></div>}
      <div id="page-content-wrapper">
        <Navbar toggleSidebar={toggleSidebar} />
        <div className="container mt-4">
          <h3 className="text-center mb-4">📅 Agenda de Citas</h3>

          <Calendar
  localizer={localizer}
  events={eventos}
  startAccessor="start"
  endAccessor="end"
  selectable
  onSelectSlot={handleSelectSlot}
  onSelectEvent={event => {
    setSelectedCita(event);
    setFormData({
      motivo: event.motivo || '',
      observaciones: event.observaciones || '',
      hora: event.hora ? event.hora.slice(0,5) : ''
    });
    setPacienteInput(event.paciente || '');
    setIdPacienteSeleccionado(event.id_paciente || null);
    setSelectedDate(event.start || new Date());
  }}
  messages={mensajes}
  defaultView="month"
  views={['month', 'week', 'day', 'agenda']}
  style={{ height: 500 }}
/>


          <Modal show={showModal} onHide={() => setShowModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Agendar Cita</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group>
                  <Form.Label>Paciente</Form.Label>
                  <Form.Control
                    type="text"
                    value={pacienteInput}
                    onChange={handlePacienteInputChange}
                    autoComplete="off"
                    placeholder="Escribe el nombre del paciente"
                    required
                  />
                  {pacienteSuggestions.length > 0 && (
                    <ul className="list-group position-absolute z-index-1">
                      {pacienteSuggestions.map(p => (
                        <li
                          key={p.id_paciente}
                          className="list-group-item list-group-item-action"
                          onClick={() => handleSelectPaciente(p)}
                          style={{ cursor: 'pointer' }}
                        >
                          {p.nombre}
                        </li>
                      ))}
                    </ul>
                  )}
                </Form.Group>

                <Form.Group>
                  <Form.Label>Médico</Form.Label>
                  <Form.Control type="text" value={user?.nombre || ''} readOnly />
                </Form.Group>

                <Form.Group>
                  <Form.Label>Fecha</Form.Label>
                  <Form.Control type="text" value={moment(selectedDate).format('YYYY-MM-DD')} readOnly />
                </Form.Group>

                <Form.Group>
                  <Form.Label>Hora</Form.Label>
                  <Form.Control
                    type="time"
                    required
                    value={formData.hora}
                    onChange={e => setFormData({ ...formData, hora: e.target.value })}
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label>Motivo</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    value={formData.motivo}
                    onChange={e => setFormData({ ...formData, motivo: e.target.value })}
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label>Observaciones</Form.Label>
                  <Form.Control
                    as="textarea"
                    value={formData.observaciones}
                    onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                  />
                </Form.Group>

                <Button className="mt-3" variant="primary" type="submit">Guardar Cita</Button>
              </Form>
            </Modal.Body>
          </Modal>

          <Modal show={!!selectedCita} onHide={() => setSelectedCita(null)}>
            <Modal.Header closeButton>
              <Modal.Title>Detalle de Cita</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedCita && (
                <>
                  <p><strong>Paciente:</strong> {selectedCita.paciente}</p>
                  <p><strong>Médico:</strong> {selectedCita.medico}</p>
                  <p><strong>Fecha:</strong> {moment(selectedCita.start).format('YYYY-MM-DD')}</p>
                  <p><strong>Hora:</strong> {selectedCita.hora ? selectedCita.hora.slice(0,5) : ''}</p>
                  <p><strong>Motivo:</strong> {selectedCita.motivo}</p>
                  <p><strong>Observaciones:</strong> {selectedCita.observaciones}</p>
                  <Button
                    variant="success"
                    className="mt-3"
                    onClick={() =>
                      imprimirTicket({
                        paciente: selectedCita.paciente,
                        medico: selectedCita.medico,
                        fecha: moment(selectedCita.start).format('YYYY-MM-DD'),
                        hora: moment(selectedCita.start).format('HH:mm'),
                        motivo: selectedCita.motivo,
                        observaciones: selectedCita.observaciones
                      })
                    }
                  >
                    🖨️ Imprimir Ticket
                  </Button>

                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setSelectedCita(null)}>Cerrar</Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </div>
  );
}


export default Agenda;
