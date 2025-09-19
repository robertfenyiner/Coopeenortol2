#!/usr/bin/env python3
"""Script simplificado para crear admin."""

import sys
import os
sys.path.insert(0, '/app')

from app.database import Base, engine, SessionLocal
from app.models import Usuario
from app.core.security import SecurityManager

# Crear las tablas si no existen
Base.metadata.create_all(bind=engine)

# Crear sesión
db = SessionLocal()

try:
    # Verificar si ya existe un admin
    existing_admin = db.query(Usuario).filter(Usuario.username == "admin").first()
    if existing_admin:
        print("✅ Usuario admin ya existe")
    else:
        # Crear usuario admin
        admin_user = Usuario(
            username="admin",
            email="admin@coopeenortol.com",
            nombre_completo="Administrador Sistema",
            hashed_password=SecurityManager.hash_password("admin123"),
            rol="admin",
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        print("✅ Usuario admin creado exitosamente")
        print("   Usuario: admin")
        print("   Contraseña: admin123")
        print("   Email: admin@coopeenortol.com")
        
except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()
finally:
    db.close()
