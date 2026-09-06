export type TranslationValue = string | Record<string, TranslationValue>;

export interface TranslationDict {
  [key: string]: TranslationValue;
}

export interface I18nConfig {
  defaultLocale: string;
  locales: string[];
  translations: Record<string, TranslationDict>;
  fallbackLocale?: string;
}

export interface FormatNumberOptions {
  style?: "decimal" | "currency" | "percent";
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export interface DateFormatOptions {
  dateStyle?: "full" | "long" | "medium" | "short";
  timeStyle?: "full" | "long" | "medium" | "short";
}

class I18n {
  private locale: string;
  private defaultLocale: string;
  private translations: Record<string, TranslationDict>;
  private fallbackLocale: string;

  constructor(config: I18nConfig) {
    this.locale = config.defaultLocale;
    this.defaultLocale = config.defaultLocale;
    this.translations = config.translations;
    this.fallbackLocale = config.fallbackLocale || config.defaultLocale;
  }

  setLocale(locale: string): void {
    this.locale = locale;
  }

  getLocale(): string {
    return this.locale;
  }

  getLocales(): string[] {
    return Object.keys(this.translations);
  }

  t(key: string, params?: Record<string, string | number>): string {
    const value = this.getNestedValue(this.locale, key);
    if (value === null) {
      const fallbackValue = this.getNestedValue(this.fallbackLocale, key);
      if (fallbackValue === null) {
        return key;
      }
      return this.interpolate(fallbackValue, params);
    }
    return this.interpolate(value, params);
  }

  private getNestedValue(locale: string, key: string): string | null {
    const translations = this.translations[locale];
    if (!translations) return null;

    const keys = key.split(".");
    let current: TranslationValue = translations;

    for (const k of keys) {
      if (typeof current !== "object" || current === null) {
        return null;
      }
      current = (current as Record<string, TranslationValue>)[k];
      if (current === undefined) return null;
    }

    return typeof current === "string" ? current : null;
  }

  private interpolate(
    template: string,
    params?: Record<string, string | number>
  ): string {
    if (!params) return template;

    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
      return params[key] !== undefined ? String(params[key]) : `{{${key}}}`;
    });
  }

  formatNumber(value: number, options?: FormatNumberOptions): string {
    const formatOptions: Intl.NumberFormatOptions = {};

    if (options?.style) formatOptions.style = options.style;
    if (options?.currency) formatOptions.currency = options.currency;
    if (options?.minimumFractionDigits !== undefined) {
      formatOptions.minimumFractionDigits = options.minimumFractionDigits;
    }
    if (options?.maximumFractionDigits !== undefined) {
      formatOptions.maximumFractionDigits = options.maximumFractionDigits;
    }

    return new Intl.NumberFormat(this.locale, formatOptions).format(value);
  }

  formatCurrency(value: number, currency: string = "USD"): string {
    return this.formatNumber(value, { style: "currency", currency });
  }

  formatPercent(value: number): string {
    return this.formatNumber(value, { style: "percent" });
  }

  formatDate(date: Date, options?: DateFormatOptions): string {
    const formatOptions: Intl.DateTimeFormatOptions = {};

    if (options?.dateStyle) formatOptions.dateStyle = options.dateStyle;
    if (options?.timeStyle) formatOptions.timeStyle = options.timeStyle;

    return new Intl.DateTimeFormat(this.locale, formatOptions).format(date);
  }

  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const rtf = new Intl.RelativeTimeFormat(this.locale, { numeric: "auto" });

    if (seconds < 60) return rtf.format(-seconds, "second");
    if (minutes < 60) return rtf.format(-minutes, "minute");
    if (hours < 24) return rtf.format(-hours, "hour");
    if (days < 30) return rtf.format(-days, "day");

    return this.formatDate(date, { dateStyle: "medium" });
  }

  pluralize(
    count: number,
    singular: string,
    plural?: string
  ): string {
    const pluralForm = plural || `${singular}s`;
    return count === 1 ? singular : pluralForm;
  }

  direction(): "ltr" | "rtl" {
    const rtlLocales = ["ar", "he", "fa", "ur"];
    return rtlLocales.includes(this.locale) ? "rtl" : "ltr";
  }

  addTranslations(locale: string, translations: TranslationDict): void {
    this.translations[locale] = {
      ...(this.translations[locale] || {}),
      ...translations,
    };
  }

  removeTranslations(locale: string): void {
    delete this.translations[locale];
  }
}

