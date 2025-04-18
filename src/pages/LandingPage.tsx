
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet';

const LandingPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  // In a real app, we would handle email submission here
  const handleGetStarted = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <>
      <Helmet>
        <title>Adviseek - AI-Powered University Application Assistant</title>
        <meta name="description" content="Adviseek helps students find their perfect university program, craft standout applications, build tailored resumes, and prepare for interviews with AI assistance." />
        <meta name="keywords" content="university application, college admissions, AI education assistant, program selection, resume builder, mock interviews" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://adviseek.com/" />
        <meta property="og:title" content="Adviseek - AI-Powered University Application Assistant" />
        <meta property="og:description" content="Get into your dream university with personalized AI assistance for program selection, applications, resume building, and interview prep." />
        <meta property="og:image" content="/og-image.jpg" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://adviseek.com/" />
        <meta property="twitter:title" content="Adviseek - AI-Powered University Application Assistant" />
        <meta property="twitter:description" content="Get into your dream university with personalized AI assistance for program selection, applications, resume building, and interview prep." />
        <meta property="twitter:image" content="/og-image.jpg" />
        
        {/* JSON-LD structured data */}
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Adviseek",
            "applicationCategory": "Education",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "AI-powered assistant for university applications, program selection, resume building, and interview preparation.",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "156"
            }
          }
        `}</script>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <header className="py-4 px-6 md:px-8 lg:px-12 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-black">Adviseek</span>
            <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-yellow-400 text-yellow-800 rounded">
              BETA
            </span>
          </div>
          
          <nav className="hidden md:flex space-x-6">
            <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
            <a href="#testimonials" className="text-gray-600 hover:text-gray-900">Testimonials</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
            <a href="#faq" className="text-gray-600 hover:text-gray-900">FAQ</a>
          </nav>
          
          <div className="flex space-x-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>Log in</Button>
            <Button onClick={() => navigate('/dashboard')}>Sign up</Button>
          </div>
        </header>
        
        <main>
          {/* Hero Section */}
          <section className="py-16 md:py-24 px-6 md:px-8 lg:px-12 max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">Get Into Your Dream University With AI</h1>
                <p className="text-lg md:text-xl text-gray-700">
                  Adviseek helps you select the right program, craft standout applications, build tailored resumes, and prepare for interviews.
                </p>
                <form onSubmit={handleGetStarted} className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="px-4 py-2 border border-gray-300 rounded-md flex-1" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Button type="submit">Get Started</Button>
                </form>
                <p className="text-sm text-gray-500">
                  No credit card required. Free plan available.
                </p>
              </div>
              <div className="relative hidden md:block">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-1">
                  <img 
                    src="/placeholder.svg" 
                    alt="Adviseek dashboard preview" 
                    className="rounded-lg shadow-lg w-full"
                  />
                </div>
              </div>
            </div>
          </section>
          
          {/* Features Section */}
          <section id="features" className="py-16 bg-white px-6 md:px-8 lg:px-12">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">Everything You Need For University Success</h2>
                <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                  Our AI-powered platform gives you the tools and guidance to navigate the entire university application process.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  {
                    title: "Program Selection",
                    description: "Find the perfect university program that matches your interests, strengths, and career goals."
                  },
                  {
                    title: "Resume Builder",
                    description: "Create tailored resumes for each application that highlight your relevant experiences and achievements."
                  },
                  {
                    title: "Application Assistant",
                    description: "Get AI guidance on crafting compelling personal statements and application essays."
                  },
                  {
                    title: "Mock Interviews",
                    description: "Practice with AI-generated interview questions specific to your chosen programs."
                  }
                ].map((feature, index) => (
                  <div key={index} className="bg-gray-50 p-6 rounded-lg">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <span className="text-blue-600 text-xl font-bold">{index + 1}</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
          
          {/* Testimonials Section */}
          <section id="testimonials" className="py-16 bg-gray-50 px-6 md:px-8 lg:px-12">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">Success Stories</h2>
                <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                  See how Adviseek has helped students get into their dream universities.
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    name: "Sarah L.",
                    program: "Computer Science at MIT",
                    quote: "Adviseek helped me craft the perfect application that highlighted my unique experiences. I got accepted to my dream program!"
                  },
                  {
                    name: "Michael T.",
                    program: "Business at Stanford",
                    quote: "The mock interview feature was a game-changer. I felt so prepared for my actual interviews thanks to the practice I got."
                  },
                  {
                    name: "Jessica K.",
                    program: "Medicine at Johns Hopkins",
                    quote: "I was overwhelmed by the application process until I found Adviseek. It guided me step by step and made everything manageable."
                  }
                ].map((testimonial, index) => (
                  <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium">{testimonial.name}</p>
                        <p className="text-sm text-gray-500">{testimonial.program}</p>
                      </div>
                    </div>
                    <p className="text-gray-600">"{testimonial.quote}"</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
          
          {/* CTA Section */}
          <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 md:px-8 lg:px-12">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
              <p className="text-lg mb-8">
                Join thousands of students who've used Adviseek to get into their dream universities.
              </p>
              <Button 
                onClick={() => navigate('/dashboard')}
                size="lg"
                className="bg-white text-blue-700 hover:bg-gray-100"
              >
                Get Started For Free
              </Button>
            </div>
          </section>
          
          {/* FAQ Section */}
          <section id="faq" className="py-16 bg-white px-6 md:px-8 lg:px-12">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
              </div>
              
              <div className="space-y-6">
                {[
                  {
                    question: "Is Adviseek free to use?",
                    answer: "Yes, Adviseek offers a free plan with basic features. Premium plans are available for additional features and enhanced AI assistance."
                  },
                  {
                    question: "How does the AI work?",
                    answer: "Our AI analyzes your academic background, interests, and goals to provide personalized recommendations for programs, application strategies, and interview preparation."
                  },
                  {
                    question: "Can I use Adviseek for any university?",
                    answer: "Yes, Adviseek supports applications to universities worldwide, with special focus on major institutions in the US, UK, Canada, and Australia."
                  },
                  {
                    question: "How secure is my information?",
                    answer: "We take data security seriously. All your personal information is encrypted and stored securely. We never share your data with third parties without your consent."
                  }
                ].map((faq, index) => (
                  <div key={index} className="border-b border-gray-200 pb-4">
                    <h3 className="text-xl font-medium mb-2">{faq.question}</h3>
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
        
        <footer className="bg-gray-900 text-gray-300 py-12 px-6 md:px-8 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-white text-lg font-semibold mb-4">Adviseek</h3>
                <p className="text-sm">
                  AI-powered assistant for university applications, program selection, resume building, and interview preparation.
                </p>
              </div>
              <div>
                <h3 className="text-white text-lg font-semibold mb-4">Links</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#features" className="hover:text-white">Features</a></li>
                  <li><a href="#testimonials" className="hover:text-white">Testimonials</a></li>
                  <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                  <li><a href="#faq" className="hover:text-white">FAQ</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white text-lg font-semibold mb-4">Legal</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="/privacy-policy" className="hover:text-white">Privacy Policy</a></li>
                  <li><a href="/terms-of-service" className="hover:text-white">Terms of Service</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white text-lg font-semibold mb-4">Connect</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:text-white">Twitter</a></li>
                  <li><a href="#" className="hover:text-white">LinkedIn</a></li>
                  <li><a href="#" className="hover:text-white">Facebook</a></li>
                  <li><a href="#" className="hover:text-white">Instagram</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800 text-sm text-center">
              &copy; {new Date().getFullYear()} Adviseek. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;
