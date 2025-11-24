// Centralized image map for inventory/ingredient images.
// Edit this mapping to explicitly associate display names with image files
// (use exact filenames and extensions present in client/src/assets).

export const IMAGE_MAP: Record<string, string> = {
  "Black Tea Leaves": new URL('../assets/black tea.jpg', import.meta.url).href,
  "Green Tea Leaves": new URL('../assets/green tea.jpg', import.meta.url).href,
  "Sugar": new URL('../assets/brown sugar.jpg', import.meta.url).href,
  "Milk": new URL('../assets/milk.jpg', import.meta.url).href,
  "Condensed Milk": new URL('../assets/condensed milk.jpg', import.meta.url).href,

  "Coconut Milk": new URL('../assets/coconut milk.jpg', import.meta.url).href,
  "Matcha Powder": new URL('../assets/matcha.jpg', import.meta.url).href,
  "Taro Powder": new URL('../assets/taro.jpg', import.meta.url).href,
  "Chocolate Syrup": new URL('../assets/chocolate syrup.jpg', import.meta.url).href,
  "Mango Syrup": new URL('../assets/mango.jpg', import.meta.url).href,

  "Strawberry Syrup": new URL('../assets/strawberry.jpg', import.meta.url).href,
  "Lychee Syrup": new URL('../assets/lychee.jpg', import.meta.url).href,
  "Lemon Juice": new URL('../assets/lemon.jpeg', import.meta.url).href,
  "Honey": new URL('../assets/honey.jpg', import.meta.url).href,
  "Coffee Beans": new URL('../assets/coffee.jpg', import.meta.url).href,

  "Whipped Cream": new URL('../assets/cream.jpg', import.meta.url).href,
  "Oreo Crumbs": new URL('../assets/oreo.jpg', import.meta.url).href,
  "Pudding Mix": new URL('../assets/pudding.jpg', import.meta.url).href,
  "Jelly Mix": new URL('../assets/jelly.jpg', import.meta.url).href,
  "Tapioca Pearls": new URL('../assets/tapioca.jpg', import.meta.url).href,

  "Ice Cubes": new URL('../assets/ice.png', import.meta.url).href,
  "Cups": new URL('../assets/cup.jpg', import.meta.url).href,
  "Lids": new URL('../assets/lid.png', import.meta.url).href,
  "Straws": new URL('../assets/straw.jpg', import.meta.url).href,
  "Napkins": new URL('../assets/napkins.png', import.meta.url).href,
};

/**
 * Return a best-effort image URL for a display name.
 * 1) Return explicit mapping from IMAGE_MAP
 * 2) Try common filename patterns in src/assets (.png then .jpg)
 * 3) Fall back to public /assets/filename.png
 */
export function getImageForName(name: string): string {
  if (!name) return '';
  if (IMAGE_MAP[name]) return IMAGE_MAP[name];

  const filename = name.toLowerCase().replace(/ /g, '_');
  try {
    return new URL(`../assets/${filename}.png`, import.meta.url).href;
  } catch (e) {
    // ignore
  }
  try {
    return new URL(`../assets/${filename}.jpg`, import.meta.url).href;
  } catch (e) {
    // ignore
  }

  // fallback to public assets path
  return `/assets/${filename}.png`;
}

export default IMAGE_MAP;
