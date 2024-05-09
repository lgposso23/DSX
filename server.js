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

    if (parts.length === 5) {
        const latitud = parts[0];
        const longitud = parts[1];
        const fecha = parts[2];
        const hora = parts[3];
        const fechahora = parts[2] + ' ' + parts[3];
        const rpm = parts[4];

        const data = { latitud, longitud, fecha, hora, fechahora, rpm };

        // Guarda los datos en la base de datos
        connection.query('INSERT INTO ubicaciones SET ?', data, (error, results, fields) => {
            if (error) {
                console.error('Error al insertar en la base de datos:', error);
            } else {
                console.log('Datos insertados correctamente en la base de datos');
            }
        });
        io.emit('updateData', { latitud, longitud, fecha, hora, rpm });
    }
    //////////////////////////////////// Segundo carro ///////////////////////////////////////////////
    if (parts.length === 4) {
        const latitud = parts[0];
        const longitud = parts[1];
        const fecha = parts[2];
        const hora = parts[3];
        const fechahora = parts[2] + ' ' + parts[3];

        const data2 = { latitud, longitud, fecha, hora, fechahora };

        // Guarda los datos en la base de datos
        connection.query('INSERT INTO ubicaciones2 SET ?', data2, (error, results, fields) => {
            if (error) {
                console.error('Error al insertar en la base de datos:', error);
            } else {
                console.log('Datos insertados correctamente en la base de datos');
            }
        });
        io.emit('updateData2', { latitud, longitud });
    }
});

app.get('/ultimos-datos', (req, res) => {
    connection.query('SELECT latitud, longitud, rpm FROM ubicaciones ORDER BY id DESC LIMIT 1', (error, results, fields) => {
        if (error) {
            console.error('Error al obtener los últimos datos:', error);
            res.status(500).send('Error al obtener los últimos datos');
        } else {
            // Envía los datos recuperados como respuesta
            res.json(results);
        }
    });
});

app.get('/ultimos-datos2', (req, res) => {
    connection.query('SELECT latitud, longitud FROM ubicaciones2 ORDER BY id DESC LIMIT 1', (error, results, fields) => {
        if (error) {
            console.error('Error al obtener los últimos datos:', error);
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

app.get('/vivo', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/team', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Equipo_trabajo.html'));
});

app.get('/historicos-datos', (req, res) => {
    const fechahoraInicio = req.query.fechahoraInicio;
    const fechahoraFin = req.query.fechahoraFin;

    // Construir la consulta SQL para unir las dos tablas y obtener los datos de ambos vehículos
    const query = `
        SELECT 'vehiculo1' AS vehiculo, latitud, longitud, fechahora, rpm 
        FROM ubicaciones 
        WHERE fechaHora BETWEEN ? AND ?
        UNION ALL
        SELECT 'vehiculo2' AS vehiculo, latitud, longitud, fechahora 
        FROM ubicaciones2 
        WHERE fechaHora BETWEEN ? AND ?
        ORDER BY fechahora`;
    // Ejecutar la consulta con los parámetros correspondientes
    connection.query(query, [fechahoraInicio, fechahoraFin, fechahoraInicio, fechahoraFin], (error, results, fields) => {
        if (error) {
            console.error('Error al consultar la base de datos:', error);
            res.status(500).json({ error: 'Error al consultar la base de datos' });
            return;
        }

        // Organizar los resultados en un objeto con datos separados para cada vehículo
        const datos = {
            vehiculo1: [],
            vehiculo2: []
        };

        // Iterar sobre los resultados y agregarlos al objeto de datos según el vehículo
        results.forEach(result => {
            if (result.vehiculo === 'vehiculo1') {
                datos.vehiculo1.push({
                    latLng: [result.latitud, result.longitud],
                    fechahora: result.fechahora,
                    rpm: result.rpm
                });
            } else if (result.vehiculo === 'vehiculo2') {
                datos.vehiculo2.push({
                    latLng: [result.latitud, result.longitud],
                    fechahora: result.fechahora
                });
            }
        });

        res.json(datos);
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
