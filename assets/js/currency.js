/**
 * Privacy-First Dynamic Currency Engine v2
 *
 * Supports all global currencies via Intl API and
 * handles detection via browser locale (VPN-friendly).
 */

window.currencyManager = (function () {
  const STORAGE_KEY = 'mindfull_currency';

  // Basic conversion rates relative to USD (Mock for theme prototype)
  // In a production environment, these should be fetched from an API.
  const rates = {
    USD: 1.0,
    GBP: 0.79,
    EUR: 0.92,
    CHF: 0.87,
    JPY: 150.0,
    CAD: 1.35,
    AUD: 1.52,
    CNY: 7.19,
    INR: 83.0,
    BRL: 4.95,
    // Add more as needed or fetch dynamically
  };

  /**
   * Maps a BCP 47 language tag to its likely currency.
   * This is used for the initial "zero-config" detection.
   */
  function getCurrencyForLocale(locale) {
    try {
      // Use Intl.NumberFormat to guess the currency based on the locale
      // However, Intl doesn't directly give the 'local' currency.
      // We'll use a mapping for major regions and fallback to USD.

      const region = locale.split('-')[1] || locale.toUpperCase();

      const regionMap = {
        GB: 'GBP',
        US: 'USD',
        CH: 'CHF',
        JP: 'JPY',
        CA: 'CAD',
        AU: 'AUD',
        CN: 'CNY',
        IN: 'INR',
        BR: 'BRL',
        DE: 'EUR',
        FR: 'EUR',
        IT: 'EUR',
        ES: 'EUR',
        NL: 'EUR',
        IE: 'EUR',
      };

      if (regionMap[region]) return regionMap[region];

      // Check language if region fails
      const lang = locale.split('-')[0];
      const langMap = {
        en: 'USD',
        ja: 'JPY',
        de: 'EUR',
        fr: 'EUR',
        it: 'EUR',
        es: 'EUR',
      };

      return langMap[lang] || 'USD';
    } catch (e) {
      return 'USD';
    }
  }

  function getDetectedCurrency() {
    const locale = navigator.language || 'en-US';
    return getCurrencyForLocale(locale);
  }

  function getCurrency() {
    let cur = localStorage.getItem(STORAGE_KEY);
    if (!cur) {
      cur = getDetectedCurrency();
      // Don't save to localStorage yet, let it stay dynamic until user overrides
    }
    return cur;
  }

  function setCurrency(cc) {
    localStorage.setItem(STORAGE_KEY, cc);
    updateUI();
  }

  function formatPrice(amount, currency) {
    const rate = rates[currency] || 1.0;
    const converted = amount * rate;

    return new Intl.NumberFormat(navigator.language, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(converted);
  }

  function updateUI() {
    const currentCurrency = getCurrency();
    const elements = document.querySelectorAll('.js-price');

    elements.forEach(el => {
      const baseAmount = parseFloat(el.getAttribute('data-price-base'));
      if (isNaN(baseAmount)) return;

      el.textContent = formatPrice(baseAmount, currentCurrency);
    });

    // Update any currency labels or selectors
    document.querySelectorAll('.js-currency-label').forEach(el => {
      el.textContent = currentCurrency;
    });

    const selector = document.getElementById('currency-selector');
    if (selector) selector.value = currentCurrency;
  }

  return {
    init: function () {
      updateUI();
    },
    setCurrency: setCurrency,
    getCurrency: getCurrency,
    format: formatPrice,
  };
})();

// Ensure immediate execution and on DOM load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.currencyManager.init);
} else {
  window.currencyManager.init();
}
