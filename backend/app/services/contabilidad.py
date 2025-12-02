"""
Servicio de contabilidad - Lógica de negocio.
"""
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy import and_, func
from sqlalchemy.orm import Session, joinedload

from app.models.contabilidad import (
    CuentaContable,
    AsientoContable,
    MovimientoContable,
    Aporte,
    TipoCuenta,
    NaturalezaCuenta
)
from app.models.asociado import Asociado
from app.schemas.contabilidad import (
    CuentaContableCrear,
    CuentaContableActualizar,
    AsientoContableCrear,
    AporteCrear,
    MovimientoContableCrear
)


class ContabilidadService:
    """Servicio para operaciones de contabilidad."""

    # ========================================================================
    # CUENTAS CONTABLES
    # ========================================================================

    @staticmethod
    def crear_cuenta(db: Session, data: CuentaContableCrear) -> CuentaContable:
        """Crear nueva cuenta contable."""
        # Validar que el código no exista
        existe = db.query(CuentaContable).filter(
            CuentaContable.codigo == data.codigo
        ).first()
        
        if existe:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe una cuenta con el código {data.codigo}"
            )
        
        # Si tiene padre, validar que existe
        if data.cuenta_padre_id:
            padre = db.query(CuentaContable).filter(
                CuentaContable.id == data.cuenta_padre_id
            ).first()
            
            if not padre:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Cuenta padre no encontrada"
                )
        
        # Crear cuenta
        cuenta = CuentaContable(**data.dict())
        db.add(cuenta)
        db.commit()
        db.refresh(cuenta)
        
        return cuenta

    @staticmethod
    def listar_cuentas(
        db: Session,
        tipo: Optional[str] = None,
        nivel: Optional[int] = None,
        solo_auxiliares: bool = False,
        solo_activas: bool = True,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[CuentaContable], int]:
        """Listar cuentas con filtros."""
        query = db.query(CuentaContable)
        
        if tipo:
            query = query.filter(CuentaContable.tipo == tipo)
        
        if nivel:
            query = query.filter(CuentaContable.nivel == nivel)
        
        if solo_auxiliares:
            query = query.filter(CuentaContable.es_auxiliar == True)
        
        if solo_activas:
            query = query.filter(CuentaContable.activa == True)
        
        total = query.count()
        
        cuentas = query.order_by(CuentaContable.codigo).offset(skip).limit(limit).all()
        
        return cuentas, total

    @staticmethod
    def obtener_cuenta(db: Session, cuenta_id: int) -> Optional[CuentaContable]:
        """Obtener cuenta por ID."""
        return db.query(CuentaContable).filter(
            CuentaContable.id == cuenta_id
        ).first()

    @staticmethod
    def obtener_cuenta_por_codigo(db: Session, codigo: str) -> Optional[CuentaContable]:
        """Obtener cuenta por código."""
        return db.query(CuentaContable).filter(
            CuentaContable.codigo == codigo
        ).first()

    @staticmethod
    def actualizar_cuenta(
        db: Session,
        cuenta: CuentaContable,
        data: CuentaContableActualizar
    ) -> CuentaContable:
        """Actualizar cuenta contable."""
        update_data = data.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(cuenta, field, value)
        
        db.commit()
        db.refresh(cuenta)
        
        return cuenta

    # ========================================================================
    # ASIENTOS CONTABLES
    # ========================================================================

    @staticmethod
    def generar_numero_asiento(db: Session, fecha: date) -> str:
        """Generar número consecutivo de asiento."""
        # Formato: AS-YYYYMM-000001
        prefijo = f"AS-{fecha.year}{fecha.month:02d}-"
        
        # Obtener último número del mes
        ultimo = db.query(AsientoContable).filter(
            AsientoContable.numero.like(f"{prefijo}%")
        ).order_by(AsientoContable.numero.desc()).first()
        
        if ultimo:
            ultimo_numero = int(ultimo.numero.split("-")[-1])
            nuevo_numero = ultimo_numero + 1
        else:
            nuevo_numero = 1
        
        return f"{prefijo}{nuevo_numero:06d}"

    @staticmethod
    def crear_asiento(
        db: Session,
        data: AsientoContableCrear,
        usuario_id: int
    ) -> AsientoContable:
        """
        Crear asiento contable con validación de partida doble.
        """
        # Validar que todas las cuentas existan y sean auxiliares
        for mov in data.movimientos:
            cuenta = db.query(CuentaContable).filter(
                CuentaContable.id == mov.cuenta_id,
                CuentaContable.es_auxiliar == True,
                CuentaContable.activa == True
            ).first()
            
            if not cuenta:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cuenta {mov.cuenta_id} no existe o no es auxiliar"
                )
        
        # Calcular totales
        total_debito = sum(m.debito for m in data.movimientos)
        total_credito = sum(m.credito for m in data.movimientos)
        
        # Validar partida doble
        if abs(total_debito - total_credito) > Decimal("0.01"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El asiento no cuadra. Débitos: {total_debito}, Créditos: {total_credito}"
            )
        
        # Generar número de asiento
        numero = ContabilidadService.generar_numero_asiento(db, data.fecha)
        
        # Crear asiento
        asiento = AsientoContable(
            numero=numero,
            fecha=data.fecha,
            tipo_movimiento=data.tipo_movimiento,
            concepto=data.concepto,
            observaciones=data.observaciones,
            documento_referencia=data.documento_referencia,
            total_debito=total_debito,
            total_credito=total_credito,
            cuadrado=True,
            registrado_por_id=usuario_id
        )
        
        db.add(asiento)
        db.flush()  # Para obtener el ID
        
        # Crear movimientos
        for mov_data in data.movimientos:
            movimiento = MovimientoContable(
                asiento_id=asiento.id,
                **mov_data.dict()
            )
            db.add(movimiento)
        
        db.commit()
        db.refresh(asiento)
        
        return asiento

    @staticmethod
    def listar_asientos(
        db: Session,
        fecha_inicio: Optional[date] = None,
        fecha_fin: Optional[date] = None,
        tipo_movimiento: Optional[str] = None,
        solo_activos: bool = True,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[AsientoContable], int]:
        """Listar asientos con filtros."""
        query = db.query(AsientoContable)
        
        if fecha_inicio:
            query = query.filter(AsientoContable.fecha >= fecha_inicio)
        
        if fecha_fin:
            query = query.filter(AsientoContable.fecha <= fecha_fin)
        
        if tipo_movimiento:
            query = query.filter(AsientoContable.tipo_movimiento == tipo_movimiento)
        
        if solo_activos:
            query = query.filter(AsientoContable.anulado == False)
        
        total = query.count()
        
        asientos = query.order_by(
            AsientoContable.fecha.desc(),
            AsientoContable.numero.desc()
        ).offset(skip).limit(limit).all()
        
        return asientos, total

    @staticmethod
    def obtener_asiento(db: Session, asiento_id: int) -> Optional[AsientoContable]:
        """Obtener asiento con sus movimientos."""
        return db.query(AsientoContable).options(
            joinedload(AsientoContable.movimientos)
        ).filter(AsientoContable.id == asiento_id).first()

    @staticmethod
    def anular_asiento(
        db: Session,
        asiento: AsientoContable,
        motivo: str,
        usuario_id: int
    ) -> AsientoContable:
        """Anular asiento contable."""
        if asiento.anulado:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El asiento ya está anulado"
            )
        
        asiento.anulado = True
        asiento.fecha_anulacion = datetime.utcnow()
        asiento.anulado_por_id = usuario_id
        asiento.motivo_anulacion = motivo
        
        db.commit()
        db.refresh(asiento)
        
        return asiento

    # ========================================================================
    # APORTES
    # ========================================================================

    @staticmethod
    def crear_aporte(
        db: Session,
        data: AporteCrear,
        usuario_id: int
    ) -> Aporte:
        """Crear aporte de asociado."""
        # Validar que el asociado existe
        asociado = db.query(Asociado).filter(
            Asociado.id == data.asociado_id
        ).first()
        
        if not asociado:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asociado no encontrado"
            )
        
        # Crear aporte
        aporte = Aporte(
            **data.dict(exclude={"generar_asiento"}),
            estado="pagado",
            registrado_por_id=usuario_id
        )
        
        db.add(aporte)
        db.flush()
        
        # Generar asiento contable si se solicita
        if data.generar_asiento:
            # Buscar cuentas necesarias
            # Cuenta Bancos (débito) - asumiendo código 1110
            cuenta_banco = db.query(CuentaContable).filter(
                CuentaContable.codigo == "1110"
            ).first()
            
            # Cuenta Aportes Sociales (crédito) - asumiendo código 3105
            cuenta_aportes = db.query(CuentaContable).filter(
                CuentaContable.codigo == "3105"
            ).first()
            
            if cuenta_banco and cuenta_aportes:
                # Crear asiento
                numero_asiento = ContabilidadService.generar_numero_asiento(db, data.fecha)
                
                asiento = AsientoContable(
                    numero=numero_asiento,
                    fecha=data.fecha,
                    tipo_movimiento="aporte",
                    concepto=f"Aporte {data.tipo_aporte} - {asociado.nombres} {asociado.apellidos}",
                    documento_referencia=data.numero_recibo,
                    total_debito=data.valor,
                    total_credito=data.valor,
                    cuadrado=True,
                    registrado_por_id=usuario_id
                )
                
                db.add(asiento)
                db.flush()
                
                # Movimiento débito (Banco)
                mov_debito = MovimientoContable(
                    asiento_id=asiento.id,
                    cuenta_id=cuenta_banco.id,
                    debito=data.valor,
                    credito=Decimal("0"),
                    detalle=f"Aporte - {asociado.nombres} {asociado.apellidos}",
                    tercero_tipo="asociado",
                    tercero_id=asociado.id
                )
                db.add(mov_debito)
                
                # Movimiento crédito (Aportes Sociales)
                mov_credito = MovimientoContable(
                    asiento_id=asiento.id,
                    cuenta_id=cuenta_aportes.id,
                    debito=Decimal("0"),
                    credito=data.valor,
                    detalle=f"Aporte - {asociado.nombres} {asociado.apellidos}",
                    tercero_tipo="asociado",
                    tercero_id=asociado.id
                )
                db.add(mov_credito)
                
                aporte.asiento_id = asiento.id
        
        db.commit()
        db.refresh(aporte)
        
        return aporte

    @staticmethod
    def listar_aportes(
        db: Session,
        asociado_id: Optional[int] = None,
        fecha_inicio: Optional[date] = None,
        fecha_fin: Optional[date] = None,
        estado: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[Aporte], int]:
        """Listar aportes con filtros."""
        query = db.query(Aporte)
        
        if asociado_id:
            query = query.filter(Aporte.asociado_id == asociado_id)
        
        if fecha_inicio:
            query = query.filter(Aporte.fecha >= fecha_inicio)
        
        if fecha_fin:
            query = query.filter(Aporte.fecha <= fecha_fin)
        
        if estado:
            query = query.filter(Aporte.estado == estado)
        
        total = query.count()
        
        aportes = query.order_by(Aporte.fecha.desc()).offset(skip).limit(limit).all()
        
        return aportes, total

    @staticmethod
    def obtener_aporte(db: Session, aporte_id: int) -> Optional[Aporte]:
        """Obtener aporte por ID."""
        return db.query(Aporte).filter(Aporte.id == aporte_id).first()

    @staticmethod
    def calcular_total_aportes_asociado(db: Session, asociado_id: int) -> Decimal:
        """Calcular total de aportes de un asociado."""
        total = db.query(func.sum(Aporte.valor)).filter(
            Aporte.asociado_id == asociado_id,
            Aporte.estado == "pagado"
        ).scalar()
        
        return total or Decimal("0")

    # ========================================================================
    # REPORTES Y CONSULTAS
    # ========================================================================

    @staticmethod
    def calcular_saldo_cuenta(
        db: Session,
        cuenta_id: int,
        fecha_inicio: Optional[date] = None,
        fecha_fin: Optional[date] = None
    ) -> Tuple[Decimal, Decimal, Decimal]:
        """
        Calcular saldo de una cuenta.
        
        Returns:
            Tuple[total_debito, total_credito, saldo_neto]
        """
        query = db.query(
            func.sum(MovimientoContable.debito).label("total_debito"),
            func.sum(MovimientoContable.credito).label("total_credito")
        ).join(AsientoContable).filter(
            MovimientoContable.cuenta_id == cuenta_id,
            AsientoContable.anulado == False
        )
        
        if fecha_inicio:
            query = query.filter(AsientoContable.fecha >= fecha_inicio)
        
        if fecha_fin:
            query = query.filter(AsientoContable.fecha <= fecha_fin)
        
        resultado = query.first()
        
        total_debito = resultado.total_debito or Decimal("0")
        total_credito = resultado.total_credito or Decimal("0")
        saldo_neto = total_debito - total_credito
        
        return total_debito, total_credito, saldo_neto

    @staticmethod
    def obtener_estadisticas(db: Session) -> dict:
        """Obtener estadísticas generales de contabilidad."""
        total_cuentas = db.query(CuentaContable).filter(
            CuentaContable.activa == True
        ).count()
        
        total_asientos = db.query(AsientoContable).filter(
            AsientoContable.anulado == False
        ).count()
        
        total_movimientos = db.query(MovimientoContable).join(AsientoContable).filter(
            AsientoContable.anulado == False
        ).count()
        
        total_aportes = db.query(Aporte).filter(
            Aporte.estado == "pagado"
        ).count()
        
        suma_aportes = db.query(func.sum(Aporte.valor)).filter(
            Aporte.estado == "pagado"
        ).scalar() or Decimal("0")
        
        ultimo_asiento = db.query(AsientoContable).filter(
            AsientoContable.anulado == False
        ).order_by(AsientoContable.fecha.desc()).first()
        
        return {
            "total_cuentas": total_cuentas,
            "total_asientos": total_asientos,
            "total_movimientos": total_movimientos,
            "total_aportes": total_aportes,
            "suma_aportes": suma_aportes,
            "ultimo_asiento": ultimo_asiento.numero if ultimo_asiento else None,
            "ultimo_asiento_fecha": ultimo_asiento.fecha if ultimo_asiento else None
        }