const translations: Record<string, TranslationDict> = {
  en: {
    common: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      view: "View",
      close: "Close",
      back: "Back",
      next: "Next",
      search: "Search",
      filter: "Filter",
      sort: "Sort",
      reset: "Reset",
      apply: "Apply",
      confirm: "Confirm",
      yes: "Yes",
      no: "No",
      or: "or",
      and: "and",
    },
    property: {
      singular: "Property",
      plural: "Properties",
      beds: "Beds",
      baths: "Baths",
      sqft: "Sq Ft",
      price: "Price",
      address: "Address",
      description: "Description",
      features: "Features",
      gallery: "Gallery",
      map: "Map",
      details: "Details",
      similarProperties: "Similar Properties",
      scheduleTour: "Schedule a Tour",
      contactAgent: "Contact Agent",
      favorite: "Favorite",
      share: "Share",
      report: "Report",
    },
    agent: {
      singular: "Agent",
      plural: "Agents",
      contact: "Contact",
      experience: "Experience",
      specializations: "Specializations",
      listings: "Listings",
      reviews: "Reviews",
      about: "About",
    },
    search: {
      placeholder: "Search properties...",
      filters: "Filters",
      results: "Results",
      noResults: "No results found",
      clearFilters: "Clear Filters",
      saveSearch: "Save Search",
    },
    mortgage: {
      calculator: "Mortgage Calculator",
      monthlyPayment: "Monthly Payment",
      downPayment: "Down Payment",
      loanTerm: "Loan Term",
      interestRate: "Interest Rate",
      principalInterest: "Principal & Interest",
      propertyTax: "Property Tax",
      insurance: "Insurance",
      hoa: "HOA",
      total: "Total",
    },
  },
  es: {
    common: {
      loading: "Cargando...",
      error: "Error",
      success: "Éxito",
      cancel: "Cancelar",
      save: "Guardar",
      delete: "Eliminar",
      edit: "Editar",
      view: "Ver",
      close: "Cerrar",
      back: "Volver",
      next: "Siguiente",
      search: "Buscar",
      filter: "Filtrar",
      sort: "Ordenar",
      reset: "Restablecer",
      apply: "Aplicar",
      confirm: "Confirmar",
      yes: "Sí",
      no: "No",
      or: "o",
      and: "y",
    },
    property: {
      singular: "Propiedad",
      plural: "Propiedades",
      beds: "Habitaciones",
      baths: "Baños",
      sqft: "m²",
      price: "Precio",
      address: "Dirección",
      description: "Descripción",
      features: "Características",
      gallery: "Galería",
      map: "Mapa",
      details: "Detalles",
      similarProperties: "Propiedades Similares",
      scheduleTour: "Programar Visita",
      contactAgent: "Contactar Agente",
      favorite: "Favorito",
      share: "Compartir",
      report: "Reportar",
    },
    agent: {
      singular: "Agente",
      plural: "Agentes",
      contact: "Contacto",
      experience: "Experiencia",
      specializations: "Especializaciones",
      listings: "Listados",
      reviews: "Reseñas",
      about: "Acerca de",
    },
    search: {
      placeholder: "Buscar propiedades...",
      filters: "Filtros",
      results: "Resultados",
      noResults: "No se encontraron resultados",
      clearFilters: "Limpiar Filtros",
      saveSearch: "Guardar Búsqueda",
    },
    mortgage: {
      calculator: "Calculadora de Hipoteca",
      monthlyPayment: "Pago Mensual",
      downPayment: "Enganche",
      loanTerm: "Plazo del Préstamo",
      interestRate: "Tasa de Interés",
      principalInterest: "Capital e Intereses",
      propertyTax: "Impuesto de Propiedad",
      insurance: "Seguro",
      hoa: "HOA",
      total: "Total",
    },
  },
};

export const i18n = new I18n({
  defaultLocale: "en",
  locales: ["en", "es"],
  translations,
  fallbackLocale: "en",
});

export default i18n;
