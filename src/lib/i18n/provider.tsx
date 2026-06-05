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
  ownerReq: Record<string, string>;
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
    showing: string; of: string; results: string; previous: string;
  };
  status: { PENDING: string; CONFIRMED: string; CANCELLED: string; COMPLETED: string };
  bookings: {
    listing: string; searchPlaceholder: string; customer: string; phone: string;
    services: string; scheduled: string; guest: string; items: string; empty: string;
    emptyFiltered: string; loading: string; detailCustomer: string; detailItems: string;
    detailNotes: string; detailSchedule: string; detailBookedOn: string; subtotal: string;
    discount: string; approve: string; reject: string; markCompleted: string; cancel: string;
    updateHint: string; unit: string;
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
  /** Service onboarding/edit wizard. */
  svcForm: {
    addTitle: string; editTitle: string; create: string;
    stType: string; stGeneral: string; stMedia: string; stPricing: string;
    stOptions: string; stDetails: string; stReview: string;
    tenant: string; svcType: string; category: string; title: string; subtitle: string;
    description: string; tags: string; photo: string; priceMode: string; price: string;
    currency: string; priceUnit: string; maxPeople: string; duration: string;
    languages: string; visible: string; requiresDate: string;
    hintType: string; optional: string; commaSep: string; hintUnit: string;
    selectTenant: string; none: string; selectCategory: string;
    tExperience: string; tTransfer: string; tProduct: string; tQuote: string;
    mPerPerson: string; mPerTrip: string; mFixed: string; mOnQuote: string;
    yes: string; no: string; photoNote: string;
    optionsTitle: string; addOption: string; optionName: string; priceDelta: string;
    extrasTitle: string; addExtra: string; extraName: string; priceCol: string;
    optionsHint: string; extrasHint: string;
    includedTitle: string; addItem: string; itemTitle: string; itemDesc: string;
    practicalTitle: string; addInfo: string; infoLabel: string; infoValue: string;
    noneAdded: string; remove: string;
    rType: string; rTitle: string; rPrice: string; rOptions: string; rExtras: string;
    breakdown: string; basePrice: string; exampleTotal: string; variantsLabel: string; addonsLabel: string;
    rIncluded: string; onQuote: string; noCover: string; untitled: string;
    accepted: string; acceptedHint: string; baseTag: string;
    priceCurrency: string; priceCurrencyHint: string;
    stFrench: string; translateBtn: string; translating: string; frHint: string;
    contentLanguage: string; coverageLabel: string; translateTo: string;
    langFr: string; langEn: string; reqOneLang: string; autoTranslateHint: string;
  };
  /** Inline Add-user / Add-category forms. */
  forms: {
    password: string; add: string; adding: string;
    roleStaff: string; roleTenantAdmin: string; roleSuperAdmin: string;
    categoryName: string; parentCategory: string; parentHint: string; topLevel: string;
    optional: string; description: string; addCategory: string;
  };
  /** Tenant onboarding wizard. */
  tntForm: {
    stDetails: string; stProfile: string; stReview: string;
    onboardTitle: string; createTenant: string; name: string; status: string;
    currency: string; currencyHint: string; description: string; contactEmail: string;
    contactPhone: string; logo: string; cover: string;
    noCover: string; untitled: string; noDescription: string;
  };
}

