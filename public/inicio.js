document.addEventListener('DOMContentLoaded', function() {
    // Obtener el elemento del menú desplegable
    var menuDesplegable = document.getElementById('opcionesMenu');

    // Agregar un listener al cambio de opción en el menú desplegable
    menuDesplegable.addEventListener('change', function(event) {
        // Obtener el valor seleccionado del menú desplegable
        const seleccionado = event.target.value;

        // Verificar el valor seleccionado y redirigir a la página correspondiente
        if (seleccionado === 'rastreoHistoricos') {
            window.location.href = '/historicos.html';
        } else if (seleccionado === 'Inicio') {
            window.location.href = '/inicio.html';
        } else if (seleccionado === 'LocalizadorActual') {
            window.location.href = '/index.html';
        } else if (seleccionado === 'equipoTrabajo') {
            window.location.href = '/Equipo_trabajo.html';
        }
    });
});
