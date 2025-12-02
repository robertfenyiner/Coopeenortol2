"""Script para crear todas las tablas en la base de datos."""
from app.database import engine, Base
from app.models import Asociado, Usuario, RegistroAuditoria, Documento

print("Creando tablas...")
Base.metadata.create_all(bind=engine)
print("¡Tablas creadas exitosamente!")
