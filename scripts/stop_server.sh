#!/bin/bash
# Detener el servidor Node.js actual
# Este es un enfoque muy básico. Considera utilizar PM2 o un enfoque similar para gestionar el proceso.
pkill -f "node server.js"
