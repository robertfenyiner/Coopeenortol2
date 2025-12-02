"""
Servicios para el sistema de ahorros.
"""
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Optional

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.models.ahorro import (
    ConfiguracionAhorro,
    CuentaAhorro,
    EstadoCuentaAhorro,
    MovimientoAhorro,
    TipoAhorro,
    TipoMovimientoAhorro,
)
from app.models.asociado import Asociado
from app.schemas.ahorro import (
    ConfiguracionAhorroActualizar,
    ConsignacionCrear,
    CuentaAhorroActualizar,
    CuentaAhorroCrear,
    RetiroCrear,
    TransferenciaCrear,
)


class AhorroService:
    """Servicio para gestión de ahorros."""

    @staticmethod
    def generar_numero_cuenta(db: Session, tipo_ahorro: str) -> str:
        """
        Generar número de cuenta único.
        
        Formato: AH-TIPO-YYYYMM-000001
        Ejemplo: AH-VISTA-202412-000001
        """
        # Mapeo de tipos a códigos cortos
        codigo_tipo = {
            TipoAhorro.A_LA_VISTA.value: "VISTA",
            TipoAhorro.PROGRAMADO.value: "PROG",
            TipoAhorro.CDAT.value: "CDAT",
            TipoAhorro.CONTRACTUAL.value: "CONT",
            TipoAhorro.APORTES.value: "APOR",
        }
        
        prefijo = f"AH-{codigo_tipo.get(tipo_ahorro, 'OTRO')}-{datetime.now().strftime('%Y%m')}"
        
        # Buscar el último número
        ultima_cuenta = (
            db.query(CuentaAhorro)
            .filter(CuentaAhorro.numero_cuenta.like(f"{prefijo}-%"))
            .order_by(CuentaAhorro.numero_cuenta.desc())
            .first()
        )
        
        if ultima_cuenta:
            ultimo_numero = int(ultima_cuenta.numero_cuenta.split("-")[-1])
            nuevo_numero = ultimo_numero + 1
        else:
            nuevo_numero = 1
        
        return f"{prefijo}-{str(nuevo_numero).zfill(6)}"

    @staticmethod
    def generar_numero_movimiento(db: Session) -> str:
        """
        Generar número de movimiento único.
        
        Formato: MOV-YYYYMMDD-000001
        """
        prefijo = f"MOV-{datetime.now().strftime('%Y%m%d')}"
        
        ultimo_movimiento = (
            db.query(MovimientoAhorro)
            .filter(MovimientoAhorro.numero_movimiento.like(f"{prefijo}-%"))
            .order_by(MovimientoAhorro.numero_movimiento.desc())
            .first()
        )
        
        if ultimo_movimiento:
            ultimo_numero = int(ultimo_movimiento.numero_movimiento.split("-")[-1])
            nuevo_numero = ultimo_numero + 1
        else:
            nuevo_numero = 1
        
        return f"{prefijo}-{str(nuevo_numero).zfill(6)}"

    @staticmethod
    def obtener_configuracion(db: Session) -> ConfiguracionAhorro:
        """Obtener o crear configuración del sistema de ahorros."""
        config = db.query(ConfiguracionAhorro).first()
        if not config:
            config = ConfiguracionAhorro()
            db.add(config)
            db.commit()
            db.refresh(config)
        return config

    @staticmethod
    def crear_cuenta(
        db: Session,
        datos: CuentaAhorroCrear,
        usuario_id: int
    ) -> CuentaAhorro:
        """Crear una nueva cuenta de ahorro."""
        # Validar que el asociado existe y está activo
        asociado = db.query(Asociado).filter(Asociado.id == datos.asociado_id).first()
        if not asociado:
            raise ValueError("Asociado no encontrado")
        if asociado.estado != "activo":
            raise ValueError("El asociado no está activo")
        
        # Obtener configuración
        config = AhorroService.obtener_configuracion(db)
        
        # Validar monto mínimo
        if datos.monto_inicial < config.monto_minimo_apertura:
            raise ValueError(
                f"El monto mínimo de apertura es ${config.monto_minimo_apertura:,.2f}"
            )
        
        # Validar monto mínimo para CDAT
        if datos.tipo_ahorro == TipoAhorro.CDAT and datos.monto_inicial < config.monto_minimo_cdat:
            raise ValueError(
                f"El monto mínimo para CDAT es ${config.monto_minimo_cdat:,.2f}"
            )
        
        # Generar número de cuenta
        numero_cuenta = AhorroService.generar_numero_cuenta(db, datos.tipo_ahorro.value)
        
        # Determinar tasa de interés
        tasa_interes = datos.tasa_interes_anual
        if not tasa_interes:
            if datos.tipo_ahorro == TipoAhorro.A_LA_VISTA:
                tasa_interes = config.tasa_ahorro_vista
            elif datos.tipo_ahorro == TipoAhorro.PROGRAMADO:
                tasa_interes = config.tasa_ahorro_programado
            elif datos.tipo_ahorro == TipoAhorro.CDAT:
                tasa_interes = config.tasa_cdat
            elif datos.tipo_ahorro == TipoAhorro.APORTES:
                tasa_interes = config.tasa_aportes
            else:
                tasa_interes = Decimal("0")
        
        # Calcular fechas para CDAT
        fecha_apertura_cdat = None
        fecha_vencimiento_cdat = None
        if datos.tipo_ahorro == TipoAhorro.CDAT and datos.plazo_dias:
            fecha_apertura_cdat = date.today()
            fecha_vencimiento_cdat = fecha_apertura_cdat + timedelta(days=datos.plazo_dias)
        
        # Crear cuenta
        cuenta = CuentaAhorro(
            numero_cuenta=numero_cuenta,
            asociado_id=datos.asociado_id,
            tipo_ahorro=datos.tipo_ahorro.value,
            estado=EstadoCuentaAhorro.ACTIVA.value,
            saldo_disponible=datos.monto_inicial,
            saldo_bloqueado=Decimal("0"),
            tasa_interes_anual=tasa_interes,
            cuota_manejo=config.cuota_manejo_mensual,
            meta_ahorro=datos.meta_ahorro,
            cuota_mensual=datos.cuota_mensual,
            fecha_inicio_programado=datos.fecha_inicio_programado,
            fecha_fin_programado=datos.fecha_fin_programado,
            plazo_dias=datos.plazo_dias,
            fecha_apertura_cdat=fecha_apertura_cdat,
            fecha_vencimiento_cdat=fecha_vencimiento_cdat,
            renovacion_automatica=datos.renovacion_automatica or False,
            abierta_por_id=usuario_id,
            observaciones=datos.observaciones
        )
        
        db.add(cuenta)
        db.flush()
        
        # Crear movimiento de apertura
        movimiento = AhorroService._crear_movimiento(
            db=db,
            cuenta=cuenta,
            tipo_movimiento=TipoMovimientoAhorro.APERTURA,
            valor=datos.monto_inicial,
            descripcion=f"Apertura de cuenta {numero_cuenta}",
            referencia=None,
            usuario_id=usuario_id
        )
        
        db.commit()
        db.refresh(cuenta)
        
        return cuenta

    @staticmethod
    def realizar_consignacion(
        db: Session,
        datos: ConsignacionCrear,
        usuario_id: int
    ) -> MovimientoAhorro:
        """Realizar una consignación en una cuenta de ahorro."""
        # Validar cuenta
        cuenta = db.query(CuentaAhorro).filter(CuentaAhorro.id == datos.cuenta_id).first()
        if not cuenta:
            raise ValueError("Cuenta no encontrada")
        if cuenta.estado != EstadoCuentaAhorro.ACTIVA.value:
            raise ValueError("La cuenta no está activa")
        
        # Validar monto mínimo
        config = AhorroService.obtener_configuracion(db)
        if datos.valor < config.monto_minimo_consignacion:
            raise ValueError(
                f"El monto mínimo de consignación es ${config.monto_minimo_consignacion:,.2f}"
            )
        
        # Crear movimiento
        movimiento = AhorroService._crear_movimiento(
            db=db,
            cuenta=cuenta,
            tipo_movimiento=TipoMovimientoAhorro.CONSIGNACION,
            valor=datos.valor,
            descripcion=datos.descripcion or "Consignación",
            referencia=datos.referencia,
            usuario_id=usuario_id
        )
        
        # Actualizar saldo
        cuenta.saldo_disponible += datos.valor
        
        db.commit()
        db.refresh(movimiento)
        
        return movimiento

    @staticmethod
    def realizar_retiro(
        db: Session,
        datos: RetiroCrear,
        usuario_id: int
    ) -> MovimientoAhorro:
        """Realizar un retiro de una cuenta de ahorro."""
        # Validar cuenta
        cuenta = db.query(CuentaAhorro).filter(CuentaAhorro.id == datos.cuenta_id).first()
        if not cuenta:
            raise ValueError("Cuenta no encontrada")
        if cuenta.estado != EstadoCuentaAhorro.ACTIVA.value:
            raise ValueError("La cuenta no está activa")
        
        # Validar saldo disponible
        if cuenta.saldo_disponible < datos.valor:
            raise ValueError("Saldo insuficiente")
        
        # Crear movimiento de retiro
        movimiento = AhorroService._crear_movimiento(
            db=db,
            cuenta=cuenta,
            tipo_movimiento=TipoMovimientoAhorro.RETIRO,
            valor=datos.valor,
            descripcion=datos.descripcion or "Retiro",
            referencia=datos.referencia,
            usuario_id=usuario_id
        )
        
        # Actualizar saldo
        cuenta.saldo_disponible -= datos.valor
        
        # Aplicar GMF si está configurado
        config = AhorroService.obtener_configuracion(db)
        if config.gmf_activo and datos.valor > Decimal("0"):
            gmf = (datos.valor * config.tasa_gmf / Decimal("1000")).quantize(Decimal("0.01"))
            if gmf > Decimal("0"):
                AhorroService._crear_movimiento(
                    db=db,
                    cuenta=cuenta,
                    tipo_movimiento=TipoMovimientoAhorro.GMF,
                    valor=gmf,
                    descripcion=f"GMF {config.tasa_gmf}x1000 sobre retiro",
                    referencia=movimiento.numero_movimiento,
                    usuario_id=usuario_id
                )
                cuenta.saldo_disponible -= gmf
        
        db.commit()
        db.refresh(movimiento)
        
        return movimiento

    @staticmethod
    def realizar_transferencia(
        db: Session,
        datos: TransferenciaCrear,
        usuario_id: int
    ) -> tuple[MovimientoAhorro, MovimientoAhorro]:
        """Realizar una transferencia entre cuentas de ahorro."""
        # Validar cuentas
        cuenta_origen = db.query(CuentaAhorro).filter(
            CuentaAhorro.id == datos.cuenta_origen_id
        ).first()
        cuenta_destino = db.query(CuentaAhorro).filter(
            CuentaAhorro.id == datos.cuenta_destino_id
        ).first()
        
        if not cuenta_origen or not cuenta_destino:
            raise ValueError("Una o ambas cuentas no existen")
        if cuenta_origen.estado != EstadoCuentaAhorro.ACTIVA.value:
            raise ValueError("La cuenta de origen no está activa")
        if cuenta_destino.estado != EstadoCuentaAhorro.ACTIVA.value:
            raise ValueError("La cuenta de destino no está activa")
        if cuenta_origen.saldo_disponible < datos.valor:
            raise ValueError("Saldo insuficiente en cuenta de origen")
        
        # Crear movimiento de salida
        mov_salida = AhorroService._crear_movimiento(
            db=db,
            cuenta=cuenta_origen,
            tipo_movimiento=TipoMovimientoAhorro.TRANSFERENCIA_SALIDA,
            valor=datos.valor,
            descripcion=f"{datos.descripcion} - A cuenta {cuenta_destino.numero_cuenta}",
            referencia=None,
            usuario_id=usuario_id
        )
        
        # Crear movimiento de entrada
        mov_entrada = AhorroService._crear_movimiento(
            db=db,
            cuenta=cuenta_destino,
            tipo_movimiento=TipoMovimientoAhorro.TRANSFERENCIA_ENTRADA,
            valor=datos.valor,
            descripcion=f"{datos.descripcion} - De cuenta {cuenta_origen.numero_cuenta}",
            referencia=mov_salida.numero_movimiento,
            usuario_id=usuario_id
        )
        
        # Actualizar saldos
        cuenta_origen.saldo_disponible -= datos.valor
        cuenta_destino.saldo_disponible += datos.valor
        
        db.commit()
        db.refresh(mov_salida)
        db.refresh(mov_entrada)
        
        return mov_salida, mov_entrada

    @staticmethod
    def _crear_movimiento(
        db: Session,
        cuenta: CuentaAhorro,
        tipo_movimiento: TipoMovimientoAhorro,
        valor: Decimal,
        descripcion: str,
        referencia: Optional[str],
        usuario_id: int
    ) -> MovimientoAhorro:
        """Método interno para crear movimientos."""
        numero_movimiento = AhorroService.generar_numero_movimiento(db)
        
        saldo_anterior = cuenta.saldo_disponible
        
        # Calcular nuevo saldo según tipo de movimiento
        if tipo_movimiento in [
            TipoMovimientoAhorro.APERTURA,
            TipoMovimientoAhorro.CONSIGNACION,
            TipoMovimientoAhorro.INTERES,
            TipoMovimientoAhorro.TRANSFERENCIA_ENTRADA,
        ]:
            saldo_nuevo = saldo_anterior + valor
        else:
            saldo_nuevo = saldo_anterior - valor
        
        movimiento = MovimientoAhorro(
            numero_movimiento=numero_movimiento,
            cuenta_id=cuenta.id,
            tipo_movimiento=tipo_movimiento.value,
            valor=valor,
            saldo_anterior=saldo_anterior,
            saldo_nuevo=saldo_nuevo,
            descripcion=descripcion,
            referencia=referencia,
            realizado_por_id=usuario_id
        )
        
        db.add(movimiento)
        db.flush()
        
        return movimiento

    @staticmethod
    def obtener_cuenta(db: Session, cuenta_id: int) -> Optional[CuentaAhorro]:
        """Obtener una cuenta de ahorro por ID."""
        return db.query(CuentaAhorro).filter(CuentaAhorro.id == cuenta_id).first()

    @staticmethod
    def listar_cuentas(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        asociado_id: Optional[int] = None,
        tipo_ahorro: Optional[str] = None,
        estado: Optional[str] = None
    ) -> tuple[list[CuentaAhorro], int]:
        """Listar cuentas de ahorro con filtros."""
        query = db.query(CuentaAhorro)
        
        if asociado_id:
            query = query.filter(CuentaAhorro.asociado_id == asociado_id)
        if tipo_ahorro:
            query = query.filter(CuentaAhorro.tipo_ahorro == tipo_ahorro)
        if estado:
            query = query.filter(CuentaAhorro.estado == estado)
        
        total = query.count()
        cuentas = query.order_by(CuentaAhorro.fecha_apertura.desc()).offset(skip).limit(limit).all()
        
        return cuentas, total

    @staticmethod
    def obtener_movimientos(
        db: Session,
        cuenta_id: int,
        fecha_inicio: Optional[date] = None,
        fecha_fin: Optional[date] = None,
        skip: int = 0,
        limit: int = 100
    ) -> list[MovimientoAhorro]:
        """Obtener movimientos de una cuenta."""
        query = db.query(MovimientoAhorro).filter(MovimientoAhorro.cuenta_id == cuenta_id)
        
        if fecha_inicio:
            query = query.filter(MovimientoAhorro.fecha_movimiento >= fecha_inicio)
        if fecha_fin:
            # Incluir todo el día
            fecha_fin_dt = datetime.combine(fecha_fin, datetime.max.time())
            query = query.filter(MovimientoAhorro.fecha_movimiento <= fecha_fin_dt)
        
        return query.order_by(MovimientoAhorro.fecha_movimiento.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def obtener_estadisticas(db: Session) -> dict:
        """Obtener estadísticas generales de ahorros."""
        # Total de cuentas
        total_cuentas = db.query(func.count(CuentaAhorro.id)).scalar()
        
        # Cuentas activas
        total_activas = db.query(func.count(CuentaAhorro.id)).filter(
            CuentaAhorro.estado == EstadoCuentaAhorro.ACTIVA.value
        ).scalar()
        
        # Total de ahorro
        total_ahorro = db.query(func.sum(CuentaAhorro.saldo_disponible)).scalar() or Decimal("0")
        
        # Total por tipo
        total_por_tipo = {}
        for tipo in TipoAhorro:
            total = db.query(func.sum(CuentaAhorro.saldo_disponible)).filter(
                CuentaAhorro.tipo_ahorro == tipo.value
            ).scalar() or Decimal("0")
            total_por_tipo[tipo.value] = float(total)
        
        # Cuentas por estado
        cuentas_por_estado = {}
        for estado in EstadoCuentaAhorro:
            count = db.query(func.count(CuentaAhorro.id)).filter(
                CuentaAhorro.estado == estado.value
            ).scalar()
            cuentas_por_estado[estado.value] = count
        
        # Promedio de saldo
        promedio_saldo = total_ahorro / Decimal(total_activas) if total_activas > 0 else Decimal("0")
        
        return {
            "total_cuentas": total_cuentas,
            "total_cuentas_activas": total_activas,
            "total_ahorro": float(total_ahorro),
            "total_por_tipo": total_por_tipo,
            "cuentas_por_estado": cuentas_por_estado,
            "promedio_saldo": float(promedio_saldo)
        }

    @staticmethod
    def actualizar_cuenta(
        db: Session,
        cuenta: CuentaAhorro,
        datos: CuentaAhorroActualizar
    ) -> CuentaAhorro:
        """Actualizar información de una cuenta de ahorro."""
        if datos.estado is not None:
            cuenta.estado = datos.estado.value
        if datos.tasa_interes_anual is not None:
            cuenta.tasa_interes_anual = datos.tasa_interes_anual
        if datos.meta_ahorro is not None:
            cuenta.meta_ahorro = datos.meta_ahorro
        if datos.cuota_mensual is not None:
            cuenta.cuota_mensual = datos.cuota_mensual
        if datos.observaciones is not None:
            cuenta.observaciones = datos.observaciones
        
        db.commit()
        db.refresh(cuenta)
        
        return cuenta

    @staticmethod
    def cancelar_cuenta(
        db: Session,
        cuenta: CuentaAhorro,
        usuario_id: int
    ) -> CuentaAhorro:
        """Cancelar una cuenta de ahorro."""
        if cuenta.estado == EstadoCuentaAhorro.CANCELADA.value:
            raise ValueError("La cuenta ya está cancelada")
        
        if cuenta.saldo_disponible > Decimal("0"):
            raise ValueError("No se puede cancelar una cuenta con saldo. Retire el saldo primero.")
        
        # Crear movimiento de cancelación
        AhorroService._crear_movimiento(
            db=db,
            cuenta=cuenta,
            tipo_movimiento=TipoMovimientoAhorro.CANCELACION,
            valor=Decimal("0"),
            descripcion="Cancelación de cuenta",
            referencia=None,
            usuario_id=usuario_id
        )
        
        cuenta.estado = EstadoCuentaAhorro.CANCELADA.value
        cuenta.fecha_cancelacion = datetime.utcnow()
        
        db.commit()
        db.refresh(cuenta)
        
        return cuenta

    @staticmethod
    def actualizar_configuracion(
        db: Session,
        datos: ConfiguracionAhorroActualizar
    ) -> ConfiguracionAhorro:
        """Actualizar configuración del sistema de ahorros."""
        config = AhorroService.obtener_configuracion(db)
        
        if datos.tasa_ahorro_vista is not None:
            config.tasa_ahorro_vista = datos.tasa_ahorro_vista
        if datos.tasa_ahorro_programado is not None:
            config.tasa_ahorro_programado = datos.tasa_ahorro_programado
        if datos.tasa_cdat is not None:
            config.tasa_cdat = datos.tasa_cdat
        if datos.tasa_aportes is not None:
            config.tasa_aportes = datos.tasa_aportes
        if datos.monto_minimo_apertura is not None:
            config.monto_minimo_apertura = datos.monto_minimo_apertura
        if datos.monto_minimo_consignacion is not None:
            config.monto_minimo_consignacion = datos.monto_minimo_consignacion
        if datos.monto_minimo_cdat is not None:
            config.monto_minimo_cdat = datos.monto_minimo_cdat
        if datos.gmf_activo is not None:
            config.gmf_activo = datos.gmf_activo
        if datos.tasa_gmf is not None:
            config.tasa_gmf = datos.tasa_gmf
        if datos.cuota_manejo_mensual is not None:
            config.cuota_manejo_mensual = datos.cuota_manejo_mensual
        
        db.commit()
        db.refresh(config)
        
        return config
