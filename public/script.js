document.addEventListener('DOMContentLoaded', () => {
    // Conecta con el servidor Socket.IO automáticamente
    const socket = io();

    // Crea e inicializa el mapa
    var mymap = L.map('mapid');
    var polyline = L.polyline([], { color: 'blue' }).addTo(mymap);

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
                    mymap.setView([ultimoDato.latitud, ultimoDato.longitud], 13);
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

function formatearFecha(fecha) {
    // Asegúrate de que la entrada sea un objeto Date
    if (!(fecha instanceof Date)) {
        fecha = new Date(fecha);
    }

    // Obtén la fecha en formato YYYY-MM-DD
    const fechaFormateada = fecha.toISOString().slice(0, 10);

    return fechaFormateada;
}

let intervaloActualizacion = null;
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
function mostrarTabla() {
    fetch('/ultimos-datos')
        .then(response => response.json())
        .then(data => {
            actualizarTabla(data);
            document.getElementById('tablaContainer').style.display = 'block'; // Mostrar la tabla
            document.getElementById('mapid').style.display = 'none'; // Ocultar el mapa
        })
        .catch(error => {
            console.error('Error al obtener los últimos datos:', error);
        });
}

// Escucha el evento change del menú desplegable
document.getElementById('seleccionMenu').addEventListener('change', (event) => {
    const seleccion = event.target.value;
    if (seleccion === 'mapa') {
        centrarMapaEnUltimaCoordenada();
        document.getElementById('tablaContainer').style.display = 'none'; // Ocultar la tabla
        document.getElementById('mapid').style.display = 'block'; // Mostrar el mapa
        // Limpiar intervalo de actualización si existe
        if (intervaloActualizacion) {
            clearInterval(intervaloActualizacion);
            intervaloActualizacion = null;
        }
    } else if (seleccion === 'basededatos') {
        mostrarTabla();
        intervaloActualizacion = setInterval(mostrarTabla, 1000);
    }
});

// Función para actualizar la tabla con los datos recibidos
function actualizarTabla(data) {
    var tableBody = document.getElementById('tabla-body');
    tableBody.innerHTML = '';
    data.forEach(dato => {
        var row = tableBody.insertRow();
        row.insertCell(0).textContent = dato.latitud;
        row.insertCell(1).textContent = dato.longitud;
        row.insertCell(2).textContent = formatearFecha(dato.fecha); // Formatear la fecha
        row.insertCell(3).textContent = dato.hora;
    });
}
});
