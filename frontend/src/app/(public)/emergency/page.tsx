"use client";

import { useState } from "react";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import { Button } from "@/components/ui/Button";
import { SosVoiceRecorderModal } from "@/components/emergency/SosVoiceRecorderModal";
import {
  Phone,
  Shield,
  HeartHandshake,
  Users,
  Zap,
  MapPin,
  Building2,
  ArrowRight,
  Clock,
  Globe,
  Landmark,
} from "lucide-react";

const primaryNumbers = [
  { name: "National Emergency Number", number: "112", desc: "Unified emergency number for Police, Fire, and Ambulance across India", icon: Shield, color: "bg-danger/10 text-danger", available: "24/7" },
  { name: "Tourist Helpline", number: "1363", desc: "Dedicated tourist assistance — multilingual support available", icon: HeartHandshake, color: "bg-accent/10 text-accent", available: "24/7" },
  { name: "Women Helpline", number: "1091", desc: "Dedicated support for women in distress or emergency situations", icon: Users, color: "bg-purple-100 text-purple-600", available: "24/7" },
];

const emergencyServices = [
  { name: "Police", number: "100", icon: Shield, color: "text-primary" },
  { name: "Fire Brigade", number: "101", icon: Zap, color: "text-warning" },
  { name: "Ambulance", number: "108", icon: HeartHandshake, color: "text-success" },
  { name: "Disaster Management", number: "108", icon: Building2, color: "text-danger" },
  { name: "Road Accident Emergency", number: "1073", icon: MapPin, color: "text-accent" },
  { name: "Anti-Poison Helpline", number: "1066", icon: Shield, color: "text-purple-500" },
  { name: "Child Helpline", number: "1098", icon: HeartHandshake, color: "text-pink-500" },
  { name: "Senior Citizen Helpline", number: "14567", icon: Users, color: "text-primary-light" },
];

const stateTourism = [
  { state: "Sikkim", number: "+91-3592-202326" },
  { state: "Goa", number: "+91-832-2438791" },
  { state: "Kerala", number: "+91-471-2560571" },
  { state: "Rajasthan", number: "+91-141-5110571" },
  { state: "Himachal Pradesh", number: "+91-177-2625252" },
  { state: "Uttarakhand", number: "+91-135-2609750" },
];

export default function EmergencyPage() {
  const { t } = useLanguage();
  const [showSosModal, setShowSosModal] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-danger-dark via-danger to-danger-dark pt-28 pb-20">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-[100px]" />
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <AnimateOnScroll>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-pulse-ring" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              <span className="text-xs font-medium text-white/90">Available 24/7 Across India</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">{t("sos_title")}</h1>
            <p className="text-lg text-white/60 max-w-xl mx-auto mb-8">
              {t("sos_subtitle")}
            </p>

            <Button
              variant="accent"
              size="lg"
              className="py-4 px-8 text-lg font-bold shadow-2xl hover:scale-105 transition-transform"
              onClick={() => setShowSosModal(true)}
            >
              🚨 Press for 10s Voice SOS Alert
            </Button>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Primary Numbers */}
      <section className="py-20 bg-bg">
        <div className="max-w-5xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <span className="text-xs font-semibold text-danger uppercase tracking-widest">Critical Numbers</span>
              <h2 className="text-3xl font-bold text-fg mt-2">Primary Emergency Numbers</h2>
            </div>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-3 gap-6">
            {primaryNumbers.map((item, i) => {
              const Icon = item.icon;
              return (
                <AnimateOnScroll key={item.name} delay={i * 100}>
                  <a href={`tel:${item.number}`} className="block bg-white rounded-2xl border border-border p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-fg">{item.number}</p>
                        <p className="text-[10px] text-success font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {item.available}
                        </p>
                      </div>
                    </div>
                    <h3 className="font-semibold text-fg mb-1">{item.name}</h3>
                    <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
                  </a>
                </AnimateOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* Other Services */}
      <section className="py-16 bg-surface-light/5">
        <div className="max-w-5xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center mb-10">
              <span className="text-xs font-semibold text-accent uppercase tracking-widest">More Services</span>
              <h2 className="text-3xl font-bold text-fg mt-2">Other Emergency Services</h2>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {emergencyServices.map((svc, i) => (
              <AnimateOnScroll key={svc.name} delay={i * 60}>
                <a href={`tel:${svc.number}`} className="bg-white rounded-xl border border-border p-4 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group block h-full">
                  <svc.icon className={`w-6 h-6 mx-auto mb-2 ${svc.color} group-hover:scale-110 transition-transform`} />
                  <p className="text-lg font-bold text-fg">{svc.number}</p>
                  <p className="text-xs text-muted mt-0.5">{svc.name}</p>
                </a>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* State Tourism */}
      <section className="py-16 bg-bg">
        <div className="max-w-5xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center mb-10">
              <span className="text-xs font-semibold text-accent uppercase tracking-widest">State Helplines</span>
              <h2 className="text-3xl font-bold text-fg mt-2">State Tourism Department Numbers</h2>
              <p className="text-muted mt-2 max-w-lg mx-auto">Direct lines to state-level tourism police and assistance centers</p>
            </div>
          </AnimateOnScroll>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {stateTourism.map((st, i) => (
              <AnimateOnScroll key={st.state} delay={i * 60}>
                <div className="bg-white rounded-xl border border-border p-4 flex items-center justify-between hover:shadow-md transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Landmark className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium text-fg text-sm">{st.state}</span>
                  </div>
                  <a href={`tel:${st.number.replace(/[^0-9]/g, "")}`} className="text-xs font-mono text-primary hover:text-primary-dark transition-colors">
                    {st.number}
                  </a>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* In-App CTA */}
      <section className="py-16 bg-gradient-to-br from-primary to-primary-dark">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <AnimateOnScroll>
            <h2 className="text-3xl font-bold text-white mb-4">Use the 10s Voice SOS Button</h2>
            <p className="text-white/60 mb-8 max-w-md mx-auto">
              The fastest way to get help — one tap records 10s ambient audio and dispatches your GPS location to all nearby authorities instantly.
            </p>
            <Button
              variant="accent"
              size="lg"
              iconRight={<ArrowRight className="w-5 h-5" />}
              onClick={() => setShowSosModal(true)}
            >
              Trigger 10-Second Voice SOS
            </Button>
          </AnimateOnScroll>
        </div>
      </section>

      <SosVoiceRecorderModal
        isOpen={showSosModal}
        onClose={() => setShowSosModal(false)}
        currentLat={27.3334}
        currentLng={88.6095}
      />

      <Footer />
    </div>
  );
}
