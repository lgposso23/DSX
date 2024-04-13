document.addEventListener('DOMContentLoaded', function() {
    // Obtener el elemento del menú desplegable
    const menuDesplegable = document.getElementById('opcionesMenu');
    
    switch (nombrePagina) {
        case 'historicos.html':
            menuDesplegable.value = 'rastreoHistoricos';
            break;
        case 'Principal.html':
            menuDesplegable.value = 'Principal';
            break;
        case 'index.html':
            menuDesplegable.value = 'LocalizadorActual';
            break;
        case 'Equipo_trabajo.html':
            menuDesplegable.value = 'equipoTrabajo';
            break;
        default:
            break;
    }
    // Agregar un listener al cambio de opción en el menú desplegable
    menuDesplegable.addEventListener('change', function(event) {
        // Obtener el valor seleccionado del menú desplegable
        const seleccionado = event.target.value;

        // Verificar el valor seleccionado y redirigir a la página correspondiente
        if (seleccionado === 'rastreoHistoricos') {
            window.location.href = '/historicos.html';
        } else if (seleccionado === 'Principal') {
            window.location.href = '/principal.html';
        } else if (seleccionado === 'LocalizadorActual') {
            window.location.href = '/index.html';
        } else if (seleccionado === 'equipoTrabajo') {
            window.location.href = '/Equipo_trabajo.html';
        }
    });
});