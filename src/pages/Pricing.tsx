
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Pricing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Upgrade your plan</h1>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Free</h2>
            <p className="text-gray-600 mb-4">Perfect for getting started</p>
            <p className="text-3xl font-bold mb-6">$0/mo</p>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full">
              Current Plan
            </Button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-2 border-purple-500">
            <h2 className="text-xl font-semibold mb-4">Pro</h2>
            <p className="text-gray-600 mb-4">For serious students</p>
            <p className="text-3xl font-bold mb-6">$10/mo</p>
            <Button className="w-full">Upgrade to Pro</Button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Enterprise</h2>
            <p className="text-gray-600 mb-4">Custom solutions</p>
            <p className="text-3xl font-bold mb-6">Contact us</p>
            <Button variant="outline" className="w-full">Contact Sales</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
