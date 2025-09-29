import { ArrowLeft, Search, BookOpen, CreditCard, Settings, Users, FileText, Mail } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");

  const helpCategories = [
    {
      icon: BookOpen,
      title: "Getting Started",
      description: "Learn the basics of Blue Tradie",
      articles: [
        "Setting up your account",
        "Completing your business profile", 
        "Your first invoice",
        "Understanding the dashboard",
        "Mobile app basics"
      ]
    },
    {
      icon: FileText,
      title: "Invoicing & Quotes",
      description: "Create professional invoices and quotes",
      articles: [
        "Creating your first invoice",
        "Setting up GST rates",
        "Quote templates and customization",
        "Payment tracking",
        "Automated reminders"
      ]
    },
    {
      icon: CreditCard,
      title: "Billing & Subscriptions",
      description: "Manage your Blue Tradie subscription",
      articles: [
        "Understanding your free trial",
        "Upgrading or downgrading plans",
        "Payment methods and billing",
        "Canceling your subscription",
        "Refund policy"
      ]
    },
    {
      icon: Settings,
      title: "Account Settings",
      description: "Customize your account and preferences",
      articles: [
        "Updating business information",
        "Managing notification preferences",
        "Security and password settings",
        "Data export and backup",
        "Account deletion"
      ]
    },
    {
      icon: Users,
      title: "Team Management",
      description: "Add and manage team members",
      articles: [
        "Inviting team members",
        "Setting user permissions",
        "Team billing and limits",
        "Removing team members",
        "Team collaboration features"
      ]
    }
  ];

  const popularArticles = [
    "How do I cancel my subscription?",
    "Setting up GST on invoices",
    "How to export my data",
    "Adding team members to my account",
    "Troubleshooting payment issues",
    "Customizing invoice templates"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Help Center</h1>
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Homepage
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">How can we help you?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Find answers to common questions, learn how to use Blue Tradie features, and get the most out of your account.
          </p>
          
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Quick Actions */}
        <div className="max-w-md mx-auto mb-8">
          <Link href="/contact">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Mail className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Contact Support</h3>
                <p className="text-sm text-gray-600">Get help from our team - usually respond within 24 hours</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Common Questions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Common Questions</CardTitle>
            <p className="text-gray-600">For detailed help with these topics, please contact our support team.</p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {popularArticles.map((article, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <BookOpen className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{article}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Help Categories */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {helpCategories.map((category, index) => {
            const IconComponent = category.icon;
            return (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-6 w-6 text-blue-600" />
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                  </div>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">Common topics we can help with:</p>
                  <ul className="space-y-2">
                    {category.articles.map((article, articleIndex) => (
                      <li key={articleIndex} className="text-sm text-gray-700 flex items-center gap-2">
                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                        {article}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4">
                    <Link href="/contact">
                      <Button variant="outline" size="sm" className="w-full">
                        Get Help with This
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Still Need Help */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Still need help?</h3>
            <p className="text-gray-600 mb-4">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/contact">
                <Button>
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </Link>
              <a href="mailto:support@bluetradie.com">
                <Button variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Support
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}