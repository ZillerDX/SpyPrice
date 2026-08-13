# 🎯 SpyPrice AI - Smart Product Price Tracker

[ English ] | [ [ภาษาไทย](#-ภาษาไทย-thai-version) ]

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Chrome Manifest V3](https://img.shields.io/badge/Chrome--Extension-Manifest%20V3-green.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini%20Flash-orange.svg)](https://aistudio.google.com/)

> **Local-First, Zero-Cost AI Product Price Tracking for E-Commerce Sellers & Shoppers.**  
> Automatically track product prices on Shopify, Shopee, Lazada, WooCommerce, and Amazon without monthly server fees or IP-blocking risks.

Repository Link: [https://github.com/ZillerDX/SpyPrice](https://github.com/ZillerDX/SpyPrice)

---

## 🌟 Key Features

- 🤖 **AI-Powered Parsing:** Uses **Google Gemini Flash API** with dynamic model discovery (`gemini-2.0-flash`, `gemini-2.5-flash`) to extract product titles and numeric prices from any raw web page HTML without fragile CSS selectors.
- ⚡ **Local-First & Zero Infra Cost:** Runs 100% inside your Chrome browser using `chrome.storage.local`. No external server required!
- 📊 **Formatted Excel Export (.xls):** One-click export to native Excel spreadsheets with high-contrast font styling, status badges, clean clickable links (`🔗 Open Link`), and timestamped filenames (`SpyPrice_Report_YYYY-MM-DD_HHMMSS.xls`).
- 🕒 **Timestamps & Real-time Stats:** Track exact update dates/times (`DD/MM/YYYY HH:MM`) and monitor price drop counters on the dashboard.
- 🌐 **Dynamic Multilingual (EN / TH):** Single-click pill button toggle between English and Thai (`EN` ↔ `TH`). Reports automatically generate in the chosen language.
- 🎨 **Modern SaaS Design:** High-contrast dark theme UI with custom vector SVG icons and custom extension branding.

---

## 🔒 Security & 100% API Key Protection

SpyPrice AI is engineered with a **Security-First Architecture** to guarantee 100% protection of your Gemini API Key:

1. **Local Storage Isolation:** API Keys are stored exclusively inside `chrome.storage.local`, accessible **ONLY** by the extension popup and private background service worker.
2. **Zero Web Page Exposure:** Content scripts injected into web pages (Shopee, Lazada, Amazon, etc.) **NEVER** receive or have access to your API Key. Third-party scripts on shopping sites cannot inspect or steal your key.
3. **No Central Server:** Direct HTTPS communication between your browser and Google AI Studio (`generativelanguage.googleapis.com`). No middleman server.
4. **Automatic Console Masking:** All API network errors are sanitized (`key=HIDDEN_API_KEY`) to prevent key exposure in Chrome Developer Tools console logs.
5. **Manifest V3 CSP Compliance:** Strict Content Security Policy preventing unauthorized code injections.

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                   SpyPrice Extension Architecture                │
├──────────────────────────────────────────────────────────────────┤
│  [ Active Chrome Tab ] ──> Content Script (Page Sampler)         │
│                                    │ (Returns raw text ONLY)     │
│                                    ▼                             │
│  [ Extension Popup / Worker ] ──> Google Gemini Flash API        │
│    (Holds Private API Key)         │ (Returns JSON Price/Title)  │
│                                    ▼                             │
│  [ Local Storage DB ] <── chrome.storage.local (Zero-Cost DB)    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started (Developer Mode Installation)

1. **Download or Clone Repository:**
   ```bash
   git clone https://github.com/ZillerDX/SpyPrice.git
   ```
   *(Or download ZIP from [GitHub Releases](https://github.com/ZillerDX/SpyPrice/archive/refs/heads/main.zip) and extract)*

2. **Open Chrome Extensions Page:**
   Navigate to `chrome://extensions` in your Google Chrome browser.

3. **Enable Developer Mode:**
   Toggle the **Developer mode** switch in the top-right corner.

4. **Load Unpacked Extension:**
   Click **Load unpacked** and select the `SpyPrice` project root folder.

5. **Configure Free Gemini API Key:**
   - Get your free API key from [Google AI Studio](https://aistudio.google.com/).
   - Click the **SpyPrice AI** extension icon (🎯) in Chrome toolbar.
   - Paste your API key and click **Save**.

---

## 📖 Usage Guide

1. Open any e-commerce product page (e.g., Shopee, Lazada, Amazon, Shopify).
2. Click the **SpyPrice AI (🎯)** icon in your Chrome toolbar.
3. Click **"Track Current Product"** (ติดตามสินค้าในหน้านี้).
4. The extension extracts title, current price, and saves it with a timestamp.
5. Click **"Scan Prices"** to refresh prices anytime or let background worker auto-scan every 12 hours.
6. Click **"Export to Sheet"** to download a formatted `.xls` report!

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

# 🇹🇭 ภาษาไทย (Thai Version)

# 🎯 SpyPrice AI - ระบบติดตามราคาสินค้าอัจฉริยะ

> **ระบบติดตามราคาสินค้า E-commerce แบบ Local-First ต้นทุน 0 บาท ขับเคลื่อนด้วย Google Gemini Flash API**

ลิงก์ Repository: [https://github.com/ZillerDX/SpyPrice](https://github.com/ZillerDX/SpyPrice)

---

## 🌟 ฟีเจอร์เด็ด

- 🤖 **วิเคราะห์ราคาสินค้าด้วย AI:** ใช้ **Google Gemini Flash API** พร้อมระบบเลือกโมเดลล่าสุดอัตโนมัติ (`gemini-2.0-flash`, `gemini-2.5-flash`) ดึงชื่อและราคาสินค้าจากหน้าเว็บโดยไม่ต้องเขียน CSS Selector
- ⚡ **Local-First ต้นทุน 0 บาท:** ทำงานในเบราว์เซอร์ Chrome 100% ผ่าน `chrome.storage.local` ไม่ต้องเช่าเซิร์ฟเวอร์หลังบ้าน
- 📊 **ส่งออกไฟล์ชีต Excel (.xls) สวยงามสำเร็จรูป:** ส่งออกรายงานตาราง Excel ในคลิกเดียว พร้อมจัดความกว้างคอลัมน์, ป้ายสถานะส่วนลด, ปุ่มลิงก์สั้นอ่านง่าย (`🔗 เปิดลิงก์สินค้า`) และตั้งชื่อไฟล์ไม่ให้ชนกัน (`SpyPrice_Report_YYYY-MM-DD_HHMMSS.xls`)
- 🕒 **Timestamp & สถิติเรียลไทม์:** บันทึกวันเวลาอัปเดตล่าสุด (`DD/MM/YYYY HH:MM`) และแสดงกล่องสรุปสถิติจำนวนสินค้าและราคาสินค้าที่ลดลง
- 🌐 **สลับภาษา 2 ภาษาไดนามิก (EN / TH):** ปุ่มสวิตช์มินิมอลคลิกเดียว (`EN` ↔ `TH`) โดยรายงาน Excel ที่ส่งออกจะเปลี่ยนภาษาตามที่คุณเลือกบนส่วนขยายอัตโนมัติ
- 🎨 **ดีไซน์ Dark SaaS ทันสมัย:** UI โทนเข้มอ่านง่าย ใช้ Vector SVG Icons คมชัด พร้อมโลโก้ส่วนขยายเฉพาะตัว

---

## 🔒 ปลอดภัยสูงสุด 100% สำหรับ Gemini API Key

SpyPrice AI ออกแบบสถาปัตยกรรมเน้นความปลอดภัย เพื่อปกป้องรหัส API Key ของคุณ 100%:

1. **แยกพื้นที่เก็บข้อมูลเฉพาะเครื่อง (`chrome.storage.local`):** รหัส API Key ถูกจัดเก็บไว้ในเครื่องของคุณเท่านั้น เข้าถึงได้เฉพาะส่วนขยายป๊อบอัปและ Service Worker ของส่วนขยาย
2. **ไม่ส่งออกไปยังหน้าเว็บภายนอก:** สคริปต์ Content Script ที่ทำงานบนหน้าเว็บช้อปปิ้ง (Shopee, Lazada, Amazon ฯลฯ) **ไม่มีวัน**ได้รับหรือเข้าถึง API Key ของคุณ สคริปต์ภายนอกบนหน้าเว็บไม่สามารถ Inspect หรือแอบขโมย API Key ได้
3. **ส่งข้อมูลตรงถึง Google AI Studio:** การยิง API ทำงานผ่าน HTTPS ตรงจากเบราว์เซอร์ของคุณไปยัง `generativelanguage.googleapis.com` โดยไม่มีเซิร์ฟเวอร์คนกลาง
4. **ปิดกั้นการรั่วไหลบน Console Log:** ระบบมีฟังก์ชันซ่อนรหัสอัตโนมัติ (`key=HIDDEN_API_KEY`) ไม่ให้รหัสรั่วไหลบน Console Log ของ Chrome Developer Tools
5. **มาตรฐาน Manifest V3 CSP:** ป้องกันการแทรกแซงโค้ดจากภายนอกตามมาตรฐานความปลอดภัยสูงสุดของ Google Chrome

---

## 🚀 วิธีการติดตั้งสำหรับใช้งาน (Developer Mode)

1. **ดาวน์โหลดหรือ Clone Repo:**
   ```bash
   git clone https://github.com/ZillerDX/SpyPrice.git
   ```
   *(หรือดาวน์โหลดไฟล์ ZIP จาก [GitHub Releases](https://github.com/ZillerDX/SpyPrice/archive/refs/heads/main.zip) แล้วทำการแตกไฟล์)*

2. **เปิดหน้า Chrome Extensions:**
   พิมพ์ `chrome://extensions` ในช่องที่อยู่ของ Google Chrome

3. **เปิด Developer Mode:**
   เปิดสวิตช์ **Developer mode** ที่มุมขวาบน

4. **โหลดส่วนขยาย:**
   กดปุ่ม **Load unpacked** แล้วเลือกโฟลเดอร์โครงการ `SpyPrice`

5. **ตั้งค่า Gemini API Key:**
   - ขอรับ API Key ฟรีได้ที่ [Google AI Studio](https://aistudio.google.com/)
   - เปิดป๊อบอัป SpyPrice (🎯) นำ API Key มาวาง แล้วกด **บันทึก (Save)**

---

## 📖 วิธีการใช้งาน

1. เปิดหน้าสินค้า e-commerce ใดก็ได้ (เช่น Shopee, Lazada, Amazon, Shopify)
2. คลิกไอคอนส่วนขยาย **SpyPrice AI (🎯)** บนแถบ Toolbar
3. กดปุ่ม **"ติดตามสินค้าในหน้านี้" (Track Current Product)**
4. ระบบ AI จะทำการดึงชื่อสินค้า ราคา และบันทึกวันเวลาอัปเดตให้อัตโนมัติ
5. กดปุ่ม **"สแกนเช็กราคา"** เพื่ออัปเดตราคาล่าสุดได้ตลอดเวลา
6. กดปุ่ม **"ส่งออก Sheet / Excel"** เพื่อดาวน์โหลดรายงานตารางสวยงามได้ทันที!
