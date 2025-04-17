import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronRight } from "lucide-react";

const pixelsOverlay = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundImage: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAADCAYAAABWKLW/AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAB9JREFUeNpiZmBgeMZABGBhQAJMDCSCUQEGEIABAJ+jAgjS9TvzAAAAAElFTkSuQmCC')",
  opacity: 0.3,
  zIndex: 1
};

const gradientOverlay = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 100%)",
  zIndex: 2
};

const universities = [
  {
    id: "nus",
    name: "NUS",
    description: "NUS is known for its strong emphasis on research and innovation, particularly in science, technology, and medicine.",
    image: "/school-logos/NUS.png"
  },
  {
    id: "ntu",
    name: "NTU",
    description: "NTU is renowned for its engineering and business programs, with a beautiful campus featuring modern architecture.",
    image: "/school-logos/NTU.png"
  },
  {
    id: "smu",
    name: "SMU",
    description: "SMU offers specialized programs in business, law, and social sciences with a city campus in the heart of Singapore.",
    image: "/school-logos/SMU.png"
  }
];

const schools = [
  {
    id: "computing",
    name: "School of Computing",
    description: "The School of Computing is renowned for its cutting-edge programs in computer science and information systems.",
    image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1800&q=80"
  },
  {
    id: "law",
    name: "School of Law",
    description: "The School of Law provides comprehensive legal education with a focus on Asian and international perspectives.",
    image: "https://images.unsplash.com/photo-1565967511849-76a60a516170?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1800&q=80"
  },
  {
    id: "medicine",
    name: "School of Medicine",
    description: "The School of Medicine offers world-class medical education with state-of-the-art facilities and research opportunities.",
    image: "https://images.unsplash.com/photo-1496307653780-42ee777d4833?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1800&q=80"
  }
];

const UniversitySelection = () => {
  const location = useLocation();
  const [selectedUniversity, setSelectedUniversity] = useState(() => {
    return location.state?.university ? 
      universities.find(uni => uni.id === location.state.university) || universities[0] 
      : universities[0];
  });
  
  const [selectedSchool, setSelectedSchool] = useState(() => {
    return location.state?.school ? 
      schools.find(sch => sch.id === location.state.school) || schools[0] 
      : schools[0];
  });

  const navigate = useNavigate();

  const handleUniversityChange = (value: string) => {
    const university = universities.find(uni => uni.id === value);
    if (university) {
      setSelectedUniversity(university);
    }
  };

  const handleSchoolChange = (value: string) => {
    const school = schools.find(sch => sch.id === value);
    if (school) {
      setSelectedSchool(school);
    }
  };

  const handleHelpMePick = () => {
    navigate("/pickAI");
  };

  const handleNext = () => {
    alert(`Selected: ${selectedUniversity.name}, ${selectedSchool.name}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#141414] text-white">
      <section className="relative flex-1 min-h-[50vh]" style={{ backgroundImage: `url(${selectedUniversity.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div style={pixelsOverlay}></div>
        <div style={gradientOverlay}></div>
        
        <div className="relative z-10 flex flex-col p-8 h-full">
          <h1 className="text-3xl font-bold text-white mb-auto">Step 1: Select Your Programme</h1>
          
          <div className="max-w-md w-full space-y-6 self-center mt-auto">
            <h2 className="text-2xl font-bold text-white">University</h2>
            
            <Select defaultValue={selectedUniversity.id} onValueChange={handleUniversityChange}>
              <SelectTrigger className="bg-[#141414] border-gray-700 text-white focus:ring-[#ff0a16]">
                <SelectValue placeholder="Select a university" />
              </SelectTrigger>
              <SelectContent className="bg-[#141414] border-gray-700 text-white">
                <SelectGroup>
                  {universities.map(uni => (
                    <SelectItem key={uni.id} value={uni.id}>{uni.name}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            
            <p className="text-white/80">{selectedUniversity.description}</p>
          </div>
        </div>
      </section>
      
      <div className="flex justify-center items-center gap-4 p-4 bg-[#141414] z-10">
        <Button 
          onClick={handleHelpMePick}
          className="bg-transparent border border-white/30 hover:border-white/80 text-white hover:bg-white/10 transition-all hover:scale-105"
        >
          <BookOpen className="mr-2 h-4 w-4" /> Help me pick!
        </Button>
        
        <Button 
          onClick={handleNext}
          className="bg-transparent border border-white/30 hover:border-white/80 text-white hover:bg-white/10 transition-all hover:scale-105"
        >
          Next <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <section className="relative flex-1 min-h-[50vh]" style={{ backgroundImage: `url(${selectedSchool.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div style={pixelsOverlay}></div>
        <div style={gradientOverlay}></div>
        
        <div className="relative z-10 flex flex-col p-8 h-full">
          <div className="max-w-md w-full space-y-6 self-center mt-auto">
            <h2 className="text-2xl font-bold text-white">School</h2>
            
            <Select defaultValue={selectedSchool.id} onValueChange={handleSchoolChange}>
              <SelectTrigger className="bg-[#141414] border-gray-700 text-white focus:ring-[#ff0a16]">
                <SelectValue placeholder="Select a school" />
              </SelectTrigger>
              <SelectContent className="bg-[#141414] border-gray-700 text-white">
                <SelectGroup>
                  {schools.map(school => (
                    <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            
            <p className="text-white/80">{selectedSchool.description}</p>
          </div>
        </div>
      </section>

      <footer className="py-4 px-6 text-center text-sm text-gray-500 bg-[#0c0c0c]">
        © 2025 Adviseek - All rights reserved
      </footer>
    </div>
  );
};

export default UniversitySelection;
