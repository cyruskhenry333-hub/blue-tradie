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
              <strong>Last updated:</strong> December 2024
            </p>

            <h2>1. Agreement to Terms</h2>
            <p>
              By accessing and using Blue Tradie ("Service"), you accept and agree to be bound by the terms 
              and provision of this agreement.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              Blue Tradie provides a comprehensive business management platform specifically designed for 
              tradespeople in Australia and New Zealand. Our services include:
            </p>
            <ul>
              <li>AI-powered business advisors</li>
              <li>Invoicing and quote management</li>
              <li>Job and client management</li>
              <li>Expense tracking</li>
              <li>Business analytics and reporting</li>
              <li>Tradie directory and networking</li>
            </ul>

            <h2>3. Free Trial and Billing</h2>
            <p>
              We offer a 30-day free trial for new users. After the trial period:
            </p>
            <ul>
              <li>You will be charged the monthly subscription fee unless you cancel before the trial ends</li>
              <li>Billing occurs monthly in advance</li>
              <li>You may cancel your subscription at any time</li>
              <li>No refunds for partial months</li>
            </ul>

            <h2>4. User Responsibilities</h2>
            <p>You agree to:</p>
            <ul>
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Use the service in compliance with all applicable laws</li>
              <li>Not share your account with unauthorized users</li>
              <li>Not use the service for any illegal or unauthorized purpose</li>
            </ul>

            <h2>5. Data and Privacy</h2>
            <p>
              Your privacy is important to us. Please review our Privacy Policy to understand how we 
              collect, use, and protect your information.
            </p>

            <h2>6. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are and will remain the 
              exclusive property of Blue Tradie and its licensors.
            </p>

            <h2>7. Limitation of Liability</h2>
            <p>
              Blue Tradie shall not be liable for any indirect, incidental, special, consequential, or 
              punitive damages resulting from your use of the service.
            </p>

            <h2>8. Termination</h2>
            <p>
              We may terminate or suspend your account immediately, without prior notice or liability, 
              for any reason whatsoever, including breach of these Terms.
            </p>

            <h2>9. Changes to Terms</h2>
            <p>
              We reserve the right to modify or replace these Terms at any time. We will provide notice 
              of significant changes via email or through the Service.
            </p>

            <h2>10. Contact Information</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
              <br />
              Email: support@bluetradie.com
            </p>

            <h2>11. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of Australia, 
              without regard to its conflict of law provisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}