"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import Footer from "@/components/layout/Footer";
import {
  Shield,
  MapPin,
  AlertTriangle,
  CreditCard,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Globe,
  Lock,
  Zap,
  Phone,
  Languages,
  HeartHandshake,
  Users,
  Building2,
  ShieldCheck,
  Fingerprint,
  Radio,
  Clock,
  Map,
  MessageCircle,
  BookOpen,
  FileCheck,
} from "lucide-react";

const features = [
  {
    icon: AlertTriangle,
    title: "Panic Button",
    desc: "One-tap emergency alert sent directly to nearest authorities with your live GPS location. Response teams are dispatched within seconds.",
    color: "bg-danger/10 text-danger",
    borderColor: "hover:border-danger/20",
  },
  {
    icon: MapPin,
    title: "Geofencing",
    desc: "Automatic alerts when tourists enter restricted, high-risk, or unfamiliar zones. Authorities are pre-notified for proactive safety.",
    color: "bg-accent/10 text-accent",
    borderColor: "hover:border-accent/20",
  },
  {
    icon: Globe,
    title: "Real-time Tracking",
    desc: "Live location monitoring for all active tourists within jurisdiction. Authorities maintain a comprehensive safety overview.",
    color: "bg-primary/10 text-primary",
    borderColor: "hover:border-primary/20",
  },
  {
    icon: Fingerprint,
    title: "Blockchain Digital ID",
    desc: "Tamper-proof, verifiable digital identity secured on blockchain. Cannot be forged, duplicated, or altered.",
    color: "bg-purple-100 text-purple-600",
    borderColor: "hover:border-purple-200",
  },
  {
    icon: Radio,
    title: "Anomaly Detection",
    desc: "AI-powered system detects unusual patterns in tourist movement and behavior, triggering early warning alerts.",
    color: "bg-warning/10 text-warning",
    borderColor: "hover:border-warning/20",
  },
  {
    icon: ShieldCheck,
    title: "Verified Identity",
    desc: "QR-code based instant verification for hotels, transport, and checkpoints. Ensures authenticity at every touchpoint.",
    color: "bg-success/10 text-success",
    borderColor: "hover:border-success/20",
  },
];

const steps = [
  { step: "1", title: "Register", desc: "Fill in your details and travel itinerary online", icon: CreditCard },
  { step: "2", title: "Get Digital ID", desc: "Receive a blockchain-secured digital identity instantly", icon: Lock },
  { step: "3", title: "Travel Safely", desc: "Authorities monitor your safety in real-time 24/7", icon: MapPin },
  { step: "4", title: "Emergency Support", desc: "Instant alerts and response when you need it most", icon: Zap },
];

const stats = [
  { value: "10,000+", label: "Tourists Protected" },
  { value: "24/7", label: "Live Monitoring" },
  { value: "500+", label: "Safe Zones Mapped" },
  { value: "<30s", label: "Avg Response Time" },
];

const languages = [
  { name: "English", code: "EN", native: "English" },
  { name: "Hindi", code: "HI", native: "हिन्दी" },
  { name: "Bengali", code: "BN", native: "বাংলা" },
  { name: "Tamil", code: "TA", native: "தமிழ்" },
  { name: "Telugu", code: "TE", native: "తెలుగు" },
  { name: "Marathi", code: "MR", native: "मराठी" },
  { name: "Kannada", code: "KN", native: "ಕನ್ನಡ" },
  { name: "Malayalam", code: "ML", native: "മലയാളം" },
  { name: "Gujarati", code: "GU", native: "ગુજરાતી" },
  { name: "Punjabi", code: "PA", native: "ਪੰਜਾਬੀ" },
  { name: "Odia", code: "OD", native: "ଓଡ଼ିଆ" },
  { name: "Assamese", code: "AS", native: "অসমীয়া" },
];

