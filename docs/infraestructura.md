# Lineamientos de infraestructura

Robert definió que la plataforma se desplegará inicialmente en una VPS con Ubuntu 22.04, 100 GB de almacenamiento expandible y conectividad de alta velocidad. Estos son los lineamientos iniciales:

## Entorno de ejecución

- **Sistema operativo**: Ubuntu 22.04 LTS.
- **Runtime de backend**: Python 3.11 con FastAPI y Uvicorn/Gunicorn.
- **Servidor web**: Nginx como proxy inverso.
- **Base de datos**: PostgreSQL 14+ en producción, SQLite para entornos de desarrollo y pruebas.
- **Contenedores**: Se evaluará Docker para facilitar despliegues y aislar servicios.

## Seguridad

- Cumplir con la Ley 1581 de protección de datos personales (Colombia).
- Usar HTTPS en producción con certificados Let’s Encrypt.
- Implementar copias de seguridad automáticas y cifradas.
- Gestionar credenciales mediante variables de entorno y servicios secretos.
- Segmentar roles de usuario (administrador, analista, auditor, asociado) en el backend.

## Observabilidad

- Configurar registros centralizados (logging estructurado).
- Definir alertas básicas (uso de CPU, memoria, espacio en disco, errores de aplicación).
- Preparar paneles para métricas de API y base de datos en fases posteriores.

## Control de versiones y despliegue

- Integración continua con ejecución de pruebas automáticas en cada commit.
- Despliegue continuo a entornos de pruebas y manual a producción controlado por Robert.
- Bitácora de cambios mantenida en `docs/` y comunicada al equipo operativo.

## Próximos pasos

1. Definir la topología de red y políticas de acceso seguro (VPN o listas blancas).
2. Preparar scripts de aprovisionamiento para la VPS (Ansible o shell scripts).
3. Diseñar estrategia de copias de seguridad y recuperación ante desastres.
