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

export function formatRole(role, t) {
  if (!role) return t ? t('roles.user') : 'USUARIO';
  const normalized = String(role).toLowerCase().trim();
  let key = 'user';
  if (normalized === 'super_admin' || normalized === 'super admin' || normalized === 'super_administrador' || normalized === 'super administrador') {
    key = 'super_admin';
  } else if (normalized === 'admin' || normalized === 'administrador') {
    key = 'admin';
  } else if (normalized === 'client' || normalized === 'cliente') {
    key = 'client';
  } else if (normalized === 'media_buyer' || normalized === 'media buyer') {
    key = 'media_buyer';
  } else if (normalized === 'salesperson' || normalized === 'vendedor') {
    key = 'salesperson';
  }

  if (t) {
    return t(`roles.${key}`);
  }

  if (key === 'super_admin') return 'SUPER ADMINISTRADOR';
  if (key === 'admin') return 'ADMINISTRADOR';
  if (key === 'client') return 'CLIENTE';
  if (key === 'media_buyer') return 'MEDIA BUYER';
  if (key === 'salesperson') return 'VENDEDOR';
  return String(role).toUpperCase();
}
