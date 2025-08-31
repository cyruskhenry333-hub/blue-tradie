import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import type { Testimonial } from "@shared/schema";

interface TestimonialsSectionProps {
  limit?: number;
  showHeader?: boolean;
}

export function TestimonialsSection({ limit = 6, showHeader = true }: TestimonialsSectionProps) {
  const { data: testimonials = [] } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials/public"],
  });

  const displayTestimonials = limit ? testimonials.slice(0, limit) : testimonials;

  if (displayTestimonials.length === 0) {
    return null;
  }

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  const getCountryFlag = (country: string) => {
    switch (country) {
      case "Australia":
        return "🇦🇺";
      case "New Zealand":
        return "🇳🇿";
      default:
        return "🌟";
    }
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        {showHeader && (
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Tradies Are Saying
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real feedback from Australian and New Zealand tradies using Blue Tradie
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayTestimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow"
            >
              {/* Rating */}
              <div className="flex items-center space-x-1 mb-4">
                {renderStars(testimonial.rating)}
                <span className="text-sm text-gray-500 ml-2">
                  {getCountryFlag(testimonial.country)} {testimonial.country}
                </span>
              </div>

              {/* Content */}
              <blockquote className="text-gray-700 mb-4 italic">
                "{testimonial.content}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center space-x-3">
                {testimonial.profilePhoto ? (
                  <img
                    src={testimonial.profilePhoto}
                    alt={testimonial.name || "User"}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-tradie-blue text-white flex items-center justify-center font-semibold">
                    {testimonial.name ? testimonial.name.charAt(0).toUpperCase() : "T"}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">
                    {testimonial.name || "Blue Tradie User"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(testimonial.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}