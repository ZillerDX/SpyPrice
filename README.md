# 🎯 SpyPrice AI - Competitor Price Tracker

[ English ] | [ [ภาษาไทย](#-ภาษาไทย-thai-version) ]

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Chrome Manifest V3](https://img.shields.io/badge/Chrome--Extension-Manifest%20V3-green.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Gemini 1.5 Flash](https://img.shields.io/badge/AI-Google%20Gemini%201.5%20Flash-orange.svg)](https://aistudio.google.com/)

> **Local-First, Zero-Cost AI Competitor Price Monitoring for E-Commerce Sellers.**  
> Automatically track competitor prices on Shopify, Shopee, Lazada, WooCommerce, and Amazon without monthly server fees or IP-blocking risks.

Repository Link: [https://github.com/ZillerDX/SpyPrice](https://github.com/ZillerDX/SpyPrice)

---

## 🌟 Key Features

- 🤖 **AI-Powered Parsing:** Uses **Google Gemini 1.5 Flash API** to extract product titles and numeric prices from any raw web page HTML without writing fragile CSS selectors.
- ⚡ **Local-First & Zero Infra Cost:** Runs 100% inside your Chrome browser using `chrome.storage.local`. No external server required!
- 🔒 **Security-First Engineering:**
  - Strict **Manifest V3 Content Security Policy (CSP)**.
  - Zero hardcoded API keys — users supply their own free Gemini API Key securely saved in local browser storage.
  - XSS-safe DOM rendering & input sanitization.
- 🌐 **Multilingual Support (EN / TH):** Default English UI with instant toggle to Thai language.
- ⏰ **Automated Background Scan:** Periodic background checks via Service Worker with price-drop badges.

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                   SpyPrice Extension Architecture                │
├──────────────────────────────────────────────────────────────────┤
│  [ Active Chrome Tab ] ──> Content Script (Page Text Sampler)     │
│                                    │                             │
│                                    ▼                             │
│  [ Popup UI / Background ] ──> Google Gemini 1.5 Flash API       │
│                                    │ (Returns JSON Price/Title)  │
│                                    ▼                             │
│  [ Local Browser Storage ] <── chrome.storage.local (0 Cost DB)  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started (Developer Mode Installation)

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/ZillerDX/SpyPrice.git
   ```
2. **Open Chrome Extensions Page:**
   Navigate to `chrome://extensions` in your Google Chrome browser.
3. **Enable Developer Mode:**
   Toggle the **Developer mode** switch in the top-right corner.
4. **Load Extension:**
   Click **Load unpacked** and select the `SpyPrice` project root directory.
5. **Configure Free Gemini API Key:**
   - Get a free key from [Google AI Studio](https://aistudio.google.com/).
   - Open the SpyPrice extension popup, paste your API key, and click **Save**.

---

## 📖 Usage Guide

1. Open any e-commerce product page (e.g., Shopify, Shopee, Lazada).
2. Click the **SpyPrice AI** extension icon in your toolbar.
3. Click **"Track Current Product"** (ติดตามสินค้าในหน้านี้).
4. The extension extracts the price via Gemini AI and saves it to your monitored list.
5. Click **"Scan Prices Now"** or let the background service worker check prices automatically!

---

## 🛡️ Security & Privacy

- **Data Privacy:** Your API keys and tracked product lists **NEVER** leave your browser. They are stored locally using `chrome.storage.local`.
- **No Third-Party Analytics:** We do not track user behavior or sell data.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

# 🇹🇭 ภาษาไทย (Thai Version)

# 🎯 SpyPrice AI - ระบบติดตามและส่องราคาคู่แข่ง

> **ระบบติดตามและส่องราคาคู่แข่ง E-commerce แบบ Local-First ต้นทุน 0 บาท ขับเคลื่อนด้วย Google Gemini 1.5 Flash**

ลิงก์ Repository: [https://github.com/ZillerDX/SpyPrice](https://github.com/ZillerDX/SpyPrice)

---

## 🌟 ฟีเจอร์เด็ด

- 🤖 **วิเคราะห์ราคาด้วย AI:** ใช้ **Google Gemini 1.5 Flash API** ในการดึงชื่อสินค้าและราคาสินค้าจากหน้าเว็บคู่แข่งโดยไม่ต้องเขียน CSS Selector
- ⚡ **Local-First ต้นทุน 0 บาท:** ทำงานในเบราว์เซอร์ Chrome 100% ผ่าน `chrome.storage.local` ไม่ต้องเช่าเซิร์ฟเวอร์หลังบ้าน
- 🔒 **เน้นความปลอดภัยสูงสุด:**
  - มาตรฐาน **Manifest V3 Content Security Policy (CSP)**
  - ไม่มีรหัส API Key ฝังในโค้ด — ผู้ใช้ใส่ API Key ฟรีของตนเองและเก็บอย่างปลอดภัยในเครื่อง
  - ป้องกัน XSS และทำความสะอาดข้อมูลก่อนแสดงผล
- 🌐 **รองรับ 2 ภาษา (อังกฤษ / ไทย):** ค่าเริ่มต้นเป็นภาษาอังกฤษ สามารถสลับเป็นภาษาไทยได้ทันที
- ⏰ **ระบบสแกนอัตโนมัติเบื้องหลัง:** เช็กราคาให้อัตโนมัติและขึ้นป้ายแจ้งเตือนเมื่อราคาลดลง

---

## 🚀 วิธีการติดตั้งสำหรับใช้งาน (Developer Mode)

1. **ดาวน์โหลดหรือ Clone Repo:**
   ```bash
   git clone https://github.com/ZillerDX/SpyPrice.git
   ```
2. **เปิดหน้า Chrome Extensions:**
   พิมพ์ `chrome://extensions` ในช่องที่อยู่ของ Google Chrome
3. **เปิด Developer Mode:**
   เปิดสวิตช์ **Developer mode** ที่มุมขวาบน
4. **โหลดส่วนขยาย:**
   กดปุ่ม **Load unpacked** แล้วเลือกโฟลเดอร์โครงการ `SpyPrice`
5. **ตั้งค่า Gemini API Key:**
   - ขอรับ API Key ฟรีได้ที่ [Google AI Studio](https://aistudio.google.com/)
   - เปิดป๊อบอัป SpyPrice นำ API Key มาวาง แล้วกด **บันทึก (Save)**
