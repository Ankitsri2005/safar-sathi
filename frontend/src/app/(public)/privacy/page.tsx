"use client";

import Footer from "@/components/layout/Footer";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import { Shield, Lock, Eye, Database, Users, FileCheck, AlertCircle } from "lucide-react";

const sections = [
  {
    title: "Information We Collect",
    icon: Database,
    content: [
      "Personal identification details (name, phone number, email, ID type and number) during registration.",
      "Travel itinerary including destinations, dates, and accommodation details.",
      "GPS location data while the Digital Tourist ID is active for safety monitoring.",
      "Emergency contact information provided during registration.",
      "Device information necessary for app functionality and security.",
    ],
  },
  {
    title: "How We Use Your Information",
    icon: Eye,
    content: [
      "To generate and manage your blockchain-secured Digital Tourist ID.",
      "To provide real-time safety monitoring and emergency response coordination.",
      "To alert authorities and emergency contacts in case of safety incidents.",
      "To analyze anonymized tourism patterns for improving safety infrastructure.",
      "To communicate important safety alerts and updates relevant to your travel area.",
      "To comply with legal obligations and government regulations.",
    ],
  },
  {
    title: "Data Storage & Security",
    icon: Lock,
    content: [
      "All personal data is encrypted using AES-256 encryption at rest and TLS 1.3 in transit.",
      "Blockchain-secured identity data is stored on a distributed ledger, making it tamper-proof.",
      "Location data is stored in encrypted form and automatically purged after 90 days.",
      "Access to your data is strictly limited to authorized safety personnel on a need-to-know basis.",
      "Regular security audits are conducted by independent cybersecurity firms.",
    ],
  },
  {
    title: "Data Sharing",
    icon: Users,
    content: [
      "Location data is shared with authorized police and tourism officials only during active safety monitoring.",
      "Emergency contact information is shared only when an emergency alert is triggered.",
      "Anonymized, aggregated data may be shared with research institutions for tourism safety studies.",
      "We do NOT sell, rent, or share personal data with third-party commercial entities.",
      "Data may be disclosed if required by law, court order, or government regulation.",
    ],
  },
  {
    title: "Your Rights",
    icon: FileCheck,
    content: [
      "Right to access all personal data we hold about you at any time.",
      "Right to request correction of inaccurate or incomplete personal data.",
      "Right to request deletion of your account and associated personal data.",
      "Right to opt out of non-essential data collection while maintaining core services.",
      "Right to data portability — receive your data in a structured, machine-readable format.",
      "Right to file a complaint with the Data Protection Authority if you believe your rights have been violated.",
    ],
  },
  {
    title: "Data Retention",
    icon: AlertCircle,
    content: [
      "Active account data is retained for the duration of your registration period.",
      "Location monitoring data is automatically deleted after 90 days.",
      "Emergency incident records are retained for 5 years as required by law.",
      "Blockchain identity records are permanently maintained on the distributed ledger for verification purposes.",
      "Upon account deletion, all personal data is permanently removed within 30 days, except blockchain records.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-surface via-primary-dark to-surface pt-28 pb-16">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <AnimateOnScroll>
            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-primary-light" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Privacy Policy</h1>
            <p className="text-lg text-white/50 max-w-xl mx-auto">
              Your privacy is our priority. Learn how we collect, use, and protect your data.
            </p>
            <p className="text-xs text-white/30 mt-4">Last updated: August 2026</p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-bg">
        <div className="max-w-4xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="bg-primary-50 border border-primary/10 rounded-2xl p-6 mb-12">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-fg mb-1">Our Commitment</h3>
                  <p className="text-sm text-muted leading-relaxed">
                    The Smart Tourist Safety Monitoring & Incident Response System is committed to
                    protecting the privacy and security of all users. This policy outlines our practices
                    regarding data collection, usage, and protection in compliance with the Information
                    Technology Act, 2000 and the Digital Personal Data Protection Act, 2023.
                  </p>
                </div>
              </div>
            </div>
          </AnimateOnScroll>

          <div className="space-y-8">
            {sections.map((section, i) => (
              <AnimateOnScroll key={section.title} delay={i * 80}>
                <div className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center">
                      <section.icon className="w-4 h-4 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold text-fg">{section.title}</h2>
                  </div>
                  <div className="p-6">
                    <ul className="space-y-3">
                      {section.content.map((item, j) => (
                        <li key={j} className="flex items-start gap-3 text-sm text-muted leading-relaxed">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full shrink-0 mt-2" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
