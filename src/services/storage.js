/**
 * Safe Storage Abstraction Layer for SpyPrice Chrome Extension
 * Uses chrome.storage.local for client-side zero-cost data persistence.
 */

export const StorageService = {
  // Get all settings (API Key, Language Preference)
  getSettings: () => {
    return new Promise((resolve) => {
      chrome.storage.local.get(['apiKey', 'lang'], (result) => {
        resolve({
          apiKey: result.apiKey || '',
          lang: result.lang || 'en' // Default language is EN
        });
      });
    });
  },

  // Save user settings securely to chrome.storage.local
  saveSettings: (apiKey, lang) => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ apiKey: apiKey.trim(), lang }, () => {
        resolve(true);
      });
    });
  },

  // Get all tracked product items
  getProducts: () => {
    return new Promise((resolve) => {
      chrome.storage.local.get(['products'], (result) => {
        resolve(result.products || []);
      });
    });
  },

  // Save full product array
  saveProducts: (products) => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ products }, () => {
        resolve(true);
      });
    });
  },

  // Add new product item
  addProduct: async (product) => {
    const products = await StorageService.getProducts();
    // Check if product URL already exists
    const existsIndex = products.findIndex(p => p.url === product.url);
    if (existsIndex > -1) {
      products[existsIndex] = { ...products[existsIndex], ...product, updatedAt: new Date().toISOString() };
    } else {
      products.push({
        id: 'prod_' + Date.now(),
        title: product.title,
        url: product.url,
        currentPrice: product.currentPrice,
        initialPrice: product.currentPrice,
        currency: product.currency || 'THB',
        lastChecked: new Date().toISOString(),
        history: [{ price: product.currentPrice, date: new Date().toISOString() }]
      });
    }
    return StorageService.saveProducts(products);
  },

  // Remove a product by ID
  removeProduct: async (id) => {
    const products = await StorageService.getProducts();
    const filtered = products.filter(p => p.id !== id);
    return StorageService.saveProducts(filtered);
  }
};
