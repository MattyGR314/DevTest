import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ResultadoConsulta.css';

function ResultadoConsulta() {
	const { id } = useParams();
	const { usuario, tipoUsuario } = useAuth();
	const [proyecto, setProyecto] = useState(null);
	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState('');
	const [estaInscrito, setEstaInscrito] = useState(false);

	useEffect(() => {
		const fetchProyecto = async () => {
			setCargando(true);
			setError('');

			try {
				const response = await fetch(`/api/proyectos?q=${encodeURIComponent(id)}&campo=id`);
				if (!response.ok) {
					throw new Error('No se pudo obtener el proyecto');
				}

				const data = await response.json();
				if (!Array.isArray(data) || data.length === 0) {
					setProyecto(null);
					setError('No existe un proyecto con ese ID.');
					return;
				}

				setProyecto(data[0]);
			} catch (err) {
				setError(err.message || 'Error al cargar el proyecto');
			} finally {
				setCargando(false);
			}
		};

		fetchProyecto();
	}, [id]);

	useEffect(() => {
		if (!usuario || !proyecto?.id) return;

		const verificarInscripcion = async () => {
			const inscritosLocal = JSON.parse(localStorage.getItem('mis_inscripciones') || '{}');
			const localIds = inscritosLocal[usuario] || [];

			try {
				const response = await fetch(`/api/inscripciones/usuario?correo=${encodeURIComponent(usuario)}`);
				const data = await response.json();
				const apiIds = data.ids || [];
				const todosIds = [...new Set([...apiIds, ...localIds])];
				setEstaInscrito(todosIds.includes(proyecto.id));
			} catch {
				setEstaInscrito(localIds.includes(proyecto.id));
			}
		};

		verificarInscripcion();
	}, [usuario, proyecto?.id]);

	const formatearFecha = (fecha) => {
		if (!fecha) return 'Sin fecha';
		return new Date(fecha).toLocaleString('es-ES', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const descripcion = proyecto?.descripcion || proyecto?.description || 'Sin descripcion registrada';
	const fichero = proyecto?.nombre_fichero || proyecto?.fichero || 'Sin fichero';

	return (
		<section className="resultado-consulta">
			<div className="resultado-header">
				<h2>Detalle del proyecto</h2>
				<Link to="/busqueda" className="resultado-volver">Volver a busqueda</Link>
			</div>

			{cargando && <p className="resultado-info">Cargando proyecto...</p>}

			{!cargando && error && <p className="resultado-error">{error}</p>}

			{!cargando && !error && proyecto && (
				<article className="resultado-card">
					<p className="resultado-id">Proyecto #{proyecto.id}</p>
					<h3>{proyecto.nombre || 'Sin nombre'}</h3>

					<div className="resultado-meta">
						<p>
							<strong>Fecha:</strong> {formatearFecha(proyecto.fecha_creacion)}
						</p>
						<p className="resultado-descripcion-scroll">
							<strong>Descripcion:</strong> {descripcion}
						</p>
						<p>
							<strong>Fichero:</strong> {fichero}
						</p>
					</div>
					
					<div className="resultado-acciones">
						{!estaInscrito ? (
							<Link to={`/seleccionarproyecto/${proyecto.id}`} className="btn-participar">
								Inscribirse como Tester
							</Link>
						) : (
							<p className="inscrito-msg">Ya estás inscrito en este proyecto.</p>
						)}

						{tipoUsuario === 'tester' && estaInscrito && proyecto.archivo_path && (
							<a
								href={`/${proyecto.archivo_path}`}
								download={proyecto.nombre_fichero || true}
								className="descarga-link btn-descarga"
							>
								Descargar proyecto
							</a>
						)}
					</div>
				</article>
			)}
		</section>
	);
}

export default ResultadoConsulta;