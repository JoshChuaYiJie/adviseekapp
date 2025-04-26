
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Help = () => {
  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 md:px-8 lg:px-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="flex items-center gap-2 text-accent hover:underline mb-4">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold mb-2">Help Center</h1>
          <p className="text-muted-foreground">How can we assist you?</p>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">Getting Started</h2>
            <p className="mb-4">
              New to Adviseek? Here are some resources to help you get started:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Create your student profile to get personalized recommendations</li>
              <li>Explore university programs that match your interests and strengths</li>
              <li>Connect with other students in the community section</li>
              <li>Track your applications in the dashboard</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Frequently Asked Questions</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">How do I update my academic information?</h3>
                <p className="text-muted-foreground">
                  You can update your academic information in the Settings page. Click on your profile and select "Settings" from the dropdown menu.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium">How are university programs recommended to me?</h3>
                <p className="text-muted-foreground">
                  Our AI algorithm considers your academic history, interests, career goals, and personality traits to suggest programs that might be a good fit for you.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium">Can I track all my applications in one place?</h3>
                <p className="text-muted-foreground">
                  Yes! The "Applied Programmes" section in your dashboard allows you to monitor the status of all your university applications.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Contact Support</h2>
            <p>
              Need more help? Contact our support team at <a href="mailto:support@adviseek.sg" className="text-blue-600 hover:underline">support@adviseek.sg</a> or use the chat feature in the bottom right corner of your screen.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Help;
