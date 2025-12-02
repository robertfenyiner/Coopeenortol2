import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-CO').format(num);
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.substring(0, length) + '...' : str;
}

export function calcularTiempoAsociado(fechaIngreso: string | Date): string {
  const inicio = new Date(fechaIngreso);
  const hoy = new Date();
  
  // Calcular diferencia en milisegundos
  let diff = hoy.getTime() - inicio.getTime();
  
  // Si es fecha futura, retornar mensaje
  if (diff < 0) {
    return 'Fecha futura';
  }
  
  // Calcular años, meses y días
  let años = hoy.getFullYear() - inicio.getFullYear();
  let meses = hoy.getMonth() - inicio.getMonth();
  let dias = hoy.getDate() - inicio.getDate();
  
  // Ajustar si los días son negativos
  if (dias < 0) {
    meses--;
    const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
    dias += ultimoDiaMesAnterior;
  }
  
  // Ajustar si los meses son negativos
  if (meses < 0) {
    años--;
    meses += 12;
  }
  
  // Construir el string de resultado
  const partes: string[] = [];
  
  if (años > 0) {
    partes.push(`${años} año${años !== 1 ? 's' : ''}`);
  }
  
  if (meses > 0) {
    partes.push(`${meses} mes${meses !== 1 ? 'es' : ''}`);
  }
  
  if (dias > 0 || partes.length === 0) {
    partes.push(`${dias} día${dias !== 1 ? 's' : ''}`);
  }
  
  return partes.join(', ');
}
