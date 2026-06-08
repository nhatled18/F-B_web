import apiClient from '../API/apiClient';

const ProductImageService = {
  // Upload image for product
  uploadImage: async (productId, imageUrl) => {
    try {
      const response = await apiClient.post(
        `/products/${productId}/image`,
        { imageUrl }
      );
      return response.data;
    } catch (error) {
      console.error('Upload error details:', error);
      
      // Xử lý error rõ ràng
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      if (error.message) {
        throw new Error(error.message);
      }
      throw new Error('Lỗi khi tải hình ảnh (không biết chi tiết)');
    }
  },

  // Compress image to reduce size
  compressImage: (base64Image, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        console.log('📊 Original size:', Math.round(base64Image.length / 1024), 'KB');
        console.log('📊 Compressed size:', Math.round(compressedBase64.length / 1024), 'KB');
        resolve(compressedBase64);
      };
      img.onerror = () => {
        reject(new Error('Lỗi khi load ảnh để compress'));
      };
      img.src = base64Image;
    });
  },

  // Convert file to base64
  fileToBase64: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        reject(new Error('Lỗi khi đọc file ảnh'));
      };
    });
  },

  // Handle file upload and convert to base64
  handleImageUpload: async (file) => {
    if (!file) return null;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Chỉ hỗ trợ định dạng: JPG, PNG, GIF, WEBP');
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Kích thước hình ảnh không được vượt quá 10MB');
    }

    const base64 = await this.fileToBase64(file);
    
    // Compress image
    console.log('🔄 Đang compress hình ảnh...');
    const compressed = await this.compressImage(base64, 800, 800, 0.6);
    
    return compressed;
  }
};

export default ProductImageService;
