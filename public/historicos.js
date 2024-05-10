document.addEventListener('DOMContentLoaded', () => {
    var mymap = L.map('mapid', {
        zoom: 13  // Ajusta este valor según el nivel de zoom inicial que desees
    });
    var polyline = L.polyline([], { color: 'red' }).addTo(mymap);
    var polyline2 = L.polyline([], { color: 'blue' }).addTo(mymap);
    var filtrarButton = document.getElementById('filtrarDatos');
    var datosDePolilinea = [];
    var datosDePolilinea2 = [];
    const slider = document.getElementById('slider');
    
    document.getElementById('filtrarDatos').disabled = true;

    // Inicializar Flatpickr en los campos de fecha y hora
    const flatpickrInicio = flatpickr("#fechahoraInicio", {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        defaultDate: "today", // Establece la fecha predeterminada como hoy
        maxDate: new Date(), // Limita la fecha máxima a hoy
        minuteIncrement: 15, // Salto de 15 minutos
        allowInput: false, // Evita la entrada manual
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
        defaultDate: new Date(), // Establece la fecha predeterminada como hoy
        maxDate: new Date(), // Limita la fecha máxima a hoy
        minuteIncrement: 15, // Salto de 15 minutos
        allowInput: false, // Evita la entrada manual
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

    var myIcon = L.icon({
        iconUrl: 'pics/Carro1.png',
        iconSize: [25, 15], // tamaño del ícono
        iconAnchor: [10, 5], // punto del ícono que corresponderá a la ubicación del marcador
        popupAnchor: [0, 0]
    });
    var myIcon2 = L.icon({
        iconUrl: 'pics/Carro2.png',
        iconSize: [25, 15], // tamaño del ícono
        iconAnchor: [10, 5], // punto del ícono que corresponderá a la ubicación del marcador
        popupAnchor: [0, 0]
    });
    var marker = L.marker([0, 0], {icon: myIcon}).addTo(mymap);
    var marker2 = L.marker([0, 0], {icon: myIcon2}).addTo(mymap);

    function centrarMapaEnUltimaCoordenada() {
        fetch('/ultimos-datos')
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    const ultimoDato = data[0];
                    mymap.setView([ultimoDato.latitud, ultimoDato.longitud]);
                    marker.setLatLng([ultimoDato.latitud, ultimoDato.longitud]);
                    gauge.set(ultimoDato.rpm);
                }
            })
            .catch(error => {
                console.error('Error al obtener los últimos datos:', error);
            });
        fetch('/ultimos-datos2')
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    const ultimoDato = data[0];
                    mymap.setView([ultimoDato.latitud, ultimoDato.longitud]);
                    marker2.setLatLng([ultimoDato.latitud, ultimoDato.longitud]);
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
        const fechaFormateada = fechaHora.toISOString().split('T')[0];
        const horaFormateada = fechaHora.toISOString().split('T')[1].split('.')[0];
        marker.bindPopup(`Pasó el ${fechaFormateada} a las ${horaFormateada} por este punto`).openPopup();
        mymap.panTo(punto);
        const rpm = dato.rpm;
        gauge.set(rpm);

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
                    alert('No se encontraron datos de ningún carro en esta ventana de tiempo');
                    return;
                }
                document.getElementById('slider').style.display = 'block';
                datosDePolilinea = data.historicos_datos.map(dato => ({
                    latLng: [dato.latitud, dato.longitud],
                    fechahora: dato.fechahora,
                    rpm: dato.rpm
                }));
                datosDePolilinea2 = data.historicos_datos2.map(dato => ({
                    latLng: [dato.latitud, dato.longitud],
                    fechahora: dato.fechahora,
                }));  
                const latLngs = datosDePolilinea.map(d => d.latLng);
                const latLngs2 = datosDePolilinea2.map(d => d.latLng);
                polyline.setLatLngs(latLngs);
                polyline2.setLatLngs(latLngs2);
                // Configura el slider
                const slider = document.getElementById('slider');
                slider.max = datosDePolilinea.length - 1;
                const finalPoint = datosDePolilinea.length - 1;
                slider.value = finalPoint;
                actualizarMarcadorYPopup(finalPoint);
                updateSliderBackground();
                const lastPoint = latLngs[latLngs.length - 1];
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
    // Función para manejar el cambio en el menú desplegable
    function cambioCarro() {
        var opcionSeleccionada = document.getElementById("selectorCarros").value;
        switch (opcionSeleccionada) {
        case "Ambos":
            mymap.addLayer(polyline);
            mymap.addLayer(marker);
            mymap.addLayer(polyline2);
            mymap.addLayer(marker2);
            break;
        case "Rojo":
            mymap.removeLayer(polyline2);
            mymap.removeLayer(marker2);
            mymap.addLayer(polyline);
            mymap.addLayer(marker);
            break;
        case "Azul":
            mymap.removeLayer(polyline);
            mymap.removeLayer(marker);
            mymap.addLayer(polyline2);
            mymap.addLayer(marker2);
            break;
        }
    }
    
    // Llama a la función para manejar el cambio en el menú desplegable al cargar la página
    cambioCarro();
    
    // Agrega un event listener para manejar el cambio en el menú desplegable
    document.getElementById("selectorCarros").addEventListener("change", cambioCarro);

    document.getElementById('filtrarDatos').addEventListener('click', () => {
        const fechahoraInicio = document.getElementById('fechahoraInicio').value;
        const fechahoraFin = document.getElementById('fechahoraFin').value;
        cargarDatosHistoricos(fechahoraInicio, fechahoraFin);
        slider.disabled = false;
    });

    function updateSliderBackground() {
        const value = (slider.value - slider.min) / (slider.max - slider.min) * 100;
        slider.style.background = `linear-gradient(to right, rgb(0, 208, 7) 0%, rgb(0, 208, 7) ${value}%, #ddd ${value}%, #ddd 100%)`;
    }

    document.getElementById('slider').addEventListener('input', function() {
        updateSliderBackground()
        actualizarMarcadorYPopup(this.value);
    });

    var target = document.getElementById('gauge-canvas');
    var gauge = new Gauge(target).setOptions(opts);
    gauge.maxValue = 6000;
    gauge.animationSpeed = 32;
});
