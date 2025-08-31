import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Star, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function TestimonialPage() {
  const [rating, setRating] = useState(5);
  const [testimonialText, setTestimonialText] = useState("");
  const [permissions, setPermissions] = useState({
    canPublish: false,
    canUseNameAndBusiness: false,
    canUseInMarketing: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Get rating from URL params if provided
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlRating = urlParams.get('rating');
    if (urlRating && !isNaN(Number(urlRating))) {
      setRating(Number(urlRating));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/testimonial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          testimonialText,
          permissions
        })
      });

      if (response.ok) {
        setIsSubmitted(true);
        toast({
          title: "Thank you for your feedback!",
          description: "Your testimonial helps us improve Blue Tradie for all tradies.",
          variant: "default"
        });
      } else {
        throw new Error('Failed to submit testimonial');
      }
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "Please try again or contact support",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (interactive = false) => {
    return (
      <div className="flex gap-1 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-8 w-8 cursor-pointer ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
            onClick={interactive ? () => setRating(star) : undefined}
          />
        ))}
      </div>
    );
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Thank you!
            </h2>
            <p className="text-gray-600 mb-6">
              Your feedback helps us build a better Blue Tradie for all tradies. We really appreciate you taking the time to share your experience.
            </p>
            <Button onClick={() => setLocation('/dashboard')} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                How's your Blue Tradie experience?
              </CardTitle>
              <p className="text-center text-gray-600">
                Hey {user?.firstName || 'mate'}! Your feedback as a beta user is incredibly valuable to us.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Star Rating */}
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Rate your overall experience
                  </label>
                  {renderStars(true)}
                  <p className="text-sm text-gray-500 mt-2">
                    {rating === 5 && "Excellent! 🎉"}
                    {rating === 4 && "Great! 👍"}
                    {rating === 3 && "Good 👌"}
                    {rating === 2 && "Fair 😐"}
                    {rating === 1 && "Needs improvement 😕"}
                  </p>
                </div>

                {/* Testimonial Text */}
                <div>
                  <label htmlFor="testimonial" className="block text-sm font-medium text-gray-700 mb-2">
                    Tell us about your experience
                  </label>
                  <Textarea
                    id="testimonial"
                    value={testimonialText}
                    onChange={(e) => setTestimonialText(e.target.value)}
                    placeholder="How has Blue Tradie helped your business? What features do you find most valuable? What would you tell other tradies?"
                    rows={5}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    The more specific, the better! Other tradies love hearing real examples.
                  </p>
                </div>

                {/* Permissions */}
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-gray-900">Sharing Preferences</h3>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canPublish"
                      checked={permissions.canPublish}
                      onCheckedChange={(checked) => 
                        setPermissions(prev => ({ ...prev, canPublish: !!checked }))
                      }
                    />
                    <label htmlFor="canPublish" className="text-sm text-gray-700">
                      You can publish my testimonial on your website
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canUseNameAndBusiness"
                      checked={permissions.canUseNameAndBusiness}
                      onCheckedChange={(checked) => 
                        setPermissions(prev => ({ ...prev, canUseNameAndBusiness: !!checked }))
                      }
                    />
                    <label htmlFor="canUseNameAndBusiness" className="text-sm text-gray-700">
                      You can use my name and business name with my testimonial
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canUseInMarketing"
                      checked={permissions.canUseInMarketing}
                      onCheckedChange={(checked) => 
                        setPermissions(prev => ({ ...prev, canUseInMarketing: !!checked }))
                      }
                    />
                    <label htmlFor="canUseInMarketing" className="text-sm text-gray-700">
                      You can use my testimonial in marketing materials (ads, social media, etc.)
                    </label>
                  </div>

                  <p className="text-xs text-gray-500">
                    Your testimonial helps other tradies discover Blue Tradie. We'll never share your contact details.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting || !testimonialText.trim()}
                  className="w-full"
                >
                  {isSubmitting ? "Submitting..." : "Submit Testimonial"}
                </Button>
              </form>

              {rating >= 4 && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">🌟 Love Blue Tradie?</h3>
                  <p className="text-sm text-yellow-700">
                    If you're happy with Blue Tradie, would you mind leaving us a review? It really helps other tradies find us!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}