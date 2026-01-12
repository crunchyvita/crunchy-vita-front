// frontend/utils/renderEmail.js
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { WelcomeEmail } from '@/components/email/WelcomeEmail';

export function getWelcomeEmailHtml(name) {
  return renderToStaticMarkup(<WelcomeEmail name={name} />);
}
