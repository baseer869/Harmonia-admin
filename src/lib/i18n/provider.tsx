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
  /** Page titles + descriptions, keyed by page. */
  pages: Record<string, { title: string; desc: string }>;
  common: {
    add: string; edit: string; view: string; save: string; cancel: string;
    search: string; selectStatus: string; allStatuses: string; actions: string;
    status: string; active: string; hidden: string; loading: string; noResults: string;
    name: string; email: string; phone: string; city: string; total: string;
    created: string; reference: string; close: string;
    back: string; next: string; saving: string;
  };
  status: { PENDING: string; CONFIRMED: string; CANCELLED: string; COMPLETED: string };
  bookings: {
    listing: string; searchPlaceholder: string; customer: string; phone: string;
    services: string; scheduled: string; guest: string; items: string; empty: string;
    emptyFiltered: string; loading: string; detailCustomer: string; detailItems: string;
    detailNotes: string; detailSchedule: string; detailBookedOn: string; subtotal: string;
    discount: string; approve: string; reject: string; markCompleted: string; cancel: string;
    updateHint: string;
  };
  services: {
    listing: string; addService: string; title: string; slug: string; price: string;
    onRequest: string; empty: string; loading: string;
  };
  lists: {
    tenantListing: string; adminListing: string; appUsersListing: string;
    categoriesListing: string; addTenant: string; addUser: string; addCategory: string;
    loadingTenants: string; emptyTenants: string; loadingUsers: string; emptyUsers: string;
    emptyCustomers: string; emptyCategories: string;
    suspended: string; archived: string; blocked: string; inactive: string;
    id: string; slug: string; parent: string;
  };
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
    pages: {
      dashboard: { title: 'Dashboard', desc: 'Overview of your activity.' },
      bookings: { title: 'Bookings', desc: 'Booking requests and their lifecycle.' },
      services: { title: 'Services', desc: 'The services your business offers. Managed per tenant.' },
      categories: { title: 'Categories', desc: 'Organize your services (up to two levels).' },
      tenants: { title: 'Tenants', desc: 'Organizations on the platform.' },
      admins: { title: 'Users Management', desc: 'Admin accounts and access.' },
      appUsers: { title: 'Users Management', desc: 'App users (customers).' },
      settings: { title: 'Settings', desc: 'Workspace settings.' },
    },
    common: {
      add: 'Add', edit: 'Edit', view: 'View', save: 'Save changes', cancel: 'Cancel',
      search: 'Search', selectStatus: 'Select Status', allStatuses: 'All statuses',
      actions: 'Actions', status: 'Status', active: 'Active', hidden: 'Hidden',
      loading: 'Loading…', noResults: 'No results.', name: 'Name', email: 'Email',
      phone: 'Phone', city: 'City', total: 'Total', created: 'Created', reference: 'Reference',
      close: 'Close', back: 'Back', next: 'Next', saving: 'Saving…',
    },
    status: { PENDING: 'Pending', CONFIRMED: 'Confirmed', CANCELLED: 'Cancelled', COMPLETED: 'Completed' },
    bookings: {
      listing: 'Bookings Listing', searchPlaceholder: 'Search reference, customer, service…',
      customer: 'Customer', phone: 'Phone', services: 'Services', scheduled: 'Scheduled',
      guest: 'Guest', items: 'item(s)', empty: 'No bookings yet.', emptyFiltered: 'No bookings match your filters.',
      loading: 'Loading bookings…', detailCustomer: 'Customer', detailItems: 'Items',
      detailNotes: 'Notes', detailSchedule: 'Scheduled', detailBookedOn: 'Booked on',
      subtotal: 'Subtotal', discount: 'Discount', approve: 'Approve', reject: 'Reject',
      markCompleted: 'Mark completed', cancel: 'Cancel', updateHint: 'Update the booking status',
    },
    services: {
      listing: 'Service Listing', addService: 'Add Service', title: 'Title', slug: 'Slug',
      price: 'Price', onRequest: 'On request', empty: 'No services yet. Add the first one to your catalog.',
      loading: 'Loading services…',
    },
    lists: {
      tenantListing: 'Tenant Listing', adminListing: 'Admins Listing', appUsersListing: 'App Users Listing',
      categoriesListing: 'Categories Listing', addTenant: 'Add tenant', addUser: 'Add user', addCategory: 'Add category',
      loadingTenants: 'Loading tenants…', emptyTenants: 'No tenants yet. Create the first one.',
      loadingUsers: 'Loading users…', emptyUsers: 'No users yet.',
      emptyCustomers: 'No customers yet.', emptyCategories: 'No categories yet.',
      suspended: 'Suspended', archived: 'Archived', blocked: 'Blocked', inactive: 'Inactive',
      id: 'ID', slug: 'Slug', parent: 'Parent',
    },
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
    pages: {
      dashboard: { title: 'Tableau de bord', desc: 'Aperçu de votre activité.' },
      bookings: { title: 'Réservations', desc: 'Demandes de réservation et leur suivi.' },
      services: { title: 'Services', desc: 'Les services proposés par votre entreprise. Gérés par locataire.' },
      categories: { title: 'Catégories', desc: 'Organisez vos services (jusqu’à deux niveaux).' },
      tenants: { title: 'Locataires', desc: 'Organisations sur la plateforme.' },
      admins: { title: 'Gestion des utilisateurs', desc: 'Comptes administrateurs et accès.' },
      appUsers: { title: 'Gestion des utilisateurs', desc: 'Utilisateurs de l’application (clients).' },
      settings: { title: 'Paramètres', desc: 'Paramètres de l’espace.' },
    },
    common: {
      add: 'Ajouter', edit: 'Modifier', view: 'Voir', save: 'Enregistrer', cancel: 'Annuler',
      search: 'Rechercher', selectStatus: 'Statut', allStatuses: 'Tous les statuts',
      actions: 'Actions', status: 'Statut', active: 'Actif', hidden: 'Masqué',
      loading: 'Chargement…', noResults: 'Aucun résultat.', name: 'Nom', email: 'E-mail',
      phone: 'Téléphone', city: 'Ville', total: 'Total', created: 'Créé le', reference: 'Référence',
      close: 'Fermer', back: 'Retour', next: 'Suivant', saving: 'Enregistrement…',
    },
    status: { PENDING: 'En attente', CONFIRMED: 'Confirmée', CANCELLED: 'Annulée', COMPLETED: 'Terminée' },
    bookings: {
      listing: 'Liste des réservations', searchPlaceholder: 'Réf., client, service…',
      customer: 'Client', phone: 'Téléphone', services: 'Services', scheduled: 'Prévu le',
      guest: 'Invité', items: 'article(s)', empty: 'Aucune réservation pour le moment.', emptyFiltered: 'Aucune réservation ne correspond aux filtres.',
      loading: 'Chargement des réservations…', detailCustomer: 'Client', detailItems: 'Articles',
      detailNotes: 'Notes', detailSchedule: 'Prévu le', detailBookedOn: 'Réservé le',
      subtotal: 'Sous-total', discount: 'Remise', approve: 'Approuver', reject: 'Rejeter',
      markCompleted: 'Marquer terminée', cancel: 'Annuler', updateHint: 'Mettre à jour le statut',
    },
    services: {
      listing: 'Liste des services', addService: 'Ajouter un service', title: 'Titre', slug: 'Slug',
      price: 'Prix', onRequest: 'Sur demande', empty: 'Aucun service. Ajoutez le premier à votre catalogue.',
      loading: 'Chargement des services…',
    },
    lists: {
      tenantListing: 'Liste des locataires', adminListing: 'Liste des admins', appUsersListing: 'Liste des utilisateurs',
      categoriesListing: 'Liste des catégories', addTenant: 'Ajouter un locataire', addUser: 'Ajouter un utilisateur', addCategory: 'Ajouter une catégorie',
      loadingTenants: 'Chargement des locataires…', emptyTenants: 'Aucun locataire. Créez le premier.',
      loadingUsers: 'Chargement…', emptyUsers: 'Aucun utilisateur.',
      emptyCustomers: 'Aucun client.', emptyCategories: 'Aucune catégorie.',
      suspended: 'Suspendu', archived: 'Archivé', blocked: 'Bloqué', inactive: 'Inactif',
      id: 'ID', slug: 'Slug', parent: 'Parent',
    },
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
