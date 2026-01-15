import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
      
      <div className="container mx-auto px-6 pt-24 pb-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-8 animate-fade-in">
            <div className="inline-block">
              <span className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
                Academic Project
              </span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
              Tech Event{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Registration System
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl">
              Simple platform for participants to register, create teams, and join tech competitions.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-delay">
              <Button variant="hero" size="lg" asChild>
                <Link to="/register">Register Now</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/competitions">View Competitions</Link>
              </Button>
            </div>
            
            <div className="flex items-center gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold text-foreground">Easy</div>
                <div className="text-sm text-muted-foreground">Registration</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <div className="text-3xl font-bold text-foreground">Fast</div>
                <div className="text-sm text-muted-foreground">Team Creation</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <div className="text-3xl font-bold text-foreground">Simple</div>
                <div className="text-sm text-muted-foreground">Management</div>
              </div>
            </div>
          </div>
          
          {/* Right content - Hero image */}
          <div className="relative animate-fade-in-delay">
            <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-full" />
            <img
              src={heroImage}
              alt="Event management dashboard interface"
              className="relative rounded-2xl shadow-2xl border border-border/50"
            />
          </div>
        </div>
      </div>
      
      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
