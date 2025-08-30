import React, { useState } from 'react';
import ImageModal from './ImageModal';

const ImageModalDemo: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; altText: string } | null>(null);

  const sampleImages = [
    {
      url: 'https://picsum.photos/800/600?random=1',
      altText: 'Sample Image 1 - Beautiful Landscape',
      width: 800,
      height: 600
    },
    {
      url: 'https://picsum.photos/600/800?random=2',
      altText: 'Sample Image 2 - City View',
      width: 600,
      height: 800
    },
    {
      url: 'https://picsum.photos/1000/400?random=3',
      altText: 'Sample Image 3 - Nature Scene',
      width: 1000,
      height: 400
    }
  ];

  const handleImageClick = (image: { url: string; altText: string }) => {
    setSelectedImage(image);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedImage(null);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">ImageModal Demo</h1>
      <p className="text-gray-600 mb-8 text-center">
        Click on any image below to test the ImageModal functionality
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {sampleImages.map((image, index) => (
           <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
             <div 
               className="relative cursor-pointer hover:opacity-90 transition-opacity"
               style={{
                 aspectRatio: `${image.width} / ${image.height}`,
                 maxHeight: '400px'
               }}
             >
               <img
                 src={image.url}
                 alt={image.altText}
                 className="w-full h-full object-cover"
                 onClick={() => handleImageClick(image)}
                 title="Click to view full size"
               />
               <div className="absolute inset-0 bg-black/0 hover:bg-black/80 transition-all rounded flex items-center justify-center pointer-events-none">
                 <span className="text-white opacity-0 hover:opacity-100 text-sm font-medium">
                   Click to expand
                 </span>
               </div>
             </div>
             <div className="p-4">
               <h3 className="font-semibold text-gray-800 mb-2">{image.altText}</h3>
               <p className="text-sm text-gray-600">
                 {image.width} × {image.height} • Click to view full size
               </p>
             </div>
           </div>
         ))}
      </div>

      {/* Image Modal */}
      {showModal && selectedImage && (
        <ImageModal
          imageUrl={selectedImage.url}
          altText={selectedImage.altText}
          onClose={handleCloseModal}
        />
      )}

      <div className="mt-12 p-6 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">Features to Test:</h2>
        <ul className="space-y-2 text-blue-700">
          <li>• Click any image to open the modal</li>
          <li>• Use zoom in/out buttons or click the image</li>
          <li>• Download the image</li>
          <li>• Close with X button, ESC key, or click outside</li>
          <li>• Test on different screen sizes</li>
        </ul>
      </div>
    </div>
  );
};

export default ImageModalDemo;
