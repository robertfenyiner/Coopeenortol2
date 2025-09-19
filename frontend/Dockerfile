# Dockerfile para frontend React
FROM node:18-alpine

# Configurar directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración de npm
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Construir aplicación para producción
RUN npm run build

# Usar nginx para servir la aplicación
FROM nginx:alpine

# Copiar archivos construidos
COPY --from=0 /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto
EXPOSE 80

# Comando por defecto
CMD ["nginx", "-g", "daemon off;"]