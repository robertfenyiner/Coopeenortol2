"""
Servicio de créditos - Lógica de negocio.
"""
from datetime import date, timedelta
from decimal import Decimal
from typing import List, Optional, Tuple
import math

from fastapi import HTTPException, status
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session, joinedload

from app.models.credito import (
    Credito, Cuota, Pago, AbonoCuota,
    EstadoCredito, EstadoCuota
)
from app.models.asociado import Asociado
from app.models.contabilidad import AsientoContable, MovimientoContable, CuentaContable
from app.schemas.credito import CreditoSolicitar, CreditoAprobar, CreditoDesembolsar, PagoCrear


class CreditoService:
    """Servicio para operaciones de créditos."""

    # ========================================================================
    # CRÉDITOS
    # ========================================================================

    @staticmethod
    def generar_numero_credito(db: Session, fecha: date = None) -> str:
        """Generar número consecutivo de crédito."""
        if fecha is None:
            fecha = date.today()
        
        # Formato: CR-YYYYMM-000001
        prefijo = f"CR-{fecha.year}{fecha.month:02d}-"
        
        # Obtener último número del mes
        ultimo = db.query(Credito).filter(
            Credito.numero_credito.like(f"{prefijo}%")
        ).order_by(Credito.numero_credito.desc()).first()
        
        if ultimo:
            ultimo_numero = int(ultimo.numero_credito.split("-")[-1])
            nuevo_numero = ultimo_numero + 1
        else:
            nuevo_numero = 1
        
        return f"{prefijo}{nuevo_numero:06d}"

    @staticmethod
    def calcular_cuota_fija(monto: Decimal, tasa_anual: Decimal, plazo_meses: int) -> Decimal:
        """Calcular cuota fija (sistema francés)."""
        # Convertir tasa anual a mensual
        tasa_mensual = float(tasa_anual) / 100 / 12
        
        if tasa_mensual == 0:
            return Decimal(float(monto) / plazo_meses)
        
        # Fórmula: C = M * [i * (1 + i)^n] / [(1 + i)^n - 1]
        factor = (1 + tasa_mensual) ** plazo_meses
        cuota = float(monto) * (tasa_mensual * factor) / (factor - 1)
        
        return Decimal(round(cuota, 2))

    @staticmethod
    def generar_tabla_amortizacion(
        monto: Decimal,
        tasa_anual: Decimal,
        plazo_meses: int,
        fecha_inicio: date,
        modalidad: str = "mensual",
        tipo_cuota: str = "fija"
    ) -> List[dict]:
        """Generar tabla de amortización."""
        cuotas = []
        saldo = monto
        tasa_mensual = tasa_anual / 100 / 12
        
        # Calcular incremento de fecha según modalidad
        if modalidad == "mensual":
            incremento = lambda d, i: date(d.year + (d.month + i) // 12, (d.month + i) % 12 or 12, d.day)
        elif modalidad == "quincenal":
            incremento = lambda d, i: d + timedelta(days=15 * i)
        else:  # semanal
            incremento = lambda d, i: d + timedelta(days=7 * i)
        
        if tipo_cuota == "fija":
            valor_cuota = CreditoService.calcular_cuota_fija(monto, tasa_anual, plazo_meses)
            
            for i in range(1, plazo_meses + 1):
                interes = saldo * tasa_mensual
                capital = valor_cuota - interes
                
                # Ajuste para última cuota
                if i == plazo_meses:
                    capital = saldo
                    valor_cuota = capital + interes
                
                saldo -= capital
                
                cuotas.append({
                    "numero_cuota": i,
                    "fecha_vencimiento": incremento(fecha_inicio, i - 1),
                    "valor_cuota": round(valor_cuota, 2),
                    "capital": round(capital, 2),
                    "interes": round(interes, 2),
                    "saldo_pendiente": round(max(saldo, 0), 2)
                })
        else:  # Variable (amortización alemana)
            capital_fijo = monto / plazo_meses
            
            for i in range(1, plazo_meses + 1):
                interes = saldo * tasa_mensual
                valor_cuota = capital_fijo + interes
                saldo -= capital_fijo
                
                cuotas.append({
                    "numero_cuota": i,
                    "fecha_vencimiento": incremento(fecha_inicio, i - 1),
                    "valor_cuota": round(valor_cuota, 2),
                    "capital": round(capital_fijo, 2),
                    "interes": round(interes, 2),
                    "saldo_pendiente": round(max(saldo, 0), 2)
                })
        
        return cuotas

    @staticmethod
    def solicitar_credito(db: Session, data: CreditoSolicitar, usuario_id: int) -> Credito:
        """Solicitar un nuevo crédito."""
        # Validar que el asociado existe y está activo
        asociado = db.query(Asociado).filter(Asociado.id == data.asociado_id).first()
        if not asociado:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asociado no encontrado"
            )
        
        if asociado.estado != "activo":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El asociado no está activo"
            )
        
        # Verificar si tiene créditos activos en mora
        creditos_mora = db.query(Credito).filter(
            Credito.asociado_id == data.asociado_id,
            Credito.estado == EstadoCredito.MORA
        ).count()
        
        if creditos_mora > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El asociado tiene créditos en mora"
            )
        
        # Generar número de crédito
        numero_credito = CreditoService.generar_numero_credito(db)
        
        # Crear crédito
        credito = Credito(
            numero_credito=numero_credito,
            **data.dict(),
            estado=EstadoCredito.SOLICITADO,
            solicitado_por_id=usuario_id,
            saldo_capital=Decimal("0"),
            saldo_interes=Decimal("0"),
            saldo_mora=Decimal("0"),
            dias_mora=0
        )
        
        db.add(credito)
        db.commit()
        db.refresh(credito)
        
        return credito

    @staticmethod
    def aprobar_credito(
        db: Session,
        credito: Credito,
        data: CreditoAprobar,
        usuario_id: int
    ) -> Credito:
        """Aprobar un crédito."""
        if credito.estado != EstadoCredito.SOLICITADO and credito.estado != EstadoCredito.EN_ESTUDIO:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El crédito no puede ser aprobado en estado {credito.estado}"
            )
        
        # Actualizar datos
        credito.monto_aprobado = data.monto_aprobado
        if data.tasa_interes:
            credito.tasa_interes = data.tasa_interes
        if data.plazo_meses:
            credito.plazo_meses = data.plazo_meses
        if data.observaciones:
            credito.observaciones = data.observaciones
        
        credito.estado = EstadoCredito.APROBADO
        credito.fecha_aprobacion = date.today()
        credito.aprobado_por_id = usuario_id
        
        # Calcular cuota y totales
        credito.valor_cuota = CreditoService.calcular_cuota_fija(
            credito.monto_aprobado,
            credito.tasa_interes,
            credito.plazo_meses
        )
        credito.total_intereses = (credito.valor_cuota * credito.plazo_meses) - credito.monto_aprobado
        credito.total_a_pagar = credito.valor_cuota * credito.plazo_meses
        
        db.commit()
        db.refresh(credito)
        
        return credito

    @staticmethod
    def rechazar_credito(
        db: Session,
        credito: Credito,
        motivo: str,
        usuario_id: int
    ) -> Credito:
        """Rechazar un crédito."""
        if credito.estado not in [EstadoCredito.SOLICITADO, EstadoCredito.EN_ESTUDIO]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El crédito no puede ser rechazado en estado {credito.estado}"
            )
        
        credito.estado = EstadoCredito.RECHAZADO
        credito.motivo_rechazo = motivo
        credito.aprobado_por_id = usuario_id
        
        db.commit()
        db.refresh(credito)
        
        return credito

    @staticmethod
    def desembolsar_credito(
        db: Session,
        credito: Credito,
        data: CreditoDesembolsar,
        usuario_id: int
    ) -> Credito:
        """Desembolsar un crédito aprobado."""
        if credito.estado != EstadoCredito.APROBADO:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se pueden desembolsar créditos aprobados"
            )
        
        # Actualizar crédito
        credito.estado = EstadoCredito.AL_DIA
        credito.fecha_desembolso = data.fecha_desembolso
        credito.fecha_primer_pago = data.fecha_primer_pago
        credito.monto_desembolsado = credito.monto_aprobado
        credito.saldo_capital = credito.monto_aprobado
        credito.desembolsado_por_id = usuario_id
        
        if data.observaciones:
            credito.observaciones = (credito.observaciones or "") + f"\n{data.observaciones}"
        
        # Generar tabla de amortización y crear cuotas
        tabla = CreditoService.generar_tabla_amortizacion(
            credito.monto_aprobado,
            credito.tasa_interes,
            credito.plazo_meses,
            data.fecha_primer_pago,
            credito.modalidad_pago,
            credito.tipo_cuota
        )
        
        for cuota_data in tabla:
            cuota = Cuota(
                credito_id=credito.id,
                **cuota_data,
                estado=EstadoCuota.PENDIENTE,
                valor_pagado=Decimal("0"),
                valor_mora=Decimal("0"),
                dias_mora=0
            )
            db.add(cuota)
        
        # Generar asiento contable si se solicita
        if data.generar_asiento:
            # Buscar cuentas
            cuenta_cartera = db.query(CuentaContable).filter(
                CuentaContable.codigo == "1305"  # Clientes/Cartera
            ).first()
            
            cuenta_banco = db.query(CuentaContable).filter(
                CuentaContable.codigo == "1110"  # Bancos
            ).first()
            
            if cuenta_cartera and cuenta_banco:
                from app.services.contabilidad import ContabilidadService
                from app.schemas.contabilidad import AsientoContableCrear, MovimientoContableCrear
                
                # Crear asiento de desembolso
                asiento_data = AsientoContableCrear(
                    fecha=data.fecha_desembolso,
                    tipo_movimiento="prestamo",
                    concepto=f"Desembolso crédito {credito.numero_credito} - {credito.asociado.nombres} {credito.asociado.apellidos}",
                    documento_referencia=credito.numero_credito,
                    movimientos=[
                        MovimientoContableCrear(
                            cuenta_id=cuenta_cartera.id,
                            debito=credito.monto_desembolsado,
                            credito=Decimal("0"),
                            detalle=f"Cartera crédito {credito.numero_credito}",
                            tercero_tipo="asociado",
                            tercero_id=credito.asociado_id
                        ),
                        MovimientoContableCrear(
                            cuenta_id=cuenta_banco.id,
                            debito=Decimal("0"),
                            credito=credito.monto_desembolsado,
                            detalle=f"Desembolso crédito {credito.numero_credito}",
                            tercero_tipo="asociado",
                            tercero_id=credito.asociado_id
                        )
                    ]
                )
                
                asiento = ContabilidadService.crear_asiento(db, asiento_data, usuario_id)
                credito.asiento_desembolso_id = asiento.id
        
        db.commit()
        db.refresh(credito)
        
        return credito

    @staticmethod
    def listar_creditos(
        db: Session,
        asociado_id: Optional[int] = None,
        estado: Optional[str] = None,
        tipo_credito: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[Credito], int]:
        """Listar créditos con filtros."""
        query = db.query(Credito)
        
        if asociado_id:
            query = query.filter(Credito.asociado_id == asociado_id)
        
        if estado:
            query = query.filter(Credito.estado == estado)
        
        if tipo_credito:
            query = query.filter(Credito.tipo_credito == tipo_credito)
        
        total = query.count()
        
        creditos = query.order_by(
            Credito.fecha_solicitud.desc()
        ).offset(skip).limit(limit).all()
        
        return creditos, total

    @staticmethod
    def obtener_credito(db: Session, credito_id: int) -> Optional[Credito]:
        """Obtener crédito con cuotas."""
        return db.query(Credito).options(
            joinedload(Credito.cuotas),
            joinedload(Credito.asociado)
        ).filter(Credito.id == credito_id).first()

    # ========================================================================
    # PAGOS
    # ========================================================================

    @staticmethod
    def generar_numero_recibo(db: Session, fecha: date = None) -> str:
        """Generar número de recibo."""
        if fecha is None:
            fecha = date.today()
        
        prefijo = f"REC-{fecha.year}{fecha.month:02d}-"
        
        ultimo = db.query(Pago).filter(
            Pago.numero_recibo.like(f"{prefijo}%")
        ).order_by(Pago.numero_recibo.desc()).first()
        
        if ultimo:
            ultimo_numero = int(ultimo.numero_recibo.split("-")[-1])
            nuevo_numero = ultimo_numero + 1
        else:
            nuevo_numero = 1
        
        return f"{prefijo}{nuevo_numero:06d}"

    @staticmethod
    def registrar_pago(
        db: Session,
        data: PagoCrear,
        usuario_id: int
    ) -> Pago:
        """Registrar un pago a un crédito."""
        # Obtener crédito
        credito = db.query(Credito).filter(Credito.id == data.credito_id).first()
        if not credito:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Crédito no encontrado"
            )
        
        if credito.estado not in [EstadoCredito.AL_DIA, EstadoCredito.MORA, EstadoCredito.DESEMBOLSADO]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El crédito no acepta pagos en su estado actual"
            )
        
        # Generar número de recibo
        numero_recibo = CreditoService.generar_numero_recibo(db, data.fecha_pago or date.today())
        
        # Crear pago
        pago = Pago(
            numero_recibo=numero_recibo,
            credito_id=data.credito_id,
            valor_total=data.valor_total,
            metodo_pago=data.metodo_pago,
            referencia=data.referencia,
            fecha_pago=data.fecha_pago or date.today(),
            observaciones=data.observaciones,
            registrado_por_id=usuario_id,
            valor_capital=Decimal("0"),
            valor_interes=Decimal("0"),
            valor_mora=Decimal("0")
        )
        
        db.add(pago)
        db.flush()
        
        # Aplicar pago a cuotas pendientes
        valor_restante = data.valor_total
        cuotas_pendientes = db.query(Cuota).filter(
            Cuota.credito_id == data.credito_id,
            Cuota.estado.in_([EstadoCuota.PENDIENTE, EstadoCuota.MORA])
        ).order_by(Cuota.numero_cuota).all()
        
        for cuota in cuotas_pendientes:
            if valor_restante <= 0:
                break
            
            # Calcular lo que falta por pagar en esta cuota
            saldo_cuota = cuota.valor_cuota - cuota.valor_pagado
            valor_abono = min(valor_restante, saldo_cuota)
            
            # Crear abono
            abono = AbonoCuota(
                pago_id=pago.id,
                cuota_id=cuota.id,
                valor_abonado=valor_abono
            )
            db.add(abono)
            
            # Actualizar cuota
            cuota.valor_pagado += valor_abono
            
            if cuota.valor_pagado >= cuota.valor_cuota:
                cuota.estado = EstadoCuota.PAGADA
                cuota.fecha_pago = pago.fecha_pago
            
            # Distribuir entre capital, interés y mora
            proporcion_pagada = cuota.valor_pagado / cuota.valor_cuota
            pago.valor_capital += cuota.capital * proporcion_pagada
            pago.valor_interes += cuota.interes * proporcion_pagada
            pago.valor_mora += cuota.valor_mora * proporcion_pagada
            
            valor_restante -= valor_abono
        
        # Actualizar saldos del crédito
        credito.saldo_capital -= pago.valor_capital
        credito.saldo_interes -= pago.valor_interes
        credito.saldo_mora -= pago.valor_mora
        
        # Verificar si el crédito está cancelado
        if credito.saldo_capital <= 0:
            credito.estado = EstadoCredito.CANCELADO
            credito.fecha_ultimo_pago = pago.fecha_pago
        elif credito.estado == EstadoCredito.MORA:
            # Verificar si salió de mora
            cuotas_mora = db.query(Cuota).filter(
                Cuota.credito_id == credito.id,
                Cuota.estado == EstadoCuota.MORA
            ).count()
            
            if cuotas_mora == 0:
                credito.estado = EstadoCredito.AL_DIA
                credito.dias_mora = 0
        
        db.commit()
        db.refresh(pago)
        
        return pago

    @staticmethod
    def calcular_mora(db: Session, fecha_corte: date = None):
        """Calcular mora de todos los créditos activos."""
        if fecha_corte is None:
            fecha_corte = date.today()
        
        # Obtener cuotas vencidas
        cuotas_vencidas = db.query(Cuota).join(Credito).filter(
            Cuota.fecha_vencimiento < fecha_corte,
            Cuota.estado == EstadoCuota.PENDIENTE,
            Credito.estado.in_([EstadoCredito.AL_DIA, EstadoCredito.MORA, EstadoCredito.DESEMBOLSADO])
        ).all()
        
        tasa_mora_diaria = Decimal("0.001")  # 0.1% diario
        
        for cuota in cuotas_vencidas:
            dias_vencido = (fecha_corte - cuota.fecha_vencimiento).days
            if dias_vencido > 0:
                cuota.dias_mora = dias_vencido
                cuota.estado = EstadoCuota.MORA
                cuota.valor_mora = cuota.valor_cuota * tasa_mora_diaria * dias_vencido
                
                # Actualizar crédito
                credito = cuota.credito
                credito.estado = EstadoCredito.MORA
                credito.dias_mora = max(credito.dias_mora, dias_vencido)
                credito.saldo_mora += cuota.valor_mora
        
        db.commit()

    @staticmethod
    def obtener_estadisticas(db: Session) -> dict:
        """Obtener estadísticas de créditos."""
        total = db.query(Credito).count()
        activos = db.query(Credito).filter(
            Credito.estado.in_([EstadoCredito.AL_DIA, EstadoCredito.MORA, EstadoCredito.DESEMBOLSADO])
        ).count()
        al_dia = db.query(Credito).filter(Credito.estado == EstadoCredito.AL_DIA).count()
        mora = db.query(Credito).filter(Credito.estado == EstadoCredito.MORA).count()
        
        cartera = db.query(func.sum(Credito.saldo_capital)).filter(
            Credito.estado.in_([EstadoCredito.AL_DIA, EstadoCredito.MORA, EstadoCredito.DESEMBOLSADO])
        ).scalar() or Decimal("0")
        
        total_mora = db.query(func.sum(Credito.saldo_mora)).filter(
            Credito.estado == EstadoCredito.MORA
        ).scalar() or Decimal("0")
        
        promedio_mora = db.query(func.avg(Credito.dias_mora)).filter(
            Credito.estado == EstadoCredito.MORA
        ).scalar() or 0
        
        tasa_morosidad = (mora / activos * 100) if activos > 0 else 0
        
        return {
            "total_creditos": total,
            "creditos_activos": activos,
            "creditos_al_dia": al_dia,
            "creditos_en_mora": mora,
            "total_cartera": cartera,
            "total_mora": total_mora,
            "promedio_dias_mora": float(promedio_mora),
            "tasa_morosidad": round(tasa_morosidad, 2)
        }
