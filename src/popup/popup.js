import { StorageService } from '../services/storage.js';
import { GeminiService } from '../services/gemini.js';

// Dictionary for UI translations
const i18n = {
  en: {
    apiKeyTitle: "🔑 Gemini API Key",
    apiKeyPlaceholder: "Enter Gemini API key (AIzaSy...)",
    saveBtn: "Save",
    trackCurrentTabLabel: "Track Current Product",
    scanAllBtnLabel: "Scan Prices",
    exportCsvLabel: "Export to Sheet",
    trackedListTitle: "Monitored Products",
    statTotalLabel: "Total Monitored",
    statDropsLabel: "Price Drops",
    noKeyWarning: "Please enter your free Gemini API Key first.",
    emptyList: "No products monitored yet. Open a product page and click 'Track Current Product'.",
    keySaved: "API Key saved successfully!",
    scanning: "Scanning page...",
    scanComplete: "Scan complete!",
    scanError: "Error scanning page: ",
    priceDrop: "Price Drop!",
    exportSuccess: "CSV Exported successfully!",
    noProductsExport: "No products available to export."
  },
  th: {
    apiKeyTitle: "🔑 ตั้งค่า Gemini API Key",
    apiKeyPlaceholder: "กรอกรหัส Gemini API Key (AIzaSy...)",
    saveBtn: "บันทึก",
    trackCurrentTabLabel: "ติดตามสินค้าในหน้านี้",
    scanAllBtnLabel: "สแกนเช็กราคา",
    exportCsvLabel: "ส่งออก CSV / Sheet",
    trackedListTitle: "รายการสินค้าที่ติดตามอยู่",
    statTotalLabel: "สินค้าที่ติดตาม",
    statDropsLabel: "ราคาสินค้าลดลง",
    noKeyWarning: "กรุณาใส่ Gemini API Key ฟรีของคุณก่อนเริ่มต้น",
    emptyList: "ยังไม่มีสินค้าที่ติดตาม เปิดหน้าสินค้าคู่แข่งแล้วกด 'ติดตามสินค้าในหน้านี้'",
    keySaved: "บันทึก API Key เรียบร้อยแล้ว!",
    scanning: "กำลังสแกนหน้าเว็บ...",
    scanComplete: "สแกนเรียบร้อยแล้ว!",
    scanError: "เกิดข้อผิดพลาดในการสแกน: ",
    priceDrop: "ราคาลดลง!",
    exportSuccess: "ส่งออกไฟล์ CSV เรียบร้อยแล้ว!",
    noProductsExport: "ไม่มีรายการสินค้าสำหรับส่งออก"
  }
};

let currentLang = 'en';

