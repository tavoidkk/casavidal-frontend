import { settingsApi } from '../api/settings.api';

let cachedLogoBase64: string | null | undefined = undefined;
let loadingPromise: Promise<string | null> | null = null;

export async function getLogoBase64(): Promise<string | null> {
  if (cachedLogoBase64 !== undefined) return cachedLogoBase64;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const settings = await settingsApi.getSettings();
      if (!settings.companyLogo) {
        cachedLogoBase64 = null;
        return null;
      }
      const resp = await fetch(settings.companyLogo);
      if (!resp.ok) {
        cachedLogoBase64 = null;
        return null;
      }
      const blob = await resp.blob();
      return await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          cachedLogoBase64 = result;
          resolve(result);
        };
        reader.onerror = () => {
          cachedLogoBase64 = null;
          resolve(null);
        };
        reader.readAsDataURL(blob);
      });
    } catch {
      cachedLogoBase64 = null;
      return null;
    }
  })();

  return loadingPromise;
}

export function clearLogoCache(): void {
  cachedLogoBase64 = undefined;
  loadingPromise = null;
}

export function getImageFormat(dataUrl: string): 'PNG' | 'JPEG' {
  if (dataUrl.startsWith('data:image/png')) return 'PNG';
  if (dataUrl.startsWith('data:image/webp')) return 'JPEG';
  return 'JPEG';
}
