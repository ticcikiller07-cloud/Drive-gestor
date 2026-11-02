/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

declare global {
  interface Window {
    gapi?: any;
    google?: any;
  }
}

export interface PickedFolder {
  id: string;
  name: string;
}

/**
 * Loads the Google Picker library if not already present.
 */
export function loadGooglePickerApi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.picker) {
      resolve();
      return;
    }

    if (!window.gapi) {
      // Check if gapi script is in DOM
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.gapi) {
          window.gapi.load('picker', {
            callback: () => resolve(),
            onerror: () => reject(new Error('No se pudo cargar Google Picker')),
          });
        } else {
          reject(new Error('gapi no disponible'));
        }
      };
      script.onerror = () => reject(new Error('Error cargando script de Google API'));
      document.body.appendChild(script);
      return;
    }

    window.gapi.load('picker', {
      callback: () => resolve(),
      onerror: () => reject(new Error('No se pudo inicializar Google Picker')),
    });
  });
}

/**
 * Opens Google Picker specifically configured to select a folder.
 */
export async function openGoogleFolderPicker(
  accessToken: string,
  onFolderPicked: (folder: PickedFolder) => void,
  onCancel?: () => void
): Promise<void> {
  await loadGooglePickerApi();

  if (!window.google?.picker) {
    throw new Error('La librería Google Picker no está lista.');
  }

  const pickerOrigin =
    window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
      ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
      : window.location.origin;

  // Configure view for Folders only
  const docsView = new window.google.picker.DocsView(window.google.picker.ViewId.FOLDERS)
    .setMimeTypes('application/vnd.google-apps.folder')
    .setSelectFolderEnabled(true)
    .setIncludeFolders(true);

  const picker = new window.google.picker.PickerBuilder()
    .addView(docsView)
    .setOAuthToken(accessToken)
    .setOrigin(pickerOrigin)
    .setTitle('Selecciona la carpeta que deseas organizar')
    .setCallback((data: any) => {
      if (data.action === window.google.picker.Action.PICKED) {
        const doc = data.docs?.[0];
        if (doc) {
          onFolderPicked({
            id: doc.id,
            name: doc.name || 'Carpeta seleccionada',
          });
        }
      } else if (data.action === window.google.picker.Action.CANCEL) {
        if (onCancel) onCancel();
      }
    })
    .build();

  picker.setVisible(true);
}
