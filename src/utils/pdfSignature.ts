import { settingsApi } from '../api/settings.api';

let cachedSignatureBase64: string | null | undefined = undefined;
let loadingPromise: Promise<string | null> | null = null;

export async function getSignatureBase64(): Promise<string | null> {
  if (cachedSignatureBase64 !== undefined) return cachedSignatureBase64;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const settings = await settingsApi.getSettings();
      if (!settings.signatureUrl) {
        cachedSignatureBase64 = null;
        return null;
      }
      const resp = await fetch(settings.signatureUrl);
      if (!resp.ok) {
        cachedSignatureBase64 = null;
        return null;
      }
      const blob = await resp.blob();
      return await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          cachedSignatureBase64 = result;
          resolve(result);
        };
        reader.onerror = () => {
          cachedSignatureBase64 = null;
          resolve(null);
        };
        reader.readAsDataURL(blob);
      });
    } catch {
      cachedSignatureBase64 = null;
      return null;
    }
  })();

  return loadingPromise;
}

export function clearSignatureCache(): void {
  cachedSignatureBase64 = undefined;
  loadingPromise = null;
}
