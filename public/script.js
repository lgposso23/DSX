document.addEventListener('DOMContentLoaded', () => {
    // Conecta con el servidor Socket.IO automáticamente
    const socket = io();
    const menuDesplegable = document.getElementById('menuDesplegable1');

    // Crea e inicializa el mapa
    var mymap = L.map('mapid');
    var polyline = L.polyline([], { color: 'red' }).addTo(mymap);

    // Añade una capa de mosaico de OpenStreetMap al mapa
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(mymap);

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
        //Centra con el marcador
        
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
    });

    const historicosBtn = document.getElementById('historicosButton');
    if (historicosBtn) {
        historicosBtn.addEventListener('click', () => {
            window.open('/historicos', '_blank');
        });
    }
    const ubicarCamionBtn = document.getElementById('ubicarCamionButton');
    if (ubicarCamionBtn) {
        ubicarCamionBtn.addEventListener('click', () => {
            // Realizar la solicitud al servidor para obtener la última ubicación y actualizar el mapa
            fetch('/ultimos-datos')
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    const ultimaUbicacion = data[0];
                    // Actualizar el mapa con la última ubicación
                    mymap.setView([ultimaUbicacion.latitud, ultimaUbicacion.longitud], 15);
                    marker.setLatLng([ultimaUbicacion.latitud, ultimaUbicacion.longitud]);
                } else {
                    console.log('No se encontraron datos de ubicación.');
                }
            })
            .catch(error => {
                console.error('Error al obtener la última ubicación:', error);
            });
        });
    }
    menuDesplegable.addEventListener('change', function(event) {
        // Obtener el valor seleccionado del menú desplegable
        const seleccionado = event.target.value;
    
        // Verificar si la opción seleccionada es "Rastreo de Históricos"
        if (seleccionado === 'rastreoHistoricos') {
            // Redirigir al usuario a la página de historiales
            window.location.href = '/historicos.html';
        }
        else if (seleccionado  === 'Inicio'){
            window.location.href = '/inicio.html';
        }
        else if (seleccionado  === 'LocalizadorActual'){
            window.location.href = '/index.html';
        }
        else if (seleccionado  === 'equipoTrabajo'){
            window.location.href = '/Equipo_trabajo.html';
        }

    });
});