const emergencyNumbers = [
  { name: "National Emergency", number: "112", icon: Phone, color: "text-danger" },
  { name: "Tourist Helpline", number: "1363", icon: HeartHandshake, color: "text-accent" },
  { name: "Women Helpline", number: "1091", icon: Users, color: "text-purple-500" },
  { name: "Police", number: "100", icon: Shield, color: "text-primary" },
  { name: "Fire Brigade", number: "101", icon: Zap, color: "text-warning" },
  { name: "Ambulance", number: "108", icon: HeartHandshake, color: "text-success" },
];

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-surface via-primary-dark to-surface pt-28 pb-24">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-primary/15 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "8s" }} />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: "6s", animationDelay: "2s" }} />
          <div className="absolute top-1/3 left-0 w-[300px] h-[300px] bg-success/5 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: "10s" }} />
          {/* Grid dots */}
          <div className="absolute inset-0" style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "28px 28px"
          }} />
          {/* Floating elements */}
          <div className="absolute top-20 left-[15%] w-2 h-2 bg-accent/30 rounded-full animate-float" />
          <div className="absolute top-40 right-[20%] w-3 h-3 bg-primary-light/20 rounded-full animate-float" style={{ animationDelay: "1s" }} />
          <div className="absolute bottom-32 left-[25%] w-2 h-2 bg-success/30 rounded-full animate-float" style={{ animationDelay: "3s" }} />
          <div className="absolute top-60 right-[10%] w-1.5 h-1.5 bg-white/10 rounded-full animate-float" style={{ animationDelay: "2s" }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Government Badge */}
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-5 py-2 mb-8 animate-fade-in backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-pulse-ring" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              <span className="text-xs font-medium text-white/80 tracking-wide">Government of India Initiative</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-[1.1] mb-6">
              <span className="animate-fade-in-up">Smart Tourist</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-accent-light to-accent animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
                Safety System
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-white/50 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
              India&apos;s comprehensive platform for tourist safety — powered by
              blockchain-secured digital IDs, AI-driven monitoring, and
              instant emergency response coordination.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
              <Link href="/register">
                <Button variant="accent" size="lg" iconRight={<ArrowRight className="w-5 h-5" />}>
                  Register for Digital ID
                </Button>
              </Link>
              <Link href="/verify">
                <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10 hover:text-white">
                  Verify Existing ID
                </Button>
              </Link>
            </div>
          </div>

          {/* Floating Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className="glass-dark rounded-2xl p-5 text-center hover:bg-white/10 transition-all duration-300 group"
              >
                <p className="text-2xl sm:text-3xl font-bold text-white group-hover:scale-105 transition-transform">{stat.value}</p>
                <p className="text-xs text-white/40 mt-1.5 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About System */}
      <section className="py-20 bg-bg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <AnimateOnScroll animation="fade-in-left">
              <span className="text-xs font-semibold text-accent uppercase tracking-widest">About the System</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-fg mt-2 mb-6">
                Protecting Every Journey Across India
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                The Smart Tourist Safety Monitoring & Incident Response System is a
                first-of-its-kind government platform designed to ensure the safety
                and security of domestic and international tourists visiting India.
              </p>
              <p className="text-muted leading-relaxed mb-6">
                By combining blockchain technology for tamper-proof digital identities,
                AI-powered anomaly detection, and real-time geospatial monitoring,
                the system creates a comprehensive safety net for tourists across all
                states and union territories.
              </p>
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: Building2, label: "Multi-State" },
                  { icon: Lock, label: "Blockchain Secured" },
                  { icon: Zap, label: "Real-time" },
                ].map((tag) => (
                  <span key={tag.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary rounded-full text-xs font-medium border border-primary/10">
                    <tag.icon className="w-3 h-3" />
                    {tag.label}
                  </span>
                ))}
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-in-right" delay={200}>
              <div className="relative">
                <div className="bg-gradient-to-br from-surface to-primary-dark rounded-3xl p-8 text-white overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
                  <div className="relative space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                        <Shield className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <p className="font-semibold">Ministry of Tourism</p>
                        <p className="text-xs text-white/50">Government of India</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: "36", label: "States Covered" },
                        { value: "8", label: "Languages" },
                        { value: "100%", label: "Digital IDs" },
                        { value: "24/7", label: "Support" },
                      ].map((item) => (
                        <div key={item.label} className="bg-white/5 rounded-xl p-3 text-center">
                          <p className="text-lg font-bold text-accent">{item.value}</p>
                          <p className="text-[10px] text-white/40 uppercase tracking-wider">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-surface-light/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <span className="text-xs font-semibold text-accent uppercase tracking-widest">Process</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-fg mt-2">How It Works</h2>
              <p className="text-muted mt-3 max-w-lg mx-auto">Get your blockchain-secured Digital Tourist ID in four simple steps</p>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((item, i) => {
              const Icon = item.icon;
              return (
                <AnimateOnScroll key={item.step} delay={i * 100}>
                  <div className="relative text-center group">
                    {i < steps.length - 1 && (
                      <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-primary/20 to-transparent" />
                    )}
                    <div className="relative w-16 h-16 bg-primary/5 border border-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10 group-hover:border-primary/30 transition-all duration-300 group-hover:shadow-glow group-hover:scale-110">
                      <Icon className="w-7 h-7 text-primary" />
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-accent text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="font-semibold text-fg mb-1">{item.title}</h3>
                    <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
                  </div>
                </AnimateOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* Safety Features */}
      <section className="py-20 bg-bg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <span className="text-xs font-semibold text-accent uppercase tracking-widest">Features</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-fg mt-2">Advanced Safety Features</h2>
              <p className="text-muted mt-3 max-w-lg mx-auto">Powered by AI and blockchain technology for comprehensive tourist protection</p>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <AnimateOnScroll key={feature.title} delay={i * 80}>
                  <div className={`bg-white rounded-2xl border border-border p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group h-full ${feature.borderColor}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${feature.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-fg text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted leading-relaxed">{feature.desc}</p>
                  </div>
                </AnimateOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* Emergency Support */}
      <section className="py-20 bg-gradient-to-br from-danger-dark via-danger to-danger-dark relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <span className="text-xs font-semibold text-white/60 uppercase tracking-widest">Emergency</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2">24/7 Emergency Support</h2>
              <p className="text-white/60 mt-3 max-w-lg mx-auto">
                Help is always just a call away. These emergency numbers are available 24/7 across India.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {emergencyNumbers.map((item, i) => {
              const Icon = item.icon;
              return (
                <AnimateOnScroll key={item.name} delay={i * 80}>
                  <a
                    href={`tel:${item.number}`}
                    className="block bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center hover:bg-white/20 transition-all duration-300 group hover:-translate-y-1 border border-white/10"
                  >
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xl font-bold text-white mb-0.5">{item.number}</p>
                    <p className="text-[10px] text-white/50 uppercase tracking-wider">{item.name}</p>
                  </a>
                </AnimateOnScroll>
              );
            })}
          </div>

          <AnimateOnScroll delay={600}>
            <div className="text-center mt-10">
              <p className="text-white/40 text-sm mb-4">
                In-app panic button provides instant one-tap emergency alert with GPS location
              </p>
              <Link href="/emergency">
                <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10 hover:text-white">
                  View All Emergency Contacts <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Supported Languages */}
      <section className="py-20 bg-bg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <span className="text-xs font-semibold text-accent uppercase tracking-widest">Languages</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-fg mt-2">Supported Languages</h2>
              <p className="text-muted mt-3 max-w-lg mx-auto">
                Access the system in your preferred language. We support major Indian languages for inclusivity.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {languages.map((lang, i) => (
              <AnimateOnScroll key={lang.code} delay={i * 40}>
                <div className="bg-white border border-border rounded-xl p-4 text-center hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
                  <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/10 transition-colors">
                    <Languages className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-fg">{lang.native}</p>
                  <p className="text-[10px] text-muted uppercase tracking-wider mt-0.5">{lang.code}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Government Branding */}
      <section className="py-16 bg-surface-light/5 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-accent to-accent-dark rounded-2xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="font-bold text-fg text-lg">Ministry of Tourism</p>
                  <p className="text-sm text-muted">Government of India</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted">
                <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-success" /> Verified Platform</span>
                <span className="flex items-center gap-2"><Lock className="w-4 h-4 text-primary" /> Data Encrypted</span>
                <span className="flex items-center gap-2"><FileCheck className="w-4 h-4 text-accent" /> compliant</span>
                <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-warning" /> 24/7 Active</span>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary-dark relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <AnimateOnScroll>
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Travel Safely?</h2>
            <p className="text-white/60 mb-8 max-w-lg mx-auto text-lg">
              Register now to get your blockchain-secured Digital Tourist ID and travel across India with confidence.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button variant="accent" size="lg" iconRight={<ArrowRight className="w-5 h-5" />}>
                  Get Your Digital ID
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10 hover:text-white">
                  Learn More
                </Button>
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      <Footer />
    </div>
  );
}
