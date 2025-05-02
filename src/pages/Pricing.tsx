
import { useState } from "react";
import { Button } from "@/components/ui/button";
import UpgradeModal from "@/components/UpgradeModal";
import { Check, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const plans = [
  {
    name: "Free",
    price: 0,
    priceSuffix: "/mo",
    features: [
      "Unlimited university & course exploration",
      "Basic AI recommendations",
      "View 3 tailored course paths",
      "Resume builder access (basic)",
      "Limited mentorship chat",
      "Community forums access",
    ],
    popular: false,
    cta: "Current Plan",
    buttonVariant: "outline"
  },
  {
    name: "Pro",
    price: 10,
    priceSuffix: "/mo",
    features: [
      "Full AI-powered guidance",
      "Unlimited course recommendations",
      "Personalised university essay feedback",
      "Priority mentorship chat",
      "Advanced resume templates & editing",
      "Early access to new tools",
      "Priority support",
    ],
    popular: true,
    cta: "Upgrade to Pro",
    buttonVariant: "default"
  },
  {
    name: "Enterprise",
    price: "Contact us",
    priceSuffix: "",
    features: [
      "Custom onboarding for schools/teams",
      "White-label solutions",
      "Bulk seat discounts",
      "Advanced analytics",
      "Dedicated account manager",
      "Custom integrations",
    ],
    popular: false,
    cta: "Contact Sales",
    buttonVariant: "outline"
  }
];

const Pricing = () => {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBackToDashboard = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ECE9FF] to-[#F5F7FA] flex flex-col py-12">
      <div className="max-w-4xl w-full mx-auto px-4">
        <Button 
          variant="outline" 
          onClick={handleBackToDashboard}
          className="mb-8 flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          {t("common.back_to_dashboard", "Back to Dashboard")}
        </Button>
        
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-poppins mb-4">{t("pricing.title", "Choose your Adviseek plan")}</h1>
          <p className="text-lg text-gray-600 mb-2">{t("pricing.subtitle", "Pick the plan that fits your ambitions. Clear pricing, no surprises.")}</p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8 px-4 md:px-0 max-w-4xl mx-auto">
        {plans.map((plan, idx) => (
          <div
            key={plan.name}
            className={`relative bg-white rounded-2xl shadow-xl transition-transform hover:-translate-y-1 hover:shadow-2xl border border-gray-100 p-8 flex flex-col ${plan.popular ? "ring-2 ring-purple-500" : ""}`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-xs px-4 py-1 rounded-full shadow font-semibold tracking-wide animate-fade-in">
                {t("pricing.most_popular", "Most Popular")}
              </div>
            )}
            <h2 className="text-2xl font-bold font-poppins mb-2">{t(`pricing.plan_name.${plan.name.toLowerCase()}`, plan.name)}</h2>
            <div className="mb-2">
              <span className="text-4xl font-extrabold text-gray-900 font-poppins">
                {typeof plan.price === "number" ? `$${plan.price}` : t("pricing.contact_us", plan.price)}
              </span>
              <span className="text-gray-500 font-medium text-lg">{plan.priceSuffix}</span>
            </div>
            <ul className="text-left space-y-3 mt-4 mb-8">
              {plan.features.map((feat, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-700">
                  <span className="flex-shrink-0 text-accent">
                    <Check size={20} className="text-purple-500" />
                  </span>
                  <span>{t(`pricing.features.${plan.name.toLowerCase()}.${i}`, feat)}</span>
                </li>
              ))}
            </ul>
            <Button
              className={`w-full mt-auto`}
              variant={plan.buttonVariant as any}
              onClick={
                plan.name === "Pro"
                  ? () => setUpgradeOpen(true)
                  : undefined
              }
              disabled={plan.name === "Free"}
              aria-label={t(`pricing.cta.${plan.name.toLowerCase()}`, plan.cta)}
            >
              {t(`pricing.cta.${plan.name.toLowerCase()}`, plan.cta)}
            </Button>
          </div>
        ))}
      </div>
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
};

export default Pricing;
