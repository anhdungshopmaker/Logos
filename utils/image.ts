export const resizeImage = (file: File, size: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = img.width / img.height;
      if (ratio > 1.8 || ratio < 0.55) {
        return reject(new Error('Logo phải có tỷ lệ gần vuông (không chấp nhận ảnh ngang/dọc quá mức)'));
      }

      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Lỗi tạo canvas'));
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);
      
      const scale = Math.min(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (size - w) / 2;
      const y = (size - h) / 2;
      
      ctx.drawImage(img, x, y, w, h);
      
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Lỗi xuất ảnh WebP'));
      }, 'image/webp', 0.9);
    };
    img.onerror = () => reject(new Error('Không thể đọc file ảnh'));
    img.src = url;
  });
};
