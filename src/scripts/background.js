/**
 * Background Service Worker for SpyPrice Extension
 * Handles periodic alarms, API key verification, and background scanning.
 */

import { StorageService } from '../services/storage.js';
import { GeminiService } from '../services/gemini.js';

// Initialize periodic alarm for price scanning (Every 12 hours = 720 minutes)
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('SPYPRICE_BACKGROUND_CHECK', { periodInMinutes: 720 });
});

// Ensure alarm exists on background service worker startup
chrome.alarms.get('SPYPRICE_BACKGROUND_CHECK', (alarm) => {
  if (!alarm) {
    chrome.alarms.create('SPYPRICE_BACKGROUND_CHECK', { periodInMinutes: 720 });
  }
});

// Listen for periodic background checks
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'SPYPRICE_BACKGROUND_CHECK') {
    await performBackgroundScan();
  }
});

async function performBackgroundScan() {
  const { apiKey } = await StorageService.getSettings();
  if (!apiKey) return;

  const products = await StorageService.getProducts();
  if (products.length === 0) return;

  let priceDropCount = 0;

  for (let i = 0; i < products.length; i++) {
    const item = products[i];
    try {
      // Fetch URL HTML content in background
      const response = await fetch(item.url);
      const htmlText = await response.text();
      // Strip tags for clean text
      const cleanText = htmlText.replace(/<[^>]+>/g, ' ').substring(0, 10000);

      const parsed = await GeminiService.extractPriceInfo(cleanText, apiKey);
      if (parsed.price > 0) {
        if (parsed.price < item.currentPrice) {
          priceDropCount++;
        }
        item.currentPrice = parsed.price;
        item.lastChecked = new Date().toISOString();
        item.history.push({ price: parsed.price, date: new Date().toISOString() });
      }
    } catch (err) {
      console.warn(`[SpyPrice Background] Failed to scan ${item.url}:`, err);
    }
  }

  await StorageService.saveProducts(products);

  // Update extension badge if prices dropped
  if (priceDropCount > 0) {
    chrome.action.setBadgeText({ text: `${priceDropCount}` });
    chrome.action.setBadgeBackgroundColor({ color: '#E53E3E' });
  }
}
