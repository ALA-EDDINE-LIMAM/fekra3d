const productImageFiles = [
  '2026_07_04_12_16_48_IMG_0852.PNG',
  '2026_07_05_09_11_48_IMG_0853.PNG',
  '2026_07_05_09_12_39_IMG_0854.PNG',
  '2026_07_05_09_13_05_IMG_0856.PNG',
  '2026_07_05_09_13_19_IMG_0857.PNG',
  '2026_07_09_11_05_57_IMG_0868.PNG',
  '2026_07_09_11_11_17_IMG_0870.PNG',
  '2026_07_09_11_20_27_IMG_0871.PNG',
  '2026_07_09_11_28_41_IMG_0873.PNG',
  '2026_07_09_11_33_30_IMG_0874.PNG',
  '2026_07_10_16_58_41_IMG_0878.GIF',
  '2026_07_10_16_59_11_IMG_0879.JPG',
  '2026_07_10_16_59_39_IMG_0880.JPG',
  '2026_07_10_16_59_59_IMG_0881.JPG',
  '2026_07_10_17_00_14_IMG_0882.JPG',
  '2026_07_10_17_00_51_IMG_0883.JPG',
  '2026_07_10_17_01_13_IMG_0884.JPG',
  '2026_07_10_17_01_32_IMG_0885.JPG',
  '2026_07_10_17_01_44_IMG_0886.JPG',
  '2026_07_10_17_01_57_IMG_0887.JPG',
  '2026_07_10_17_02_14_IMG_0888.JPG',
  '2026_07_10_17_02_34_IMG_0889.JPG',
  '2026_07_10_17_02_45_IMG_0890.JPG',
  '2026_07_10_17_02_58_IMG_0891.JPG',
  '2026_07_10_17_03_18_IMG_0892.JPG',
  '2026_07_10_17_03_38_IMG_0893.JPG',
  '2026_07_10_17_03_52_IMG_0894.JPG',
  '2026_07_10_17_04_01_IMG_0895.JPG',
  '2026_07_10_17_04_44_IMG_0896.JPG',
  '2026_07_10_17_05_18_IMG_0897.JPG',
  '2026_07_10_17_05_39_IMG_0898.JPG',
  '2026_07_10_17_05_53_IMG_0899.JPG',
  '2026_07_10_17_06_07_IMG_0900.JPG',
  '2026_07_10_17_06_18_IMG_0901.JPG',
  '2026_07_10_17_06_36_IMG_0902.JPG',
  '2026_07_10_17_06_56_IMG_0903.JPG',
  '2026_07_10_17_07_24_IMG_0904.JPG',
  '2026_07_10_17_08_21_IMG_0905.JPG',
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