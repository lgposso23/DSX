document.addEventListener('DOMContentLoaded', () => {
    var mymap = L.map('mapid');
    var polyline = L.polyline([], { color: 'red' }).addTo(mymap);

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

    function centrarMapaEnUltimaCoordenada() {
        fetch('/ultimos-datos')
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const ultimoDato = data[0];
                mymap.setView([ultimoDato.latitud, ultimoDato.longitud],14);
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
        const url = `/historicos-datos?fechahoraInicio=${fechahoraInicio}&fechahoraFin=${fechahoraFin}}`;

        // Realizar la solicitud al servidor
        fetch(url)
            .then(response => response.json())
            .then(data => {
                polyline.setLatLngs([]);
                data.forEach(dato => {
                    polyline.addLatLng([dato.latitud, dato.longitud]);
                });
                mymap.fitBounds(polyline.getBounds());
                var lastPointIndex = polyline.getLatLngs().length - 1;
                var lastPoint = polyline.getLatLngs()[lastPointIndex];
                var marker = L.marker(lastPoint).addTo(mymap);
            })
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
