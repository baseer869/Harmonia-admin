'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

/**
 * Lightweight admin i18n (EN/FR). Locale is kept client-side (localStorage) —
 * an admin panel needs no locale URLs. Use `useAdminI18n()` in client
 * components; translate the navigation/chrome first, deeper strings as needed.
 */
export type Locale = 'en' | 'fr';

interface Dict {
  nav: Record<string, string>;
  subnav: Record<string, string>;
  sidebar: { allTenants: string; myWorkspace: string; saas: string; admin: string };
  topbar: { search: string; signOut: string; language: string };
}

const DICT: Record<Locale, Dict> = {
  en: {
    nav: {
      dashboard: 'Dashboard',
      'users-mgmt': 'Users Management',
      services: 'Services',
      reservations: 'Bookings',
      settings: 'Settings',
    },
    subnav: {
      users: 'Admins',
      customers: 'App Users',
      tenants: 'Tenants',
      services: 'Catalog',
      categories: 'Categories',
    },
    sidebar: { allTenants: 'All Tenants', myWorkspace: 'My Workspace', saas: 'Harmonia SaaS', admin: 'Admin' },
    topbar: { search: 'Search…', signOut: 'Sign out', language: 'Language' },
  },
  fr: {
    nav: {
      dashboard: 'Tableau de bord',
      'users-mgmt': 'Gestion des utilisateurs',
      services: 'Services',
      reservations: 'Réservations',
      settings: 'Paramètres',
    },
    subnav: {
      users: 'Admins',
      customers: 'Utilisateurs',
      tenants: 'Locataires',
      services: 'Catalogue',
      categories: 'Catégories',
    },
    sidebar: { allTenants: 'Tous les locataires', myWorkspace: 'Mon espace', saas: 'Harmonia SaaS', admin: 'Admin' },
    topbar: { search: 'Rechercher…', signOut: 'Déconnexion', language: 'Langue' },
  },
};

interface Ctx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dict;
}

const I18nContext = createContext<Ctx | null>(null);
const STORAGE_KEY = 'harmonia.admin.locale';

export function AdminI18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'fr') setLocaleState(saved);
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: DICT[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useAdminI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useAdminI18n must be used within AdminI18nProvider');
  return ctx;
}
