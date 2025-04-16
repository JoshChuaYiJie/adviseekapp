
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 md:px-8 lg:px-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="flex items-center gap-2 text-accent hover:underline mb-4">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">Last Updated: April 16, 2025</p>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p>
              Welcome to Adviseek ("we," "our," or "us"). We are committed to protecting your privacy and providing you with a safe experience when using our service. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our web application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
            <p className="mb-2">We collect several types of information from and about users of our application, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Personal information (such as name, email address, and educational details) that you provide to us when registering, using our application, or communicating with us.</li>
              <li>Information about your device, browser, and how you interact with our application.</li>
              <li>Information you input regarding university preferences and academic achievements.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
            <p className="mb-2">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, operate, and maintain our application.</li>
              <li>Personalize your experience and deliver content relevant to your educational goals.</li>
              <li>Improve and enhance our services.</li>
              <li>Communicate with you, including sending notifications about your account or providing updates.</li>
              <li>Analyze usage patterns to better design our services.</li>
              <li>Protect our services and users, and prevent fraudulent activity.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Data Retention</h2>
            <p>
              We will retain your information for as long as your account is active or as needed to provide services to you. We will also retain and use your information as necessary to comply with legal obligations, resolve disputes, and enforce our agreements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Data Security</h2>
            <p>
              We implement reasonable security measures to protect the security of your personal information. However, no method of transmission over the Internet is 100% secure. Therefore, while we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Children's Privacy</h2>
            <p>
              Our service is not directed to children under 13. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal information, we will take steps to remove such information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at privacy@adviseek.sg.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
