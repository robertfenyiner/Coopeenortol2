"""
Script para crear asociados de prueba con datos aleatorios completos.
"""
import random
from datetime import date, timedelta
from decimal import Decimal

from app.database import SessionLocal
from app.models.asociado import Asociado


def generar_cedula():
    """Generar número de cédula aleatorio."""
    return str(random.randint(10000000, 99999999))


def generar_celular():
    """Generar número de celular colombiano."""
    prefijos = ['300', '301', '302', '310', '311', '312', '313', '314', '315', '316', '317', '318', '320', '321', '322', '323', '324', '350', '351']
    return random.choice(prefijos) + str(random.randint(1000000, 9999999))


def generar_fecha_nacimiento():
    """Generar fecha de nacimiento entre 18 y 65 años."""
    hoy = date.today()
    edad = random.randint(18, 65)
    return hoy - timedelta(days=edad * 365 + random.randint(0, 365))


def crear_asociados_prueba(db, cantidad=5):
    """Crear asociados de prueba con datos aleatorios."""
    
    nombres = [
        'Juan', 'María', 'Pedro', 'Ana', 'Carlos', 'Laura', 'Jorge', 'Diana',
        'Luis', 'Carolina', 'Miguel', 'Valentina', 'Andrés', 'Camila', 'Felipe'
    ]
    
    apellidos = [
        'García', 'Rodríguez', 'Martínez', 'López', 'González', 'Pérez', 'Sánchez',
        'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz', 'Morales'
    ]
    
    departamentos = [
        'Antioquia', 'Bogotá D.C.', 'Valle del Cauca', 'Atlántico', 'Santander',
        'Cundinamarca', 'Bolívar', 'Risaralda', 'Caldas', 'Quindío'
    ]
    
    municipios = {
        'Antioquia': ['Medellín', 'Envigado', 'Itagüí', 'Bello', 'Sabaneta'],
        'Bogotá D.C.': ['Bogotá'],
        'Valle del Cauca': ['Cali', 'Palmira', 'Buenaventura', 'Tuluá'],
        'Atlántico': ['Barranquilla', 'Soledad', 'Malambo'],
        'Santander': ['Bucaramanga', 'Floridablanca', 'Girón'],
        'Cundinamarca': ['Soacha', 'Chía', 'Zipaquirá', 'Facatativá'],
        'Bolívar': ['Cartagena', 'Magangué'],
        'Risaralda': ['Pereira', 'Dosquebradas'],
        'Caldas': ['Manizales', 'Villamaría'],
        'Quindío': ['Armenia', 'Calarcá']
    }
    
    empresas = [
        'Comercializadora XYZ', 'Servicios ABC', 'Construcciones DEF', 'Transportes GHI',
        'Alimentos JKL', 'Textiles MNO', 'Tecnología PQR', 'Educación STU',
        'Salud VWX', 'Agroindustria YZ', 'Consultorías 123', 'Manufactura 456'
    ]
    
    cargos = [
        'Operario', 'Auxiliar Administrativo', 'Vendedor', 'Conductor',
        'Supervisor', 'Analista', 'Técnico', 'Coordinador',
        'Asistente', 'Mecánico', 'Contador', 'Ingeniero'
    ]
    
    barrios = [
        'Centro', 'El Poblado', 'Laureles', 'Belén', 'Robledo',
        'Buenos Aires', 'La América', 'Aranjuez', 'Castilla', 'Manrique'
    ]
    
    asociados_creados = []
    
    print(f"\n{'='*60}")
    print(f"Creando {cantidad} asociados de prueba...")
    print(f"{'='*60}\n")
    
    for i in range(cantidad):
        # Datos personales
        nombre = random.choice(nombres)
        apellido1 = random.choice(apellidos)
        apellido2 = random.choice(apellidos)
        genero = random.choice(['M', 'F'])
        fecha_nac = generar_fecha_nacimiento()
        cedula = generar_cedula()
        
        # Ubicación
        depto = random.choice(departamentos)
        muni = random.choice(municipios[depto])
        
        # Contacto
        celular = generar_celular()
        email = f"{nombre.lower()}.{apellido1.lower()}{random.randint(1, 999)}@email.com"
        
        # Datos laborales
        empresa = random.choice(empresas)
        cargo = random.choice(cargos)
        ingresos = random.choice([1300000, 1500000, 2000000, 2500000, 3000000, 3500000, 4000000, 5000000])
        
        # Datos familiares
        estado_civil = random.choice(['soltero', 'casado', 'union_libre', 'divorciado'])
        num_hijos = random.randint(0, 4) if estado_civil != 'soltero' else random.randint(0, 2)
        
        asociado = Asociado(
            tipo_documento='CC',
            numero_documento=cedula,
            nombres=nombre,
            apellidos=f"{apellido1} {apellido2}",
            correo_electronico=email,
            telefono_principal=celular,
            estado='activo',
            fecha_ingreso=date.today() - timedelta(days=random.randint(30, 730)),
            
            # Datos personales
            datos_personales={
                'fecha_nacimiento': fecha_nac.isoformat(),
                'genero': genero,
                'estado_civil': estado_civil,
                'nivel_educativo': random.choice(['primaria', 'bachillerato', 'tecnico', 'profesional', 'posgrado']),
                'lugar_nacimiento': muni,
                'tipo_sangre': random.choice(['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'])
            },
            
            # Datos laborales
            datos_laborales={
                'actividad_economica': 'empleado',
                'empresa': empresa,
                'cargo': cargo,
                'ingresos_mensuales': ingresos,
                'tipo_contrato': random.choice(['indefinido', 'fijo', 'prestacion_servicios']),
                'tiempo_laborando': f"{random.randint(6, 120)} meses",
                'telefono_empresa': generar_celular()
            },
            
            # Información familiar
            informacion_familiar={
                'numero_hijos': num_hijos,
                'personas_cargo': random.randint(0, 3),
                'nombre_conyuge': f"{random.choice(nombres)} {random.choice(apellidos)}" if estado_civil in ['casado', 'union_libre'] else None,
                'telefono_emergencia': generar_celular(),
                'contacto_emergencia': f"{random.choice(nombres)} {random.choice(apellidos)}"
            },
            
            # Información financiera
            informacion_financiera={
                'activos': random.randint(5000000, 50000000),
                'pasivos': random.randint(0, 20000000),
                'otros_ingresos': random.randint(0, 1000000),
                'gastos_mensuales': int(ingresos * random.uniform(0.6, 0.9)),
                'tiene_otras_deudas': random.choice([True, False]),
                'entidades_financieras': random.choice([
                    ['Bancolombia'],
                    ['Davivienda', 'Nequi'],
                    ['Banco de Bogotá'],
                    []
                ])
            },
            
            # Información académica
            informacion_academica={
                'ultimo_nivel': random.choice(['Bachillerato', 'Técnico', 'Tecnólogo', 'Profesional']),
                'institucion': random.choice(['SENA', 'Universidad Nacional', 'Universidad de Antioquia', 'Colegio Departamental']),
                'titulo_obtenido': random.choice(['Bachiller', 'Técnico en...', 'Ingeniero', 'Licenciado'])
            },
            
            # Información de vivienda
            informacion_vivienda={
                'departamento': depto,
                'municipio': muni,
                'direccion': f"Calle {random.randint(1, 100)} # {random.randint(1, 50)}-{random.randint(10, 99)}",
                'barrio': random.choice(barrios),
                'estrato': random.randint(1, 6),
                'tipo_vivienda': random.choice(['propia', 'arrendada', 'familiar']),
                'tiempo_residencia': f"{random.randint(12, 240)} meses"
            },
            
            observaciones=f"Asociado creado automáticamente para pruebas - {date.today()}"
        )
        
        db.add(asociado)
        db.flush()
        
        asociados_creados.append(asociado)
        
        # Mostrar información del asociado creado
        print(f"✓ Asociado {i+1}/{cantidad} - {asociado.nombres} {asociado.apellidos}")
        print(f"  CC: {asociado.numero_documento}")
        print(f"  Email: {asociado.correo_electronico}")
        print(f"  Celular: {asociado.telefono_principal}")
        print(f"  Ciudad: {muni}, {depto}")
        print(f"  Empresa: {empresa} - {cargo}")
        print(f"  Ingresos: ${ingresos:,}")
        print(f"  Estado: {asociado.estado}")
        print()
    
    db.commit()
    
    print(f"{'='*60}")
    print(f"✓ {len(asociados_creados)} asociados creados exitosamente")
    print(f"{'='*60}\n")
    
    return asociados_creados


def main():
    """Ejecutar creación de asociados de prueba."""
    db = SessionLocal()
    try:
        # Crear 5 asociados de prueba
        asociados = crear_asociados_prueba(db, cantidad=5)
        
        print("\n📊 RESUMEN DE ASOCIADOS CREADOS:")
        print(f"{'─'*60}")
        for idx, asociado in enumerate(asociados, 1):
            print(f"{idx}. {asociado.nombres} {asociado.apellidos}")
            print(f"   CC: {asociado.numero_documento} | Tel: {asociado.telefono_principal}")
            print(f"   Ingresos: ${asociado.datos_laborales.get('ingresos_mensuales', 0):,}")
            print()
        
        print("¡Proceso completado exitosamente!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
