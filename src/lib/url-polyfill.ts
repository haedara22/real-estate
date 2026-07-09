// src/lib/url-polyfill.ts

// ✅ Polyfill آمن لـ URL.canParse
if (typeof URL !== 'undefined' && typeof URL.canParse !== 'function') {
  // @ts-ignore
  URL.canParse = function(url: string, base?: string) {
    try {
      new URL(url, base);
      return true;
    } catch {
      return false;
    }
  };
}

// ✅ Polyfill آمن لـ URL.parse (إذا كان موجوداً)
if (typeof URL !== 'undefined' && typeof URL.parse !== 'function') {
  // @ts-ignore
  URL.parse = function(url: string, base?: string) {
    try {
      return new URL(url, base);
    } catch {
      return null;
    }
  };
}

console.log('✅ URL polyfills installed');