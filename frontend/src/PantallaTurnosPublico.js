import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './PantallaTurnosTV.css';

const URL = process.env.REACT_APP_URL_BACKEND || 'http://localhost:3001';

export default function PantallaTurnosTV() {
  const [turnoActual, setTurnoActual] = useState(null);
  const [enEspera, setEnEspera] = useState([]);
  const [hora, setHora] = useState(new Date());
  const prevActualIdRef = useRef(null);

  const speak = (texto) => {
    try {
      window.speechSynthesis.cancel();
      const voz = new SpeechSynthesisUtterance(texto);
      voz.lang = 'es-ES';
      window.speechSynthesis.speak(voz);
    } catch (e) {
      console.warn('SpeechSynthesis no soportado', e);
    }
  };

  const fetchTurnos = async () => {
    try {
      const [actualRes, esperaRes] = await Promise.all([
        axios.get(`${URL}/api/turnos/actual`),
        axios.get(`${URL}/api/turnos/espera`)
      ]);

      const actual = actualRes.data || null;
      const espera = Array.isArray(esperaRes.data) ? esperaRes.data : [];

      setTurnoActual(actual);
      setEnEspera(espera);

      if (actual && prevActualIdRef.current !== actual.id_turno) {
        prevActualIdRef.current = actual.id_turno;
        speak(`${actual.nombre_paciente}, favor de pasar a consulta.`);
      }

      if (!actual) {
        prevActualIdRef.current = null;
      }
    } catch (e) {
      console.error('Error cargando turnos:', e);
    }
  };

  useEffect(() => {
    fetchTurnos();
    const i = setInterval(fetchTurnos, 5000);
    const r = setInterval(() => setHora(new Date()), 1000);

    return () => {
      clearInterval(i);
      clearInterval(r);
    };
  }, []);

  useEffect(() => {
    let ch;

    try {
      ch = new BroadcastChannel('turnos_channel');
      ch.onmessage = (ev) => {
        const data = ev.data || {};
        if (data.type === 'reanuncio') {
          speak(`${data.nombre_paciente}, favor de pasar a consulta.`);
        }
      };
    } catch {}

    const onStorage = (ev) => {
      if (ev.key === 'turno_reanuncio' && ev.newValue) {
        try {
          const data = JSON.parse(ev.newValue);
          if (data && data.type === 'reanuncio') {
            speak(`${data.nombre_paciente}, favor de pasar a consulta.`);
          }
        } catch {}
      }
    };

    window.addEventListener('storage', onStorage);

    return () => {
      if (ch) ch.close();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return (
    <div className="tv-root">
      <div className="tv-container">
        <header className="tv-header">
          <h1>Turno en curso</h1>
          <span className="tv-clock">{hora.toLocaleTimeString()}</span>
        </header>

        <main className="tv-main">
          <section className="tv-actual">
            {turnoActual ? (
              <div className="tv-card tv-card-actual">
                <div className="tv-actual-nombre">{turnoActual.nombre_paciente}</div>
                <div className="tv-actual-motivo">
                  {turnoActual.motivo || 'Consulta'}
                </div>
                <div className="tv-badge">ATENDIENDO</div>
              </div>
            ) : (
              <div className="tv-card tv-card-actual">Esperando nuevo turno</div>
            )}
          </section>

          <section className="tv-lista">
            <h2>Siguientes</h2>
            {enEspera.length === 0 ? (
              <div className="tv-lista-vacia">No hay turnos en espera</div>
            ) : (
              <ul className="tv-ul">
                {enEspera.slice(0, 24).map((t) => (
                  <li key={t.id_turno} className="tv-item">
                    <span className="tv-item-nombre">{t.nombre_paciente}</span>
                    <span className="tv-item-motivo">{t.motivo || 'Consulta'}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>

        <footer className="tv-footer">
          Clínica Jerusalem · {new Date().toLocaleDateString()}
        </footer>
      </div>
    </div>
  );
}