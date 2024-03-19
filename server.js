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

        // Consulta el último dato en la base de datos
        connection.query('SELECT fecha, hora, latitud, longitud FROM ubicaciones ORDER BY id DESC LIMIT 1', (error, results, fields) => {
            if (error) {
                console.error('Error al consultar la base de datos:', error);
            } else {
                // Verifica si hay resultados y si el último dato es igual al nuevo dato
                if (results.length > 0 && 
                    parseFloat(results[0].latitud) === parseFloat(latitud) && 
                    parseFloat(results[0].longitud) === parseFloat(longitud) && 
                    results[0].fecha === fecha && 
                    results[0].hora === hora) {
                    console.log('El último dato en la base de datos es igual al nuevo dato. Evitando inserción redundante.');
                } else {
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
            }
        });
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

// Establece el puerto en el que el servidor UDP escuchará
const UDP_PORT = 23001;
udpServer.bind(UDP_PORT, () => {
    console.log(`Servidor UDP escuchando en el puerto ${UDP_PORT}`);
});
// Establece el puerto en el que el servidor HTTP escuchará
const PORT = 80;
server.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
