#!/bin/bash
# Instalar dependencias de Node.js (si es necesario)
# Este script se ejecuta antes de que el nuevo código se despliegue.
cd /home/ubuntu
npm install dgram
npm install mysql
npm install socket.io
npm install express
npm install http
