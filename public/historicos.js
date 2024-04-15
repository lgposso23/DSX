document.addEventListener('DOMContentLoaded', () => {
    var mymap = L.map('mapid');
    var menuDesplegable = document.getElementById('opcionesMenu');
    var polyline = L.polyline([], { color: 'white' }).addTo(mymap);
    var filtrarButton = document.getElementById('filtrarDatos');
    var datosDePolilinea = [];
    const slider = document.getElementById('slider');
    
    document.getElementById('filtrarDatos').disabled = true;

    // Inicializar Flatpickr en los campos de fecha y hora
    const flatpickrInicio = flatpickr("#fechahoraInicio", {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        defaultDate: "today", // Establece la fecha predeterminada como hoy
        maxDate: "today", // Limita la fecha máxima a hoy
        disableMobile: true, // Evita que aparezca el teclado en dispositivos móviles
        onClose: function(selectedDates, dateStr, instance) {
            // Habilita el campo de fecha y hora final y establece su fecha mínima
            flatpickrFinal.set("minDate", dateStr || "today");
            flatpickrFinal.open(); // Abre automáticamente el selector de fecha y hora final
            flatpickrFinal.element.disabled = false; // Habilita el campo de fecha y hora final
            validarFiltrarButton(); // Valida el botón de filtro después de cada cambio
        }
    });

    const flatpickrFinal = flatpickr("#fechahoraFin", {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        defaultDate: "today", // Establece la fecha predeterminada como hoy
        maxDate: "today", // Limita la fecha máxima a hoy
        disableMobile: true, // Evita que aparezca el teclado en dispositivos móviles
        onClose: function(selectedDates, dateStr, instance) {
            validarFiltrarButton(); // Valida el botón de filtro después de cada cambio
        }
    });

    function validarFiltrarButton() {
        const fechaInicio = flatpickrInicio.selectedDates[0];
        const fechaFinal = flatpickrFinal.selectedDates[0];
        if (fechaInicio && fechaFinal && fechaInicio <= fechaFinal) {
            filtrarButton.disabled = false;
        } else {
            filtrarButton.disabled = true;
        }
    }


    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(mymap);

    var marker =L.marker([0,0]).addTo(mymap);

    function centrarMapaEnUltimaCoordenada() {
        fetch('/ultimos-datos')
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const ultimoDato = data[0];
                mymap.setView([ultimoDato.latitud, ultimoDato.longitud],14);
                marker.setLatLng([ultimoDato.latitud, ultimoDato.longitud]);
            }
        })
        .catch(error => {
            console.error('Error al obtener los últimos datos:', error);
        });
    }

    centrarMapaEnUltimaCoordenada(); // Centrar el mapa al cargar la página

    function actualizarMarcadorYPopup(index) {
        const dato = datosDePolilinea[index];
        const punto = new L.LatLng(dato.latLng[0], dato.latLng[1]);
        if (!marker) {
            marker = L.marker(punto).addTo(mymap);
        } else {
            marker.setLatLng(punto);
        }
        const fechaHoraISO = dato.fechahora;
        const fechaHora = new Date(fechaHoraISO);
        const fechaHoraLegible = fechaHora.toLocaleString('es-ES', { 
            year: 'numeric', // Año (cuatro dígitos)
            month: '2-digit', // Mes (dos dígitos)
            day: '2-digit', // Día del mes (dos dígitos)
            hour: 'numeric', // Hora (formato de 12 horas)
            minute: 'numeric', // Minutos
            second: 'numeric', // Segundos
            hour12: true // Usar formato de 12 horas (true) o 24 horas (false)
        });
        marker.bindPopup(`Estuvo acá el ${fechaHoraLegible}`).openPopup();
        mymap.panTo(punto);
    }    

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
                const filteredData = [data[0]]; // Inicialmente agregamos el primer punto sin filtrar
                let previousPoint = data[0];
                for (let i = 1; i < data.length; i++) {
                    const currentPoint = data[i];
                    const distance = calcularDistancia(previousPoint.latitud, previousPoint.longitud, currentPoint.latitud, currentPoint.longitud);
                    if (distance < 1000) { // Si la distancia es menor a 1 km (1000 metros)
                        filteredData.push(currentPoint);
                        previousPoint = currentPoint;
                    } else {
                        // Si la distancia es mayor a 1 km, no agregamos este punto y continuamos con el siguiente
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
    

    document.getElementById('filtrarDatos').addEventListener('click', () => {
        const fechahoraInicio = document.getElementById('fechahoraInicio').value;
        const fechahoraFin = document.getElementById('fechahoraFin').value;
        cargarDatosHistoricos(fechahoraInicio, fechahoraFin);
        slider.disabled = false;
    });

    function updateSliderBackground() {
        const value = (slider.value - slider.min) / (slider.max - slider.min) * 100;
        slider.style.background = `linear-gradient(to right, rgb(167, 184, 181) 0%, rgb(167, 184, 181) ${value}%, #ddd ${value}%, #ddd 100%)`;
    }

    document.getElementById('slider').addEventListener('input', function() {
        updateSliderBackground()
        actualizarMarcadorYPopup(this.value);
    });

    menuDesplegable.addEventListener('change', function(event) {
        // Obtener el valor seleccionado del menú desplegable
        const seleccionado = event.target.value;

        // Verificar el valor seleccionado y redirigir a la página correspondiente
        if (seleccionado === 'rastreoHistoricos') {
            window.location.href = '/historicos.html';
        } else if (seleccionado === 'Principal') {
            window.location.href = '/principal.html';
        } else if (seleccionado === 'LocalizadorActual') {
            window.location.href = '/index.html';
        } else if (seleccionado === 'equipoTrabajo') {
            window.location.href = '/Equipo_trabajo.html';
        }
    });
    
});
