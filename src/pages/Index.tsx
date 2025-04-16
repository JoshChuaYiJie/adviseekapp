
import { useState } from "react";
import AuthSection from "@/components/auth/AuthSection";
import ImageCarousel from "@/components/ImageCarousel";

const Index = () => {
  const carouselImages = [
    {
      src: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1800&q=80",
      alt: "Singapore University Campus"
    },
    {
      src: "https://images.unsplash.com/photo-1596005554384-d293674c91d7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1800&q=80",
      alt: "Singapore Modern Architecture"
    },
    {
      src: "https://images.unsplash.com/photo-1565967511849-76a60a516170?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1800&q=80", 
      alt: "Singapore Student Life"
    },
    {
      src: "https://images.unsplash.com/photo-1574236170880-28803ab57f4d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1800&q=80",
      alt: "Singapore City Skyline"
    }
  ];

  return (
    <div className="min-h-screen w-full flex overflow-hidden">
      {/* Left Side - Auth */}
      <AuthSection />
      
      {/* Right Side - Image Carousel */}
      <div className="hidden md:block md:w-7/12 lg:w-8/12 xl:w-2/3 bg-primary-gradient">
        <div className="h-full w-full relative overflow-hidden">
          <ImageCarousel images={carouselImages} />
        </div>
      </div>
    </div>
  );
};

export default Index;
