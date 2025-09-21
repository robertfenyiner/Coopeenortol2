"""
Script de migración para agregar el campo foto_url a la tabla asociados
Ejecutar este script después de actualizar el modelo
"""

from sqlalchemy import text
from app.database import engine

def upgrade():
    """Agregar campo foto_url a la tabla asociados"""
    try:
        with engine.connect() as connection:
            # Verificar si la columna ya existe
            result = connection.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'asociados' AND column_name = 'foto_url'
            """))
            
            if not result.fetchone():
                # Agregar la columna foto_url
                connection.execute(text("""
                    ALTER TABLE asociados 
                    ADD COLUMN foto_url VARCHAR(500) NULL
                """))
                connection.commit()
                print("✅ Campo foto_url agregado exitosamente a la tabla asociados")
            else:
                print("ℹ️ El campo foto_url ya existe en la tabla asociados")
                
    except Exception as e:
        print(f"❌ Error al ejecutar migración: {e}")
        raise

def downgrade():
    """Eliminar campo foto_url de la tabla asociados"""
    try:
        with engine.connect() as connection:
            connection.execute(text("""
                ALTER TABLE asociados 
                DROP COLUMN IF EXISTS foto_url
            """))
            connection.commit()
            print("✅ Campo foto_url eliminado exitosamente de la tabla asociados")
            
    except Exception as e:
        print(f"❌ Error al revertir migración: {e}")
        raise

if __name__ == "__main__":
    print("Ejecutando migración para agregar campo foto_url...")
    upgrade()
    print("Migración completada!")