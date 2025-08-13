// Utility functions for generating placeholder images

export const generatePlaceholderImage = (
  width: number,
  height: number,
  text: string,
  bgColor: string = "#f3f4f6",
  textColor: string = "#6b7280"
): string => {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bgColor}"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
            font-family="Arial, sans-serif" font-size="16" fill="${textColor}">
        ${text}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Pre-defined placeholder images
export const PLACEHOLDER_IMAGES = {
  business: generatePlaceholderImage(
    400,
    300,
    "Business Image",
    "#fef2f2",
    "#dc2626"
  ),
  noImage: generatePlaceholderImage(400, 300, "No Image", "#f9fafb", "#9ca3af"),
  businessSquare: generatePlaceholderImage(
    400,
    400,
    "Business",
    "#fef2f2",
    "#dc2626"
  ),
  product: generatePlaceholderImage(
    300,
    200,
    "Product Image",
    "#f0fdf4",
    "#16a34a"
  ),
};
