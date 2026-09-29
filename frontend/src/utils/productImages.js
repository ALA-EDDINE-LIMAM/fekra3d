const productImageFiles = [
  '2026_07_04_12_16_48_IMG_0852.webp',
  '2026_07_05_09_11_48_IMG_0853.webp',
  '2026_07_05_09_12_39_IMG_0854.webp',
  '2026_07_05_09_13_05_IMG_0856.webp',
  '2026_07_05_09_13_19_IMG_0857.webp',
  '2026_07_09_11_05_57_IMG_0868.webp',
  '2026_07_09_11_11_17_IMG_0870.webp',
  '2026_07_09_11_20_27_IMG_0871.webp',
  '2026_07_09_11_28_41_IMG_0873.webp',
  '2026_07_09_11_33_30_IMG_0874.webp',
  '2026_07_10_16_58_41_IMG_0878.webp',
  '2026_07_10_16_59_11_IMG_0879.webp',
  '2026_07_10_16_59_39_IMG_0880.webp',
  '2026_07_10_16_59_59_IMG_0881.webp',
  '2026_07_10_17_00_14_IMG_0882.webp',
  '2026_07_10_17_00_51_IMG_0883.webp',
  '2026_07_10_17_01_13_IMG_0884.webp',
  '2026_07_10_17_01_32_IMG_0885.webp',
  '2026_07_10_17_01_44_IMG_0886.webp',
  '2026_07_10_17_01_57_IMG_0887.webp',
  '2026_07_10_17_02_14_IMG_0888.webp',
  '2026_07_10_17_02_34_IMG_0889.webp',
  '2026_07_10_17_02_45_IMG_0890.webp',
  '2026_07_10_17_02_58_IMG_0891.webp',
  '2026_07_10_17_03_18_IMG_0892.webp',
  '2026_07_10_17_03_38_IMG_0893.webp',
  '2026_07_10_17_03_52_IMG_0894.webp',
  '2026_07_10_17_04_01_IMG_0895.webp',
  '2026_07_10_17_04_44_IMG_0896.webp',
  '2026_07_10_17_05_18_IMG_0897.webp',
  '2026_07_10_17_05_39_IMG_0898.webp',
  '2026_07_10_17_05_53_IMG_0899.webp',
  '2026_07_10_17_06_07_IMG_0900.webp',
  '2026_07_10_17_06_18_IMG_0901.webp',
  '2026_07_10_17_06_36_IMG_0902.webp',
  '2026_07_10_17_06_56_IMG_0903.webp',
  '2026_07_10_17_07_24_IMG_0904.webp',
  '2026_07_10_17_08_21_IMG_0905.webp',
];

export const productImagePaths = productImageFiles.map((fileName) => `/products/${fileName}`);

export const getProductMedia = (index, imageCount = 2) => {
  const startIndex = index * imageCount;
  const images = productImagePaths.slice(startIndex, startIndex + imageCount);
  const fallbackImage = productImagePaths[index % productImagePaths.length];

  return {
    image: images[0] ?? fallbackImage,
    images: images.length > 0 ? images : [fallbackImage],
  };
};