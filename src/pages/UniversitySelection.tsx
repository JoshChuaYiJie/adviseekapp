
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Book, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUniversitySelection } from "@/hooks/useUniversitySelection";
import "../styles/jekflix.css";

const UniversitySelection = () => {
  const {
    universities,
    selectedUniversity,
    selectedSchool,
    handleUniversityChange,
    handleSchoolChange,
    handleHelpMePick
  } = useUniversitySelection();
  
  const navigate = useNavigate();

  // Ensure we have data loaded before rendering
  if (!selectedUniversity || !selectedSchool) {
    return <div className="flex items-center justify-center h-screen bg-primary-dark">Loading...</div>;
  }

  return (
    <div className="jekflix-page">
      {/* Page Header */}
      <header className="p-6 text-center">
        <h1 className="text-3xl font-bold">Step 1: Select Your Programme</h1>
      </header>

      {/* University Selection Section */}
      <section 
        className="jekflix-hero" 
        style={{ backgroundImage: `url(${selectedUniversity.imageSrc})` }}
      >
        <div className="pixels"></div>
        <div className="gradient"></div>
        <div className="content">
          <time dateTime="2025-04-16" className="date">04.16.2025</time>
          <h2 className="title">Choose Your University</h2>
          
          <Select 
            value={selectedUniversity.id} 
            onValueChange={handleUniversityChange}
          >
            <SelectTrigger className="jekflix-select">
              <SelectValue placeholder="Select a university" />
            </SelectTrigger>
            <SelectContent>
              {universities.map((university) => (
                <SelectItem key={university.id} value={university.id}>
                  {university.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <p className="description">{selectedUniversity.description}</p>
        </div>
      </section>

      {/* Center Buttons */}
      <div className="jekflix-buttons">
        <Button 
          onClick={handleHelpMePick}
          className="jekflix-button"
        >
          <HelpCircle size={18} />
          <span>Help me pick!</span>
        </Button>
        
        <Button 
          onClick={() => navigate("/next-page")}
          className="jekflix-button"
        >
          <Book size={18} />
          <span>Next</span>
        </Button>
      </div>

      {/* School Selection Section */}
      <section 
        className="jekflix-hero" 
        style={{ backgroundImage: `url(${selectedSchool.imageSrc})` }}
      >
        <div className="pixels"></div>
        <div className="gradient"></div>
        <div className="content">
          <time dateTime="2025-04-16" className="date">04.16.2025</time>
          <h2 className="title">Choose Your School</h2>
          
          <Select 
            value={selectedSchool.id} 
            onValueChange={handleSchoolChange}
          >
            <SelectTrigger className="jekflix-select">
              <SelectValue placeholder="Select a school" />
            </SelectTrigger>
            <SelectContent>
              {selectedUniversity.schools.map((school) => (
                <SelectItem key={school.id} value={school.id}>
                  {school.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <p className="description">{selectedSchool.description}</p>
        </div>
      </section>
    </div>
  );
};

export default UniversitySelection;
