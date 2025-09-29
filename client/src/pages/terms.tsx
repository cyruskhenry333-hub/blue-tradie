import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Terms of Service</h1>
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
              <strong>Last updated:</strong> January 2025
            </p>

            <h2>1. Agreement to Terms</h2>
            <p>
              By accessing and using Blue Tradie ("Service", "we", "us", "our"), operated by Blue Tradie Pty Ltd (ABN: [To be inserted]), 
              you ("user", "you", "your") accept and agree to be bound by these Terms of Service ("Terms"). 
              If you disagree with any part of these terms, you may not access the Service.
            </p>

            <h2>2. Eligibility and Account Registration</h2>
            <p>
              You must be at least 18 years old and have the legal capacity to enter into contracts. 
              By registering, you represent that all information provided is accurate and complete. 
              You are responsible for maintaining the confidentiality of your account credentials.
            </p>

            <h2>3. Description of Service</h2>
            <p>
              Blue Tradie provides a comprehensive business management platform specifically designed for 
              tradespeople in Australia and New Zealand. Our services include:
            </p>
            <ul>
              <li>AI-powered business advisors and automation tools</li>
              <li>Invoicing, quote generation, and payment processing</li>
              <li>Job scheduling and client management systems</li>
              <li>Expense tracking and business analytics</li>
              <li>Professional networking and tradie directory access</li>
              <li>Document storage and business reporting tools</li>
            </ul>

            <h2>4. Subscription Plans and Billing</h2>
            <p>
              <strong>Free Trial:</strong> We offer a 30-day free trial for new users. Payment information is required upon registration.
            </p>
            <p>
              <strong>Billing Terms:</strong>
            </p>
            <ul>
              <li>Subscription fees are charged monthly in advance starting after your free trial expires</li>
              <li>All fees are in Australian Dollars (AUD) unless otherwise specified</li>
              <li>Payment is processed automatically via Stripe on your billing date</li>
              <li>You may cancel your subscription at any time through your account settings</li>
              <li>No refunds are provided for partial months or unused portions of your subscription</li>
              <li>We reserve the right to change pricing with 30 days written notice</li>
            </ul>

            <h2>5. Acceptable Use and Prohibited Activities</h2>
            <p>You agree to use the Service lawfully and appropriately. You SHALL NOT:</p>
            <ul>
              <li>Use the Service for any illegal activities or to violate any applicable laws</li>
              <li>Share your account credentials or allow unauthorized access</li>
              <li>Attempt to reverse engineer, hack, or compromise the Service</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Use automated tools to access the Service without permission</li>
              <li>Violate the rights of other users or third parties</li>
              <li>Use the Service to send spam or unsolicited communications</li>
            </ul>

            <h2>6. Intellectual Property Rights</h2>
            <p>
              The Service, including all content, features, functionality, and technology, is owned by Blue Tradie 
              and protected by Australian and international copyright, trademark, and other intellectual property laws. 
              You retain ownership of content you create using the Service, but grant us a license to process and display it as necessary to provide the Service.
            </p>

            <h2>7. Data Protection and Privacy</h2>
            <p>
              Your privacy is important to us. We collect, use, and protect your information in accordance with our Privacy Policy, 
              which complies with the Australian Privacy Principles and New Zealand Privacy Act. By using the Service, 
              you consent to our data practices as described in our Privacy Policy.
            </p>

            <h2>8. Service Availability and Modifications</h2>
            <p>
              We strive to maintain high service availability but cannot guarantee uninterrupted access. 
              We reserve the right to modify, suspend, or discontinue the Service with reasonable notice. 
              We may also update these Terms from time to time, with material changes communicated via email.
            </p>

            <h2>9. Limitation of Liability and Disclaimers</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW:
            </p>
            <ul>
              <li>The Service is provided "AS IS" without warranties of any kind</li>
              <li>We disclaim all warranties, express or implied, including merchantability and fitness for purpose</li>
              <li>Our total liability shall not exceed the amount paid by you in the 12 months preceding the claim</li>
              <li>We shall not be liable for indirect, incidental, consequential, or punitive damages</li>
              <li>You acknowledge that you use the Service at your own risk</li>
            </ul>

            <h2>10. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Blue Tradie, its officers, directors, employees, and agents 
              from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.
            </p>

            <h2>11. Termination</h2>
            <p>
              Either party may terminate this agreement at any time. We may suspend or terminate your account 
              immediately for violations of these Terms. Upon termination, your right to access the Service ceases, 
              but provisions regarding liability, indemnification, and governing law shall survive.
            </p>

            <h2>12. Dispute Resolution</h2>
            <p>
              Any disputes shall first be resolved through good faith negotiations. If unsuccessful, 
              disputes will be resolved through binding arbitration in accordance with Australian Commercial Arbitration Rules, 
              or through appropriate court proceedings if arbitration is not suitable.
            </p>

            <h2>13. Governing Law and Jurisdiction</h2>
            <p>
              These Terms are governed by the laws of Australia. Any legal proceedings shall be conducted 
              in the courts of [State/Territory], Australia. If you are in New Zealand, local consumer protection laws may also apply.
            </p>

            <h2>14. Severability and Entire Agreement</h2>
            <p>
              If any provision of these Terms is found unenforceable, the remaining provisions shall remain in effect. 
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and Blue Tradie.
            </p>

            <h2>15. Contact Information</h2>
            <p>
              For questions about these Terms or the Service, please contact us at:
              <br />
              <strong>Blue Tradie Pty Ltd</strong>
              <br />
              Email: support@bluetradie.com
              <br />
              Website: https://bluetradie.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}