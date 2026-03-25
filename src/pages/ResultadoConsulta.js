import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import './ResultadoConsulta.css';

function ResultadoConsulta() {
	const { id } = useParams();
	const [proyecto, setProyecto] = useState(null);
	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState('');

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
	const fichero = proyecto?.fichero || 'Sin fichero';

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
						<p>
							<strong>Descripcion:</strong> {descripcion}
						</p>
						<p>
							<strong>Fichero:</strong> {fichero}
						</p>
					</div>
				</article>
			)}
		</section>
	);
}

export default ResultadoConsulta;
