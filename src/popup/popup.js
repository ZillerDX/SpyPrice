import { StorageService } from '../services/storage.js';
import { GeminiService } from '../services/gemini.js';

// Dictionary for UI translations
const i18n = {
  en: {
    apiKeyTitle: "Gemini API Key",
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
    exportSuccess: "Excel file exported successfully!",
    noProductsExport: "No products available to export."
  },
  th: {
    apiKeyTitle: "ตั้งค่า Gemini API Key",
    apiKeyPlaceholder: "กรอกรหัส Gemini API Key (AIzaSy...)",
    saveBtn: "บันทึก",
    trackCurrentTabLabel: "ติดตามสินค้าในหน้านี้",
    scanAllBtnLabel: "สแกนเช็กราคา",
    exportCsvLabel: "ส่งออก Sheet / Excel",
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
    exportSuccess: "ส่งออกไฟล์ Excel เรียบร้อยแล้ว!",
    noProductsExport: "ไม่มีรายการสินค้าสำหรับส่งออก"
  }
};

let currentLang = 'en';

document.addEventListener('DOMContentLoaded', async () => {
  const settings = await StorageService.getSettings();
  currentLang = settings.lang || 'en';

  const langToggleBtn = document.getElementById('langToggleBtn');
  const langText = document.getElementById('langText');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const saveKeyBtn = document.getElementById('saveKeyBtn');
  const trackTabBtn = document.getElementById('trackTabBtn');
  const scanAllBtn = document.getElementById('scanAllBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');

  // Set initial single button language text (EN or TH)
  langText.textContent = (currentLang || 'en').toUpperCase();

  if (settings.apiKey) {
    apiKeyInput.value = settings.apiKey;
  }

  updateUILanguage(currentLang);
  await renderProductList();

  // Single Click Language Toggle Listener (EN <-> TH)
  langToggleBtn.addEventListener('click', async () => {
    currentLang = currentLang === 'en' ? 'th' : 'en';
    langText.textContent = currentLang.toUpperCase();

    await StorageService.saveLanguage(currentLang);
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
    await StorageService.saveApiKey(key);
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

  // Export to Sheet / Excel Listener
  exportCsvBtn.addEventListener('click', async () => {
    const products = await StorageService.getProducts();
    if (products.length === 0) {
      showStatus(i18n[currentLang].noProductsExport, true);
      return;
    }

    exportToExcel(products);
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
        <span class="timestamp-text">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${formattedDate}
        </span>
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
 * Export product tracking data to beautifully formatted Excel file (.xls HTML Table)
 * Dynamically localized based on currently selected language (EN / TH)
 */
function exportToExcel(products) {
  const excelDict = {
    en: {
      reportTitle: "🎯 SpyPrice AI - Product Price Intelligence Report",
      exportedDate: "Exported Date:",
      totalMonitored: "Total Monitored:",
      itemsUnit: "items",
      colNum: "#",
      colTitle: "Product Name",
      colCurrentPrice: "Current Price",
      colInitialPrice: "Initial Price",
      colCurrency: "Currency",
      colStatus: "Price Status",
      colLastUpdated: "Last Updated",
      colLink: "Product Link",
      statusDropped: "Price Dropped",
      statusNormal: "Normal",
      openLink: "🔗 Open Link"
    },
    th: {
      reportTitle: "🎯 SpyPrice AI - รายงานสรุปการติดตามราคาสินค้า",
      exportedDate: "วันที่ส่งออกรายงาน:",
      totalMonitored: "สินค้าที่ติดตามทั้งหมด:",
      itemsUnit: "รายการ",
      colNum: "ลำดับ",
      colTitle: "ชื่อสินค้า",
      colCurrentPrice: "ราคาปัจจุบัน",
      colInitialPrice: "ราคาตั้งต้น",
      colCurrency: "สกุลเงิน",
      colStatus: "สถานะราคา",
      colLastUpdated: "อัปเดตล่าสุด",
      colLink: "ลิงก์สินค้า",
      statusDropped: "ราคาลดลง",
      statusNormal: "ปกติ",
      openLink: "🔗 เปิดลิงก์สินค้า"
    }
  };

  const t = excelDict[currentLang] || excelDict.en;

  const rowsHtml = products.map((p, index) => {
    const isPriceDrop = p.currentPrice < p.initialPrice;
    const priceDiff = p.initialPrice - p.currentPrice;
    const dropPercent = (p.initialPrice > 0 && isPriceDrop) 
      ? Math.round((priceDiff / p.initialPrice) * 100) 
      : 0;

    const statusHtml = isPriceDrop 
      ? `<span style="background-color: #FEE2E2; color: #B91C1C; font-weight: bold; padding: 4px 10px; border-radius: 4px;">${t.statusDropped} (-${dropPercent}%)</span>` 
      : `<span style="color: #334155; font-weight: 600;">${t.statusNormal}</span>`;

    const dateFormatted = formatTimestamp(p.lastChecked || p.updatedAt);

    return `
      <tr style="height: 34px;">
        <td style="width: 45pt; min-width: 60px; text-align:center; color:#1E293B; font-weight:bold;">${index + 1}</td>
        <td style="width: 510pt; min-width: 680px; font-weight:600; color:#0F172A; mso-number-format:'\\@'; padding-right: 24px;">
          <a href="${escapeHtml(p.url)}" target="_blank" style="color:#0F172A; text-decoration:none;">${escapeHtml(p.title || 'Product')}</a>
        </td>
        <td style="width: 150pt; min-width: 200px; font-weight:bold; color:#047857; text-align:right;">${p.currency || 'THB'} ${Number(p.currentPrice || 0).toLocaleString()}</td>
        <td style="width: 150pt; min-width: 200px; text-align:right; color:#1E293B; font-weight:600;">${p.currency || 'THB'} ${Number(p.initialPrice || 0).toLocaleString()}</td>
        <td style="width: 75pt; min-width: 100px; text-align:center; font-weight:600; color:#1E293B;">${escapeHtml(p.currency || 'THB')}</td>
        <td style="width: 160pt; min-width: 210px; text-align:center;">${statusHtml}</td>
        <td style="width: 140pt; min-width: 180px; text-align:center; color:#0F172A; font-weight:500; mso-number-format:'\\@';">${dateFormatted}</td>
        <td style="width: 120pt; min-width: 160px; text-align:center;">
          <a href="${escapeHtml(p.url)}" target="_blank" style="color:#1D4ED8; font-weight:700; text-decoration:underline;">${t.openLink}</a>
        </td>
      </tr>
    `;
  }).join('');

  const now = new Date();
  const dateFormatted = currentLang === 'th' ? now.toLocaleString('th-TH') : now.toLocaleString('en-US');
  
  const excelTemplate = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>SpyPrice Report</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
                <x:FitToPage/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 11pt; color: #0F172A; }
        table { border-collapse: collapse; width: 100%; margin-top: 14px; table-layout: fixed; }
        th { background-color: #0F172A; color: #FFFFFF; font-weight: bold; padding: 12px 16px; border: 1px solid #1E293B; text-align: left; white-space: nowrap; height: 38px; }
        td { padding: 10px 16px; border: 1px solid #CBD5E1; vertical-align: middle; white-space: nowrap; height: 34px; }
        tr:nth-child(even) { background-color: #F8FAFC; }
      </style>
    </head>
    <body>
      <h2 style="color: #0F172A; font-family: 'Segoe UI', sans-serif; margin-bottom: 2px;">${t.reportTitle}</h2>
      <p style="color: #334155; font-size: 10pt; font-weight: 500; margin-top: 0; margin-bottom: 14px;">${t.exportedDate} ${dateFormatted} | ${t.totalMonitored} ${products.length} ${t.itemsUnit}</p>
      <table border="1">
        <colgroup>
          <col width="60" style="width: 45pt; min-width: 60px;">
          <col width="680" style="width: 510pt; min-width: 680px;">
          <col width="200" style="width: 150pt; min-width: 200px;">
          <col width="200" style="width: 150pt; min-width: 200px;">
          <col width="100" style="width: 75pt; min-width: 100px;">
          <col width="210" style="width: 160pt; min-width: 210px;">
          <col width="180" style="width: 140pt; min-width: 180px;">
          <col width="160" style="width: 120pt; min-width: 160px;">
        </colgroup>
        <thead>
          <tr style="height: 38px;">
            <th width="60" style="width: 45pt; min-width: 60px; text-align:center;">${t.colNum}</th>
            <th width="680" style="width: 510pt; min-width: 680px; text-align:left;">${t.colTitle}</th>
            <th width="200" style="width: 150pt; min-width: 200px; text-align:right;">${t.colCurrentPrice}</th>
            <th width="200" style="width: 150pt; min-width: 200px; text-align:right;">${t.colInitialPrice}</th>
            <th width="100" style="width: 75pt; min-width: 100px; text-align:center;">${t.colCurrency}</th>
            <th width="200" style="width: 150pt; min-width: 200px; text-align:center;">${t.colStatus}</th>
            <th width="180" style="width: 140pt; min-width: 180px; text-align:center;">${t.colLastUpdated}</th>
            <th width="160" style="width: 120pt; min-width: 160px; text-align:center;">${t.colLink}</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  // Generate unique filename with timestamp down to seconds to prevent filename collisions (e.g. SpyPrice_Report_2026-08-14_014402.xls)
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  const filename = `SpyPrice_Report_${yyyy}-${mm}-${dd}_${hh}${min}${ss}.xls`;

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
