
import { useEffect } from "react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useImageCarousel } from "@/hooks/useImageCarousel";

type Image = {
  src: string;
  alt: string;
};

interface ImageCarouselProps {
  images: Image[];
  interval?: number; // in milliseconds
}

const ImageCarousel = ({ images, interval = 5000 }: ImageCarouselProps) => {
  const { currentIndex, goToSlide } = useImageCarousel(images, interval);

  return (
    <Carousel className="w-full h-full">
      <CarouselContent>
        {images.map((image, index) => (
          <CarouselItem key={index} className={index === currentIndex ? "block" : "hidden"}>
            <div className="h-full w-full relative overflow-hidden">
              <img 
                src={image.src} 
                alt={image.alt} 
                className="h-full w-full object-cover transition-opacity duration-500"
              />
              <div className="absolute inset-0 bg-black/10 flex flex-col justify-end p-8">
                <div className="max-w-md">
                  <h2 className="text-white text-3xl font-bold mb-4">Navigate Your Path to Top Singapore Universities</h2>
                  <p className="text-white/80 text-lg">Personalized guidance for NUS, NTU, and SMU admissions</p>
                </div>
                <div className="absolute bottom-4 right-4 text-white/80 text-xs">
                  © 2025 Adviseek
                </div>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-10">
        {images.map((_, index) => (
          <button
            key={index}
            className={`h-2 rounded-full transition-all ${
              currentIndex === index ? "w-8 bg-white" : "w-2 bg-white/50"
            }`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </Carousel>
  );
};

export default ImageCarousel;
