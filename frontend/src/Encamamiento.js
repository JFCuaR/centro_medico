import React, { useState, useEffect } from 'react';
import Sidebar from './sidebar';
import Navbar from './Navbar';
import axios from 'axios';
import './Home.css';
import './Encamamiento.css';
import { Modal, Button, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';


//medicamentos_dia

const URL = process.env.REACT_APP_URL_BACKEND || 'http://localhost:3001'

const Encamamiento = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const [pacienteSuggestions, setPacienteSuggestions] = useState([]);
  const [idPacienteSeleccionado, setIdPacienteSeleccionado] = useState(null);
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [historialData, setHistorialData] = useState(null);
  const [showDatosModal, setShowDatosModal] = useState(false);
  const [fechasConDatos, setFechasConDatos] = useState([]);
  const [datosFecha, setDatosFecha] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  });

  const [datosYaExisten, setDatosYaExisten] = useState(false);
  const [datosDiarios, setDatosDiarios] = useState({

    presion_arterial: '',
    temperatura: '',
    frecuencia_cardiaca: '',
    frecuencia_respiratoria: '',
    saturacion_oxigeno: '',
    glucemia: '',
    dieta: '',
    medicamentos_dia: [{ nombre: '' }],
    soluciones: '',
    laboratorio: '',
    especiales: ''
  });
  const [listaDatosDiarios, setListaDatosDiarios] = useState([]);


  const openDatosDiariosModal = (index) => {
  setCurrentRoomIndex(index);
  setDatosDiarios({
    presion_arterial: '',
    temperatura: '',
    frecuencia_cardiaca: '',
    frecuencia_respiratoria: '',
    saturacion_oxigeno: '',
    glucemia: '',
    dieta: '',
    medicamentos_dia: [{ nombre: '' }],
    soluciones: '',
    laboratorio: '',
    especiales: ''
  });
  setListaDatosDiarios([]);
  setFechasConDatos([]);
  
  // ✅ Cargar fechas con datos para este encamamiento
  const idEncamamiento = cuartos[index].id_encamamiento;
  if (idEncamamiento) {
    cargarFechasConDatos(idEncamamiento);
  }

  setShowDatosModal(true);
};

  
  


  const verHistorial = async (id_historial) => {
    if (!id_historial) {
      alert("Este paciente no tiene historial médico registrado");
      return;
    }

    try {
      const res = await axios.get(`${URL}/api/historial/${id_historial}`);
      if (res.data) {
        setHistorialData(res.data);
        setShowHistorialModal(true);
      } else {
        alert("No se encontró historial médico para este paciente");
      }
    } catch (error) {
      console.error("Error al obtener historial médico:", error);
      alert("Error al cargar el historial médico");
    }
  };

  const tieneDatosSignificativos = (registro) => {
    return [
      registro.presion_arterial,
      registro.temperatura,
      registro.frecuencia_cardiaca,
      registro.frecuencia_respiratoria,
      registro.saturacion_oxigeno,
      registro.glucemia,
      registro.dieta,
      registro.medicamentos_dia,
      registro.soluciones,
      registro.laboratorio,
      registro.especiales
    ].some(val => val && val.toString().trim() !== '');
  };


  const initialRooms = Array.from({ length: 35 }, (_, index) => ({
    numero: 0 + index + 1,
    paciente: '',
    estado: '',
    dieta: '',
    ingreso: '',
    observaciones: '',
    fecha_salida: '',
    observacion_salida: ''
  }));

  const [cuartos, setCuartos] = useState(initialRooms);
  const [showModal, setShowModal] = useState(false);
  const [currentRoomIndex, setCurrentRoomIndex] = useState(null);
  const [formData, setFormData] = useState({
    paciente: '',
    estado: '',
    dieta: '',
    ingreso: '',
    observaciones: ''
  });

  const openModal = (index) => {
    setCurrentRoomIndex(index);
    setFormData(cuartos[index]);
    setShowModal(true);
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSave = async () => {
    if (!idPacienteSeleccionado) {
      alert('Debes seleccionar un paciente válido de la lista');
      return;
    }

    try {
      const res = await axios.post(`${URL}/api/encamamientos`, {
        numero: cuartos[currentRoomIndex].numero,
        id_paciente: idPacienteSeleccionado,
        estado: formData.estado,
        dieta: formData.dieta,
        ingreso: formData.ingreso,
        observaciones: formData.observaciones
      });

      // ✅ Actualiza todos los cuartos ocupados en el frontend
      const ocupados = res.data.cuartos || [];
      const updatedRooms = initialRooms.map(room => {
        const ocupado = ocupados.find(o => Number(o.numero) === room.numero);
        return ocupado ? { ...room, ...ocupado } : room;
      });

      setCuartos(updatedRooms);
      setShowModal(false);
    } catch (error) {
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        console.error('Error inesperado:', error);
      }
    }
  };

  const [showSalidaModal, setShowSalidaModal] = useState(false);
  const [salidaData, setSalidaData] = useState({
    fecha_salida: '',
    observacion_salida: ''
  });

  const openSalidaModal = (index) => {
    setCurrentRoomIndex(index);
    setSalidaData({
      fecha_salida: '',
      observacion_salida: ''
    });
    setShowSalidaModal(true);
  };

  const handleSalidaChange = (e) => {
    setSalidaData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSalidaSave = async () => {
    try {
      await axios.put(`${URL}/api/encamamientos/${cuartos[currentRoomIndex].numero}/salida`, salidaData);

      // ✅ Vuelve a cargar los cuartos ocupados sin depender de 'ocupado'
      const res = await axios.get(`${URL}/api/encamamientos`);
      const ocupados = (Array.isArray(res.data.cuartos) ? res.data.cuartos : res.data).filter(e => e.paciente);

      const updatedRooms = initialRooms.map(room => {
        const ocupado = ocupados.find(o => Number(o.numero) === room.numero);
        return ocupado
          ? {
            ...room,
            ...ocupado,
            ocupado: 1
          }
          : {
            ...room,
            ocupado: 0
          };
      });

      setCuartos(updatedRooms);
      setShowSalidaModal(false);
    } catch (err) {
      console.error('Error al registrar salida:', err);
    }
  };

  const handlePacienteChange = async (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, paciente: value }));
    setIdPacienteSeleccionado(null); // resetea selección

    if (value.length >= 2) {
      try {
        const res = await axios.get(`${URL}/api/pacientes`, {
          params: { nombre: value }
        });
        setPacienteSuggestions(res.data); // debe ser un array de pacientes con id_paciente y nombre
      } catch (error) {
        console.error('Error buscando pacientes:', error);
      }
    } else {
      setPacienteSuggestions([]);
    }
  };

  const fetchDatosPorFecha = async (fechaSeleccionada, id_encamamiento) => {
    if (!id_encamamiento) return;
  
    try {
      const res1 = await axios.get(`${URL}/api/signos-vitales/${id_encamamiento}/${fechaSeleccionada}`);
      const res2 = await axios.get(`${URL}/api/datos-clinicos/${id_encamamiento}/${fechaSeleccionada}`);
  
      const lista = [];
  
      for (let i = 0; i < res1.data.length; i++) {
        lista.push({
          presion_arterial: res1.data[i]?.presion_arterial || '',
          temperatura: res1.data[i]?.temperatura || '',
          frecuencia_cardiaca: res1.data[i]?.frecuencia_cardiaca || '',
          frecuencia_respiratoria: res1.data[i]?.frecuencia_respiratoria || '',
          saturacion_oxigeno: res1.data[i]?.saturacion_oxigeno || '',
          glucemia: res1.data[i]?.glucemia || '',
          dieta: res2.data[i]?.dieta || '',
          medicamentos_dia: (() => {
            const raw = res2.data[i]?.medicamentos_dia || '';
            try {
              return Array.isArray(raw) ? raw : JSON.parse(raw);
            } catch {
              return [{ nombre: raw.toString() }];
            }
          })(),
          soluciones: res2.data[i]?.soluciones || '',
          laboratorio: res2.data[i]?.laboratorio || '',
          especiales: res2.data[i]?.especiales || ''
        });
      }
  
      setListaDatosDiarios(lista);
    } catch (err) {
      console.error('Error al obtener registros por fecha:', err);
    }
  };
  

  const cargarFechasConDatos = async (idEncamamiento) => {
    try {
      const res = await axios.get(`${URL}/api/encamamientos/${idEncamamiento}/fechas-con-datos`);
      setFechasConDatos(res.data);
    } catch (err) {
      console.error('Error al cargar fechas con datos:', err);
    }
  };

  const cargarRegistrosPorFecha = async (fechaStr) => {
    const cuarto = cuartos[currentRoomIndex];
    if (!cuarto?.id_encamamiento) return;
  
    try {
      const res = await axios.get(`${URL}/api/encamamientos/${cuarto.id_encamamiento}/registros/${fechaStr}`);
  
      const registrosParseados = res.data.map(registro => ({
        ...registro,
        medicamentos_dia: (() => {
          try {
            return Array.isArray(registro.medicamentos_dia)
              ? registro.medicamentos_dia
              : JSON.parse(registro.medicamentos_dia || '[]');
          } catch {
            return [{ nombre: registro.medicamentos_dia }];
          }
        })()
      }));
  
      setListaDatosDiarios(registrosParseados);
    } catch (err) {
      console.error("Error cargando registros por hora:", err);
    }
  };
  


  const handleSelectPaciente = (paciente) => {
    setFormData(prev => ({ ...prev, paciente: paciente.nombre }));
    setIdPacienteSeleccionado(paciente.id_paciente);
    setPacienteSuggestions([]);
  };

  useEffect(() => {
    const fetchEncamamientos = async () => {
      try {
        const res = await axios.get(`${URL}/api/encamamientos`);
        console.log("📦 API devuelve cuartos:", res.data);

        const encamamientos = Array.isArray(res.data.cuartos) ? res.data.cuartos : [];

        const updatedRooms = initialRooms.map(room => {
          const ocupado = encamamientos.find(e =>
            Number(e.numero) === room.numero && e.ocupado?.toString() === '1'
          );

          return ocupado ? {
            ...room,
            ocupado: 1,
            paciente: ocupado.paciente || '',
            estado: ocupado.estado || '',
            dieta: ocupado.dieta || '',
            ingreso: ocupado.ingreso || '',
            observaciones: ocupado.observaciones || '',
            fecha_salida: ocupado.fecha_salida || '',
            observacion_salida: ocupado.observacion_salida || '',
            id_historial: ocupado.id_historial || null,
            id_encamamiento: ocupado.id_encamamiento || null,
          } : {
            ...room,
            ocupado: 0
          };
        });

        console.log("🧩 updatedRooms:", updatedRooms);
        setCuartos(updatedRooms);
      } catch (err) {
        console.error('Error al cargar encamamientos:', err);
      }
    };

    fetchEncamamientos();
  }, []);

  const handleMedicamentoDiaChange = (index, value) => {
    const nuevos = [...datosDiarios.medicamentos_dia];
    nuevos[index].nombre = value;
    setDatosDiarios(prev => ({ ...prev, medicamentos_dia: nuevos }));
  };

  const handleAgregarMedicamentoDia = () => {
    setDatosDiarios(prev => ({
      ...prev,
      medicamentos_dia: [...prev.medicamentos_dia, { nombre: '' }]
    }));
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
        <Sidebar isOpen={isSidebarOpen} />
        {isSidebarOpen && (
          <div className="overlay" onClick={() => setSidebarOpen(false)}></div>
        )}
        <div id="page-content-wrapper">
          <Navbar toggleSidebar={toggleSidebar} />

          <div className="container-fluid mt-4">
            <h2>Encamamiento de Pacientes</h2>
            <div className="row">
              {cuartos.map((cuarto, index) => (
                <div className="col-md-4 mb-4" key={index}>
                  <div
                    className="card shadow-sm h-100"
                    onClick={(e) => {
                      const isButtonClick = e.target.closest('button');
                      if (!isButtonClick) {
                        openModal(index);
                      }
                    }}

                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-header bg-light">
                      <strong>Cama #{cuarto.numero}</strong>
                    </div>
                    <div className="card-body">
                      {cuarto.ocupado === 1 ? (
                        <>
                          <p><strong>Paciente:</strong> {cuarto.paciente}</p>
                          <p><strong>Estado:</strong> {cuarto.estado}</p>
                          <p><strong>Ingreso:</strong> {cuarto.ingreso?.slice(0, 10)}</p>
                          <p><strong>Obs.:</strong> {cuarto.observaciones}</p>

                          {cuarto.fecha_salida && cuarto.fecha_salida !== '0000-00-00' && cuarto.fecha_salida !== '1899-11-30T06:02:04.000Z' ? (
                            <>
                              <p><strong>Salida:</strong> {new Date(cuarto.fecha_salida).toLocaleDateString()}</p>
                              <p><strong>Observaciones de salida:</strong> {cuarto.observacion_salida}</p>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                openSalidaModal(index);
                              }}
                            >
                              Dar salida
                            </Button>

                          )}
                          <Button
                            size="sm"
                            variant="success"
                            className="ml-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDatosDiariosModal(index); // esta función la crearemos luego
                            }}
                          >
                            Datos diarios
                          </Button>

                          {cuarto.id_historial ? (
                            <Button
                              size="sm"
                              variant="info"
                              onClick={(e) => {
                                e.stopPropagation(); // ✅ evita que se dispare el onClick del card
                                verHistorial(cuarto.id_historial);
                              }}
                            >
                              Ver historial
                            </Button>
                          ) : (
                            <Button size="sm" variant="secondary" disabled>
                              Sin historial
                            </Button>
                          )}
                        </>
                      ) : (
                        <p className="text-muted text-center">Vacío - Click para llenar</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal de ingreso */}
          <Modal show={showModal} onHide={() => setShowModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Registrar paciente</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group>
                  <Form.Label>Paciente Nombre</Form.Label>
                  <Form.Group>
                    <Form.Label>Paciente</Form.Label>
                    <Form.Control
                      type="text"
                      name="paciente"
                      value={formData.paciente}
                      onChange={handlePacienteChange}
                      autoComplete="off"
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

                </Form.Group>
                <Form.Group>
                  <Form.Label>Estado</Form.Label>
                  <Form.Control name="estado" value={formData.estado} onChange={handleChange} />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Fecha de ingreso</Form.Label>
                  <Form.Control type="date" name="ingreso" value={formData.ingreso} onChange={handleChange} />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Observaciones</Form.Label>
                  <Form.Control name="observaciones" value={formData.observaciones} onChange={handleChange} />
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handleSave}>Guardar</Button>
            </Modal.Footer>
          </Modal>

          {/* Modal de salida */}
          <Modal show={showSalidaModal} onHide={() => setShowSalidaModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Dar salida al paciente</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group>
                  <Form.Label>Fecha de salida</Form.Label>
                  <Form.Control
                    type="date"
                    name="fecha_salida"
                    value={salidaData.fecha_salida}
                    onChange={handleSalidaChange}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Observaciones de salida</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="observacion_salida"
                    value={salidaData.observacion_salida}
                    onChange={handleSalidaChange}
                  />
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowSalidaModal(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handleSalidaSave}>Guardar salida</Button>
            </Modal.Footer>
          </Modal>

          <Modal show={showHistorialModal} onHide={() => setShowHistorialModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Historial Médico</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {historialData ? (
                <>
                  <p><strong>Diagnóstico:</strong> {historialData.diagnostico}</p>
                  <p><strong>Síntomas:</strong> {historialData.sintomas}</p>
                  <p><strong>Medicamentos:</strong> {historialData.medicamentos_recetados}</p>
                  <p><strong>Médico Responsable:</strong> {historialData.medico_responsable}</p>
                  <p><strong>Fecha Consulta:</strong> {new Date(historialData.fecha_consulta).toLocaleDateString()}</p>
                </>
              ) : (
                <p>Cargando historial...</p>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowHistorialModal(false)}>Cerrar</Button>
            </Modal.Footer>
          </Modal>

          <Modal show={showDatosModal} onHide={() => setShowDatosModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Datos Clínicos y Signos Vitales Diarios</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group>
                  <Form.Label>Seleccionar fecha</Form.Label>
                  <Calendar
                    value={new Date(`${datosFecha}T00:00:00`)}
                    onClickDay={(date) => {
                      const fechaLocal = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
                      setDatosFecha(fechaLocal);
                      cargarRegistrosPorFecha(fechaLocal); // muestra lista por hora
                    }}
                    tileClassName={({ date }) => {
                      const fechaStr = date.toISOString().slice(0, 10);
                      return fechasConDatos.includes(fechaStr) ? 'bg-success text-white' : null;
                    }}
                    maxDate={new Date()}
                  />


                  {listaDatosDiarios.length > 0 && (
                    <>
                      <h6 className="mt-3">Registros del día:</h6>
                      <ul className="list-group mb-3">
                        {listaDatosDiarios.map((registro, idx) => (
                          <li
                            key={idx}
                            className="list-group-item list-group-item-action"
                            onClick={() =>
                              setDatosDiarios({
                                presion_arterial: registro.presion_arterial || '',
                                temperatura: registro.temperatura || '',
                                frecuencia_cardiaca: registro.frecuencia_cardiaca || '',
                                frecuencia_respiratoria: registro.frecuencia_respiratoria || '',
                                saturacion_oxigeno: registro.saturacion_oxigeno || '',
                                glucemia: registro.glucemia || '',
                                dieta: registro.dieta || '',
                                medicamentos_dia: Array.isArray(registro.medicamentos_dia)
                                ? registro.medicamentos_dia
                                : (() => {
                                    try {
                                      return JSON.parse(registro.medicamentos_dia || '[]');
                                    } catch {
                                      return [{ nombre: registro.medicamentos_dia }];
                                    }
                                  })(),
                              
                                soluciones: registro.soluciones || '',
                                laboratorio: registro.laboratorio || '',
                                especiales: registro.especiales || ''
                              })
                            }
                            style={{ cursor: 'pointer' }}
                          >
                            🕒 {registro.hora || 'sin hora'}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}


                </Form.Group>

                <h5>Signos Vitales</h5>
                <Form.Group><Form.Label>Presión Arterial</Form.Label>
                  <Form.Control value={datosDiarios.presion_arterial} onChange={(e) => setDatosDiarios(prev => ({ ...prev, presion_arterial: e.target.value }))} />
                </Form.Group>
                <Form.Group><Form.Label>Temperatura</Form.Label>
                  <Form.Control value={datosDiarios.temperatura} onChange={(e) => setDatosDiarios(prev => ({ ...prev, temperatura: e.target.value }))} />
                </Form.Group>
                <Form.Group><Form.Label>Frecuencia Cardíaca</Form.Label>
                  <Form.Control value={datosDiarios.frecuencia_cardiaca} onChange={(e) => setDatosDiarios(prev => ({ ...prev, frecuencia_cardiaca: e.target.value }))} />
                </Form.Group>
                <Form.Group><Form.Label>Frecuencia Respiratoria</Form.Label>
                  <Form.Control value={datosDiarios.frecuencia_respiratoria} onChange={(e) => setDatosDiarios(prev => ({ ...prev, frecuencia_respiratoria: e.target.value }))} />
                </Form.Group>
                <Form.Group><Form.Label>Saturación de Oxígeno</Form.Label>
                  <Form.Control value={datosDiarios.saturacion_oxigeno} onChange={(e) => setDatosDiarios(prev => ({ ...prev, saturacion_oxigeno: e.target.value }))} />
                </Form.Group>
                <Form.Group><Form.Label>Glucemia</Form.Label>
                  <Form.Control value={datosDiarios.glucemia} onChange={(e) => setDatosDiarios(prev => ({ ...prev, glucemia: e.target.value }))} />
                </Form.Group>

                <h5>Datos Clínicos</h5>
                <Form.Group><Form.Label>Dieta</Form.Label>
                  <Form.Control value={datosDiarios.dieta} onChange={(e) => setDatosDiarios(prev => ({ ...prev, dieta: e.target.value }))} />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Medicamentos del día</Form.Label>
                  {datosDiarios.medicamentos_dia.map((med, index) => (
                    <Form.Control
                      key={index}
                      className="mb-2"
                      placeholder={`Medicamento ${index + 1}`}
                      value={med.nombre}
                      onChange={(e) => handleMedicamentoDiaChange(index, e.target.value)}
                    />
                  ))}
                  <Button size="sm" variant="outline-secondary" onClick={handleAgregarMedicamentoDia}>
                    Agregar más medicamentos
                  </Button>
                </Form.Group>

                <Form.Group><Form.Label>Soluciones</Form.Label>
                  <Form.Control value={datosDiarios.soluciones} onChange={(e) => setDatosDiarios(prev => ({ ...prev, soluciones: e.target.value }))} />
                </Form.Group>
                <Form.Group><Form.Label>Laboratorio</Form.Label>
                  <Form.Control value={datosDiarios.laboratorio} onChange={(e) => setDatosDiarios(prev => ({ ...prev, laboratorio: e.target.value }))} />
                </Form.Group>
                <Form.Group><Form.Label>Especiales</Form.Label>
                  <Form.Control value={datosDiarios.especiales} onChange={(e) => setDatosDiarios(prev => ({ ...prev, especiales: e.target.value }))} />
                </Form.Group>
                <Button
                  variant="outline-primary"
                  className="mt-3"
                  onClick={() => {
                    if (tieneDatosSignificativos(datosDiarios)) {
                      setListaDatosDiarios(prev => [...prev, { ...datosDiarios }]);
                    }

                    setDatosDiarios({
                      presion_arterial: '',
                      temperatura: '',
                      frecuencia_cardiaca: '',
                      frecuencia_respiratoria: '',
                      saturacion_oxigeno: '',
                      glucemia: '',
                      dieta: '',
                      medicamentos_dia: [{ nombre: '' }],
                      soluciones: '',
                      laboratorio: '',
                      especiales: ''
                    });
                  }}
                >
                  Nuevo Registro
                </Button>



              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowDatosModal(false)}>Cancelar</Button>
              <Button
                variant="primary"
                onClick={async () => {
                  try {
                    const cuarto = cuartos[currentRoomIndex];

                    // 🧠 1. Cargar registros ya existentes en BD para esta fecha
                    const { data: registrosExistentes } = await axios.get(`${URL}/api/encamamientos/${cuarto.id_encamamiento}/registros/${datosFecha}`);

                    // 🧠 2. Verifica si ya existe un registro igual al actual en la base de datos
                    const yaExiste = registrosExistentes.some(item =>
                      JSON.stringify({
                        presion_arterial: item.presion_arterial || '',
                        temperatura: item.temperatura || '',
                        frecuencia_cardiaca: item.frecuencia_cardiaca || '',
                        frecuencia_respiratoria: item.frecuencia_respiratoria || '',
                        saturacion_oxigeno: item.saturacion_oxigeno || '',
                        glucemia: item.glucemia || '',
                        dieta: item.dieta || '',
                        medicamentos_dia: item.medicamentos_dia || '',
                        soluciones: item.soluciones || '',
                        laboratorio: item.laboratorio || '',
                        especiales: item.especiales || ''
                      }) === JSON.stringify(datosDiarios)
                    );

                    if (yaExiste) {
                      alert("Este registro ya existe para esta fecha. No se guardará nuevamente.");
                      return;
                    }

                    // ✅ 3. Validación: tiene al menos algún dato
                    if (!tieneDatosSignificativos(datosDiarios)) {
                      alert("El formulario está vacío o incompleto.");
                      return;
                    }

                    const horaLocal = new Date().toISOString(); // ejemplo: 2025-06-24T19:44:32.123Z


                    // ✅ 4. Guardar en backend (signos + datos clínicos)
                    await axios.post(`${URL}/api/signos-vitales`, {
                      ...datosDiarios,
                      fecha: datosFecha,
                      id_encamamiento: cuarto.id_encamamiento,
                      creado_en: horaLocal
                    });

                    await axios.post(`${URL}/api/datos-clinicos`, {
                      ...datosDiarios,
                      medicamentos_dia: JSON.stringify(
                        datosDiarios.medicamentos_dia
                        .filter(m => m.nombre && m.nombre.trim() !=='')
                      ),
                      fecha: datosFecha,
                      id_encamamiento: cuarto.id_encamamiento,
                      creadoe_en: horaLocal
                    });

                    alert("Registro guardado correctamente");

                    // ✅ 5. Refrescar lista
                    await cargarRegistrosPorFecha(datosFecha);

                    // ✅ 6. Limpiar formulario
                    setDatosDiarios({
                      presion_arterial: '',
                      temperatura: '',
                      frecuencia_cardiaca: '',
                      frecuencia_respiratoria: '',
                      saturacion_oxigeno: '',
                      glucemia: '',
                      dieta: '',
                      medicamentos_dia: [{ nombre: '' }],
                      soluciones: '',
                      laboratorio: '',
                      especiales: ''
                    });

                  } catch (err) {
                    console.error("❌ Error guardando el registro:", err);
                    alert("Error al guardar el registro");
                  }
                }}
              >
                Guardar Todos
              </Button>


            </Modal.Footer>
          </Modal>


        </div>
      </div>
    </div>
  );
};

export default Encamamiento;
