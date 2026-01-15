import { Calendar, Users, Users2, Clock, Database, Settings } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Calendar,
    title: "Competition Management",
    description: "Manage event details, rules, and descriptions.",
  },
  {
    icon: Users,
    title: "Participant Registration",
    description: "Simple user signup and login.",
  },
  {
    icon: Users2,
    title: "Team Creation",
    description: "Participants can form teams and join competitions.",
  },
  {
    icon: Clock,
    title: "Event Scheduling",
    description: "View start time, end time, and room details.",
  },
  {
    icon: Database,
    title: "Clean Database Design",
    description: "Fast and reliable database operations.",
  },
  {
    icon: Settings,
    title: "Admin Control Panel",
    description: "Basic CRUD operations for all records.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Simple & Efficient{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Event Management
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Everything you need for tech event registration and team management.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="p-6 bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glow group animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-card-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
