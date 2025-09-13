import { test, expect } from '@playwright/test';

test.describe('Domain Split Smoke Tests', () => {
  test.describe('Marketing Site (www.taxproexchange.com)', () => {
    test('should redirect /app/* to app subdomain', async ({ page }) => {
      const response = await page.goto('https://www.taxproexchange.com/app/login');
      
      // Should redirect to app subdomain
      expect(response?.url()).toBe('https://app.taxproexchange.com/login');
      expect(response?.status()).toBe(200);
    });

    test('should have canonical URLs pointing to www domain', async ({ page }) => {
      await page.goto('https://www.taxproexchange.com');
      
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toBe('https://www.taxproexchange.com/');
    });

    test('should have canonical URLs for subpages', async ({ page }) => {
      await page.goto('https://www.taxproexchange.com/search');
      
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toBe('https://www.taxproexchange.com/search');
    });

    test('should have JSON-LD structured data', async ({ page }) => {
      await page.goto('https://www.taxproexchange.com');
      
      const jsonLdScripts = await page.locator('script[type="application/ld+json"]').count();
      expect(jsonLdScripts).toBeGreaterThan(0);
    });

    test('should have sitemap.xml', async ({ page }) => {
      const response = await page.goto('https://www.taxproexchange.com/sitemap.xml');
      expect(response?.status()).toBe(200);
    });

    test('should have robots.txt that allows crawling', async ({ page }) => {
      const response = await page.goto('https://www.taxproexchange.com/robots.txt');
      expect(response?.status()).toBe(200);
      
      const content = await response?.text();
      expect(content).toContain('User-agent: *');
      expect(content).toContain('Allow: /');
      expect(content).toContain('Disallow: /app/');
    });
  });

  test.describe('App Site (app.taxproexchange.com)', () => {
    test('should have robots.txt that disallows all', async ({ page }) => {
      const response = await page.goto('https://app.taxproexchange.com/robots.txt');
      expect(response?.status()).toBe(200);
      
      const content = await response?.text();
      expect(content).toContain('User-agent: *');
      expect(content).toContain('Disallow: /');
    });

    test('should have noindex meta tags', async ({ page }) => {
      await page.goto('https://app.taxproexchange.com');
      
      const robotsMeta = await page.locator('meta[name="robots"]').getAttribute('content');
      expect(robotsMeta).toBe('noindex, nofollow');
      
      const googlebotMeta = await page.locator('meta[name="googlebot"]').getAttribute('content');
      expect(googlebotMeta).toBe('noindex, nofollow');
    });

    test('should not have canonical URLs', async ({ page }) => {
      await page.goto('https://app.taxproexchange.com');
      
      const canonical = await page.locator('link[rel="canonical"]').count();
      expect(canonical).toBe(0);
    });

    test('should not have sitemap.xml', async ({ page }) => {
      const response = await page.goto('https://app.taxproexchange.com/sitemap.xml');
      expect(response?.status()).toBe(404);
    });
  });

  test.describe('Security Headers', () => {
    test('marketing site should have security headers', async ({ page }) => {
      const response = await page.goto('https://www.taxproexchange.com');
      
      expect(response?.headers()['x-frame-options']).toBe('DENY');
      expect(response?.headers()['x-content-type-options']).toBe('nosniff');
      expect(response?.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });

    test('app site should have security headers including CSP', async ({ page }) => {
      const response = await page.goto('https://app.taxproexchange.com');
      
      expect(response?.headers()['x-frame-options']).toBe('DENY');
      expect(response?.headers()['x-content-type-options']).toBe('nosniff');
      expect(response?.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(response?.headers()['content-security-policy']).toContain("default-src 'self'");
    });
  });
});
