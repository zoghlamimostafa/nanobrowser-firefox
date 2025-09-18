import type { ManifestParserInterface, Manifest } from './type';

export const ManifestParserImpl: ManifestParserInterface = {
  convertManifestToString: (manifest, env) => {
    if (env === 'firefox') {
      manifest = convertToFirefoxCompatibleManifest(manifest);
    }
    return JSON.stringify(manifest, null, 2);
  },
};

function convertToFirefoxCompatibleManifest(manifest: Manifest) {
  const manifestCopy = {
    ...manifest,
  } as { [key: string]: unknown };

  // Handle background scripts properly for Firefox
  const background = manifest.background as any;
  const backgroundScript =
    background?.service_worker || (background?.scripts && background.scripts[0]) || 'background.iife.js';

  manifestCopy.background = {
    scripts: [backgroundScript],
  };

  // Filter out Firefox-incompatible permissions
  const firefoxIncompatiblePermissions = ['debugger', 'sidePanel'];
  if (manifest.permissions) {
    manifestCopy.permissions = manifest.permissions.filter(
      permission => !firefoxIncompatiblePermissions.includes(permission),
    );
  }

  manifestCopy.options_ui = {
    page: manifest.options_page,
    browser_style: false,
  };
  manifestCopy.content_security_policy = {
    extension_pages: "script-src 'self'; object-src 'self'",
  };
  manifestCopy.browser_specific_settings = {
    gecko: {
      id: 'nanobrowser-firefox@zoghlamimostafa.github.io',
      strict_min_version: '109.0',
      data_collection_permissions: {
        required: true,
        web_accessible_resources: false,
        content_scripts: false,
      },
    },
  };
  delete manifestCopy.options_page;
  return manifestCopy as Manifest;
}
