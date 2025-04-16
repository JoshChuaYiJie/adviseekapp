
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 md:px-8 lg:px-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="flex items-center gap-2 text-accent hover:underline mb-4">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">Last Updated: April 16, 2025</p>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Adviseek service, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
            <p>
              Adviseek provides guidance for high school students applying to top Singapore universities, including course selection assistance and resume building tools. The service is designed for educational purposes only.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
            <p className="mb-2">By creating an account, you agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate and complete information.</li>
              <li>Maintain the security of your password and account.</li>
              <li>Accept responsibility for all activities that occur under your account.</li>
              <li>Notify us immediately of any unauthorized use of your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. User Conduct</h2>
            <p className="mb-2">When using our service, you agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violate any applicable laws or regulations.</li>
              <li>Impersonate any person or entity.</li>
              <li>Interfere with or disrupt the service or servers or networks connected to the service.</li>
              <li>Use the service to transmit any harmful code or material.</li>
              <li>Collect or store personal information about other users without their consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Intellectual Property</h2>
            <p>
              All content, features, and functionality of the service, including but not limited to text, graphics, logos, and software, are owned by Adviseek and are protected by copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Disclaimer of Warranties</h2>
            <p>
              The service is provided on an "as is" and "as available" basis. We make no warranties, expressed or implied, regarding the reliability, accuracy, or availability of the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Limitation of Liability</h2>
            <p>
              In no event shall Adviseek be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of any changes by posting the new Terms on this page and updating the "Last Updated" date at the top.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Governing Law</h2>
            <p>
              These Terms shall be governed by the laws of Singapore without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at terms@adviseek.sg.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
