// Importa los módulos necesarios, incluyendo el módulo de conexión a la base de datos
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const dgram = require('dgram');
const mysql = require('mysql');
const path = require('path');

require('dotenv').config({ path: 'DSX/.env' });

// Configura la conexión a la base de datos
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
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

app.get('/historicos', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'historicos.html'));
});

app.get('/historicos-datos', (req, res) => {
    const fechaInicio = req.query.fechaInicio;
    const horaInicio = req.query.horaInicio;
    const fechaFin = req.query.fechaFin;
    const horaFin = req.query.horaFin;

    // Construir la consulta SQL con los filtros de fecha y hora
    const query = `SELECT latitud, longitud, fecha, hora FROM ubicaciones WHERE (fecha>? OR (fecha =? AND hora >= ? ))
    AND (fecha < ? OR (fecha =? AND hora <=?))`;

    // Ejecutar la consulta con los parámetros correspondientes
    connection.query(query, [fechaInicio, horaInicio, fechaFin, horaFin], (error, results, fields) => {
        if (error) {
            console.error('Error al consultar la base de datos:', error);
            res.status(500).json({ error: 'Error al consultar la base de datos' });
            return;
        }
        res.json(results);
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
