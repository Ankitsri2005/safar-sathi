"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useLanguage, SUPPORTED_LOCALES, Locale } from "@/contexts/LanguageContext";
import { cn } from "@/utils/cn";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { TiltCard } from "@/components/ui/TiltCard";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
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
  FileCheck,
} from "lucide-react";

const features = [
  {
    icon: Fingerprint,
    titleKey: "feat_1_title",
    descKey: "feat_1_desc",
    color: "bg-purple-100 text-purple-600",
    borderColor: "hover:border-purple-200",
  },
  {
    icon: Radio,
    titleKey: "feat_2_title",
    descKey: "feat_2_desc",
    color: "bg-warning/10 text-warning",
    borderColor: "hover:border-warning/20",
  },
  {
    icon: ShieldCheck,
    titleKey: "feat_3_title",
    descKey: "feat_3_desc",
    color: "bg-success/10 text-success",
    borderColor: "hover:border-success/20",
  },
  {
    icon: MapPin,
    titleKey: "feat_4_title",
    descKey: "feat_4_desc",
    color: "bg-accent/10 text-accent",
    borderColor: "hover:border-accent/20",
  },
  {
    icon: AlertTriangle,
    titleKey: "feat_5_title",
    descKey: "feat_5_desc",
    color: "bg-danger/10 text-danger",
    borderColor: "hover:border-danger/20",
  },
  {
    icon: Globe,
    titleKey: "feat_6_title",
    descKey: "feat_6_desc",
    color: "bg-primary/10 text-primary",
    borderColor: "hover:border-primary/20",
  },
];

const steps = [
  { step: "1", titleKey: "hiw_1_title", descKey: "hiw_1_desc", icon: CreditCard },
  { step: "2", titleKey: "hiw_2_title", descKey: "hiw_2_desc", icon: Lock },
  { step: "3", titleKey: "hiw_3_title", descKey: "hiw_3_desc", icon: MapPin },
  { step: "4", titleKey: "hiw_4_title", descKey: "hiw_4_desc", icon: Zap },
];

