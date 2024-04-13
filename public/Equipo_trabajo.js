document.addEventListener('DOMContentLoaded', function() {
    // Selecciona automáticamente la opción "Equipo de Trabajo" en el menú desplegable
    document.getElementById('opcionesMenu').value = 'equipoTrabajo';
});

// Función para manejar los cambios en el menú desplegable
function cambiarOpcion() {
    var opcionSeleccionada = document.getElementById("opcionesMenu").value;
    // Aquí puedes agregar la lógica para manejar la opción seleccionada
    console.log("Opción seleccionada:", opcionSeleccionada);
}
