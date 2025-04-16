
import { useState, useEffect } from 'react';

type Image = {
  src: string;
  alt: string;
};

export const useImageCarousel = (images: Image[], interval: number = 5000) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images, interval]);

  useEffect(() => {
    // Preload images for smoother transitions
    images.forEach((image) => {
      const img = new Image();
      img.src = image.src;
    });
  }, [images]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return { currentIndex, goToSlide };
};
