document.addEventListener('DOMContentLoaded', () => {
    var mymap = L.map('mapid');
    var polyline = L.polyline([], { color: 'red' }).addTo(mymap);
    var datetimeInicio = document.getElementById('fechahoraInicio');
    var datetimeFinal = document.getElementById('fechahoraFin');
    var markers = [];
    var customIcon = L.icon({
        iconUrl: 'pics/punto.png', // Ruta al archivo de imagen del icono
        iconSize: [32, 32], // Tamaño del icono
        iconAnchor: [16, 16], // Punto de anclaje del icono
        popupAnchor: [0, -32] // Punto de anclaje del popup
    });

    function obtenerFechaHoraActualLocal() {
        // Obtiene la fecha y hora actual en la zona horaria local del dispositivo
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');
        const second = String(now.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    }

    // Establece la fecha máxima al valor actual en la zona horaria local del dispositivo
    datetimeInicio.setAttribute('max', obtenerFechaHoraActualLocal());
    datetimeFinal.setAttribute('max', obtenerFechaHoraActualLocal());

    datetimeInicio.addEventListener('change', function() {
        // Habilita el campo fechahoraFinal solo si fechahoraInicio tiene un valor
        if (datetimeInicio.value) {
            datetimeFinal.disabled = false;
            datetimeFinal.min = datetimeInicio.value; // Establece el mínimo valor permitido para fechahoraFinal basado en fechahoraInicio
        } else {
            datetimeFinal.disabled = true; // Deshabilita fechahoraFinal si fechahoraInicio está vacío
            datetimeFinal.value = ''; // Opcional: limpia fechahoraFinal si fechahoraInicio se limpia
        }
    });

    datetimeFinal.addEventListener('change', function() {
        // Verifica si la fecha y hora de fin es anterior a la fecha y hora de inicio
        if (datetimeInicio.value && datetimeFinal.value < datetimeInicio.value) {
            // Restablece la fecha y hora de fin al valor mínimo permitido si es anterior a la fecha y hora de inicio
            datetimeFinal.value = datetimeInicio.value;
        }
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
    }).addTo(mymap);

    // Añade una capa de mosaico de OpenStreetMap al mapa
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, // Nivel de zoom máximo
        attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors' // Atribución de los datos del mapa
    }).addTo(mymap);

    var mapaCentrado =false;
    var marker =L.marker([0,0]).addTo(mymap);

    function centrarMapaEnUltimaCoordenada() {
        fetch('/ultimos-datos')
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const ultimoDato = data[0];
                mymap.setView([ultimoDato.latitud, ultimoDato.longitud],14);
                marker.setLatLng([ultimoDato.latitud, ultimoDato.longitud]);
                mapaCentrado = true;
            }
        })
        .catch(error => {
            console.error('Error al obtener los últimos datos:', error);
        });
    }

    centrarMapaEnUltimaCoordenada(); // Centrar el mapa al cargar la página

    function cargarDatosHistoricos(fechahoraInicio, fechahoraFin) {
        // Construir la URL de solicitud con los parámetros de filtrado
        const url = `/historicos-datos?fechahoraInicio=${fechahoraInicio}&fechahoraFin=${fechahoraFin}`;

        // Realizar la solicitud al servidor
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.length === 0) {
                    // Ocultar el botón "Ver lugares" si no hay datos
                    verLugaresButton.style.display = 'none';
                    // Mostrar un popup indicando que no hay datos disponibles
                    alert('No se encontraron datos en esta ventana de tiempo');
                    return;
                }
                // Mostrar el botón "Ver lugares"
                verLugaresButton.style.display = 'block';
                polyline.setLatLngs([]);
                data.forEach(dato => {
                    polyline.addLatLng([dato.latitud, dato.longitud]);
                });
                mymap.fitBounds(polyline.getBounds());
                var lastPointIndex = polyline.getLatLngs().length - 1;
                var lastPoint = polyline.getLatLngs()[lastPointIndex];
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

    verLugaresButton.addEventListener('click', () => {
        // Limpiar los marcadores anteriores
        markers.forEach(marker => marker.removeFrom(mymap));
        markers = [];

        // Agregar marcadores en cada punto de la polilínea
        polyline.getLatLngs().forEach(point => {
            var marker = L.marker(point, { icon: customIcon }).addTo(mymap);
            markers.push(marker);
        });

        // Ajustar el mapa para que todos los marcadores sean visibles
        mymap.fitBounds(polyline.getBounds());
    });

    document.getElementById('filtrarDatos').addEventListener('click', () => {
        const fechahoraInicio = document.getElementById('fechahoraInicio').value;
        const fechahoraFin = document.getElementById('fechahoraFin').value;
        cargarDatosHistoricos(fechahoraInicio, fechahoraFin);
    });
});
