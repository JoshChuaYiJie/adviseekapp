
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export const GetPaid = () => {
  const handleApplyConsultant = () => {
    // In a real app, this would submit an application or open a form
    toast({
      title: "Application Submitted",
      description: "Your application to become a consultant has been received. We'll review it and get back to you soon!",
    });
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Earn Money as a Consultant</h2>
        
        <div className="space-y-4">
          <p>
            Once you've been accepted into your desired programme, you can apply to become an Adviseek consultant.
            As a consultant, you'll help other students with their applications and interviews, sharing your 
            valuable experience and insights.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="text-lg font-medium text-blue-800 mb-2">Benefits of being a consultant:</h3>
            <ul className="list-disc pl-5 space-y-2 text-blue-700">
              <li>Earn competitive hourly rates for helping others succeed</li>
              <li>Flexible work hours that fit around your studies</li>
              <li>Build your professional network and enhance your resume</li>
              <li>Give back to the community by sharing your knowledge</li>
            </ul>
          </div>
          
          <div className="bg-green-50 p-4 rounded-md">
            <h3 className="text-lg font-medium text-green-800 mb-2">How it works:</h3>
            <ol className="list-decimal pl-5 space-y-2 text-green-700">
              <li>Apply to become a consultant after you've been accepted to your programme</li>
              <li>Complete a short training and onboarding process</li>
              <li>Set your availability and connect with students who need help</li>
              <li>Get paid for each session you conduct</li>
            </ol>
          </div>
          
          <div className="mt-6">
            <Button onClick={handleApplyConsultant} data-tutorial="apply-consultant">
              Apply Now
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              *You must be enrolled in a university programme to qualify
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
