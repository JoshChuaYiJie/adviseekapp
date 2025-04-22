
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CreditCard, DollarSign, QrCode } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UpgradeModal = ({ open, onOpenChange }: UpgradeModalProps) => {
  const [method, setMethod] = useState<"card" | "paynow" | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheckout = () => {
    setLoading(true);
    // Placeholder: integrate Stripe/PayNow here.
    setTimeout(() => {
      setLoading(false);
      onOpenChange(false);
      // show a toast here in real app!
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Upgrade to Pro</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Choose Payment Method</h3>
            <div className="flex gap-3">
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${method === 'card' ? "border-purple-500 bg-purple-50" : "border-gray-200"} transition shadow-sm hover:shadow-md`}
                onClick={() => setMethod("card")}
                type="button"
                aria-label="Credit/Debit Card"
              >
                <CreditCard className="w-5 h-5" />
                Card
              </button>
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${method === 'paynow' ? "border-purple-500 bg-purple-50" : "border-gray-200"} transition shadow-sm hover:shadow-md`}
                onClick={() => setMethod("paynow")}
                type="button"
                aria-label="PayNow"
              >
                <QrCode className="w-5 h-5" />
                PayNow
              </button>
            </div>
          </div>
          {method && (
            <div className="mt-4">
              {method === "card" ? (
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-3 text-center text-gray-700">
                  (Credit/Debit card payments will be powered by Stripe in the completed app.)
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-3 text-center text-gray-700">
                  (PayNow support coming soon. This is a placeholder.)
                </div>
              )}
              <Button
                onClick={handleCheckout}
                className="w-full"
                disabled={loading}
                aria-label="Pay and Upgrade"
              >
                {loading ? (
                  <span className="animate-spin mr-2">↻</span>
                ) : (
                  <DollarSign className="w-5 h-5 mr-2" />
                )}
                Pay & Upgrade
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
