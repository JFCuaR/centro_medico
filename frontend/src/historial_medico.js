import React, { useState, useContext, useEffect } from 'react';
import AuthContext from './AuthContext';
import axios from 'axios';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import logo from './logo.jpg';
import Sidebar from './sidebar';
import Navbar from './Navbar';
import './Home.css';

const URL = process.env.REACT_APP_URL_BACKEND || 'http://localhost:3001';

function Home() {
  const { user } = useContext(AuthContext);

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [turnos, setTurnos] = useState([]);
  const [turnoActual, setTurnoActual] = useState(null);
  const [sugerencias, setSugerencias] = useState([]);
  const [medicamentoSugerencias, setMedicamentoSugerencias] = useState([]);
  const [indiceActivo, setIndiceActivo] = useState(null);
  const [recetaGenerada, setRecetaGenerada] = useState(false);

  const [historialMedico, setHistorialMedico] = useState({
    id_turno: '',
    id_paciente: '',
    nombre_paciente: '',
    fecha_consulta: '',
    diagnostico: '',
    sintomas: '',
    dpi: '',
    sexo: '',
    religion: '',
    medico_responsable: '',
    telefono: '',
    fecha_nacimiento: '',
    presion_arterial: '',
    temperatura: '',
    frecuencia_cardiaca: '',
    frecuencia_respiratoria: '',
    saturacion_oxigeno: '',
    glucemia: '',
    peso: '',
    talla: '',
    medicamentos_recetados: [{ nombre: '' }],
    antecedentes_medico: '',
    antecedentes_quirurgico: '',
    antecedentes_alergico: '',
    antecedentes_traumaticos: '',
    antecedentes_familiares: '',
    antecedentes_vicios_y_manias: ''
  });

  useEffect(() => {
    if (user && user.nombre) {
      setHistorialMedico((prev) => ({
        ...prev,
        medico_responsable: user.nombre
      }));
    }
  }, [user]);

  useEffect(() => {
    cargarTurnos();
    const intervalo = setInterval(cargarTurnos, 5000);
    return () => clearInterval(intervalo);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

 const cargarTurnos = async () => {
  try {
    const [esperaRes, actualRes] = await Promise.all([
      axios.get(`${URL}/api/turnos/espera`),
      axios.get(`${URL}/api/turnos/actual`)
    ]);

    setTurnos(Array.isArray(esperaRes.data) ? esperaRes.data : []);
    setTurnoActual(actualRes.data || null);
  } catch (error) {
    console.error('Error cargando turnos:', error);
    setTurnos([]);
    setTurnoActual(null);
  }
};

 const llamarTurno = async (id) => {
  try {
    console.log('Llamando turno ID:', id);
    const res = await axios.put(`${URL}/api/turnos/${id}/atender`);
    console.log('Respuesta atender:', res.data);
    await cargarTurnos();
  } catch (error) {
    console.error('Error al pasar a atendiendo:', error);
  }
};
  const finalizarTurno = async (id) => {
    try {
      await axios.put(`${URL}/api/turnos/${id}/finalizar`);
      await cargarTurnos();
    } catch (error) {
      console.error('Error al finalizar turno:', error);
    }
  };

  const noAtendidoTurno = async (id) => {
    try {
      await axios.put(`${URL}/api/turnos/${id}/no-atendido`);
      await cargarTurnos();
    } catch (error) {
      console.error('Error al marcar no atendido:', error);
    }
  };

const avisarReanuncio = (turno) => {
  const payload = {
    type: 'reanuncio',
    id_turno: turno.id_turno,
    ts: Date.now(),
    nombre_paciente: turno.nombre_paciente,
    motivo: turno.motivo
  };

  console.log('📣 Reanunciando turno:', payload);

  try {
    const ch = new BroadcastChannel('turnos_channel');
    ch.postMessage(payload);
    ch.close();
    console.log('✅ BroadcastChannel enviado');
  } catch (error) {
    console.error('❌ Error BroadcastChannel:', error);
  }

  try {
    localStorage.setItem('turno_reanuncio', JSON.stringify(payload));
    console.log('✅ localStorage enviado');
  } catch (error) {
    console.error('❌ Error localStorage:', error);
  }
};

  const llamarSiguiente = async () => {
    try {
      const enEsperaOrdenados = [...turnos].sort((a, b) =>
        (a.creado_en || a.id_turno) > (b.creado_en || b.id_turno) ? 1 : -1
      );

      if (enEsperaOrdenados.length === 0) return;

      await llamarTurno(enEsperaOrdenados[0].id_turno);
    } catch (error) {
      console.error('Error al llamar siguiente:', error);
    }
  };

  const handleMedicamentoChange = async (e, index) => {
    const value = e.target.value;

    const nuevosMedicamentos = [...historialMedico.medicamentos_recetados];
    nuevosMedicamentos[index].nombre = value;

    setHistorialMedico({
      ...historialMedico,
      medicamentos_recetados: nuevosMedicamentos
    });

    if (value.length >= 2) {
      try {
        const { data } = await axios.get(`${URL}/buscar_medicamento`, {
          params: { nombre: value }
        });
        setMedicamentoSugerencias(Array.isArray(data) ? data : []);
        setIndiceActivo(index);
      } catch (error) {
        console.error('Error al buscar medicamentos:', error);
        setMedicamentoSugerencias([]);
        setIndiceActivo(null);
      }
    } else {
      setMedicamentoSugerencias([]);
      setIndiceActivo(null);
    }
  };

  const handleSeleccionarMedicamento = (nombre) => {
    const nuevosMedicamentos = [...historialMedico.medicamentos_recetados];

    if (indiceActivo !== null) {
      nuevosMedicamentos[indiceActivo].nombre = nombre;
      setHistorialMedico({
        ...historialMedico,
        medicamentos_recetados: nuevosMedicamentos
      });
    }

    setMedicamentoSugerencias([]);
    setIndiceActivo(null);
  };

  const handleNombreChange = async (e) => {
    const value = e.target.value;

    setHistorialMedico((prev) => ({
      ...prev,
      id_paciente: '',
      nombre_paciente: value
    }));

    if (value.length >= 3) {
      try {
        const { data } = await axios.get(`${URL}/buscar_pacientes`, {
          params: { nombre: value }
        });

        const lista = Array.isArray(data) ? data : [];

        const nombresUnicos = new Set();
        const pacientesFiltrados = lista.filter((paciente) => {
          const nombreMostrar = paciente.nombre || paciente.nombre_paciente || '';
          const clave = nombreMostrar.trim().toLowerCase();

          if (!nombresUnicos.has(clave)) {
            nombresUnicos.add(clave);
            return true;
          }
          return false;
        });

        setSugerencias(pacientesFiltrados);
      } catch (error) {
        console.error('Error al buscar pacientes:', error);
        setSugerencias([]);
      }
    } else {
      setSugerencias([]);
    }
  };

  const handleSeleccionarSugerencia = async (paciente) => {
    let antecedentes = {
      antecedentes_medico: '',
      antecedentes_quirurgico: '',
      antecedentes_alergico: '',
      antecedentes_traumaticos: '',
      antecedentes_familiares: '',
      antecedentes_vicios_y_manias: ''
    };

    try {
      if (paciente.id_paciente) {
        const { data } = await axios.get(
          `${URL}/api/pacientes/${paciente.id_paciente}/antecedentes`
        );
        antecedentes = data || antecedentes;
      }
    } catch (error) {
      console.error('Error cargando antecedentes del paciente:', error);
    }

    setHistorialMedico((prev) => ({
      ...prev,
      id_paciente: paciente.id_paciente || '',
      nombre_paciente: paciente.nombre || paciente.nombre_paciente || '',
      dpi: paciente.dpi || '',
      sexo: paciente.sexo || '',
      religion: paciente.religion || '',
      telefono: paciente.telefono || '',
      fecha_nacimiento: paciente.fecha_nacimiento
        ? String(paciente.fecha_nacimiento).slice(0, 10)
        : '',
      antecedentes_medico: antecedentes.antecedentes_medico || '',
      antecedentes_quirurgico: antecedentes.antecedentes_quirurgico || '',
      antecedentes_alergico: antecedentes.antecedentes_alergico || '',
      antecedentes_traumaticos: antecedentes.antecedentes_traumaticos || '',
      antecedentes_familiares: antecedentes.antecedentes_familiares || '',
      antecedentes_vicios_y_manias: antecedentes.antecedentes_vicios_y_manias || ''
    }));

    setSugerencias([]);
  };

  const seleccionarTurno = async (turno) => {
    let antecedentes = {
      antecedentes_medico: '',
      antecedentes_quirurgico: '',
      antecedentes_alergico: '',
      antecedentes_traumaticos: '',
      antecedentes_familiares: '',
      antecedentes_vicios_y_manias: ''
    };

    try {
      if (turno.id_paciente) {
        const { data } = await axios.get(
          `${URL}/api/pacientes/${turno.id_paciente}/antecedentes`
        );
        antecedentes = data || antecedentes;
      }
    } catch (error) {
      console.error('Error cargando antecedentes del paciente:', error);
    }

    setHistorialMedico((prev) => ({
      ...prev,
      id_turno: turno.id_turno || '',
      id_paciente: turno.id_paciente || '',
      nombre_paciente: turno.nombre_paciente || '',
      dpi: turno.dpi || '',
      telefono: turno.telefono || '',
      sexo: turno.sexo || '',
      fecha_nacimiento: turno.fecha_nacimiento
        ? String(turno.fecha_nacimiento).slice(0, 10)
        : '',
      fecha_consulta: turno.fecha_consulta
        ? String(turno.fecha_consulta).slice(0, 10)
        : '',
      sintomas: turno.motivo || '',
      presion_arterial: turno.presion_arterial || '',
      temperatura: turno.temperatura || '',
      frecuencia_cardiaca: turno.frecuencia_cardiaca || '',
      frecuencia_respiratoria: turno.frecuencia_respiratoria || '',
      saturacion_oxigeno: turno.saturacion_oxigeno || '',
      glucemia: turno.glucemia || '',
      peso: turno.peso || '',
      talla: turno.talla || '',
      antecedentes_medico: antecedentes.antecedentes_medico || '',
      antecedentes_quirurgico: antecedentes.antecedentes_quirurgico || '',
      antecedentes_alergico: antecedentes.antecedentes_alergico || '',
      antecedentes_traumaticos: antecedentes.antecedentes_traumaticos || '',
      antecedentes_familiares: antecedentes.antecedentes_familiares || '',
      antecedentes_vicios_y_manias: antecedentes.antecedentes_vicios_y_manias || ''
    }));
  };

  const handleHistorialChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('medicamento_')) {
      const index = parseInt(name.split('_')[1], 10);
      const nuevosMedicamentos = [...historialMedico.medicamentos_recetados];
      nuevosMedicamentos[index].nombre = value;

      setHistorialMedico({
        ...historialMedico,
        medicamentos_recetados: nuevosMedicamentos
      });
    } else {
      setHistorialMedico({
        ...historialMedico,
        [name]: value
      });
    }
  };

  const handleAddMedicamento = () => {
    setHistorialMedico((prevState) => ({
      ...prevState,
      medicamentos_recetados: [
        ...prevState.medicamentos_recetados,
        { nombre: '' }
      ]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dpiSinGuiones = (historialMedico.dpi || '').replace(/-/g, '');

    const medicamentosFiltrados = historialMedico.medicamentos_recetados.filter(
      (medicamento) =>
        medicamento.nombre &&
        typeof medicamento.nombre === 'string' &&
        medicamento.nombre.trim() !== ''
    );

    const datosParaEnviar = {
      ...historialMedico,
      dpi: dpiSinGuiones,
      medicamentos_recetados: medicamentosFiltrados
    };

    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Estás a punto de guardar los datos del historial médico.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.post(`${URL}/historial-medico`, datosParaEnviar);

          if (historialMedico.id_turno) {
            try {
              await axios.put(`${URL}/api/turnos/${historialMedico.id_turno}/finalizar`);
              await cargarTurnos();
            } catch (errorTurno) {
              console.error('Error finalizando turno:', errorTurno);
            }
          }

          Swal.fire({
            title: 'Guardado',
            text: 'El historial médico ha sido guardado exitosamente.',
            icon: 'success',
            confirmButtonText: 'OK'
          }).then(() => {
            setRecetaGenerada(true);
          });
        } catch (error) {
          console.error('Hubo un error al agregar el historial médico:', error);
          Swal.fire('Error', 'Hubo un error al guardar el historial médico.', 'error');
        }
      }
    });
  };

  const handleNuevo = () => {
    setHistorialMedico((prev) => ({
      id_turno: '',
      id_paciente: '',
      nombre_paciente: '',
      fecha_consulta: '',
      diagnostico: '',
      sintomas: '',
      dpi: '',
      sexo: '',
      religion: '',
      medico_responsable: prev.medico_responsable || '',
      telefono: '',
      fecha_nacimiento: '',
      presion_arterial: '',
      temperatura: '',
      frecuencia_cardiaca: '',
      frecuencia_respiratoria: '',
      saturacion_oxigeno: '',
      glucemia: '',
      peso: '',
      talla: '',
      medicamentos_recetados: [
        { nombre: '', modo_administracion: '', cantidad: '', unidad: '', comentario: '' }
      ],
      antecedentes_medico: '',
      antecedentes_quirurgico: '',
      antecedentes_alergico: '',
      antecedentes_traumaticos: '',
      antecedentes_familiares: '',
      antecedentes_vicios_y_manias: ''
    }));

    setSugerencias([]);
    setMedicamentoSugerencias([]);
    setIndiceActivo(null);
    setRecetaGenerada(false);
  };

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    const imgData = logo;

    doc.addImage(imgData, 'JPEG', 15, 10, 50, 20);

    doc.setFontSize(14);
    doc.text('Dr. Oscar Herrera', 80, 25);
    doc.setFontSize(12);
    doc.text('CENTRO MEDICO JERUSALEM', 75, 30);
    doc.text('CONSULTAS • RECIÉN NACIDOS • NIÑOS • ADOLESCENTES • ADULTOS', 50, 35);
    doc.line(15, 40, 195, 40);

    doc.setFontSize(12);
    doc.text(`Nombre del Paciente: ${historialMedico.nombre_paciente}`, 20, 50);
    doc.text(`Fecha de Consulta: ${historialMedico.fecha_consulta}`, 20, 60);

    doc.text('Medicamentos Recetados:', 20, 70);
    let yPosition = 80;

    historialMedico.medicamentos_recetados
      .filter((med) => med.nombre.trim() !== '')
      .forEach((medicamento, index) => {
        doc.text(`${index + 1}. ${medicamento.nombre}`, 20, yPosition);
        yPosition += 10;
      });

    doc.setFontSize(10);
    doc.text(`Médico Responsable: ${historialMedico.medico_responsable}`, 20, yPosition + 10);

    doc.setFontSize(10);
    doc.text('CENTRO MEDICO JERUSALEM', 20, 260);
    doc.text('Camino a aldea lolemi, chocola,', 20, 270);
    doc.text('Aldea Chocola, san pablo jocopilas, suchitepequez', 20, 275);
    doc.text('Tel: 3161 2260', 20, 280);

    doc.save('receta-medica.pdf');
  };

  return (
    <div>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Ingreso de Historial Médico</title>
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

          <div className="container-fluid">
            <div className="row">
              <div className="col-md-8">
                <h2>Ingreso de Historial Médico</h2>

                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group col-md-6 position-relative">
                      <label>Nombre del Paciente:</label>
                      <input
                        type="text"
                        className="form-control"
                        name="nombre_paciente"
                        value={historialMedico.nombre_paciente}
                        onChange={handleNombreChange}
                        autoComplete="off"
                      />
                      {sugerencias.length > 0 && (
                        <ul className="suggestions-list">
                          {sugerencias.map((sugerencia, index) => (
                            <li
                              key={sugerencia.id_paciente || index}
                              onClick={() => handleSeleccionarSugerencia(sugerencia)}
                            >
                              {sugerencia.nombre || sugerencia.nombre_paciente}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="form-group col-md-6">
                      <label>Fecha de Consulta:</label>
                      <input
                        type="date"
                        className="form-control"
                        name="fecha_consulta"
                        value={historialMedico.fecha_consulta}
                        onChange={handleHistorialChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group col-md-6">
                      <label>Diagnóstico:</label>
                      <input
                        type="text"
                        className="form-control"
                        name="diagnostico"
                        value={historialMedico.diagnostico}
                        onChange={handleHistorialChange}
                        required
                      />
                    </div>
                    <div className="form-group col-md-6">
                      <label>Síntomas:</label>
                      <input
                        type="text"
                        className="form-control"
                        name="sintomas"
                        value={historialMedico.sintomas}
                        onChange={handleHistorialChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group col-md-6">
                      <label>DPI:</label>
                      <input
                        type="text"
                        className="form-control"
                        name="dpi"
                        value={historialMedico.dpi}
                        onChange={handleHistorialChange}
                        maxLength={15}
                        required
                      />
                    </div>

                    <div className="form-group col-md-6">
                      <label>Sexo:</label>
                      <select
                        className="form-control"
                        name="sexo"
                        value={historialMedico.sexo}
                        onChange={handleHistorialChange}
                        required
                      >
                        <option value="">Seleccione</option>
                        <option value="Hombre">Hombre</option>
                        <option value="Mujer">Mujer</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group col-md-6">
                      <label>Religión:</label>
                      <input
                        type="text"
                        className="form-control"
                        name="religion"
                        value={historialMedico.religion}
                        onChange={handleHistorialChange}
                      />
                    </div>

                    <div className="form-group col-md-6">
                      <label>Médico Responsable:</label>
                      <input
                        type="text"
                        className="form-control"
                        name="medico_responsable"
                        value={historialMedico.medico_responsable}
                        readOnly
                        onChange={handleHistorialChange}
                        required
                      />
                    </div>

                    <div className="form-group col-md-6">
                      <label>Teléfono:</label>
                      <input
                        type="text"
                        className="form-control"
                        name="telefono"
                        value={historialMedico.telefono}
                        onChange={handleHistorialChange}
                        maxLength={15}
                        required
                      />
                    </div>

                    <div className="form-group col-md-6">
                      <label>Fecha de Nacimiento:</label>
                      <input
                        type="date"
                        className="form-control"
                        name="fecha_nacimiento"
                        value={historialMedico.fecha_nacimiento}
                        onChange={handleHistorialChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Medicamentos Recetados:</label>
                    {historialMedico.medicamentos_recetados.map((medicamento, index) => (
                      <div key={index} className="form-group position-relative">
                        <input
                          type="text"
                          className="form-control"
                          name={`medicamento_${index}`}
                          value={medicamento.nombre}
                          placeholder={`Medicamento ${index + 1}`}
                          onChange={(e) => handleMedicamentoChange(e, index)}
                          autoComplete="off"
                        />

                        {indiceActivo === index && medicamentoSugerencias.length > 0 && (
                          <ul className="suggestions-list">
                            {medicamentoSugerencias.map((item, i) => (
                              <li
                                key={i}
                                onClick={() => handleSeleccionarMedicamento(item.nombre)}
                              >
                                {item.nombre} (Stock: {item.stock_disponible})
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      className="btn btn-primary mt-2"
                      onClick={handleAddMedicamento}
                    >
                      Agregar Más Medicamentos
                    </button>
                  </div>

                  <div className="card shadow-sm mb-4">
                    <div className="card-header bg-success text-white">
                      <strong>Signos Vitales (Ingreso Enfermería)</strong>
                    </div>

                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-4 mb-3">
                          <label>Presión arterial</label>
                          <input
                            type="text"
                            className="form-control"
                            value={historialMedico.presion_arterial || ''}
                            readOnly
                          />
                        </div>

                        <div className="col-md-4 mb-3">
                          <label>Temperatura (°C)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={historialMedico.temperatura || ''}
                            readOnly
                          />
                        </div>

                        <div className="col-md-4 mb-3">
                          <label>Frecuencia cardíaca</label>
                          <input
                            type="text"
                            className="form-control"
                            value={historialMedico.frecuencia_cardiaca || ''}
                            readOnly
                          />
                        </div>

                        <div className="col-md-4 mb-3">
                          <label>Frecuencia respiratoria</label>
                          <input
                            type="text"
                            className="form-control"
                            value={historialMedico.frecuencia_respiratoria || ''}
                            readOnly
                          />
                        </div>

                        <div className="col-md-4 mb-3">
                          <label>Saturación de oxígeno (%)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={historialMedico.saturacion_oxigeno || ''}
                            readOnly
                          />
                        </div>

                        <div className="col-md-4 mb-3">
                          <label>Glucemia</label>
                          <input
                            type="text"
                            className="form-control"
                            value={historialMedico.glucemia || ''}
                            readOnly
                          />
                        </div>

                        <div className="col-md-6 mb-3">
                          <label>Peso (kg)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={historialMedico.peso || ''}
                            readOnly
                          />
                        </div>

                        <div className="col-md-6 mb-3">
                          <label>Talla (m)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={historialMedico.talla || ''}
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <h4>Antecedentes</h4>
                    <div className="form-row">
                      <div className="col-md-4">
                        <label>Antecedentes Médicos:</label>
                        <input
                          type="text"
                          className="form-control"
                          name="antecedentes_medico"
                          value={historialMedico.antecedentes_medico}
                          onChange={handleHistorialChange}
                        />
                      </div>

                      <div className="col-md-4">
                        <label>Antecedentes Quirúrgicos:</label>
                        <input
                          type="text"
                          className="form-control"
                          name="antecedentes_quirurgico"
                          value={historialMedico.antecedentes_quirurgico}
                          onChange={handleHistorialChange}
                        />
                      </div>

                      <div className="col-md-4">
                        <label>Antecedentes Alérgicos:</label>
                        <input
                          type="text"
                          className="form-control"
                          name="antecedentes_alergico"
                          value={historialMedico.antecedentes_alergico}
                          onChange={handleHistorialChange}
                        />
                      </div>
                    </div>

                    <div className="form-row mt-3">
                      <div className="col-md-4">
                        <label>Antecedentes Traumáticos:</label>
                        <input
                          type="text"
                          className="form-control"
                          name="antecedentes_traumaticos"
                          value={historialMedico.antecedentes_traumaticos}
                          onChange={handleHistorialChange}
                        />
                      </div>

                      <div className="col-md-4">
                        <label>Antecedentes Familiares:</label>
                        <input
                          type="text"
                          className="form-control"
                          name="antecedentes_familiares"
                          value={historialMedico.antecedentes_familiares}
                          onChange={handleHistorialChange}
                        />
                      </div>

                      <div className="col-md-4">
                        <label>Vicios y Manías:</label>
                        <input
                          type="text"
                          className="form-control"
                          name="antecedentes_vicios_y_manias"
                          value={historialMedico.antecedentes_vicios_y_manias}
                          onChange={handleHistorialChange}
                        />
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary mt-3">
                    Enviar
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary mt-3 ml-3"
                    onClick={handleNuevo}
                  >
                    Nuevo
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary mt-3 ml-3"
                    onClick={handleGeneratePDF}
                  >
                    Generar Receta en PDF
                  </button>
                </form>

                {recetaGenerada && (
                  <div className="mt-5">
                    <h3>Receta Médica</h3>
                    <p>
                      <strong>Paciente:</strong> {historialMedico.nombre_paciente}
                    </p>
                    <p>
                      <strong>Diagnóstico:</strong> {historialMedico.diagnostico}
                    </p>
                    <p>
                      <strong>Medicamentos:</strong>
                    </p>
                    <ul>
                      {historialMedico.medicamentos_recetados
                        .filter((med) => med.nombre.trim() !== '')
                        .map((med, index) => (
                          <li key={index}>{med.nombre}</li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="col-md-4">
                <div className="card shadow-sm mt-4 mt-md-0 mb-3">
                  <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <strong>Turno actual</strong>
                    <button
                      type="button"
                      className="btn btn-light btn-sm"
                      onClick={llamarSiguiente}
                      disabled={!!turnoActual || turnos.length === 0}
                      title={
                        turnoActual
                          ? 'Finaliza o marca no atendido para llamar al siguiente'
                          : 'Llamar siguiente en espera'
                      }
                    >
                      📣 Siguiente
                    </button>
                  </div>

                  <div className="card-body">
                    {turnoActual ? (
                      <>
                        <div className="mb-2">
                          <strong>{turnoActual.nombre_paciente}</strong>
                        </div>
                        <div className="text-muted mb-3">
                          {turnoActual.motivo || 'Sin motivo'}
                        </div>

                        <div className="d-flex flex-wrap">
                          <button
                            type="button"
                            className="btn btn-success btn-sm mr-2 mb-2"
                            onClick={() => avisarReanuncio(turnoActual)}
                          >
                            🔊 Llamar de nuevo
                          </button>

                          <button
                            type="button"
                            className="btn btn-danger btn-sm mr-2 mb-2"
                            onClick={() => finalizarTurno(turnoActual.id_turno)}
                          >
                            ✅ Atendido
                          </button>

                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm mb-2"
                            onClick={() => noAtendidoTurno(turnoActual.id_turno)}
                          >
                            🚫 No atendido
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted mb-0">No hay turno activo</p>
                    )}
                  </div>
                </div>

                <div className="card shadow-sm">
                  <div className="card-header bg-info text-white">
                    <strong>Pacientes en espera</strong>
                  </div>

                  <div className="card-body" style={{ maxHeight: '700px', overflowY: 'auto' }}>
                    {turnos.length === 0 ? (
                      <p className="text-muted mb-0">No hay pacientes en espera.</p>
                    ) : (
                      <div className="list-group">
                        {turnos.map((turno) => (
                          <div key={turno.id_turno} className="list-group-item">
                            <button
                              type="button"
                              className="btn btn-link p-0 text-left w-100"
                              style={{ textDecoration: 'none' }}
                              onClick={() => seleccionarTurno(turno)}
                            >
                              <strong>{turno.nombre_paciente}</strong>
                              <br />
                              <small className="text-muted">
                                DPI: {turno.dpi || 'Sin DPI'}
                              </small>
                              <br />
                              <small className="text-muted">
                                Motivo: {turno.motivo || 'Sin motivo'}
                              </small>
                            </button>

                            <div className="mt-2">
                              <button
                                type="button"
                                className="btn btn-success btn-sm mr-2"
                                onClick={() => llamarTurno(turno.id_turno)}
                              >
                                ▶️ Atender
                              </button>

                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => noAtendidoTurno(turno.id_turno)}
                              >
                                🚫 No atendido
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;