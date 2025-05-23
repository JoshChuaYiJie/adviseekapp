import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, User, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import MajorRecommendations from "./MajorRecommendations";

export const AboutMe = () => {
  const [name, setName] = useState("");
  const [user, setUser] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();
  const { isCurrentlyDark } = useTheme();

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(currentUser);

      if (currentUser?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', currentUser.id)
          .single();

        if (profile) {
          setName(profile.name || '');
        }
      }
    };

    fetchUser();
  }, []);

  const handleUpdateProfile = async (field: string, value: any) => {
    if (!user?.id) {
      console.error("User ID not found");
      return;
    }

    const updates = {
      [field]: value,
      updated_at: new Date(),
    };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Profile Card */}
      <div className={`p-6 ${isCurrentlyDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-lg shadow w-full`}>
        <h2 className="text-xl font-semibold mb-4">Profile Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleUpdateProfile('name', name)}
              className={`w-full p-2 border rounded-md ${isCurrentlyDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              placeholder="Enter your name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className={`w-full p-2 border rounded-md ${isCurrentlyDark ? 'bg-gray-700 border-gray-600 text-gray-400' : 'bg-gray-50 border-gray-300 text-gray-500'}`}
            />
          </div>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={() => navigate('/quiz/1')} 
            className="w-full"
            data-tutorial="take-quiz"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Take Quiz
          </Button>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowProfile(!showProfile)}
              variant="outline"
              className="flex-1"
              data-tutorial="my-profile-button"
            >
              <User className="mr-2 h-4 w-4" />
              My Profile
            </Button>
            
            <Button
              onClick={() => navigate('/recommendations')}
              variant="outline"
              className="flex-1"
              data-tutorial="narrow-down-button"
            >
              <Target className="mr-2 h-4 w-4" />
              Narrow down further
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      {showProfile && (
        <div className={`p-6 ${isCurrentlyDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-lg shadow w-full`} data-tutorial="profiles-section">
          {/* RIASEC Profile */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">RIASEC Profile</h3>
            <p>
              Your RIASEC (Realistic, Investigative, Artistic, Social, Enterprising, Conventional) profile
              will be displayed here once you complete the quiz. This profile helps match your interests
              and personality to suitable career paths.
            </p>
          </div>

          {/* Work Value Profile */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Work Value Profile</h3>
            <p>
              Your Work Value profile will be displayed here once you complete the quiz. This profile
              identifies what you value most in a work environment, such as achievement, independence,
              recognition, relationships, support, and working conditions.
            </p>
          </div>
          
          <div data-tutorial="recommended-majors">
            <h3 className="text-lg font-medium mb-4">Recommended Majors</h3>
            <MajorRecommendations />
          </div>
        </div>
      )}
    </div>
  );
};
