import React, { useEffect, useState } from "react";
import Sidebar from "./sidebar";
import Navbar from "./Navbar";
import axios from "axios";
import "./Home.css";
import "bootstrap/dist/css/bootstrap.min.css";

const URL = process.env.REACT_APP_URL_BACKEND || "http://localhost:3001";

const Enfermero = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const hoy = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    id_paciente: "",
    nombre_paciente: "",
    dpi: "",
    telefono: "",
    fecha_consulta: hoy,
    sexo: "",
    fecha_nacimiento: "",
    motivo: "",
    presion_arterial: "",
    temperatura: "",
    frecuencia_cardiaca: "",
    frecuencia_respiratoria: "",
    saturacion_oxigeno: "",
    glucemia: "",
    peso: "",
    talla: "",
  });

  const [sugerencias, setSugerencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      fecha_consulta: hoy,
    }));
  }, [hoy]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNombreChange = async (e) => {
    const value = e.target.value;

    setFormData((prev) => ({
      ...prev,
      id_paciente: "",
      nombre_paciente: value,
    }));

    if (value.trim().length >= 3) {
      try {
        const { data } = await axios.get(`${URL}/api/buscar_pacientes_turnos`, {
          params: { nombre: value },
        });

        setSugerencias(data || []);
      } catch (error) {
        console.error("Error al buscar pacientes:", error);
        setSugerencias([]);
      }
    } else {
      setSugerencias([]);
    }
  };

  const handleSeleccionarSugerencia = (paciente) => {
    setFormData((prev) => ({
      ...prev,
      id_paciente: paciente.id_paciente || "",
      nombre_paciente: paciente.nombre || "",
      dpi: paciente.dpi || "",
      telefono: paciente.telefono || "",
      sexo: paciente.sexo || "",
      fecha_nacimiento: paciente.fecha_nacimiento
        ? paciente.fecha_nacimiento.slice(0, 10)
        : "",
    }));

    setSugerencias([]);
  };

  const limpiarFormulario = () => {
    setFormData({
      id_paciente: "",
      nombre_paciente: "",
      dpi: "",
      telefono: "",
      fecha_consulta: new Date().toISOString().split("T")[0],
      sexo: "",
      fecha_nacimiento: "",
      motivo: "",
      presion_arterial: "",
      temperatura: "",
      frecuencia_cardiaca: "",
      frecuencia_respiratoria: "",
      saturacion_oxigeno: "",
      glucemia: "",
      peso: "",
      talla: "",
    });
    setSugerencias([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (
      !formData.nombre_paciente ||
      !formData.dpi ||
      !formData.telefono ||
      !formData.sexo ||
      !formData.fecha_nacimiento
    ) {
      setError("Completa los campos obligatorios.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...formData,
        dpi: formData.dpi.replace(/-/g, ""),
        estado: "espera",
      };

      const res = await axios.post(`${URL}/api/turnos_tem`, payload);
      console.log("✅ Turno guardado:", res.data);

      setMensaje("Turno registrado correctamente.");
      limpiarFormulario();
    } catch (err) {
      console.error("❌ Error al guardar turno:", err);
      setError(
        err?.response?.data?.message ||
          "Ocurrió un error al guardar el turno."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className={`d-flex ${isSidebarOpen ? "toggled" : ""}`} id="wrapper">
        <Sidebar isOpen={isSidebarOpen} />
        {isSidebarOpen && (
          <div className="overlay" onClick={() => setSidebarOpen(false)}></div>
        )}

        <div id="page-content-wrapper">
          <Navbar toggleSidebar={toggleSidebar} />

          <div className="container-fluid mt-4">
            <div className="mb-3">
              <h3 className="mb-1">Registro temporal de turno</h3>
              <p className="text-muted mb-0">
                Busca al paciente desde la tabla de pacientes para reutilizar sus datos.
              </p>
            </div>

            {mensaje && <div className="alert alert-success">{mensaje}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="card shadow-sm mb-4">
                <div className="card-header bg-primary text-white">
                  <strong>Datos del paciente</strong>
                </div>

                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3 position-relative">
                      <label className="form-label">Nombre del paciente *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="nombre_paciente"
                        value={formData.nombre_paciente}
                        onChange={handleNombreChange}
                        autoComplete="off"
                        placeholder="Ingrese el nombre del paciente"
                      />

                      {sugerencias.length > 0 && (
                        <ul className="suggestions-list">
                          {sugerencias.map((paciente) => (
                            <li
                              key={paciente.id_paciente}
                              onClick={() => handleSeleccionarSugerencia(paciente)}
                              style={{ cursor: "pointer" }}
                            >
                              <strong>{paciente.nombre}</strong>
                              {paciente.dpi ? ` - DPI: ${paciente.dpi}` : ""}
                              {paciente.telefono ? ` - Tel: ${paciente.telefono}` : ""}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">DPI *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="dpi"
                        value={formData.dpi}
                        onChange={handleChange}
                        maxLength={13}
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Teléfono *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Fecha de consulta</label>
                      <input
                        type="date"
                        className="form-control"
                        name="fecha_consulta"
                        value={formData.fecha_consulta}
                        readOnly
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Sexo *</label>
                      <select
                        className="form-control"
                        name="sexo"
                        value={formData.sexo}
                        onChange={handleChange}
                      >
                        <option value="">Seleccione</option>
                        <option value="Hombre">Hombre</option>
                        <option value="Mujer">Mujer</option>
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Fecha de nacimiento *</label>
                      <input
                        type="date"
                        className="form-control"
                        name="fecha_nacimiento"
                        value={formData.fecha_nacimiento}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-12 mb-3">
                      <label className="form-label">Motivo</label>
                      <textarea
                        className="form-control"
                        name="motivo"
                        value={formData.motivo}
                        onChange={handleChange}
                        rows="2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card shadow-sm mb-4">
                <div className="card-header bg-success text-white">
                  <strong>Signos vitales</strong>
                </div>

                <div className="card-body">
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Presión arterial</label>
                      <input
                        type="text"
                        className="form-control"
                        name="presion_arterial"
                        value={formData.presion_arterial}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-4 mb-3">
                      <label className="form-label">Temperatura</label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-control"
                        name="temperatura"
                        value={formData.temperatura}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-4 mb-3">
                      <label className="form-label">Frecuencia cardíaca</label>
                      <input
                        type="number"
                        className="form-control"
                        name="frecuencia_cardiaca"
                        value={formData.frecuencia_cardiaca}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-4 mb-3">
                      <label className="form-label">Frecuencia respiratoria</label>
                      <input
                        type="number"
                        className="form-control"
                        name="frecuencia_respiratoria"
                        value={formData.frecuencia_respiratoria}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-4 mb-3">
                      <label className="form-label">Saturación de oxígeno</label>
                      <input
                        type="number"
                        className="form-control"
                        name="saturacion_oxigeno"
                        value={formData.saturacion_oxigeno}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-4 mb-3">
                      <label className="form-label">Glucemia</label>
                      <input
                        type="number"
                        className="form-control"
                        name="glucemia"
                        value={formData.glucemia}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Peso</label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-control"
                        name="peso"
                        value={formData.peso}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Talla</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        name="talla"
                        value={formData.talla}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary me-2" disabled={loading}>
                {loading ? "Guardando..." : "Guardar turno"}
              </button>

              <button type="button" className="btn btn-secondary" onClick={limpiarFormulario}>
                Limpiar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Enfermero;