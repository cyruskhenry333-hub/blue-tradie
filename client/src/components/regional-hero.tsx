// Regional Hero Component for culturally authentic representation
import { useRegionalAssets, getRegionalWelcomeMessage } from "@/utils/regional-assets";
import { useAuth } from "@/hooks/useAuth";

interface RegionalHeroProps {
  className?: string;
  showWelcomeMessage?: boolean;
}

export function RegionalHero({ className, showWelcomeMessage = true }: RegionalHeroProps) {
  const { user } = useAuth();
  const assets = useRegionalAssets();
  
  return (
    <div className={`relative ${className}`}>
      {/* Hero Image */}
      <div className="aspect-[4/5] md:aspect-[3/4] lg:aspect-[2/3] relative overflow-hidden rounded-lg">
        <img
          src={assets.hero.model}
          alt={assets.hero.alt}
          className="w-full h-full object-cover object-center"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>
      
      {/* Welcome Message Overlay */}
      {showWelcomeMessage && (
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <p className="text-lg font-semibold drop-shadow-lg">
            {getRegionalWelcomeMessage(user?.country || undefined)}
          </p>
        </div>
      )}
    </div>
  );
}

// Compact version for dashboard/sidebar use
export function RegionalHeroCompact({ className }: { className?: string }) {
  const assets = useRegionalAssets();
  
  return (
    <div className={`relative ${className}`}>
      <div className="aspect-[1/1] relative overflow-hidden rounded-full">
        <img
          src={assets.hero.model}
          alt={assets.hero.alt}
          className="w-full h-full object-cover object-center"
          loading="lazy"
        />
      </div>
    </div>
  );
}