document.addEventListener('DOMContentLoaded', () => {
    // Conecta con el servidor Socket.IO automáticamente
    const socket = io();

    // Crea e inicializa el mapa
    var mymap = L.map('mapid');
    var polyline = L.polyline([], { color: 'red' }).addTo(mymap);

    // Añade una capa de mosaico de OpenStreetMap al mapa
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, // Nivel de zoom máximo
        attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors' // Atribución de los datos del mapa
    }).addTo(mymap);

    var mapaCentrado =false;
    var marker =L.marker([0,0]).addTo(mymap);

    // Función para centrar el mapa en la última coordenada almacenada en la base de datos
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

    // Función para mover el marcador y actualizar el historial
    function moverMarcadorYActualizarHistorial(latitud, longitud) {
        // Mueve el marcador a la nueva ubicación
        marker.setLatLng([latitud, longitud]);    
        // Agrega la nueva ubicación al historial
        polyline.addLatLng([latitud, longitud]);
    }

    // Escucha el evento 'updateData' del servidor Socket.IO
    socket.on('updateData', function(data) {
        console.log('Datos recibidos del servidor:', data);
        document.getElementById('longitudValue').textContent = data.longitud;
        document.getElementById('latitudValue').textContent = data.latitud;
        document.getElementById('fechaValue').textContent = data.fecha;
        document.getElementById('timestampValue').textContent = data.hora;
        // Actualiza las coordenadas del marcador
        moverMarcadorYActualizarHistorial(data.latitud, data.longitud);
        if (!mapaCentrado) {
            mymap.setView([data.latitud, data.longitud], 13);
            mapaCentrado = true;
        }
    });

    // Maneja el evento click del botón para ver el mapa
    document.getElementById('mapButton').addEventListener('click', () => {
        centrarMapaEnUltimaCoordenada();
    });

    const historicosBtn = document.getElementById('historicosButton');
    if (historicosBtn) {
        historicosBtn.addEventListener('click', () => {
            window.open('/historicos', '_blank');
        });
    }
});
