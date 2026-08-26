import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount, currency = 'ARS', locale = 'es-AR') {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString, timeZone = 'America/Argentina/Buenos_Aires', locale = 'es-AR') {
  if (!dateString) return '-';
  const date = new Date(dateString);
  try {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timeZone,
    }).format(date);
  } catch (e) {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
}

export function formatNumber(value, locale = 'es-AR', options = {}) {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatRole(role) {
  if (!role) return 'USUARIO';
  const normalized = String(role).toLowerCase().trim();
  if (normalized === 'super_admin' || normalized === 'super admin' || normalized === 'super_administrador' || normalized === 'super administrador') {
    return 'SUPER ADMINISTRADOR';
  }
  if (normalized === 'admin' || normalized === 'administrador') {
    return 'ADMINISTRADOR';
  }
  if (normalized === 'client' || normalized === 'cliente') {
    return 'CLIENTE';
  }
  if (normalized === 'media_buyer' || normalized === 'media buyer') {
    return 'MEDIA BUYER';
  }
  if (normalized === 'salesperson' || normalized === 'vendedor') {
    return 'VENDEDOR';
  }
  return String(role).toUpperCase();
}
