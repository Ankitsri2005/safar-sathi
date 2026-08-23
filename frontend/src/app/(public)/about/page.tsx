"use client";

import Link from "next/link";
import Footer from "@/components/layout/Footer";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import { Button } from "@/components/ui/Button";
import {
  Shield,
  Users,
  Globe,
  Lock,
  MapPin,
  Zap,
  Building2,
  ArrowRight,
  Fingerprint,
  Radio,
  CheckCircle,
  Target,
} from "lucide-react";

const systemFeatures = [
  { icon: Fingerprint, title: "Blockchain Digital ID", desc: "Every tourist receives a tamper-proof digital identity stored on a distributed blockchain ledger. This ID cannot be forged, duplicated, or altered, providing instant verification at checkpoints, hotels, and transport hubs." },
  { icon: Radio, title: "AI Anomaly Detection", desc: "Machine learning algorithms continuously analyze tourist movement patterns to detect anomalies — sudden deviations from planned routes, prolonged inactivity in remote areas, or unusual clustering patterns that may indicate distress." },
  { icon: MapPin, title: "Real-time Geospatial Monitoring", desc: "GPS-enabled tracking provides authorities with live dashboards showing active tourist locations, density heatmaps, and zone-based risk assessments across all monitored regions." },
  { icon: Zap, title: "Instant Emergency Response", desc: "The one-tap panic button triggers an immediate alert to the nearest police station, tourism help center, and emergency services — all within 30 seconds of activation." },
  { icon: Shield, title: "Geofencing & Zone Alerts", desc: "Authorities can define safe zones, restricted areas, and high-risk regions. Tourists receive automatic warnings when entering potentially dangerous areas, and authorities are proactively notified." },
  { icon: Globe, title: "Multi-Language Support", desc: "Available in 12+ Indian languages to ensure accessibility for tourists from all regions. The system automatically detects preferred language settings." },
];

const milestones = [
  { year: "2024", event: "National Smart Tourist Safety & Incident Response initiative conceived" },
  { year: "2025", event: "Prototype developed with blockchain identity verification" },
  { year: "2025", event: "Pilot launch in Sikkim & Goa tourist regions" },
  { year: "2026", event: "Expansion to 36 states and union territories" },
  { year: "2026", event: "Integration with national police and tourism databases" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-surface via-primary-dark to-surface pt-28 pb-20">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/15 rounded-full blur-[100px]" />
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <AnimateOnScroll>
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6">
              <Building2 className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-medium text-white/70">Ministry of Tourism, Government of India</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">About the System</h1>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">
              India&apos;s first comprehensive platform for tourist safety, combining
              blockchain technology with real-time monitoring and AI-powered intelligence.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-bg">
        <div className="max-w-5xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <span className="text-xs font-semibold text-accent uppercase tracking-widest">Our Mission</span>
              <h2 className="text-3xl font-bold text-fg mt-2 mb-4">Making India the Safest Tourist Destination</h2>
              <p className="text-muted max-w-2xl mx-auto leading-relaxed">
                The Smart Tourist Safety Monitoring & Incident Response System was created
                with a singular vision: to ensure every tourist visiting India feels safe,
                supported, and protected throughout their journey. By leveraging cutting-edge
                technology, we aim to make India the world&apos;s most tourist-friendly destination.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              { icon: Target, title: "Zero Tolerance for Incidents", desc: "Proactive monitoring to prevent incidents before they occur." },
              { icon: Users, title: "Inclusive for All", desc: "Supporting domestic and international tourists across all languages and regions." },
              { icon: Lock, title: "Privacy First", desc: "Data encrypted end-to-end with strict access controls and GDPR compliance." },
            ].map((item, i) => (
              <AnimateOnScroll key={item.title} delay={i * 100}>
                <div className="bg-white rounded-2xl border border-border p-6 text-center hover:shadow-lg transition-all duration-300 h-full">
                  <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-fg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted">{item.desc}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Detail */}
      <section className="py-20 bg-surface-light/5">
        <div className="max-w-5xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <span className="text-xs font-semibold text-accent uppercase tracking-widest">Technology</span>
              <h2 className="text-3xl font-bold text-fg mt-2">How It Works Under the Hood</h2>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-2 gap-6">
            {systemFeatures.map((feat, i) => (
              <AnimateOnScroll key={feat.title} delay={i * 80}>
                <div className="bg-white rounded-2xl border border-border p-6 hover:shadow-lg transition-all duration-300 group h-full">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                      <feat.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-fg mb-1">{feat.title}</h3>
                      <p className="text-sm text-muted leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-bg">
        <div className="max-w-3xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <span className="text-xs font-semibold text-accent uppercase tracking-widest">Journey</span>
              <h2 className="text-3xl font-bold text-fg mt-2">Our Milestones</h2>
            </div>
          </AnimateOnScroll>

          <div className="relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-border" />
            {milestones.map((m, i) => (
              <AnimateOnScroll key={i} delay={i * 100} animation={i % 2 === 0 ? "fade-in-left" : "fade-in-right"}>
                <div className={`relative flex items-center gap-6 mb-8 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
                  <div className="hidden md:block md:w-1/2" />
                  <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-3 h-3 bg-accent rounded-full border-2 border-white shadow-md z-10" />
                  <div className="ml-12 md:ml-0 md:w-1/2 bg-white rounded-xl border border-border p-4 hover:shadow-md transition-all">
                    <span className="text-xs font-bold text-accent uppercase">{m.year}</span>
                    <p className="text-sm text-fg mt-1">{m.event}</p>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-primary to-primary-dark">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <AnimateOnScroll>
            <h2 className="text-3xl font-bold text-white mb-4">Join the Safety Revolution</h2>
            <p className="text-white/60 mb-8 max-w-md mx-auto">
              Register today and become part of India&apos;s safest tourism network.
            </p>
            <Link href="/register">
              <Button variant="accent" size="lg" iconRight={<ArrowRight className="w-5 h-5" />}>
                Get Your Digital ID
              </Button>
            </Link>
          </AnimateOnScroll>
        </div>
      </section>

      <Footer />
    </div>
  );
}
