/**
 * Content Script for SpyPrice Extension
 * Runs safely on web pages to extract text content for AI price parsing.
 */

(() => {
  // Prevent duplicate listener registration
  if (window.__spyPriceContentLoaded) return;
  window.__spyPriceContentLoaded = true;

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'EXTRACT_PAGE_DATA') {
      try {
        // Collect relevant text from page (Title, Price elements, Meta tags)
        const pageTitle = document.title;
        const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
        const ogPrice = document.querySelector('meta[property="product:price:amount"]')?.content || '';
        const bodyText = document.body ? document.body.innerText.substring(0, 15000) : '';

        const fullContent = `Title: ${pageTitle}\nMeta: ${metaDescription}\nMetaPrice: ${ogPrice}\nBody Snippet:\n${bodyText}`;

        sendResponse({
          success: true,
          url: window.location.href,
          title: pageTitle,
          content: fullContent
        });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
      return true; // Keep message channel open for async response
    }
  });
})();
