document.addEventListener('DOMContentLoaded', () => {
    // Conecta con el servidor Socket.IO automáticamente
    const socket = io();
    const interruptor = document.getElementById('centrarMapaInterruptor');
    const botonCentrarManualmente = document.getElementById('centrarManualmenteButton');

    centrarManualmenteButton.addEventListener('click', function() {
        // Centrar el mapa manualmente
        centrarMapaEnUltimaCoordenada();
    });

    // Crea e inicializa el mapa
    var mymap = L.map('mapid', {
        zoom: 13  // Ajusta este valor según el nivel de zoom inicial que desees
    });
    var polyline = L.polyline([], { color: 'red' }).addTo(mymap);

    // Añade una capa de mosaico de OpenStreetMap al mapa
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(mymap);

    var marker = L.marker([0, 0]).addTo(mymap);

    // Función para centrar el mapa en la última coordenada almacenada en la base de datos
    function centrarMapaEnUltimaCoordenada() {
        fetch('/ultimos-datos')
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    const ultimoDato = data[0];
                    mymap.setView([ultimoDato.latitud, ultimoDato.longitud]);
                    marker.setLatLng([ultimoDato.latitud, ultimoDato.longitud]);
                }
            })
            .catch(error => {
                console.error('Error al obtener los últimos datos:', error);
            });
    }

    centrarMapaEnUltimaCoordenada(); // Centrar el mapa al cargar la página

    // Función para mover el marcador y actualizar el historial
    function moverMarcadorYActualizarHistorial(latitud, longitud) {
        // Mueve el marcador a la nueva ubicación
        marker.setLatLng([latitud, longitud]);
        // Agrega la nueva ubicación al historial
        polyline.addLatLng([latitud, longitud]);
        // Centra el mapa si el interruptor está activado
        if (document.getElementById('centrarMapaInterruptor').checked) {
            mymap.setView([latitud, longitud]);
        }
    }

    // Escucha el evento 'updateData' del servidor Socket.IO
    socket.on('updateData', function(data) {
        console.log('Datos recibidos del servidor:', data);
        document.getElementById('fechaValue').textContent = data.fecha;
        document.getElementById('timestampValue').textContent = data.hora;
        // Actualiza las coordenadas del marcador
        moverMarcadorYActualizarHistorial(data.latitud, data.longitud);
        gauge.set(data.rpm)
    });
    function toggleButtonVisibility() {
        botonCentrarManualmente.style.display = interruptor.checked ? 'none' : 'block';
    }
    interruptor.addEventListener('change', function() {
        // Si el interruptor está activado, deshabilita el botón de centrar manualmente
        if (this.checked) {
            botonCentrarManualmente.disabled = true;
            toggleButtonVisibility();
        } else {
            // Si el interruptor está desactivado, habilita el botón de centrar manualmente
            botonCentrarManualmente.disabled = false;
            toggleButtonVisibility();
        }
    });

   

    // Deshabilita el interruptor por defecto
    document.getElementById('centrarMapaInterruptor').checked = true;

    // Cambia el comportamiento del interruptor
    document.getElementById('centrarMapaInterruptor').addEventListener('change', function(event) {
        const interruptor = event.target;
        if (interruptor.checked) {
            // Habilitar el centrado automático del mapa
            console.log('Centrado automático activado');
        } else {
            // Deshabilitar el centrado automático del mapa
            console.log('Centrado automático desactivado');
        }
    });

    var target = document.getElementById('gauge-canvas');
    var gauge = new Gauge(target).setOptions(opts);
    gauge.maxValue = 8000;
    gauge.animationSpeed = 32;
    gauge.set(0);
});
