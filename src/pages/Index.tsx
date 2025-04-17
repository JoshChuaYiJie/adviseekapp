
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import AuthSection from "@/components/auth/AuthSection";
import { FileText, BookOpen, Video, DollarSign, School } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState("applied-programmes");
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [programme, setProgramme] = useState("");
  const [appliedProgrammes, setAppliedProgrammes] = useState<Array<{
    logo: string;
    school: string;
    course: string;
    extras?: string;
  }>>([]);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
      setLoading(false);
    };
    
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAddUniversity = () => {
    if (!selectedUniversity || !programme) return;
    
    const newProgramme = {
      logo: `/school-logos/${selectedUniversity}.png`,
      school: selectedUniversity,
      course: programme,
    };
    
    setAppliedProgrammes([...appliedProgrammes, newProgramme]);
    setSelectedUniversity("");
    setProgramme("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-purple-500 rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthSection />;
  }

  const renderContent = () => {
    switch (selectedSection) {
      case "applied-programmes":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a university" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NUS">NUS</SelectItem>
                  <SelectItem value="NTU">NTU</SelectItem>
                  <SelectItem value="SMU">SMU</SelectItem>
                </SelectContent>
              </Select>
              
              {selectedUniversity && (
                <input
                  type="text"
                  value={programme}
                  onChange={(e) => setProgramme(e.target.value)}
                  placeholder="Enter programme name"
                  className="w-full px-3 py-2 border rounded-md"
                />
              )}
              
              <Button onClick={handleAddUniversity}>Add University</Button>
              <Button 
                variant="outline" 
                onClick={() => navigate("/pickAI")}
                className="ml-4"
              >
                What is my ideal programme?
              </Button>
            </div>

            {appliedProgrammes.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>University</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Additional Info</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appliedProgrammes.map((prog, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <img src={prog.logo} alt={prog.school} className="h-12 w-12 object-contain" />
                      </TableCell>
                      <TableCell>{prog.school}</TableCell>
                      <TableCell>{prog.course}</TableCell>
                      <TableCell>{prog.extras || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        );
      
      case "my-resume":
        return (
          <div className="space-y-6">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <p>Drop your resume here or click to upload</p>
              <input type="file" className="hidden" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold">Don't have an optimized resume? Build one now!</h3>
              <p className="text-sm text-gray-600 mt-1">
                Our proprietary AI model will build one specifically catered to your desired programme
              </p>
              <Button 
                onClick={() => navigate("/resumebuilder")} 
                className="mt-4"
              >
                Build your resume
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Uploaded on</TableHead>
                  <TableHead>Applying to</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Add rows when documents are uploaded */}
              </TableBody>
            </Table>
          </div>
        );
      
      case "apply-now":
        return (
          <div className="space-y-4">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Pick a university" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NUS">NUS</SelectItem>
                <SelectItem value="NTU">NTU</SelectItem>
                <SelectItem value="SMU">SMU</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      
      default:
        return <p>Placeholder</p>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-[240px] bg-white border-r border-gray-200 flex flex-col h-screen">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-purple-600">Adviseek</span>
            <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-yellow-400 text-yellow-800 rounded">FREE</span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setSelectedSection("applied-programmes")}
            className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${
              selectedSection === "applied-programmes" 
                ? "bg-gray-100 text-gray-900" 
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <School className="mr-3 h-5 w-5 text-gray-500" />
            Applied Programmes
          </button>
          
          <button
            onClick={() => setSelectedSection("my-resume")}
            className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${
              selectedSection === "my-resume" 
                ? "bg-gray-100 text-gray-900" 
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <FileText className="mr-3 h-5 w-5 text-gray-500" />
            My Resume
          </button>
          
          <button
            onClick={() => setSelectedSection("apply-now")}
            className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${
              selectedSection === "apply-now" 
                ? "bg-gray-100 text-gray-900" 
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <BookOpen className="mr-3 h-5 w-5 text-gray-500" />
            Apply Now
          </button>
          
          <button
            onClick={() => setSelectedSection("mock-interviews")}
            className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${
              selectedSection === "mock-interviews" 
                ? "bg-gray-100 text-gray-900" 
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Video className="mr-3 h-5 w-5 text-gray-500" />
            Mock Interviews
          </button>
          
          <button
            onClick={() => setSelectedSection("get-paid")}
            className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${
              selectedSection === "get-paid" 
                ? "bg-gray-100 text-gray-900" 
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <DollarSign className="mr-3 h-5 w-5 text-gray-500" />
            Get Paid
          </button>
        </nav>
        
        {/* Upgrade button */}
        <div className="p-4 mt-auto border-t border-gray-200">
          <button className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200">
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 11l5-5 5 5"/>
              <path d="M7 17l5-5 5 5"/>
            </svg>
            Upgrade
          </button>
        </div>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-medium text-gray-800 mb-6">
            Welcome, {user.email || "Student"}. Let's get to work.
          </h1>
          
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Index;
