import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Building2, 
  Users, 
  Shield, 
  Zap, 
  ArrowRight,
  CheckCircle2,
  Wallet
} from "lucide-react";

const features = [
  {
    icon: Building2,
    title: "Organisation Management",
    description: "Create and manage multiple organisations with subscription-based access control."
  },
  {
    icon: Users,
    title: "Student Registration",
    description: "Register students with RFID card IDs for seamless attendance tracking."
  },
  {
    icon: Shield,
    title: "Blockchain Security",
    description: "All records are immutably stored on the Sui blockchain for transparency."
  },
  {
    icon: Zap,
    title: "Real-time Tracking",
    description: "Instant attendance recording with ESP32-powered RFID readers."
  }
];

const benefits = [
  "Immutable attendance records",
  "Decentralized data storage",
  "RFID-based check-in",
  "Real-time analytics",
  "Multi-organisation support",
  "Subscription management"
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-foreground">SuiAttend</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#benefits" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Benefits</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Docs</a>
            </div>
            
            <Button asChild>
              <Link to="/dashboard">
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              Built on Sui Blockchain
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
              Blockchain-Powered{" "}
              <span className="text-primary">Attendance</span>{" "}
              Management
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              A decentralized attendance system using ESP32 RFID readers and Sui blockchain. 
              Secure, transparent, and tamper-proof record keeping for institutions.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link to="/dashboard">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                <a href="#">View Documentation</a>
              </Button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { value: "100+", label: "Organisations" },
              { value: "50K+", label: "Students" },
              { value: "1M+", label: "Records" },
              { value: "99.9%", label: "Uptime" }
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-muted/50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything you need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete solution for managing attendance with blockchain technology
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border bg-card hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Why choose SuiAttend?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Leverage the power of blockchain technology for transparent, 
                secure, and efficient attendance management.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-border p-8 flex items-center justify-center">
                <div className="text-center">
                  <Shield className="h-24 w-24 text-primary mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground">Secured by Sui</p>
                  <p className="text-sm text-muted-foreground">Blockchain Technology</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to get started?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8">
            Connect your wallet and create your first organisation today.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/dashboard">
              Launch Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">SuiAttend</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Documentation</a>
              <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
              <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © 2024 SuiAttend. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
