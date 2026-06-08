import React, { useState, useRef } from 'react';
import ProductImageService from '../Services/ProductImageService';
import '../assets/styles/Common.css';

function ProductImageCropper({ product, onSuccess, onCancel }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [cropArea, setCropArea] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = (e) => {
    if (!imageSrc) return;
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    setStartX(e.clientX - rect.left);
    setStartY(e.clientY - rect.top);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, startY, currentX - startX, currentY - startY);
    };
    img.src = imageSrc;
  };

  const handleMouseUp = (e) => {
    if (!isDrawing || !canvasRef.current) return;
    setIsDrawing(false);

    const rect = canvasRef.current.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    setCropArea({
      x: Math.min(startX, endX),
      y: Math.min(startY, endY),
      width: Math.abs(endX - startX),
      height: Math.abs(endY - startY)
    });
  };

  const handleCrop = async () => {
    if (!cropArea || !canvasRef.current) {
      alert('Vui lòng vẽ vùng cắt trên hình ảnh');
      return;
    }

    setIsUploading(true);
    try {
      const img = new Image();
      img.onload = async () => {
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = cropArea.width;
        croppedCanvas.height = cropArea.height;
        const croppedCtx = croppedCanvas.getContext('2d');
        croppedCtx.drawImage(
          img,
          cropArea.x,
          cropArea.y,
          cropArea.width,
          cropArea.height,
          0,
          0,
          cropArea.width,
          cropArea.height
        );

        const croppedImageBase64 = croppedCanvas.toDataURL('image/jpeg', 0.6);
        console.log('📸 Cropped image size:', Math.round(croppedImageBase64.length / 1024), 'KB');
        
        try {
          // Compress further if needed
          let finalImage = croppedImageBase64;
          if (croppedImageBase64.length > 2 * 1024 * 1024) {
            console.log('🔄 Đang compress ảnh được cắt...');
            finalImage = await ProductImageService.compressImage(croppedImageBase64, 600, 600, 0.5);
          }
          
          // Upload the cropped image
          await ProductImageService.uploadImage(product.id, finalImage);
          
          alert('✅ Hình ảnh đã được cắt và tải lên thành công!');
          if (onSuccess) {
            onSuccess(finalImage);
          }
        } catch (uploadError) {
          console.error('Upload failed:', uploadError);
          alert('❌ Lỗi: ' + (uploadError.message || uploadError));
        } finally {
          setIsUploading(false);
        }
      };
      img.onerror = () => {
        console.error('Image load failed');
        setIsUploading(false);
        alert('❌ Lỗi khi tải ảnh gốc');
      };
      img.src = imageSrc;
    } catch (error) {
      console.error('Crop error:', error);
      alert('❌ Lỗi: ' + (error.message || error));
      setIsUploading(false);
    }
  };

  const handleUseOriginal = async () => {
    if (!imageSrc) {
      alert('Vui lòng chọn ảnh');
      return;
    }

    setIsUploading(true);
    try {
      console.log('📸 Uploading image, size:', Math.round(imageSrc.length / 1024), 'KB');
      
      // Compress image before upload
      let finalImage = imageSrc;
      if (imageSrc.length > 2 * 1024 * 1024) {
        console.log('🔄 Đang compress ảnh...');
        finalImage = await ProductImageService.compressImage(imageSrc, 800, 800, 0.5);
      }
      
      await ProductImageService.uploadImage(product.id, finalImage);
      alert('✅ Hình ảnh đã được tải lên thành công!');
      if (onSuccess) {
        onSuccess(finalImage);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ Lỗi: ' + (error.message || error));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ marginBottom: '15px', color: '#1a1a1a' }}>
        📸 Cắt hình cho: {product.productName}
      </h3>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          Chọn ảnh từ menu:
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            width: '100%',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {imageSrc && (
        <>
          <div style={{
            marginBottom: '15px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '10px',
            backgroundColor: '#f5f5f5'
          }}>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
              📌 Hướng dẫn: Kéo chuột để vẽ vùng cắt (hình chữ nhật)
            </p>
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              width={imageSrc ? 500 : 0}
              height={imageSrc ? 400 : 0}
              style={{
                maxWidth: '100%',
                border: '1px solid #999',
                cursor: 'crosshair',
                backgroundColor: '#fff'
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '15px'
          }}>
            <button
              onClick={handleCrop}
              disabled={isUploading || !cropArea}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: cropArea ? '#4caf50' : '#ccc',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: cropArea && !isUploading ? 'pointer' : 'not-allowed',
                fontWeight: '500'
              }}
            >
              {isUploading ? '⏳ Đang tải...' : '✂️ Cắt & Tải lên'}
            </button>
            <button
              onClick={handleUseOriginal}
              disabled={isUploading}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#2196f3',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                fontWeight: '500'
              }}
            >
              {isUploading ? '⏳ Đang tải...' : '📤 Sử dụng ảnh gốc'}
            </button>
            <button
              onClick={onCancel}
              disabled={isUploading}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#f44336',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                fontWeight: '500'
              }}
            >
              ❌ Đóng
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ProductImageCropper;
