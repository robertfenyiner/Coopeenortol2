#!/bin/bash

# Cargar nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Usar Node 18
nvm use 18

# Ir al directorio del frontend
cd /root/projects/Coopeenortol/frontend

# Iniciar el servidor de desarrollo
npm run dev
