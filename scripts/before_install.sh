#!/bin/bash
# Detiene el servidor node si está corriendo
pkill node || true
# Limpia el directorio de trabajo anterior
rm -rf /home/ubuntu/myapp/*
