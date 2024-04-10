document.addEventListener('DOMContentLoaded', () => {
    var mymap = L.map('mapid');
    var polyline = L.polyline([], { color: 'blue' }).addTo(mymap);
    var datetimeInicio = document.getElementById('fechahoraInicio');
    var datetimeFinal = document.getElementById('fechahoraFin');
    var filtrarButton = document.getElementById('filtrarDatos');
    var markers = [];
    var datosCompletos = [];
    var customIcon = L.icon({
        iconUrl: 'pics/punto.png', // Ruta al archivo de imagen del icono
        iconSize: [32, 32], // Tamaño del icono
        iconAnchor: [16, 16], // Punto de anclaje del icono
        popupAnchor: [0, -32] // Punto de anclaje del popup
    });

    document.getElementById('filtrarDatos').disabled = true;

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

    function validarFiltrarButton() {
        if (datetimeInicio.value && datetimeFinal.value) {
            filtrarButton.disabled = false;
        } else {
            filtrarButton.disabled = true;
        }
    }

    datetimeInicio.addEventListener('change', function() {
        // Habilita el campo fechahoraFinal solo si fechahoraInicio tiene un valor
        if (datetimeInicio.value) {
            datetimeFinal.disabled = false;
            datetimeFinal.min = datetimeInicio.value; // Establece el mínimo valor permitido para fechahoraFinal basado en fechahoraInicio
        } else {
            datetimeFinal.disabled = true; // Deshabilita fechahoraFinal si fechahoraInicio está vacío
            datetimeFinal.value = ''; // Opcional: limpia fechahoraFinal si fechahoraInicio se limpia
        }
        validarFiltrarButton()
    });

    datetimeFinal.addEventListener('change', function() {
        // Verifica si la fecha y hora de fin es anterior a la fecha y hora de inicio
        if (datetimeInicio.value && datetimeFinal.value < datetimeInicio.value) {
            // Restablece la fecha y hora de fin al valor mínimo permitido si es anterior a la fecha y hora de inicio
            datetimeFinal.value = datetimeInicio.value;
        }
        validarFiltrarButton()
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
        datosCompletos = [];

        // Realizar la solicitud al servidor
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.length === 0) {
                    // Mostrar un popup indicando que no hay datos disponibles
                    alert('No se encontraron datos en esta ventana de tiempo');
                    return;
                }
                datosCompletos = data;
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
    ///////////////// Lugares en polilinea ///////////////////////////////////
                // Limpiar los marcadores anteriores
                markers.forEach(marker => marker.removeFrom(mymap));
                markers = [];

                datosCompletos.forEach(dato => {
                    const punto = [dato.latitud, dato.longitud];
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
                    var marker = L.marker(punto, { icon: customIcon })
                        .bindPopup(`Estuvo acá el ${fechaHoraLegible}`) // Usa fechaHoraLegible el popup
                        .addTo(mymap);
                    markers.push(marker);
                });
            })
    ///////////////// fin lugares en polilinea //////////////////////////////////////
            .catch(error => {
                console.error('Error al cargar los datos históricos:', error);
            });
            
    }

    document.getElementById('filtrarDatos').addEventListener('click', () => {
        const fechahoraInicio = document.getElementById('fechahoraInicio').value;
        const fechahoraFin = document.getElementById('fechahoraFin').value;
        cargarDatosHistoricos(fechahoraInicio, fechahoraFin);
    });
});