document.addEventListener('DOMContentLoaded', async () => {
  const settings = await StorageService.getSettings();
  currentLang = settings.lang || 'en';

  const langSelect = document.getElementById('langSelect');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const saveKeyBtn = document.getElementById('saveKeyBtn');
  const trackTabBtn = document.getElementById('trackTabBtn');
  const scanAllBtn = document.getElementById('scanAllBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');

  langSelect.value = currentLang;
  if (settings.apiKey) {
    apiKeyInput.value = settings.apiKey;
  }

  updateUILanguage(currentLang);
  await renderProductList();

  // Language Change Listener
  langSelect.addEventListener('change', async (e) => {
    currentLang = e.target.value;
    const key = apiKeyInput.value.trim();
    await StorageService.saveSettings(key, currentLang);
    updateUILanguage(currentLang);
    await renderProductList();
  });

  // Save API Key Listener
  saveKeyBtn.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
      showStatus(i18n[currentLang].noKeyWarning, true);
      return;
    }
    await StorageService.saveSettings(key, currentLang);
    showStatus(i18n[currentLang].keySaved, false);
  });

  // Track Current Active Tab Listener
  trackTabBtn.addEventListener('click', async () => {
    const { apiKey } = await StorageService.getSettings();
    if (!apiKey) {
      showStatus(i18n[currentLang].noKeyWarning, true);
      return;
    }

    showStatus(i18n[currentLang].scanning, false);

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    try {
      // Execute content script if not already injected
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['src/scripts/content.js']
      });

      // Send message to extract page text
      chrome.tabs.sendMessage(tab.id, { action: 'EXTRACT_PAGE_DATA' }, async (response) => {
        if (!response || !response.success) {
          showStatus(i18n[currentLang].scanError + (response?.error || 'Cannot access page'), true);
          return;
        }

        try {
          const parsed = await GeminiService.extractPriceInfo(response.content, apiKey);
          
          await StorageService.addProduct({
            title: parsed.title || response.title,
            url: response.url,
            currentPrice: parsed.price,
            currency: parsed.currency
          });

          showStatus(i18n[currentLang].scanComplete, false);
          await renderProductList();
        } catch (err) {
          showStatus(i18n[currentLang].scanError + err.message, true);
        }
      });

    } catch (err) {
      showStatus(i18n[currentLang].scanError + err.message, true);
    }
  });

  // Manual Scan All Items Listener
  scanAllBtn.addEventListener('click', async () => {
    const { apiKey } = await StorageService.getSettings();
    if (!apiKey) {
      showStatus(i18n[currentLang].noKeyWarning, true);
      return;
    }
    const products = await StorageService.getProducts();
    if (products.length === 0) return;

    showStatus(i18n[currentLang].scanning, false);

    for (let i = 0; i < products.length; i++) {
      const item = products[i];
      try {
        const response = await fetch(item.url);
        const htmlText = await response.text();
        const cleanText = htmlText.replace(/<[^>]+>/g, ' ').substring(0, 10000);
        const parsed = await GeminiService.extractPriceInfo(cleanText, apiKey);
        if (parsed.price > 0) {
          item.currentPrice = parsed.price;
          item.lastChecked = new Date().toISOString();
          if (!item.history) item.history = [];
          item.history.push({ price: parsed.price, date: new Date().toISOString() });
        }
      } catch (err) {
        console.warn(`[SpyPrice UI] Failed to scan ${item.url}:`, err);
      }
    }

    await StorageService.saveProducts(products);
    await renderProductList();
    showStatus(i18n[currentLang].scanComplete, false);
  });

  // Export to Sheet / CSV Listener
  exportCsvBtn.addEventListener('click', async () => {
    const products = await StorageService.getProducts();
    if (products.length === 0) {
      showStatus(i18n[currentLang].noProductsExport, true);
      return;
    }

    exportToCsv(products);
    showStatus(i18n[currentLang].exportSuccess, false);
  });
});

function updateUILanguage(lang) {
  const dict = i18n[lang] || i18n.en;
  document.getElementById('apiKeyTitle').textContent = dict.apiKeyTitle;
  document.getElementById('apiKeyInput').placeholder = dict.apiKeyPlaceholder;
  document.getElementById('saveKeyBtn').textContent = dict.saveBtn;
  document.getElementById('trackCurrentTabLabel').textContent = dict.trackCurrentTabLabel;
  document.getElementById('scanAllBtnLabel').textContent = dict.scanAllBtnLabel;
  document.getElementById('exportCsvLabel').textContent = dict.exportCsvLabel;
  document.getElementById('trackedListTitle').textContent = dict.trackedListTitle;
  document.getElementById('statTotalLabel').textContent = dict.statTotalLabel;
  document.getElementById('statDropsLabel').textContent = dict.statDropsLabel;
}

function showStatus(msg, isError) {
  const el = document.getElementById('keyStatus');
  el.textContent = msg;
  el.className = 'status-msg ' + (isError ? 'error' : '');
  setTimeout(() => {
    el.textContent = '';
  }, 4000);
}

