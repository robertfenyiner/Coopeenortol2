"""
Tests para los validadores personalizados.
"""
import pytest
from app.core.validators import (
    DocumentoValidator,
    TelefonoValidator,
    EmailValidator,
    CampoTextoValidator,
    ValorNumericoValidator,
    validar_asociado_completo
)


class TestDocumentoValidator:
    """Tests para validación de documentos."""
    
    def test_cedula_valida(self):
        assert DocumentoValidator.validar_cedula("1234567") is True
        assert DocumentoValidator.validar_cedula("12345678") is True
        assert DocumentoValidator.validar_cedula("1234567890") is True
    
    def test_cedula_invalida(self):
        assert DocumentoValidator.validar_cedula("123") is False  # Muy corta
        assert DocumentoValidator.validar_cedula("12345678901") is False  # Muy larga
        assert DocumentoValidator.validar_cedula("123ABC") is False  # No numérica
        assert DocumentoValidator.validar_cedula("") is False
    
    def test_nit_valido(self):
        assert DocumentoValidator.validar_nit("900123456") is True
        assert DocumentoValidator.validar_nit("900123456-1") is True
        assert DocumentoValidator.validar_nit("900 123 456") is True
    
    def test_nit_invalido(self):
        assert DocumentoValidator.validar_nit("12345") is False  # Muy corto
        assert DocumentoValidator.validar_nit("ABC123456") is False  # No numérico
    
    def test_validar_documento_cc(self):
        valido, error = DocumentoValidator.validar_documento("CC", "12345678")
        assert valido is True
        assert error is None
        
        valido, error = DocumentoValidator.validar_documento("CC", "123")
        assert valido is False
        assert "inválido" in error.lower()
    
    def test_validar_documento_nit(self):
        valido, error = DocumentoValidator.validar_documento("NIT", "900123456-1")
        assert valido is True
        assert error is None


class TestTelefonoValidator:
    """Tests para validación de teléfonos."""
    
    def test_celular_valido(self):
        assert TelefonoValidator.validar_celular("3101234567") is True
        assert TelefonoValidator.validar_celular("310 123 4567") is True
        assert TelefonoValidator.validar_celular("310-123-4567") is True
        assert TelefonoValidator.validar_celular("(310) 1234567") is True
    
    def test_celular_invalido(self):
        assert TelefonoValidator.validar_celular("2101234567") is False  # No empieza con 3
        assert TelefonoValidator.validar_celular("31012345") is False  # Muy corto
        assert TelefonoValidator.validar_celular("310123456789") is False  # Muy largo
        assert TelefonoValidator.validar_celular("ABC1234567") is False  # No numérico
    
    def test_fijo_valido(self):
        assert TelefonoValidator.validar_fijo("2123456") is True  # 7 dígitos
        assert TelefonoValidator.validar_fijo("6012345678") is True  # 10 dígitos
    
    def test_validar_telefono(self):
        valido, error = TelefonoValidator.validar_telefono("3101234567")
        assert valido is True
        assert error is None
        
        valido, error = TelefonoValidator.validar_telefono("123")
        assert valido is False
        assert "inválido" in error.lower()


class TestEmailValidator:
    """Tests para validación de emails."""
    
    def test_email_corporativo(self):
        assert EmailValidator.es_email_corporativo(
            "juan@coopeenortol.com",
            ["coopeenortol.com", "empresa.com"]
        ) is True
        
        assert EmailValidator.es_email_corporativo(
            "juan@gmail.com",
            ["coopeenortol.com"]
        ) is False
    
    def test_validar_formato_extendido(self):
        valido, error = EmailValidator.validar_formato_extendido("juan.perez@example.com")
        assert valido is True
        assert error is None
        
        valido, error = EmailValidator.validar_formato_extendido("juan..perez@example.com")
        assert valido is False
        
        valido, error = EmailValidator.validar_formato_extendido("@example.com")
        assert valido is False


