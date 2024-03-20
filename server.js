// Importa los módulos necesarios, incluyendo el módulo de conexión a la base de datos
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const dgram = require('dgram');
const mysql = require('mysql');

// Configura la conexión a la base de datos
const dbConfig = {
  host: 'dsx-db.c5kwa0eccnra.us-east-2.rds.amazonaws.com',
  user: 'luisgaGOD',
  password: 'Lujusumo232403*',
  database: 'DSX'
};

const connection = mysql.createConnection(dbConfig);

// Crea el servidor UDP
const udpServer = dgram.createSocket('udp4');

// Configura el servidor HTTP y WebSocket
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('DSX/public'));

// Configura la conexión a los clientes WebSocket
io.on('connection', (socket) => {
    console.log('Un cliente se ha conectado');
    // Aquí puedes emitir eventos a tus clientes
});

// Maneja los mensajes recibidos por el servidor UDP
udpServer.on('message', (msg, rinfo) => {
    console.log(`Servidor UDP recibio: ${msg} de ${rinfo.address}:${rinfo.port}`);
    const parts = msg.toString().split(' ');

    if (parts.length === 4) {
        const latitud = parts[0];
        const longitud = parts[1];
        const fecha = parts[2];
        const hora = parts[3];

        const data = { latitud, longitud, fecha, hora };

        // Guarda los datos en la base de datos
        connection.query('INSERT INTO ubicaciones SET ?', data, (error, results, fields) => {
            if (error) {
                console.error('Error al insertar en la base de datos:', error);
            } else {
                console.log('Datos insertados correctamente en la base de datos');
            }
        });
        io.emit('updateData', { latitud, longitud, fecha, hora });
    }
});


app.get('/ultimos-datos', (req, res) => {
    connection.query('SELECT fecha, hora, latitud, longitud FROM ubicaciones ORDER BY id DESC LIMIT 30', (error, results, fields) => {
        if (error) {
            console.error('Error al consultar la base de datos:', error);
            res.status(500).send('Error al obtener los últimos datos');
        } else {
            // Envía los datos recuperados como respuesta
            res.json(results);
        }
    });
});

// Agrega esta función para limpiar registros duplicados
function limpiarRegistrosDuplicados() {
    const query = `
        DELETE t1 FROM ubicaciones t1
        INNER JOIN ubicaciones t2 
        WHERE t1.id < t2.id 
        AND t1.latitud = t2.latitud 
        AND t1.longitud = t2.longitud 
        AND t1.fecha = t2.fecha 
        AND t1.hora = t2.hora
    `;    
    connection.query(query, (error, results, fields) => {
        if (error) {
            console.error('Error al limpiar registros duplicados:', error);
        } else {
            console.log('Registros duplicados eliminados correctamente');
        }
    });
}

// Programa la ejecución de la función de limpieza cada 500ms
const intervaloLimpieza = setInterval(limpiarRegistrosDuplicados, 500);

// Establece el puerto en el que el servidor UDP escuchará
const UDP_PORT = 23001;
udpServer.bind(UDP_PORT, () => {
    console.log(`Servidor UDP escuchando en el puerto ${UDP_PORT}`);
});
// Establece el puerto en el que el servidor HTTP escuchará
const PORT = 80;
server.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