const DICT: Record<Locale, Dict> = {
  en: {
    nav: {
      dashboard: 'Dashboard',
      'users-mgmt': 'Users Management',
      services: 'Services',
      reservations: 'Bookings',
      ownerRequests: 'Owner Requests',
      settings: 'Settings',
    },
    subnav: {
      users: 'Admins',
      customers: 'App Users',
      tenants: 'Tenants',
      services: 'Catalog',
      categories: 'Categories',
    },
    ownerReq: {
      listing: 'Provider Requests',
      business: 'Business',
      subject: 'Subject',
      requestedOn: 'Requested on',
      searchPlaceholder: 'Search name, email, business…',
      empty: 'No requests yet.',
      detailTitle: 'Provider request',
      role: 'Role',
      message: 'Message',
      noMessage: 'No message provided.',
      statusNEW: 'New',
      statusREVIEWING: 'Reviewing',
      statusAPPROVED: 'Approved',
      statusREJECTED: 'Rejected',
      statusCONVERTED: 'Converted',
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
      ownerRequests: { title: 'Owner Requests', desc: 'Businesses requesting to list their services.' },
      settings: { title: 'Settings', desc: 'Workspace settings.' },
    },
    common: {
      add: 'Add', edit: 'Edit', view: 'View', save: 'Save changes', cancel: 'Cancel',
      search: 'Search', selectStatus: 'Select Status', allStatuses: 'All statuses',
      actions: 'Actions', status: 'Status', active: 'Active', hidden: 'Hidden',
      loading: 'Loading…', noResults: 'No results.', name: 'Name', email: 'Email',
      phone: 'Phone', city: 'City', total: 'Total', created: 'Created', reference: 'Reference',
      close: 'Close', back: 'Back', next: 'Next', saving: 'Saving…',
      showing: 'Showing', of: 'of', results: 'results', previous: 'Previous',
    },
    status: { PENDING: 'Pending', CONFIRMED: 'Confirmed', CANCELLED: 'Cancelled', COMPLETED: 'Completed' },
    bookings: {
      listing: 'Bookings Listing', searchPlaceholder: 'Search reference, customer, service…',
      customer: 'Customer', phone: 'Phone', services: 'Services', scheduled: 'Scheduled',
      guest: 'Guest', items: 'item(s)', empty: 'No bookings yet.', emptyFiltered: 'No bookings match your filters.',
      loading: 'Loading bookings…', detailCustomer: 'Customer', detailItems: 'Items',
      detailNotes: 'Notes', detailSchedule: 'Scheduled', detailBookedOn: 'Booked on',
      subtotal: 'Subtotal', discount: 'Discount', approve: 'Approve', reject: 'Reject',
      markCompleted: 'Mark completed', cancel: 'Cancel', updateHint: 'Update the booking status', unit: 'Unit',
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
    svcForm: {
      addTitle: 'Add Service', editTitle: 'Edit Service', create: 'Create service',
      stType: 'Type & Category', stGeneral: 'General', stMedia: 'Media', stPricing: 'Pricing & Booking',
      stOptions: 'Options & Extras', stDetails: 'Details', stReview: 'Review',
      tenant: 'Tenant', svcType: 'Service type', category: 'Category', title: 'Title', subtitle: 'Subtitle',
      description: 'Description', tags: 'Tags', photo: 'Photo', priceMode: 'Price mode', price: 'Price',
      currency: 'Currency', priceUnit: 'Price unit', maxPeople: 'Max people', duration: 'Duration (minutes)',
      languages: 'Languages', visible: 'Visible in catalog', requiresDate: 'Requires a date',
      hintType: 'Drives the booking form', optional: 'Optional', commaSep: 'Comma-separated', hintUnit: 'e.g. "/ pers.", "/ trip"',
      selectTenant: 'Select a tenant…', none: '— None —', selectCategory: 'Select a category…',
      tExperience: 'Experience (date · people)', tTransfer: 'Transfer (per trip)', tProduct: 'Product (quantity)', tQuote: 'On quote (enquiry)',
      mPerPerson: 'Per person', mPerTrip: 'Per trip', mFixed: 'Fixed', mOnQuote: 'On quote',
      yes: 'Yes', no: 'No', photoNote: 'One photo is enough — it’s used as both the cover and the thumbnail.',
      optionsTitle: 'Variants', addOption: 'Add variant', optionName: 'e.g. Full-time, Half-time', priceDelta: 'Variant price (+)',
      extrasTitle: 'Add-ons', addExtra: 'Add add-on', extraName: 'e.g. Private guide, Extra night', priceCol: 'Price',
      optionsHint: 'The customer picks ONE variant. Its price is ADDED to the base price (set base = 0 if the price lives entirely in the variants).',
      extrasHint: 'Optional paid add-ons a customer can include. Leave empty if not needed.',
      includedTitle: "What's included", addItem: 'Add item', itemTitle: 'Title', itemDesc: 'Description',
      practicalTitle: 'Practical info', addInfo: 'Add info', infoLabel: 'Label (e.g. Duration)', infoValue: 'Value',
      noneAdded: 'None added.', remove: 'Remove',
      rType: 'Type', rTitle: 'Title', rPrice: 'Base price', rOptions: 'Options', rExtras: 'Extras',
      breakdown: 'Price breakdown', basePrice: 'Base price', exampleTotal: 'Example total (base + 1st variant + all add-ons)',
      variantsLabel: 'Variants', addonsLabel: 'Add-ons',
      rIncluded: 'Included', onQuote: 'On quote', noCover: 'No cover image', untitled: 'Untitled service',
      accepted: 'Also accept payment in', acceptedHint: 'Extra currencies a customer can pay in — the price currency is always included.', baseTag: 'base',
      priceCurrency: 'Price currency', priceCurrencyHint: 'The currency you enter the price in.',
      stFrench: 'Français', translateBtn: 'Auto-translate from English', translating: 'Translating…',
      frHint: 'French is required. Click translate, then review/edit.',
      contentLanguage: 'Content language', coverageLabel: 'Coverage', translateTo: 'Translate to',
      langFr: 'Français', langEn: 'English',
      reqOneLang: 'Enter a title and description for this language.',
      autoTranslateHint: 'The other language is generated automatically when you save.',
    },
    forms: {
      password: 'Password', add: 'Add', adding: 'Adding…',
      roleStaff: 'Staff', roleTenantAdmin: 'Tenant Admin', roleSuperAdmin: 'Super Admin',
      categoryName: 'Category name', parentCategory: 'Parent category',
      parentHint: 'Leave empty for a top-level category', topLevel: '— Top level —',
      optional: 'Optional', description: 'Description', addCategory: 'Add category',
    },
    tntForm: {
      stDetails: 'Tenant Details', stProfile: 'Profile & Branding', stReview: 'Review',
      onboardTitle: 'Onboard Tenant', createTenant: 'Create tenant', name: 'Tenant name', status: 'Status',
      currency: 'Default currency', currencyHint: "Used for this tenant's pricing & payments",
      description: 'Description', contactEmail: 'Contact email', contactPhone: 'Contact phone',
      logo: 'Logo', cover: 'Cover / banner',
      noCover: 'No cover image', untitled: 'Untitled tenant', noDescription: 'No description',
    },
  },
  fr: {
    nav: {
      dashboard: 'Tableau de bord',
      'users-mgmt': 'Gestion des utilisateurs',
      services: 'Services',
      reservations: 'Réservations',
      ownerRequests: 'Demandes prestataires',
      settings: 'Paramètres',
    },
    subnav: {
      users: 'Admins',
      customers: 'Utilisateurs',
      tenants: 'Locataires',
      services: 'Catalogue',
      categories: 'Catégories',
    },
    ownerReq: {
      listing: 'Demandes de prestataires',
      business: 'Entreprise',
      subject: 'Sujet',
      requestedOn: 'Demandé le',
      searchPlaceholder: 'Rechercher nom, e-mail, entreprise…',
      empty: 'Aucune demande pour le moment.',
      detailTitle: 'Demande de prestataire',
      role: 'Rôle',
      message: 'Message',
      noMessage: 'Aucun message fourni.',
      statusNEW: 'Nouvelle',
      statusREVIEWING: 'En examen',
      statusAPPROVED: 'Approuvée',
      statusREJECTED: 'Rejetée',
      statusCONVERTED: 'Convertie',
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
      ownerRequests: { title: 'Demandes prestataires', desc: 'Entreprises souhaitant lister leurs services.' },
      settings: { title: 'Paramètres', desc: 'Paramètres de l’espace.' },
    },
    common: {
      add: 'Ajouter', edit: 'Modifier', view: 'Voir', save: 'Enregistrer', cancel: 'Annuler',
      search: 'Rechercher', selectStatus: 'Statut', allStatuses: 'Tous les statuts',
      actions: 'Actions', status: 'Statut', active: 'Actif', hidden: 'Masqué',
      loading: 'Chargement…', noResults: 'Aucun résultat.', name: 'Nom', email: 'E-mail',
      phone: 'Téléphone', city: 'Ville', total: 'Total', created: 'Créé le', reference: 'Référence',
      close: 'Fermer', back: 'Retour', next: 'Suivant', saving: 'Enregistrement…',
      showing: 'Affichage', of: 'sur', results: 'résultats', previous: 'Précédent',
    },
    status: { PENDING: 'En attente', CONFIRMED: 'Confirmée', CANCELLED: 'Annulée', COMPLETED: 'Terminée' },
    bookings: {
      listing: 'Liste des réservations', searchPlaceholder: 'Réf., client, service…',
      customer: 'Client', phone: 'Téléphone', services: 'Services', scheduled: 'Prévu le',
      guest: 'Invité', items: 'article(s)', empty: 'Aucune réservation pour le moment.', emptyFiltered: 'Aucune réservation ne correspond aux filtres.',
      loading: 'Chargement des réservations…', detailCustomer: 'Client', detailItems: 'Articles',
      detailNotes: 'Notes', detailSchedule: 'Prévu le', detailBookedOn: 'Réservé le',
      subtotal: 'Sous-total', discount: 'Remise', approve: 'Approuver', reject: 'Rejeter',
      markCompleted: 'Marquer terminée', cancel: 'Annuler', updateHint: 'Mettre à jour le statut', unit: 'Unité',
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
    svcForm: {
      addTitle: 'Ajouter un service', editTitle: 'Modifier le service', create: 'Créer le service',
      stType: 'Type & catégorie', stGeneral: 'Général', stMedia: 'Média', stPricing: 'Tarif & réservation',
      stOptions: 'Options & extras', stDetails: 'Détails', stReview: 'Récapitulatif',
      tenant: 'Locataire', svcType: 'Type de service', category: 'Catégorie', title: 'Titre', subtitle: 'Sous-titre',
      description: 'Description', tags: 'Étiquettes', photo: 'Photo', priceMode: 'Mode de tarif', price: 'Prix',
      currency: 'Devise', priceUnit: 'Unité de prix', maxPeople: 'Personnes max', duration: 'Durée (minutes)',
      languages: 'Langues', visible: 'Visible au catalogue', requiresDate: 'Date requise',
      hintType: 'Détermine le formulaire de réservation', optional: 'Facultatif', commaSep: 'Séparés par des virgules', hintUnit: 'ex. « / pers. », « / trajet »',
      selectTenant: 'Choisir un locataire…', none: '— Aucune —', selectCategory: 'Choisir une catégorie…',
      tExperience: 'Expérience (date · personnes)', tTransfer: 'Transfert (par trajet)', tProduct: 'Produit (quantité)', tQuote: 'Sur devis (demande)',
      mPerPerson: 'Par personne', mPerTrip: 'Par trajet', mFixed: 'Fixe', mOnQuote: 'Sur devis',
      yes: 'Oui', no: 'Non', photoNote: 'Une seule photo suffit — utilisée comme couverture et miniature.',
      optionsTitle: 'Variantes', addOption: 'Ajouter une variante', optionName: 'ex. Temps plein, Demi-journée', priceDelta: 'Prix de la variante (+)',
      extrasTitle: 'Suppléments', addExtra: 'Ajouter un supplément', extraName: 'ex. Guide privé, Nuit supplémentaire', priceCol: 'Prix',
      optionsHint: 'Le client choisit UNE variante. Son prix est AJOUTÉ au prix de base (mettez le prix de base à 0 si le prix est entièrement dans les variantes).',
      extrasHint: 'Suppléments payants facultatifs que le client peut ajouter. Laissez vide si inutile.',
      includedTitle: 'Ce qui est inclus', addItem: 'Ajouter un élément', itemTitle: 'Titre', itemDesc: 'Description',
      practicalTitle: 'Infos pratiques', addInfo: 'Ajouter une info', infoLabel: 'Libellé (ex. Durée)', infoValue: 'Valeur',
      noneAdded: 'Aucun ajouté.', remove: 'Supprimer',
      rType: 'Type', rTitle: 'Titre', rPrice: 'Prix de base', rOptions: 'Options', rExtras: 'Extras',
      breakdown: 'Détail du prix', basePrice: 'Prix de base', exampleTotal: 'Total exemple (base + 1re variante + tous les suppléments)',
      variantsLabel: 'Variantes', addonsLabel: 'Suppléments',
      rIncluded: 'Inclus', onQuote: 'Sur devis', noCover: 'Pas de couverture', untitled: 'Service sans titre',
      accepted: 'Accepter aussi le paiement en', acceptedHint: 'Devises supplémentaires acceptées — la devise du prix est toujours incluse.', baseTag: 'base',
      priceCurrency: 'Devise du prix', priceCurrencyHint: 'La devise dans laquelle vous saisissez le prix.',
      stFrench: 'Français', translateBtn: "Traduire depuis l'anglais", translating: 'Traduction…',
      frHint: 'Le français est requis. Cliquez sur traduire, puis vérifiez/modifiez.',
      contentLanguage: 'Langue du contenu', coverageLabel: 'Couverture', translateTo: 'Traduire vers',
      langFr: 'Français', langEn: 'English',
      reqOneLang: 'Saisissez un titre et une description pour cette langue.',
      autoTranslateHint: "L'autre langue est générée automatiquement à l'enregistrement.",
    },
    forms: {
      password: 'Mot de passe', add: 'Ajouter', adding: 'Ajout…',
      roleStaff: 'Personnel', roleTenantAdmin: 'Admin locataire', roleSuperAdmin: 'Super Admin',
      categoryName: 'Nom de la catégorie', parentCategory: 'Catégorie parente',
      parentHint: 'Laisser vide pour une catégorie de premier niveau', topLevel: '— Premier niveau —',
      optional: 'Facultatif', description: 'Description', addCategory: 'Ajouter une catégorie',
    },
    tntForm: {
      stDetails: 'Détails du locataire', stProfile: 'Profil & image de marque', stReview: 'Récapitulatif',
      onboardTitle: 'Ajouter un locataire', createTenant: 'Créer le locataire', name: 'Nom du locataire', status: 'Statut',
      currency: 'Devise par défaut', currencyHint: 'Utilisée pour les prix & paiements de ce locataire',
      description: 'Description', contactEmail: 'E-mail de contact', contactPhone: 'Téléphone de contact',
      logo: 'Logo', cover: 'Couverture / bannière',
      noCover: 'Pas de couverture', untitled: 'Locataire sans nom', noDescription: 'Pas de description',
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
