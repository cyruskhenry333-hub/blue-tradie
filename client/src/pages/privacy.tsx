import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Homepage
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> December 2024
            </p>

            <h2>1. Information We Collect</h2>
            <p>We collect information you provide directly to us, such as:</p>
            <ul>
              <li><strong>Account Information:</strong> Name, email address, business name, trade, service area</li>
              <li><strong>Business Data:</strong> Jobs, clients, invoices, expenses, and other business records you create</li>
              <li><strong>Payment Information:</strong> Billing address and payment details (processed securely by Stripe)</li>
              <li><strong>Usage Data:</strong> How you interact with our service to improve functionality</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices, updates, and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Provide AI-powered business insights and recommendations</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2>3. Information Sharing</h2>
            <p>We do not sell, trade, or otherwise transfer your personal information to third parties except:</p>
            <ul>
              <li><strong>Service Providers:</strong> Trusted partners who help us operate our service (e.g., Stripe for payments)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              <li><strong>With Your Consent:</strong> When you explicitly agree to share information</li>
            </ul>

            <h2>4. Data Security</h2>
            <p>We implement appropriate security measures to protect your information:</p>
            <ul>
              <li>Encryption of data in transit and at rest</li>
              <li>Secure data centers with restricted access</li>
              <li>Regular security audits and monitoring</li>
              <li>Employee access controls and training</li>
            </ul>

            <h2>5. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide services. 
              You may request deletion of your data at any time, subject to legal obligations.
            </p>

            <h2>6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access and update your personal information</li>
              <li>Request deletion of your data</li>
              <li>Opt out of marketing communications</li>
              <li>Data portability (export your data)</li>
              <li>Lodge a complaint with relevant authorities</li>
            </ul>

            <h2>7. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to enhance your experience, analyze usage, and provide 
              personalized content. You can control cookie settings through your browser.
            </p>

            <h2>8. International Data Transfers</h2>
            <p>
              Your information may be processed in countries outside of Australia/New Zealand. We ensure 
              appropriate safeguards are in place to protect your data.
            </p>

            <h2>9. Children's Privacy</h2>
            <p>
              Our service is not intended for children under 18. We do not knowingly collect personal 
              information from children under 18.
            </p>

            <h2>10. Changes to Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any significant 
              changes via email or through our service.
            </p>

            <h2>11. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
              <br />
              Email: privacy@bluetradie.com
              <br />
              Address: Blue Tradie, Australia
            </p>

            <h2>12. Australian Privacy Principles</h2>
            <p>
              We comply with the Australian Privacy Principles under the Privacy Act 1988 (Cth) and 
              New Zealand Privacy Act 2020, ensuring your personal information is handled appropriately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}