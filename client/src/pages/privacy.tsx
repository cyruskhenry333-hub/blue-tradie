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
              <strong>Last updated:</strong> January 2025
            </p>

            <h2>1. Introduction and Scope</h2>
            <p>
              Blue Tradie Pty Ltd (ABN: [To be inserted]) ("we", "us", "our") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you use our Service. 
              This policy applies to all users of our platform in Australia and New Zealand and complies with the 
              Australian Privacy Principles (APP) under the Privacy Act 1988 (Cth) and the New Zealand Privacy Act 2020.
            </p>

            <h2>2. Information We Collect</h2>
            <p><strong>Personal Information we collect includes:</strong></p>
            <ul>
              <li><strong>Account Information:</strong> Name, email address, phone number, business name, trade type, service area, country, GST registration status</li>
              <li><strong>Business Data:</strong> Jobs, clients, invoices, quotes, expenses, photos, documents, and other business records you create</li>
              <li><strong>Payment Information:</strong> Billing address and payment method details (securely processed by Stripe - we do not store card details)</li>
              <li><strong>Usage Data:</strong> IP address, browser type, device information, pages visited, features used, session duration</li>
              <li><strong>Communication Data:</strong> Messages sent through our platform, support tickets, feedback</li>
              <li><strong>Location Data:</strong> General location for service area matching (with your consent)</li>
            </ul>

            <h2>3. How We Collect Information</h2>
            <p>We collect information when you:</p>
            <ul>
              <li>Register for an account and complete your profile</li>
              <li>Use our services and features</li>
              <li>Contact us for support or feedback</li>
              <li>Interact with our website and mobile applications</li>
              <li>Participate in surveys or promotional activities</li>
            </ul>

            <h2>4. How We Use Your Information</h2>
            <p>We use your personal information for the following purposes:</p>
            <ul>
              <li><strong>Service Provision:</strong> To provide, maintain, and improve our services</li>
              <li><strong>Account Management:</strong> To create and manage your account and subscription</li>
              <li><strong>Payment Processing:</strong> To process payments and send billing information</li>
              <li><strong>Communication:</strong> To send service updates, support responses, and important notices</li>
              <li><strong>AI Features:</strong> To provide personalized business insights and recommendations</li>
              <li><strong>Security:</strong> To protect against fraud and unauthorized access</li>
              <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
              <li><strong>Service Improvement:</strong> To analyze usage patterns and improve functionality</li>
            </ul>

            <h2>5. Information Sharing and Disclosure</h2>
            <p>We do not sell your personal information. We may share information in these limited circumstances:</p>
            <ul>
              <li><strong>Service Providers:</strong> With trusted third parties who assist in operating our service (e.g., Stripe for payments, email providers)</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets (with prior notice)</li>
              <li><strong>Protection of Rights:</strong> To protect our rights, property, or safety, or that of our users</li>
              <li><strong>With Consent:</strong> When you explicitly agree to share information</li>
              <li><strong>Aggregated Data:</strong> Anonymous, aggregated data that cannot identify individuals</li>
            </ul>

            <h2>6. Data Security and Protection</h2>
            <p>We implement comprehensive security measures including:</p>
            <ul>
              <li>TLS/SSL encryption for data transmission</li>
              <li>Encrypted data storage with access controls</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Employee background checks and confidentiality agreements</li>
              <li>Multi-factor authentication for administrative access</li>
              <li>Incident response procedures for security breaches</li>
            </ul>

            <h2>7. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to provide services and comply with legal obligations. 
              Specifically:
            </p>
            <ul>
              <li><strong>Active Accounts:</strong> Throughout your subscription period</li>
              <li><strong>Closed Accounts:</strong> Up to 7 years for tax and business records (as required by Australian law)</li>
              <li><strong>Marketing Data:</strong> Until you opt out or we determine it's no longer needed</li>
              <li><strong>Legal Retention:</strong> As required by applicable laws and regulations</li>
            </ul>

            <h2>8. Your Privacy Rights</h2>
            <p>Under Australian and New Zealand privacy laws, you have the right to:</p>
            <ul>
              <li><strong>Access:</strong> Request access to your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your data (subject to legal retention requirements)</li>
              <li><strong>Portability:</strong> Export your data in a commonly used format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Complaint:</strong> Lodge a complaint with us or relevant privacy authorities</li>
            </ul>

            <h2>9. Cookies and Tracking Technologies</h2>
            <p>
              We use cookies and similar technologies for:
            </p>
            <ul>
              <li>Essential functionality (login sessions, security)</li>
              <li>Performance analytics (usage statistics, error tracking)</li>
              <li>Preference storage (settings, customizations)</li>
              <li>Marketing optimization (conversion tracking)</li>
            </ul>
            <p>You can manage cookie preferences through your browser settings.</p>

            <h2>10. International Data Transfers</h2>
            <p>
              Your information may be processed on servers located outside Australia/New Zealand. 
              We ensure appropriate safeguards through:
            </p>
            <ul>
              <li>Standard contractual clauses with service providers</li>
              <li>Adequacy decisions for countries with equivalent privacy protections</li>
              <li>Regular reviews of international transfer arrangements</li>
            </ul>

            <h2>11. Third-Party Services</h2>
            <p>Our service integrates with third-party providers:</p>
            <ul>
              <li><strong>Stripe:</strong> Payment processing (subject to Stripe's privacy policy)</li>
              <li><strong>Email Services:</strong> Transactional and marketing emails</li>
              <li><strong>Analytics Tools:</strong> Service performance and usage analysis</li>
            </ul>

            <h2>12. Children's Privacy</h2>
            <p>
              Our service is not intended for individuals under 18 years of age. We do not knowingly collect 
              personal information from children. If we become aware of such collection, we will take steps to delete it promptly.
            </p>

            <h2>13. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy to reflect changes in our practices or applicable law. 
              Material changes will be communicated via email or prominent notice on our service at least 30 days before taking effect.
            </p>

            <h2>14. Privacy Complaints and Contact</h2>
            <p>
              For privacy-related questions, requests, or complaints, please contact us at:
              <br />
              <strong>Blue Tradie Pty Ltd</strong>
              <br />
              <strong>Privacy Officer</strong>
              <br />
              Email: support@bluetradie.com
              <br />
              Website: https://bluetradie.com
            </p>
            <p>
              If you are not satisfied with our response, you may lodge a complaint with:
              <br />
              <strong>Australia:</strong> Office of the Australian Information Commissioner (OAIC) - www.oaic.gov.au
              <br />
              <strong>New Zealand:</strong> Office of the Privacy Commissioner - www.privacy.org.nz
            </p>

            <h2>15. Governing Law</h2>
            <p>
              This Privacy Policy is governed by Australian law. For New Zealand users, local privacy laws may also apply 
              where they provide greater protection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}