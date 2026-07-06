// src/lib/browser.ts
export const isBrowser = typeof window !== 'undefined';

// ✅ منع أي محاولة لاستخدام location أو URL خارج المتصفح
if (!isBrowser) {
  // تعريف location بشكل وهمي
  (global as any).location = {
    href: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    reload: () => {},
    replace: () => {},
    assign: () => {},
  };

  // ✅ تعريف URL بشكل وهمي
  (global as any).URL = class URL {
    constructor(url: string, base?: string) {
      // إذا كان المسار نسبي ولا يوجد base، استخدم base افتراضي
      if (!base && url.startsWith('/')) {
        base = 'http://localhost:3000';
      }
      return new (require('url').URL)(url, base || 'http://localhost:3000');
    }
  };
}