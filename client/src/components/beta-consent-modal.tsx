import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, AlertTriangle, Database, Lock } from "lucide-react";

interface BetaConsentModalProps {
  isOpen: boolean;
  onConsent: () => void;
  onDecline: () => void;
}

const BETA_CONSENT_TEXT = `I understand this is a beta version of Blue Tradie. While every effort has been made to ensure functionality, some features may still be in development. I consent to my data being used to improve the platform, and I agree to maintain independent records during the beta period.`;

export function BetaConsentModal({ isOpen, onConsent, onDecline }: BetaConsentModalProps) {
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [hasAgreedToConsent, setHasAgreedToConsent] = useState(false);

  const canProceed = hasReadTerms && hasAgreedToConsent;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-6 w-6 text-tradie-blue" />
            Blue Tradie Beta - Important Information
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Security & Data Protection */}
            <div className="border-l-4 border-l-tradie-success bg-green-50 p-4 rounded-r-lg">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-tradie-success mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Your Data is Protected</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• All data is encrypted in transit and at rest</li>
                    <li>• Hosted in secure, compliant infrastructure</li>
                    <li>• Daily automated backups are maintained</li>
                    <li>• Admin access is strictly controlled and audited</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Beta Disclaimer */}
            <div className="border-l-4 border-l-tradie-warning bg-orange-50 p-4 rounded-r-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-tradie-warning mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Beta Version Notice</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Some features may still be in development</li>
                    <li>• Invoicing and summaries are marked "Beta – Verify All Info"</li>
                    <li>• Please maintain independent records during beta testing</li>
                    <li>• Bank connection features are disabled by default for safety</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Data Usage */}
            <div className="border-l-4 border-l-tradie-blue bg-blue-50 p-4 rounded-r-lg">
              <div className="flex items-start gap-3">
                <Database className="h-5 w-5 text-tradie-blue mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">How We Use Your Data</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Improve platform functionality and user experience</li>
                    <li>• Provide AI-powered business insights and recommendations</li>
                    <li>• Ensure compliance with Australian/New Zealand regulations</li>
                    <li>• All usage is aggregated and anonymized where possible</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Your Rights */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Your Rights</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• You can request data export or deletion at any time</li>
                <li>• You can provide feedback and report issues via the platform</li>
                <li>• You can withdraw from beta testing at any time</li>
                <li>• All beta data will be handled according to our Privacy Policy</li>
              </ul>
            </div>
          </div>
        </ScrollArea>

        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700 font-medium">
              {BETA_CONSENT_TEXT}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox 
                id="read-terms" 
                checked={hasReadTerms}
                onCheckedChange={(checked) => setHasReadTerms(checked === true)}
                className="mt-0.5"
              />
              <label htmlFor="read-terms" className="text-sm text-gray-700 cursor-pointer">
                I have read and understood the beta information above
              </label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox 
                id="agree-consent" 
                checked={hasAgreedToConsent}
                onCheckedChange={(checked) => setHasAgreedToConsent(checked === true)}
                className="mt-0.5"
              />
              <label htmlFor="agree-consent" className="text-sm text-gray-700 cursor-pointer">
                I agree to the beta consent terms and understand this is a testing version
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <Button 
              variant="outline" 
              onClick={onDecline}
              className="flex-1"
            >
              I Don't Agree
            </Button>
            <Button 
              onClick={onConsent}
              disabled={!canProceed}
              className={`flex-1 ${canProceed ? 'btn-tradie-primary' : ''}`}
            >
              I Agree - Continue to Blue Tradie
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}