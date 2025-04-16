
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthFooter from "@/components/auth/AuthFooter";
import AuthSection from "@/components/auth/AuthSection";
import ImageCarousel from "@/components/ImageCarousel";
import { supabase } from "@/integrations/supabase/client";

const loginSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address"
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters"
  })
});

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    try {
      setIsLoading(true);
      
      // Attempt to sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password
      });

      if (error) {
        // Handle wrong credentials error
        if (error.message.includes("Invalid login credentials")) {
          setLoginError("Invalid email or password");
        } else {
          setLoginError(error.message);
        }
        return;
      }

      if (data?.user) {
        // Login successful
        toast({
          title: "Login successful",
          description: "Welcome back!"
        });
        
        // Navigate to University Selection page
        navigate("/university-selection");
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
