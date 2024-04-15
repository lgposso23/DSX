function cargarDatosHistoricos(fechahoraInicio, fechahoraFin) {
    // Construir la URL de solicitud con los parámetros de filtrado
    const url = `/historicos-datos?fechahoraInicio=${fechahoraInicio}&fechahoraFin=${fechahoraFin}`;

    // Realizar la solicitud al servidor
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                // Mostrar un popup indicando que no hay datos disponibles
                alert('No se encontraron datos en esta ventana de tiempo');
                document.getElementById('slider').style.display = 'none'; // Oculta el slider si no hay datos
                return;
            }
            document.getElementById('slider').style.display = 'block';
            
            // Filtrar los datos para eliminar los puntos que están a más de 1 km de distancia entre sí
            const filteredData = [];
            for (let i = 0; i < data.length; i++) {
                if (i === 0) {
                    // Si es el primer punto, agregarlo directamente
                    filteredData.push(data[i]);
                } else {
                    // Calcular la distancia entre el punto actual y el anterior
                    const distancia = calcularDistancia(data[i - 1].latitud, data[i - 1].longitud, data[i].latitud, data[i].longitud);
                    if (distancia < 1000) { // Si la distancia es menor a 1 km (1000 metros)
                        filteredData.push(data[i]);
                    }
                }
            }
            
            // Actualizar la polilínea con los datos filtrados
            datosDePolilinea = filteredData.map(dato => ({
                latLng: [dato.latitud, dato.longitud],
                fechahora: dato.fechahora
            }));
            const latLngs = datosDePolilinea.map(d => d.latLng);
            polyline.setLatLngs(latLngs);
            
            // Configura el slider
            const slider = document.getElementById('slider');
            slider.max = datosDePolilinea.length - 1;
            const finalPoint = datosDePolilinea.length - 1;
            slider.value = finalPoint;
            actualizarMarcadorYPopup(finalPoint);
            updateSliderBackground();
            if (marker) {
                marker.setLatLng(lastPoint);
            } else {
                marker = L.marker(lastPoint).addTo(mymap);
            }
        })
        .catch(error => {
            console.error('Error al cargar los datos históricos:', error);
        });
}

// Función para calcular la distancia entre dos puntos en coordenadas geográficas
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180; // Convertir latitud 1 a radianes
    const φ2 = lat2 * Math.PI / 180; // Convertir latitud 2 a radianes
    const Δφ = (lat2 - lat1) * Math.PI / 180; // Diferencia de latitud en radianes
    const Δλ = (lon2 - lon1) * Math.PI / 180; // Diferencia de longitud en radianes

    // Fórmula de Haversine
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Distancia en metros
    const distancia = R * c;
    return distancia;
}
