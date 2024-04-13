document.addEventListener('DOMContentLoaded', function() {
    // Obtener el elemento del menú desplegable
    const menuDesplegable = document.getElementById('opcionesMenu');

    // Agregar un evento 'change' al menú desplegable
    menuDesplegable.addEventListener('change', function(event) {
        // Obtener el valor seleccionado del menú desplegable
        const seleccionado = event.target.value;

        // Verificar la opción seleccionada y redirigir a la página correspondiente
        if (seleccionado === 'rastreoHistoricos') {
            // Redirigir al usuario a la página de historiales
            window.location.href = '/historicos.html';
        } else if (seleccionado === 'Inicio') {
            // Redirigir al usuario a la página de inicio
            window.location.href = '/inicio.html';
        } else if (seleccionado === 'LocalizadorActual') {
            // Redirigir al usuario a la página del localizador actual
            window.location.href = '/index.html';
        } else if (seleccionado === 'equipoTrabajo') {
            // Redirigir al usuario a la página del equipo de trabajo
            window.location.href = '/Equipo_trabajo.html';
        }
    });
});
