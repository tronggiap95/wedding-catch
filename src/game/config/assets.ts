/**
 * Relative asset paths under {@link RuntimeConfig.assetBaseUrl}.
 * Keep keys stable so scenes never hard-code folder strings.
 */
export const AssetPath = {
  images: 'images',
  audio: 'audio',
  fonts: 'fonts',
  atlases: 'atlases',
} as const;

export type AssetCategory = (typeof AssetPath)[keyof typeof AssetPath];

/** Builds a path relative to the configured asset base URL. */
export function assetPath(category: AssetCategory, fileName: string): string {
  return `${category}/${fileName}`;
}
