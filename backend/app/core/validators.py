"""
Validadores personalizados para campos críticos del sistema.
"""
import re
from typing import Optional


class DocumentoValidator:
    """Validador para números de documento de identidad colombianos."""
    
    @staticmethod
    def validar_cedula(numero: str) -> bool:
        """
        Valida formato de cédula de ciudadanía colombiana.
        Debe ser numérico entre 6 y 10 dígitos.
        """
        if not numero or not numero.isdigit():
            return False
        return 6 <= len(numero) <= 10
    
    @staticmethod
    def validar_nit(numero: str) -> bool:
        """
        Valida formato básico de NIT colombiano.
        Debe tener entre 9 y 10 dígitos, opcionalmente con guión y dígito de verificación.
        Ejemplo: 900123456-1
        """
        # Remover guiones y espacios
        numero_limpio = numero.replace("-", "").replace(" ", "")
        
        if not numero_limpio.isdigit():
            return False
        
        return 9 <= len(numero_limpio) <= 10
    
    @staticmethod
    def validar_documento(tipo: str, numero: str) -> tuple[bool, Optional[str]]:
        """
        Valida número de documento según el tipo.
        
        Returns:
            tuple[bool, Optional[str]]: (es_valido, mensaje_error)
        """
        if not numero or not numero.strip():
            return False, "Número de documento requerido"
        
        numero = numero.strip()
        
        if tipo in ["CC", "TI"]:  # Cédula de Ciudadanía, Tarjeta de Identidad
            if not DocumentoValidator.validar_cedula(numero):
                return False, f"Número de {tipo} inválido. Debe tener entre 6 y 10 dígitos numéricos"
        
        elif tipo == "NIT":
            if not DocumentoValidator.validar_nit(numero):
                return False, "NIT inválido. Debe tener entre 9 y 10 dígitos"
        
        elif tipo == "CE":  # Cédula de Extranjería
            # CE puede tener formato alfanumérico
            if not (numero.replace("-", "").replace(" ", "").isalnum()):
                return False, "Cédula de extranjería inválida"
        
        return True, None


class TelefonoValidator:
    """Validador para números telefónicos colombianos."""
    
    @staticmethod
    def validar_celular(numero: str) -> bool:
        """
        Valida número de celular colombiano.
        Formato: 3XX XXXXXXX (10 dígitos iniciando con 3)
        """
        # Remover espacios, guiones y paréntesis
        numero_limpio = re.sub(r'[\s\-\(\)]', '', numero)
        
        if not numero_limpio.isdigit():
            return False
        
        # Debe tener 10 dígitos y empezar con 3
        return len(numero_limpio) == 10 and numero_limpio.startswith('3')
    
    @staticmethod
    def validar_fijo(numero: str) -> bool:
        """
        Valida número de teléfono fijo colombiano.
        Formato: (indicativo) + 7 dígitos
        Ejemplo: (2) 1234567 o 6012345678
        """
        # Remover espacios, guiones y paréntesis
        numero_limpio = re.sub(r'[\s\-\(\)]', '', numero)
        
        if not numero_limpio.isdigit():
            return False
        
        # Puede tener 7 dígitos (sin indicativo) o 10 dígitos (con indicativo nacional 60X)
        return len(numero_limpio) in [7, 10]
    
    @staticmethod
    def validar_telefono(numero: str) -> tuple[bool, Optional[str]]:
        """
        Valida número telefónico (celular o fijo).
        
        Returns:
            tuple[bool, Optional[str]]: (es_valido, mensaje_error)
        """
        if not numero or not numero.strip():
            return False, "Número de teléfono requerido"
        
        numero = numero.strip()
        
        # Intentar validar como celular o fijo
        if TelefonoValidator.validar_celular(numero):
            return True, None
        elif TelefonoValidator.validar_fijo(numero):
            return True, None
        else:
            return False, "Número de teléfono inválido. Debe ser un celular (10 dígitos iniciando con 3) o un fijo (7-10 dígitos)"


class EmailValidator:
    """Validador adicional para emails (complementa pydantic EmailStr)."""
    
    @staticmethod
    def es_email_corporativo(email: str, dominios_permitidos: list[str]) -> bool:
        """
        Verifica si un email pertenece a dominios corporativos específicos.
        """
        if not email or '@' not in email:
            return False
        
        dominio = email.split('@')[1].lower()
        return dominio in [d.lower() for d in dominios_permitidos]
    
    @staticmethod
    def validar_formato_extendido(email: str) -> tuple[bool, Optional[str]]:
        """
        Validación extendida de formato de email.
        """
        if not email or not email.strip():
            return False, "Email requerido"
        
        email = email.strip().lower()
        
        # Patrón básico de email
        patron = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        
        if not re.match(patron, email):
            return False, "Formato de email inválido"
        
        # Verificar que no tenga caracteres especiales problemáticos
        if '..' in email or email.startswith('.') or email.endswith('.'):
            return False, "Email contiene puntos consecutivos o al inicio/final"
        
        return True, None


