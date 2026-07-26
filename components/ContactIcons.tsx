'use client';

import { Phone, Mail, MapPin, Clock } from 'lucide-react';

const iconClass = 'mt-0.5 shrink-0 text-slate-500';
const iconSize = 16;

export function PhoneIcon() {
  return <Phone size={iconSize} className={iconClass} aria-hidden="true" />;
}

export function MailIcon() {
  return <Mail size={iconSize} className={iconClass} aria-hidden="true" />;
}

export function MapPinIcon() {
  return <MapPin size={iconSize} className={iconClass} aria-hidden="true" />;
}

export function ClockIcon() {
  return <Clock size={iconSize} className={iconClass} aria-hidden="true" />;
}
