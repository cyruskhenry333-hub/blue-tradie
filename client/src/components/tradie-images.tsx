// Stock photo components for tradie imagery throughout the platform
import { cn } from "@/lib/utils";

interface TradieImageProps {
  className?: string;
  alt: string;
  variant: 'hero' | 'welcome' | 'empty-state' | 'testimonial' | 'success';
}

export function TradieImage({ className, alt, variant }: TradieImageProps) {
  // Using high-quality professional tradie stock photos
  const imageMap = {
    hero: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2076&q=80",
    welcome: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    'empty-state': "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    testimonial: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2041&q=80",
    success: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
  };

  return (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      <img
        src={imageMap[variant]}
        alt={alt}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      {variant === 'hero' && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/60 to-blue-800/40" />
      )}
    </div>
  );
}

// Specific component variants for common use cases
export function HeroTradieImage({ className }: { className?: string }) {
  return (
    <TradieImage
      variant="hero"
      alt="Professional tradie working on construction site"
      className={className}
    />
  );
}

export function WelcomeTradieImage({ className }: { className?: string }) {
  return (
    <TradieImage
      variant="welcome"
      alt="Tradie using tablet for business management"
      className={className}
    />
  );
}

export function EmptyStateTradieImage({ className }: { className?: string }) {
  return (
    <TradieImage
      variant="empty-state"
      alt="Tradie with clipboard ready to start work"
      className={className}
    />
  );
}

export function TestimonialTradieImage({ className }: { className?: string }) {
  return (
    <TradieImage
      variant="testimonial"
      alt="Satisfied tradie customer testimonial"
      className={className}
    />
  );
}

export function SuccessTradieImage({ className }: { className?: string }) {
  return (
    <TradieImage
      variant="success"
      alt="Successful tradie celebrating completion"
      className={className}
    />
  );
}