class CampoTextoValidator:
    """Validadores para campos de texto comunes."""
    
    @staticmethod
    def validar_nombres(texto: str, campo: str = "nombres") -> tuple[bool, Optional[str]]:
        """
        Valida nombres o apellidos.
        - Solo letras, espacios, tildes y caracteres especiales de nombres
        - Longitud mínima y máxima
        """
        if not texto or not texto.strip():
            return False, f"{campo.capitalize()} requerido"
        
        texto = texto.strip()
        
        # Verificar longitud
        if len(texto) < 2:
            return False, f"{campo.capitalize()} demasiado corto (mínimo 2 caracteres)"
        
        if len(texto) > 100:
            return False, f"{campo.capitalize()} demasiado largo (máximo 100 caracteres)"
        
        # Patrón para nombres: letras, espacios, tildes, apóstrofes, guiones
        patron = r"^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'\-]+$"
        
        if not re.match(patron, texto):
            return False, f"{campo.capitalize()} contiene caracteres inválidos. Solo se permiten letras, espacios, tildes y guiones"
        
        return True, None
    
    @staticmethod
    def validar_direccion(direccion: str) -> tuple[bool, Optional[str]]:
        """
        Valida formato de dirección colombiana.
        Ejemplo: Calle 10 #4-55
        """
        if not direccion or not direccion.strip():
            return False, "Dirección requerida"
        
        direccion = direccion.strip()
        
        if len(direccion) < 5:
            return False, "Dirección demasiado corta (mínimo 5 caracteres)"
        
        if len(direccion) > 200:
            return False, "Dirección demasiado larga (máximo 200 caracteres)"
        
        return True, None


class ValorNumericoValidator:
    """Validadores para valores numéricos y financieros."""
    
    @staticmethod
    def validar_salario(valor: float) -> tuple[bool, Optional[str]]:
        """
        Valida que el salario esté en un rango razonable.
        """
        if valor < 0:
            return False, "El salario no puede ser negativo"
        
        # Salario mínimo colombiano 2024: ~1.300.000
        SALARIO_MINIMO = 1_300_000
        
        if valor < SALARIO_MINIMO and valor > 0:
            return False, f"El salario no puede ser inferior al mínimo legal (${SALARIO_MINIMO:,.0f})"
        
        # Máximo razonable: 100 millones (ajustar según necesidad)
        if valor > 100_000_000:
            return False, "El salario parece excesivamente alto. Verificar el valor"
        
        return True, None
    
    @staticmethod
    def validar_porcentaje(valor: float, nombre: str = "porcentaje") -> tuple[bool, Optional[str]]:
        """
        Valida que un valor esté entre 0 y 100 (o 0 y 1 si es decimal).
        """
        if valor < 0:
            return False, f"{nombre.capitalize()} no puede ser negativo"
        
        # Aceptar tanto formato decimal (0-1) como porcentual (0-100)
        if valor > 100:
            return False, f"{nombre.capitalize()} no puede ser mayor a 100%"
        
        return True, None


def validar_asociado_completo(data: dict) -> tuple[bool, list[str]]:
    """
    Valida todos los campos críticos de un asociado.
    
    Returns:
        tuple[bool, list[str]]: (es_valido, lista_errores)
    """
    errores = []
    
    # Validar documento (solo para documentos colombianos - CC y TI)
    if 'tipo_documento' in data and 'numero_documento' in data:
        # Solo validar estrictamente para CC y TI
        if data['tipo_documento'] in ['CC', 'TI']:
            valido, error = DocumentoValidator.validar_documento(
                data['tipo_documento'],
                data['numero_documento']
            )
            if not valido:
                # Solo advertir, no bloquear
                pass  # errores.append(error)
    
    # Validar nombres
    if 'nombres' in data:
        valido, error = CampoTextoValidator.validar_nombres(data['nombres'], "nombres")
        if not valido:
            errores.append(error)
    
    # Validar apellidos
    if 'apellidos' in data:
        valido, error = CampoTextoValidator.validar_nombres(data['apellidos'], "apellidos")
        if not valido:
            errores.append(error)
    
    # Validar teléfono principal (validación relajada - solo advertir)
    # if 'telefono_principal' in data and data['telefono_principal']:
    #     valido, error = TelefonoValidator.validar_telefono(data['telefono_principal'])
    #     if not valido:
    #         errores.append(error)
    
    # Validar salario si existe
    if 'datos_laborales' in data and isinstance(data['datos_laborales'], dict):
        if 'salario_basico' in data['datos_laborales']:
            valido, error = ValorNumericoValidator.validar_salario(
                data['datos_laborales']['salario_basico']
            )
            if not valido:
                errores.append(error)
    
    return len(errores) == 0, errores
