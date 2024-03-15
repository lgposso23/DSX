#!/bin/bash
cd /home/ubuntu/myapp

# Iniciar el servidor Node.js
nohup node server.js > app.log 2>&1 &