async function renderProductList() {
  const products = await StorageService.getProducts();
  const listEl = document.getElementById('productList');
  const countEl = document.getElementById('productCount');
  const statTotalEl = document.getElementById('statTotal');
  const statDropsEl = document.getElementById('statDrops');

  // Stats calculation
  let priceDropCount = 0;
  products.forEach(p => {
    if (p.currentPrice < p.initialPrice) priceDropCount++;
  });

  statTotalEl.textContent = products.length;
  statDropsEl.textContent = priceDropCount;
  countEl.textContent = products.length;
  listEl.innerHTML = '';

  if (products.length === 0) {
    listEl.innerHTML = `<p class="empty-state">${i18n[currentLang].emptyList}</p>`;
    return;
  }

  products.forEach((prod) => {
    const itemEl = document.createElement('div');
    itemEl.className = 'product-item';

    const isPriceDrop = prod.currentPrice < prod.initialPrice;
    const priceDiff = prod.initialPrice - prod.currentPrice;
    const dropPercentage = (prod.initialPrice > 0 && isPriceDrop) 
      ? Math.round((priceDiff / prod.initialPrice) * 100) 
      : 0;

    const formattedDate = formatTimestamp(prod.lastChecked || prod.updatedAt);

    itemEl.innerHTML = `
      <div class="product-item-header">
        <a href="${escapeHtml(prod.url)}" target="_blank" class="product-title" title="${escapeHtml(prod.title)}">
          ${escapeHtml(prod.title)}
        </a>
        <button class="delete-btn" data-id="${prod.id}" title="Remove item">✕</button>
      </div>
      <div class="product-details">
        <div class="price-box">
          <span class="price-current">${prod.currency || 'THB'} ${prod.currentPrice.toLocaleString()}</span>
          ${isPriceDrop ? `<span class="price-initial">${prod.currency || 'THB'} ${prod.initialPrice.toLocaleString()}</span>` : ''}
          ${isPriceDrop ? `<span class="price-drop-tag">-${dropPercentage}%</span>` : ''}
        </div>
        <span class="timestamp-text">🕒 ${formattedDate}</span>
      </div>
    `;

    itemEl.querySelector('.delete-btn').addEventListener('click', async (e) => {
      const id = e.target.getAttribute('data-id');
      await StorageService.removeProduct(id);
      await renderProductList();
    });

    listEl.appendChild(itemEl);
  });
}

/**
 * Formats ISO date string into readable local timestamp string
 */
function formatTimestamp(isoString) {
  if (!isoString) return 'Just now';
  try {
    const d = new Date(isoString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}`;
  } catch (e) {
    return 'Recently';
  }
}

/**
 * Export product tracking data to CSV (Excel / Sheet compatible UTF-8 BOM)
 */
function exportToCsv(products) {
  const headers = [
    'Product Title (ชื่อสินค้า)',
    'Current Price (ราคาปัจจุบัน)',
    'Initial Price (ราคาตั้งต้น)',
    'Currency (สกุลเงิน)',
    'Price Status (สถานะราคา)',
    'Last Updated (อัปเดตล่าสุด)',
    'Product URL (ลิงก์สินค้า)'
  ];

  const rows = products.map(p => {
    const isPriceDrop = p.currentPrice < p.initialPrice;
    const status = isPriceDrop ? 'Price Dropped (ราคาลดลง)' : 'Normal (ราคาปกติ)';
    const dateFormatted = formatTimestamp(p.lastChecked || p.updatedAt);

    return [
      `"${String(p.title || '').replace(/"/g, '""')}"`,
      p.currentPrice || 0,
      p.initialPrice || 0,
      `"${p.currency || 'THB'}"`,
      `"${status}"`,
      `"${dateFormatted}"`,
      `"${p.url || ''}"`
    ].join(',');
  });

  // Include UTF-8 BOM (\uFEFF) for automatic Thai character support in Excel
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const today = new Date().toISOString().split('T')[0];
  const filename = `SpyPrice_Tracked_Products_${today}.csv`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
