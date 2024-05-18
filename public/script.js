document.addEventListener('DOMContentLoaded', () => {
    // Conecta con el servidor Socket.IO automáticamente
    const socket = io();
    const interruptor = document.getElementById('centrarMapaInterruptor');
    const botonCentrarManualmente = document.getElementById('centrarManualmenteButton');

    centrarManualmenteButton.addEventListener('click', function() {
        var opcionSeleccionada = document.getElementById("selectorCarros").value;
        if (opcionSeleccionada==="Azul"){
            mymap.panTo(marker2.getLatLng());
        } 
        if (opcionSeleccionada==="Rojo"){
            mymap.panTo(marker.getLatLng());
        }
        if (opcionSeleccionada==="Ambos"){
            bounds = L.latLngBounds();
            bounds.extend(marker.getLatLng());
            bounds.extend(marker2.getLatLng());
            mymap.fitBounds(bounds, { padding: [50, 50] });
        }
    });

    // Crea e inicializa el mapa
    var mymap = L.map('mapid', {
        zoom: 13  // Ajusta este valor según el nivel de zoom inicial que desees
    });
    var polyline = L.polyline([], { color: 'red' }).addTo(mymap);
    var polyline2 = L.polyline([], { color: 'blue' }).addTo(mymap);
    var myIcon = L.icon({
        iconUrl: 'pics/Carro1.png',
        iconSize: [25, 15], // tamaño del ícono
        iconAnchor: [0, 0], // punto del ícono que corresponderá a la ubicación del marcador
    });
    var myIcon2 = L.icon({
        iconUrl: 'pics/Carro2.png',
        iconSize: [25, 15], // tamaño del ícono
        iconAnchor: [0, 0], // punto del ícono que corresponderá a la ubicación del marcador
    });

    // Añade una capa de mosaico de OpenStreetMap al mapa
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(mymap);

    var marker = L.marker([0, 0], {icon: myIcon}).addTo(mymap);
    var marker2 = L.marker([0, 0], {icon: myIcon2}).addTo(mymap);

    // Función para centrar el mapa en la última coordenada almacenada en la base de datos
    function centrarMapaEnUltimaCoordenada() {
        Promise.all([
            fetch('/ultimos-datos').then(response => response.json()),
            fetch('/ultimos-datos2').then(response => response.json())
        ]).then(data => {
            const ultimoDato = data[0][0];  // Respuesta del primer fetch
            const ultimoDato2 = data[1][0]; // Respuesta del segundo fetch
    
            marker.setLatLng([ultimoDato.latitud, ultimoDato.longitud]);
            gauge.set(ultimoDato.rpm); // Asumiendo que gauge también necesita actualizarse
    
            marker2.setLatLng([ultimoDato2.latitud, ultimoDato2.longitud]);
    
            // Reiniciar y establecer los límites alrededor de las nuevas posiciones
            bounds = L.latLngBounds();
            bounds.extend(marker.getLatLng());
            bounds.extend(marker2.getLatLng());
            mymap.fitBounds(bounds, { padding: [50, 50] });
        }).catch(error => {
            console.error('Error al obtener los últimos datos:', error);
        });
    }

    centrarMapaEnUltimaCoordenada(); // Centrar el mapa al cargar la página
    // Función para manejar el cambio en el menú desplegable
    function cambioCarro() {
        var opcionSeleccionada = document.getElementById("selectorCarros").value;
        switch (opcionSeleccionada) {
        case "Ambos":
            mymap.addLayer(polyline);
            mymap.addLayer(marker);
            mymap.addLayer(polyline2);
            mymap.addLayer(marker2);
            bounds = L.latLngBounds();
            bounds.extend(marker.getLatLng());
            bounds.extend(marker2.getLatLng());
            mymap.fitBounds(bounds, { padding: [50, 50] });
            break;
        case "Rojo":
            mymap.removeLayer(polyline2);
            mymap.removeLayer(marker2);
            mymap.addLayer(polyline);
            mymap.addLayer(marker);
            mymap.panTo(marker.getLatLng());
            break;
        case "Azul":
            mymap.removeLayer(polyline);
            mymap.removeLayer(marker);
            mymap.addLayer(polyline2);
            mymap.addLayer(marker2);
            mymap.panTo(marker2.getLatLng());
            break;
        }
    }
    
    // Agrega un event listener para manejar el cambio en el menú desplegable
    document.getElementById("selectorCarros").addEventListener("change", cambioCarro);
  

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
    function moverMarcadorYActualizarHistorial2(latitud, longitud) {
        // Mueve el marcador a la nueva ubicación
        marker2.setLatLng([latitud, longitud]);
        // Agrega la nueva ubicación al historial
        polyline2.addLatLng([latitud, longitud]);
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
    socket.on('updateData2', function(data2) {
        console.log('Datos recibidos del servidor:', data2);
        document.getElementById('fechaValue').textContent = data2.fecha;
        document.getElementById('timestampValue').textContent = data2.hora;
        moverMarcadorYActualizarHistorial2(data2.latitud, data2.longitud);
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
    gauge.maxValue = 6000;
    gauge.animationSpeed = 30;
});