const stats = [
  { value: 10000, suffix: "+", labelKey: "stat_tourists" },
  { value: 24, suffix: "/7", labelKey: "stat_monitoring" },
  { value: 500, suffix: "+", labelKey: "stat_zones" },
  { value: 30, prefix: "<", suffix: "s", labelKey: "stat_response" },
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
  const { t, locale, setLocale } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const heroRef = useRef<HTMLElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      if (heroRef.current) {
        heroRef.current.style.setProperty("--scroll-y", `${window.scrollY}px`);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const section = heroRef.current;
    const spot = spotlightRef.current;
    if (!section || !spot) return;
    const rect = section.getBoundingClientRect();
    spot.style.opacity = "1";
    spot.style.transform = `translate(${e.clientX - rect.left - 300}px, ${e.clientY - rect.top - 300}px)`;
  };

  const handleHeroMouseLeave = () => {
    if (spotlightRef.current) spotlightRef.current.style.opacity = "0";
  };

  return (
    <div className="min-h-screen">
      <ScrollProgress />
      {/* Hero */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        className="relative overflow-hidden bg-gradient-to-br from-surface via-primary-dark to-surface pt-28 pb-24"
      >
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-primary-light/15 rounded-full blur-[120px] animate-pulse"
            style={{ animationDuration: "8s", transform: "translate(-50%, calc(var(--scroll-y, 0px) * -0.12))" }}
          />
          <div
            className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] animate-pulse"
            style={{ animationDuration: "6s", animationDelay: "2s", transform: "translateY(calc(var(--scroll-y, 0px) * -0.2))" }}
          />
          <div
            className="absolute top-1/3 left-0 w-[300px] h-[300px] bg-success/5 rounded-full blur-[80px] animate-pulse"
            style={{ animationDuration: "10s", transform: "translateY(calc(var(--scroll-y, 0px) * -0.08))" }}
          />
          {/* Grid dots */}
          <div className="absolute inset-0" style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "28px 28px"
          }} />
          {/* Mouse spotlight */}
          <div
            ref={spotlightRef}
            className="pointer-events-none absolute left-0 top-0 w-[600px] h-[600px] rounded-full opacity-0 transition-opacity duration-500"
            style={{
              background: "radial-gradient(circle, rgba(20,184,166,0.16) 0%, rgba(20,184,166,0.05) 40%, transparent 65%)",
            }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Government Badge */}
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-5 py-2 mb-8 animate-fade-in backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-pulse-ring" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              <span className="text-xs font-medium text-white/80 tracking-wide">{t("hero_badge")}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-[1.1] mb-6">
              <span className="animate-fade-in-up">
                {t("hero_title")}
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-white/50 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
              {t("hero_subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
              <Link href="/register" className="group">
                <Button variant="accent" size="lg" iconRight={<ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />}>
                  {t("hero_register")}
                </Button>
              </Link>
              <Link href="/login" className="group">
                <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10 hover:text-white hover:border-primary-light/60">
                  {t("hero_login")}
                </Button>
              </Link>
            </div>
          </div>

          {/* Floating Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
            {stats.map((stat) => (
              <div
                key={stat.labelKey}
                className="glass-dark rounded-2xl p-5 text-center hover:bg-white/10 transition-all duration-300 group hover:-translate-y-1 hover:shadow-glow cursor-default"
              >
                <p className="text-2xl sm:text-3xl font-bold text-white group-hover:scale-105 transition-transform">
                  <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </p>
                <p className="text-xs text-white/40 mt-1.5 uppercase tracking-wider">{t(stat.labelKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-surface-light/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <span className="text-xs font-semibold text-accent uppercase tracking-widest">{t("hiw_tag")}</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-fg mt-2">{t("hiw_title")}</h2>
              <p className="text-muted mt-3 max-w-lg mx-auto">{t("hiw_subtitle")}</p>
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
                    <h3 className="font-semibold text-fg mb-1">{t(item.titleKey)}</h3>
                    <p className="text-sm text-muted leading-relaxed">{t(item.descKey)}</p>
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
              <span className="text-xs font-semibold text-accent uppercase tracking-widest">{t("feat_tag")}</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-fg mt-2">{t("feat_title")}</h2>
              <p className="text-muted mt-3 max-w-lg mx-auto">{t("feat_subtitle")}</p>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <AnimateOnScroll key={feature.titleKey} delay={i * 80} className="h-full">
                  <TiltCard maxTilt={7}>
                    <div className={`bg-white rounded-2xl border border-border p-7 hover:shadow-xl transition-shadow duration-300 group h-full ${feature.borderColor}`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${feature.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-semibold text-fg text-lg mb-2">{t(feature.titleKey)}</h3>
                      <p className="text-sm text-muted leading-relaxed">{t(feature.descKey)}</p>
                    </div>
                  </TiltCard>
                </AnimateOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* Emergency Banner */}
      <section className="py-20 bg-gradient-to-br from-danger-dark via-danger to-danger-dark relative overflow-hidden">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateOnScroll>
            <div className="max-w-2xl mx-auto">
              <span className="text-xs font-semibold text-white/70 uppercase tracking-widest">24/7 Response</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2 mb-4">{t("emer_banner_title")}</h2>
              <p className="text-white/80 text-base mb-8">{t("emer_banner_subtitle")}</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/emergency">
                  <Button variant="accent" size="lg" className="bg-white text-danger hover:bg-gray-100 border-none font-bold">
                    {t("emer_btn_sos")}
                  </Button>
                </Link>
                <a href="tel:112">
                  <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                    {t("emer_btn_call")}
                  </Button>
                </a>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Supported Languages */}
      <section className="py-20 bg-bg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <span className="text-xs font-semibold text-accent uppercase tracking-widest">{t("lang_tag")}</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-fg mt-2">{t("lang_title")}</h2>
              <p className="text-muted mt-3 max-w-lg mx-auto">{t("lang_subtitle")}</p>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {SUPPORTED_LOCALES.map((lang, i) => (
              <AnimateOnScroll key={lang.code} delay={i * 30}>
                <button
                  onClick={() => setLocale(lang.code as Locale)}
                  className={cn(
                    "w-full bg-white border rounded-xl p-4 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer block",
                    locale === lang.code
                      ? "border-primary bg-primary-50/40 ring-2 ring-primary/30"
                      : "border-border hover:border-primary/20"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 transition-colors",
                    locale === lang.code ? "bg-primary text-white" : "bg-primary/5 text-primary group-hover:bg-primary/10"
                  )}>
                    <Languages className="w-5 h-5" />
                  </div>
                  <p className={cn("text-sm font-semibold", locale === lang.code ? "text-primary font-bold" : "text-fg")}>{lang.native}</p>
                  <p className="text-[10px] text-muted uppercase tracking-wider mt-0.5">{lang.name}</p>
                </button>
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
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm animate-float">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Travel Safely?</h2>
            <p className="text-white/60 mb-8 max-w-lg mx-auto text-lg">
              Register now to get your blockchain-secured Digital Tourist ID and travel across India with confidence.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="group">
                <Button variant="accent" size="lg" iconRight={<ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />}>
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