class TestCampoTextoValidator:
    """Tests para validación de campos de texto."""
    
    def test_nombres_validos(self):
        valido, error = CampoTextoValidator.validar_nombres("Juan Carlos")
        assert valido is True
        
        valido, error = CampoTextoValidator.validar_nombres("María José")
        assert valido is True
        
        valido, error = CampoTextoValidator.validar_nombres("O'Connor")
        assert valido is True
        
        valido, error = CampoTextoValidator.validar_nombres("Jean-Pierre")
        assert valido is True
    
    def test_nombres_invalidos(self):
        valido, error = CampoTextoValidator.validar_nombres("A")
        assert valido is False
        
        valido, error = CampoTextoValidator.validar_nombres("Juan123")
        assert valido is False
        
        valido, error = CampoTextoValidator.validar_nombres("")
        assert valido is False
    
    def test_direccion_valida(self):
        valido, error = CampoTextoValidator.validar_direccion("Calle 10 #4-55")
        assert valido is True
        
        valido, error = CampoTextoValidator.validar_direccion("Carrera 7 No. 12-34 Apto 501")
        assert valido is True
    
    def test_direccion_invalida(self):
        valido, error = CampoTextoValidator.validar_direccion("Cra")
        assert valido is False
        
        valido, error = CampoTextoValidator.validar_direccion("")
        assert valido is False


class TestValorNumericoValidator:
    """Tests para validación de valores numéricos."""
    
    def test_salario_valido(self):
        valido, error = ValorNumericoValidator.validar_salario(1_500_000)
        assert valido is True
        
        valido, error = ValorNumericoValidator.validar_salario(5_000_000)
        assert valido is True
    
    def test_salario_invalido(self):
        valido, error = ValorNumericoValidator.validar_salario(-1000)
        assert valido is False
        
        valido, error = ValorNumericoValidator.validar_salario(1_000_000)
        assert valido is False  # Por debajo del mínimo
        
        valido, error = ValorNumericoValidator.validar_salario(200_000_000)
        assert valido is False  # Muy alto
    
    def test_porcentaje_valido(self):
        valido, error = ValorNumericoValidator.validar_porcentaje(50)
        assert valido is True
        
        valido, error = ValorNumericoValidator.validar_porcentaje(0.5)
        assert valido is True
    
    def test_porcentaje_invalido(self):
        valido, error = ValorNumericoValidator.validar_porcentaje(-10)
        assert valido is False
        
        valido, error = ValorNumericoValidator.validar_porcentaje(150)
        assert valido is False


class TestValidarAsociadoCompleto:
    """Tests para validación completa de asociado."""
    
    def test_asociado_valido(self):
        data = {
            "tipo_documento": "CC",
            "numero_documento": "12345678",
            "nombres": "Juan Carlos",
            "apellidos": "Pérez Gómez",
            "telefono_principal": "3101234567",
            "datos_laborales": {
                "salario_basico": 3_000_000
            }
        }
        
        valido, errores = validar_asociado_completo(data)
        assert valido is True
        assert len(errores) == 0
    
    def test_asociado_con_errores(self):
        data = {
            "tipo_documento": "CC",
            "numero_documento": "123",  # Inválido
            "nombres": "Juan123",  # Inválido
            "apellidos": "Pérez Gómez",
            "telefono_principal": "123",  # Inválido
            "datos_laborales": {
                "salario_basico": -1000  # Inválido
            }
        }
        
        valido, errores = validar_asociado_completo(data)
        assert valido is False
        assert len(errores) >= 3  # Al menos 3 errores
        # Verificar que hay errores de diferentes tipos
        errores_str = " ".join(errores).lower()
        assert "cc" in errores_str or "número" in errores_str or "documento" in errores_str
        assert "nombre" in errores_str or "caract" in errores_str
        assert "teléfono" in errores_str or "inválido" in errores_str
        assert "salario" in errores_str or "negativo" in errores_str
