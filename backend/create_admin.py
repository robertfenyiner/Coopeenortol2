#!/usr/bin/env python3
"""
Script para crear el usuario administrador inicial de Coopeenortol.

Robert debe ejecutar este script una vez configurado el entorno para
crear el usuario superadministrador inicial del sistema.

Uso:
    python create_admin.py
"""

import sys
from getpass import getpass

from sqlalchemy.orm import Session

from app.core.config import settings
from app.database import SessionLocal, engine
from app.models import Base, Usuario
from app.services.usuarios import create_superuser, get_user_by_username


def create_initial_admin():
    """Crear usuario administrador inicial."""
    
    print("🔧 Configurando usuario administrador inicial para Coopeenortol")
    print("=" * 60)
    
    # Crear tablas si no existen
    Base.metadata.create_all(bind=engine)
    
    # Verificar si ya existe un superusuario
    db = SessionLocal()
    try:
        admin_exists = db.query(Usuario).filter(Usuario.is_superuser == True).first()
        if admin_exists:
            print(f"⚠️  Ya existe un superadministrador: {admin_exists.username}")
            response = input("¿Deseas crear otro superadministrador? (s/N): ")
            if response.lower() not in ['s', 'si', 'yes']:
                print("👋 Operación cancelada")
                return
        
        # Solicitar datos del administrador
        print("\n📝 Ingresa los datos del administrador:")
        
        while True:
            username = input("Nombre de usuario: ").strip()
            if not username:
                print("❌ El nombre de usuario es requerido")
                continue
            if get_user_by_username(db, username):
                print("❌ El nombre de usuario ya existe")
                continue
            break
        
        while True:
            email = input("Email: ").strip()
            if not email:
                print("❌ El email es requerido")
                continue
            if "@" not in email:
                print("❌ Email inválido")
                continue
            break
        
        nombre_completo = input("Nombre completo: ").strip()
        if not nombre_completo:
            nombre_completo = username
        
        while True:
            password = getpass("Contraseña (mínimo 8 caracteres): ")
            if len(password) < 8:
                print("❌ La contraseña debe tener al menos 8 caracteres")
                continue
            
            confirm_password = getpass("Confirmar contraseña: ")
            if password != confirm_password:
                print("❌ Las contraseñas no coinciden")
                continue
            break
        
        # Crear usuario
        print("\n🔨 Creando usuario administrador...")
        admin_user = create_superuser(
            db=db,
            username=username,
            email=email,
            password=password,
            nombre_completo=nombre_completo
        )
        
        print("✅ Usuario administrador creado exitosamente!")
        print(f"   Username: {admin_user.username}")
        print(f"   Email: {admin_user.email}")
        print(f"   Rol: {admin_user.rol}")
        print(f"   Superuser: {admin_user.is_superuser}")
        print(f"   ID: {admin_user.id}")
        
        print("\n🎉 Robert ya puede usar estas credenciales para acceder al sistema!")
        
    except Exception as e:
        print(f"❌ Error al crear administrador: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    create_initial_admin()