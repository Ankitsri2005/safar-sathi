"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import api from "@/lib/api";
import { useSocket } from "@/contexts/SocketContext";
import { cn } from "@/utils/cn";
import { Alert, AlertStatus, AlertType, ALERT_TYPE_LABELS, type AlertTimelineEntry, type AIAnalysisResult } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import {
  MapPin,
  Clock,
  Search,
  Filter,
  X,
  AlertTriangle,
  Shield,
  ShieldAlert,
  CheckCircle,
  ArrowUpCircle,
  FileText,
  Eye,
  Navigation,
  Timer,
  User,
  Ban,
  MessageSquare,
  Brain,
  Cpu,
  Zap,
} from "lucide-react";

const STATUS_VARIANTS: Record<string, { v: "danger" | "warning" | "success" | "primary" | "accent" | "default"; label: string }> = {
  new: { v: "danger", label: "New" },
  acknowledged: { v: "primary", label: "Acknowledged" },
  under_review: { v: "warning", label: "Under Review" },
  escalated: { v: "accent", label: "Escalated" },
  resolved: { v: "success", label: "Resolved" },
  false_positive: { v: "default", label: "False Positive" },
};

const SEVERITY_VARIANTS: Record<string, { v: "danger" | "warning" | "accent" | "default"; color: string }> = {
  critical: { v: "danger", color: "#ef4444" },
  high: { v: "danger", color: "#f97316" },
  medium: { v: "warning", color: "#eab308" },
  low: { v: "default", color: "#6b7280" },
};

const TYPE_ICONS: Record<string, typeof AlertTriangle> = {
  panic: ShieldAlert,
  restricted_zone_entry: Ban,
  high_risk_zone_entry: AlertTriangle,
  no_location_update: Timer,
  route_deviation: Navigation,
  prolonged_stop: Clock,
  manual: User,
};

export default function AlertsPage() {
  const { socket } = useSocket();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Alert | null>(null);
  const [showTriageModal, setShowTriageModal] = useState(false);
  const [triageStep, setTriageStep] = useState(0);
  const [triageMessages, setTriageMessages] = useState<any[]>([]);
  const [triageTargetAlert, setTriageTargetAlert] = useState<Alert | null>(null);
  const [triageLang, setTriageLang] = useState<"en" | "hi" | "ne">("en");
  
  const [timeline, setTimeline] = useState<AlertTimelineEntry[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [escalateNotes, setEscalateNotes] = useState("");
  const [resolveNotes, setResolveNotes] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, new: 0, acknowledged: 0, under_review: 0, escalated: 0, resolved: 0, false_positive: 0 });

function formatCoord(val: any, decimals = 2): string {
  if (val === null || val === undefined) return "N/A";
  const num = typeof val === "number" ? val : parseFloat(val);
  return isNaN(num) ? "N/A" : num.toFixed(decimals);
}

  const TRIAGE_DIALOG_MULTILINGUAL: Record<"en" | "hi" | "ne", any[]> = {
    en: [
      {
        ai: "Sikkim Smart Safety AI. I detected an emergency alert from your device. Are you hurt? Is anyone with you?",
        options: [
          { text: "I'm injured and alone.", next: 1 },
          { text: "Stranded with group/family.", next: 2 },
          { text: "No injuries, just lost the trail.", next: 3 }
        ]
      },
      {
        ai: "Medical priority flagged. Are you bleeding or experiencing fracture pain? Can you stand or walk?",
        options: [
          { text: "Severe leg pain, unable to stand. No visible bleeding.", next: 4 },
          { text: "Minor scrapes and cuts, but I can walk slowly.", next: 4 }
        ]
      },
      {
        ai: "Group stranded. What is your group size? Do you have drinking water and shelter from the rain?",
        options: [
          { text: "Group of 3, no shelter. It's raining heavily.", next: 4 },
          { text: "Group of 2, we have rain protection gear.", next: 4 }
        ]
      },
      {
        ai: "Lost trail. Is visibility low due to fog/landslide? Do you have sufficient phone battery?",
        options: [
          { text: "Dense fog, zero visibility. Battery is around 25%.", next: 4 },
          { text: "Can see landmarks but lost direction. Have powerbank.", next: 4 }
        ]
      },
      {
        ai: "Thank you. I have locked your exact coordinates and synced your triage status. Responders have been briefed with this transcript. Keep this screen open.",
        options: [
          { text: "Finish Triage & Dispatch Details", next: -1 }
        ]
      }
    ],
    hi: [
      {
        ai: "सिक्किम स्मार्ट सुरक्षा एआई। मैंने आपके डिवाइस से एक आपातकालीन अलर्ट का पता लगाया है। क्या आप घायल हैं? क्या कोई आपके साथ है?",
        options: [
          { text: "मैं घायल हूँ और अकेला हूँ।", next: 1 },
          { text: "समूह/परिवार के साथ फंसा हुआ हूँ।", next: 2 },
          { text: "कोई चोट नहीं, बस रास्ता भटक गया हूँ।", next: 3 }
        ]
      },
      {
        ai: "चिकित्सा प्राथमिकता चिह्नित। क्या आपको रक्तस्राव हो रहा है या फ्रैक्चर का दर्द है? क्या आप खड़े हो सकते हैं या चल सकते हैं?",
        options: [
          { text: "पैर में गंभीर दर्द, खड़े होने में असमर्थ। कोई रक्तस्राव नहीं।", next: 4 },
          { text: "मामूली खरोंचें, लेकिन मैं धीरे-धीरे चल सकता हूँ।", next: 4 }
        ]
      },
      {
        ai: "समूह फंसा हुआ है। आपके समूह का आकार क्या है? क्या आपके पास पीने का पानी और बारिश से बचने के लिए आश्रय है?",
        options: [
          { text: "3 का समूह, कोई आश्रय नहीं। भारी बारिश हो रही है।", next: 4 },
          { text: "2 का समूह, हमारे पास रेन गियर है।", next: 4 }
        ]
      },
      {
        ai: "रास्ता भटक गया। क्या कोहरे/भूस्खलन के कारण दृश्यता कम है? क्या आपके फोन में पर्याप्त बैटरी है?",
        options: [
          { text: "घना कोहरा, शून्य दृश्यता। बैटरी लगभग 25% है।", next: 4 },
          { text: "लैंडमार्क देख सकता हूँ पर दिशा भूल गया हूँ। पावरबैंक है।", next: 4 }
        ]
      },
      {
        ai: "धन्यवाद। मैंने आपके सटीक निर्देशांक लॉक कर दिए हैं और आपकी ट्राइएज स्थिति को सिंक कर दिया है। उत्तरदाताओं को इस प्रतिलेख के साथ जानकारी दे दी गई है। इस स्क्रीन को खुला रखें।",
        options: [
          { text: "ट्राइएज समाप्त करें और विवरण भेजें", next: -1 }
        ]
      }
    ],
    ne: [
      {
        ai: "सिक्किम स्मार्ट सुरक्षा एआई। मैले तपाईंको उपकरणबाट आपतकालीन अलर्ट फेला पारेको छु। के तपाईंलाई चोट लागेको छ? कोही तपाईंसँग हुनुहुन्छ?",
        options: [
          { text: "म घाइते छु र एक्लै छु।", next: 1 },
          { text: "समूह/परिवारसँग अलपत्र परेको छु।", next: 2 },
          { text: "चोटपटक लागेको छैन, बाटो मात्र बिराएको हो।", next: 3 }
        ]
      },
      {
        ai: "चिकित्सा प्राथमिकता तोकिएको छ। के तपाईंको रक्तस्राव भइरहेको छ वा फ्र्याक्चरको पीडा छ? के तपाईं उभिन वा हिँड्न सक्नुहुन्छ?",
        options: [
          { text: "खुट्टामा गम्भीर दुखाइ, उभिन असमर्थ। रक्तस्राव छैन।", next: 4 },
          { text: "सामान्य चोटपटक, तर म बिस्तारै हिँड्न सक्छु।", next: 4 }
        ]
      },
      {
        ai: "समूह अलपत्र। तपाईंको समूहको संख्या कति हो? के तपाईंसँग पिउने पानी र पानीबाट बच्ने ओत छ?",
        options: [
          { text: "३ जनाको समूह, ओत छैन। मुसलधारे पानी परिरहेको छ।", next: 4 },
          { text: "२ जनाको समूह, हामीसँग रेन गियर छ।", next: 4 }
        ]
      },
      {
        ai: "बाटो बिराएको। के कुहिरो/पहिरोका कारण बाटो देखिँदैन? के तपाईंको फोनमा पर्याप्त ब्याट्री छ?",
        options: [
          { text: "बाक्लो कुहिरो, शून्य दृश्यता। ब्याट्री २५% जति छ।", next: 4 },
          { text: "दृश्यहरू देखिन्छन् तर दिशा हरायो। पावरबैंक छ।", next: 4 }
        ]
      },
      {
        ai: "धन्यवाद। मैले तपाईंको सटीक स्थान रेकर्ड गरेको छु र ट्राइएज अपडेट गरेको छु। उद्धार टोलीलाई जानकारी पठाइएको छ। कृपया यो स्क्रिन खुल्लै राख्नुहोस्।",
        options: [
          { text: "ट्राइएज पुरा गर्नुहोस्", next: -1 }
        ]
      }
    ]
  };

  const handleStartTriageSimulation = (alert: Alert) => {
    setTriageTargetAlert(alert);
    setTriageStep(0);
    setTriageLang("en");
    setTriageMessages([{ role: "assistant", text: TRIAGE_DIALOG_MULTILINGUAL.en[0].ai }]);
    setShowTriageModal(true);
  };

  const handleTriageOptionSelect = async (option: any) => {
    if (!triageTargetAlert) return;
    
    const updatedMessages = [...triageMessages, { role: "user", text: option.text }];
    
    if (option.next === -1) {
      setShowTriageModal(false);
      try {
        await api.patch(`/alerts/${triageTargetAlert.id}/triage`, {
          triage_status: "completed",
          triage_transcript: updatedMessages
        });
        
        const updatedAlert = { ...triageTargetAlert, triage_status: "completed", triage_transcript: updatedMessages };
        setSelected(updatedAlert);
        setAlerts((prev) => prev.map((a) => a.id === triageTargetAlert.id ? updatedAlert : a));
        fetchTimeline(triageTargetAlert.id);
      } catch (err) {
        console.error("Failed to complete triage:", err);
      }
      return;
    }

    const nextStep = option.next;
    setTriageStep(nextStep);
    
    const nextAiText = TRIAGE_DIALOG_MULTILINGUAL[triageLang][nextStep].ai;
    const finalMessages = [...updatedMessages, { role: "assistant", text: nextAiText }];
    setTriageMessages(finalMessages);

    try {
      await api.patch(`/alerts/${triageTargetAlert.id}/triage`, {
        triage_status: "in_progress",
        triage_transcript: finalMessages
      });
      const updatedAlert = { ...triageTargetAlert, triage_status: "in_progress", triage_transcript: finalMessages };
      setSelected(updatedAlert);
      setAlerts((prev) => prev.map((a) => a.id === triageTargetAlert.id ? updatedAlert : a));
      fetchTimeline(triageTargetAlert.id);
    } catch {}
  };

  // Dynamic language updates during simulation
  useEffect(() => {
    setTriageMessages((prev) => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      const lastMsg = copy[copy.length - 1];
      if (lastMsg && lastMsg.role === "assistant") {
        const localizedAiText = TRIAGE_DIALOG_MULTILINGUAL[triageLang][triageStep]?.ai;
        if (localizedAiText && lastMsg.text !== localizedAiText) {
          copy[copy.length - 1] = { ...lastMsg, text: localizedAiText };
          return copy;
        }
      }
      return prev;
    });
  }, [triageLang, triageStep]);

  const parseTranscript = (t: any) => {
    if (!t) return [];
    if (Array.isArray(t)) return t;
    try {
      return typeof t === "string" ? JSON.parse(t) : t;
    } catch {
      return [];
    }
  };

  // Listen for real-time triage updates
  useEffect(() => {
    if (!socket) return;

    const handleTriageUpdate = (data: { alert_id: string; triage_status: string; triage_transcript: any }) => {
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === data.alert_id
            ? { ...a, triage_status: data.triage_status, triage_transcript: data.triage_transcript }
            : a
        )
      );

      setSelected((prev) => {
        if (prev?.id === data.alert_id) {
          return { ...prev, triage_status: data.triage_status, triage_transcript: data.triage_transcript };
        }
        return prev;
      });

      if (selected?.id === data.alert_id) {
        fetchTimeline(data.alert_id);
      }
    };

    socket.on("alert:triage_update", handleTriageUpdate);

    return () => {
      socket.off("alert:triage_update", handleTriageUpdate);
    };
  }, [socket, selected?.id]);


  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: "15" };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.alert_type = typeFilter;
      if (severityFilter) params.severity = severityFilter;
      if (search) params.search = search;
      const r = await api.get("/alerts", { params });
      setAlerts(r.data.data);
      setTotal(r.data.total);
    } catch {}
    setLoading(false);
  }, [page, statusFilter, typeFilter, severityFilter, search]);

  const fetchStats = async () => {
    try {
      const r = await api.get("/alerts/stats");
      setStats(r.data);
    } catch {}
  };

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);
  useEffect(() => { fetchStats(); }, []);

  const fetchTimeline = async (alertId: string) => {
    try {
      const r = await api.get(`/alerts/${alertId}/timeline`);
      setTimeline(r.data);
    } catch { setTimeline([]); }
  };

  const fetchAIAnalysis = async (touristId: string) => {
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const r = await api.get(`/ai/tourist/${touristId}?limit=1`);
      if (r.data && r.data.length > 0) {
        setAiAnalysis(r.data[0]);
      }
    } catch {}
    setAiLoading(false);
  };

  const runAIAnalysis = async (touristId: string) => {
    setAiLoading(true);
    try {
      const r = await api.post(`/ai/analyze/${touristId}`);
      setAiAnalysis(r.data);
    } catch {}
    setAiLoading(false);
  };

  const handleSelect = (alert: Alert) => {
    setSelected(alert);
    fetchTimeline(alert.id);
    fetchAIAnalysis(alert.tourist_id);
  };

  const handleStatusUpdate = async (id: string, status: AlertStatus, notes?: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/alerts/${id}`, { status, notes });
      await fetchAlerts();
      await fetchStats();
      setSelected(null);
      setShowEscalateModal(false);
      setShowResolveModal(false);
      setEscalateNotes("");
      setResolveNotes("");
    } catch {}
    setActionLoading(false);
  };

  const handleGenerateEfir = async (alert: Alert) => {
    setActionLoading(true);
    try {
      await api.post(`/efirs/generate/${alert.id}`);
      await fetchAlerts();
    } catch {}
    setActionLoading(false);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Alerts Management"
        subtitle="Monitor and respond to safety incidents"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Alerts" }]}
      />

      {/* Stats bar */}
      <div className="grid grid-cols-7 gap-2">
        {[
          { label: "Total", value: stats.total, color: "text-fg" },
          { label: "New", value: stats.new, color: "text-danger", pulse: true },
          { label: "Acknowledged", value: stats.acknowledged, color: "text-primary" },
          { label: "In Review", value: stats.under_review, color: "text-warning" },
          { label: "Escalated", value: stats.escalated, color: "text-accent" },
          { label: "Resolved", value: stats.resolved, color: "text-success" },
          { label: "False +", value: stats.false_positive, color: "text-muted" },
        ].map((s) => (
          <Card key={s.label} variant="elevated" padding="sm" className="text-center">
            <p className={`text-lg font-bold ${s.color} ${s.pulse ? "animate-pulse" : ""}`}>{s.value}</p>
            <p className="text-[9px] text-muted uppercase">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full border border-border rounded-xl pl-9 pr-4 py-2 text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
            placeholder="Search tourist, location, message..."
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-all ${showFilters ? "bg-primary text-white border-primary" : "bg-white border-border text-muted hover:border-primary/30"}`}
        >
          <Filter className="w-3.5 h-3.5" />
          Filters
        </button>
        <span className="text-sm text-muted ml-auto">{total} alerts</span>
      </div>

      {showFilters && (
        <div className="flex gap-3 flex-wrap animate-fade-in">
          <div className="flex gap-1.5">
            {["", "new", "acknowledged", "under_review", "escalated", "resolved", "false_positive"].map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${statusFilter === s ? "bg-primary text-white" : "bg-surface-light/20 text-muted hover:bg-surface-light/30"}`}
              >
                {s ? STATUS_VARIANTS[s]?.label || s : "All Status"}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {["", "panic", "restricted_zone_entry", "high_risk_zone_entry", "no_location_update", "route_deviation", "prolonged_stop", "manual"].map((t) => (
              <button
                key={t}
                onClick={() => { setTypeFilter(t); setPage(1); }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${typeFilter === t ? "bg-primary text-white" : "bg-surface-light/20 text-muted hover:bg-surface-light/30"}`}
              >
                {t ? ALERT_TYPE_LABELS[t]?.substring(0, 12) || t : "All Types"}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {["", "critical", "high", "medium", "low"].map((s) => (
              <button
                key={s}
                onClick={() => { setSeverityFilter(s); setPage(1); }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${severityFilter === s ? "bg-primary text-white" : "bg-surface-light/20 text-muted hover:bg-surface-light/30"}`}
              >
                {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All Severity"}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-5">
        {/* Table */}
        <div className={`${selected ? "w-1/2" : "w-full"} transition-all duration-300`}>
          <Card variant="elevated" padding="none" className="overflow-hidden">
            {alerts.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted">No alerts found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-bg/50">
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted uppercase">Severity</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted uppercase">Tourist</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted uppercase">Type</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted uppercase">Location</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted uppercase">Time</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted uppercase">Status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((alert) => {
                      const Icon = TYPE_ICONS[alert.alert_type] || AlertTriangle;
                      const sev = SEVERITY_VARIANTS[alert.severity] || SEVERITY_VARIANTS.medium;
                      const sts = STATUS_VARIANTS[alert.status] || STATUS_VARIANTS.new;
                      return (
                        <tr
                          key={alert.id}
                          onClick={() => handleSelect(alert)}
                          className={`border-b border-border/50 cursor-pointer transition-colors hover:bg-primary/5 ${selected?.id === alert.id ? "bg-primary/10" : ""}`}
                        >
                          <td className="px-4 py-3">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sev.color }} />
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-fg text-xs">{alert.tourist_name}</p>
                            <p className="text-[10px] text-muted font-mono">{alert.tourist_id.substring(0, 12)}...</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <Icon className="w-3.5 h-3.5 text-muted shrink-0" />
                              <span className="text-xs text-fg">{ALERT_TYPE_LABELS[alert.alert_type] || alert.alert_type}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted max-w-[120px] truncate">
                            {alert.location_name || `${formatCoord(alert.location_lat, 2)}, ${formatCoord(alert.location_lng, 2)}`}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                            {new Date(alert.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={sts.v} size="sm" pulse={alert.status === "new"}>{sts.label}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Eye className="w-4 h-4 text-muted hover:text-primary transition-colors" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          {total > 15 && (
            <div className="flex justify-center gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
              <span className="px-3 py-1 text-sm text-muted">Page {page}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page * 15 >= total}>Next</Button>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="w-1/2 animate-fade-in">
            <Card variant="elevated" className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = TYPE_ICONS[selected.alert_type] || AlertTriangle;
                    const sev = SEVERITY_VARIANTS[selected.severity] || SEVERITY_VARIANTS.medium;
                    return (
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: sev.color + "20" }}>
                        <Icon className="w-5 h-5" style={{ color: sev.color }} />
                      </div>
                    );
                  })()}
                  <div>
                    <h2 className="text-sm font-bold text-fg">{ALERT_TYPE_LABELS[selected.alert_type]}</h2>
                    <p className="text-xs text-muted">{selected.id}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-surface-light/10 text-muted">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Severity + Status */}
              <div className="flex gap-2">
                <Badge variant={SEVERITY_VARIANTS[selected.severity]?.v || "default"} size="sm">
                  {selected.severity}
                </Badge>
                <Badge variant={STATUS_VARIANTS[selected.status]?.v || "default"} size="sm" pulse={selected.status === "new"}>
                  {STATUS_VARIANTS[selected.status]?.label || selected.status}
                </Badge>
              </div>

              {/* Tourist info */}
              <div className="p-3 rounded-xl bg-bg border border-border space-y-2">
                <h4 className="text-[10px] font-semibold text-muted uppercase">Tourist</h4>
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-sm font-medium text-fg">{selected.tourist_name}</span>
                </div>
                <p className="text-xs text-muted font-mono ml-5.5">{selected.tourist_id}</p>
              </div>

              {/* Location */}
              <div className="p-3 rounded-xl bg-bg border border-border space-y-2">
                <h4 className="text-[10px] font-semibold text-muted uppercase">Location</h4>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-fg">{selected.location_name || "Unknown location"}</p>
                    <p className="text-xs text-muted font-mono">{formatCoord(selected.location_lat, 4)}, {formatCoord(selected.location_lng, 4)}</p>
                  </div>
                </div>
                <div className="mt-2 h-32 rounded-lg bg-gradient-to-br from-surface to-surface-light border border-border flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="w-full h-full" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                  </div>
                  <div className="relative flex flex-col items-center">
                    <MapPin className="w-6 h-6 text-danger animate-bounce" />
                    <span className="text-[9px] text-white/50 mt-1">{formatCoord(selected.location_lat, 2)}, {formatCoord(selected.location_lng, 2)}</span>
                  </div>
                </div>
              </div>

              {/* Message */}
              {selected.message && (
                <div className="p-3 rounded-xl bg-warning-50 border border-warning-200">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                    <p className="text-xs text-fg">{selected.message}</p>
                  </div>
                </div>
              )}

              {/* Time */}
              <div className="flex items-center gap-2 text-xs text-muted">
                <Clock className="w-3.5 h-3.5" />
                Created: {new Date(selected.created_at).toLocaleString("en-IN")}
              </div>

              {/* Timeline */}
              {timeline.length > 0 && (
                <div className="p-3 rounded-xl bg-bg border border-border space-y-2">
                  <h4 className="text-[10px] font-semibold text-muted uppercase">Incident Timeline</h4>
                  <div className="space-y-2">
                    {timeline.map((entry, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-fg capitalize">{entry.action.replace("_", " ")}</span>
                            {entry.performed_by && <span className="text-muted">by {entry.performed_by}</span>}
                          </div>
                          {entry.notes && <p className="text-muted mt-0.5">{entry.notes}</p>}
                          <p className="text-[10px] text-muted">{new Date(entry.created_at).toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Analysis */}
              <div className="p-3 rounded-xl bg-gradient-to-br from-accent-50 to-primary-50 border border-accent-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-fg flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-accent" />
                    AI Analysis
                  </h4>
                  <Button variant="ghost" size="sm" onClick={() => runAIAnalysis(selected.tourist_id)} disabled={aiLoading} icon={<Zap className="w-3 h-3" />}>
                    {aiLoading ? "Analyzing..." : "Run AI"}
                  </Button>
                </div>

                {aiLoading && (
                  <div className="flex items-center gap-2 py-3">
                    <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-muted">Running Isolation Forest analysis...</span>
                  </div>
                )}

                {aiAnalysis && !aiLoading && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="w-3 h-3 text-muted" />
                        <span className="text-[10px] text-muted font-mono">{aiAnalysis.model_version}</span>
                      </div>
                      <Badge
                        variant={aiAnalysis.risk_level === "critical" ? "danger" : aiAnalysis.risk_level === "high" ? "danger" : aiAnalysis.risk_level === "medium" ? "warning" : "success"}
                        size="sm"
                      >
                        Score: {aiAnalysis.anomaly_score.toFixed(3)}
                      </Badge>
                      <Badge
                        variant={aiAnalysis.risk_level === "critical" ? "danger" : aiAnalysis.risk_level === "high" ? "danger" : aiAnalysis.risk_level === "medium" ? "warning" : "success"}
                        size="sm"
                      >
                        {aiAnalysis.risk_level.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      {aiAnalysis.reasons.map((reason, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs">
                          <AlertTriangle className="w-3 h-3 text-warning shrink-0 mt-0.5" />
                          <span className="text-fg">{reason}</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-2 rounded-lg bg-white/60 border border-border">
                      <p className="text-[10px] text-muted font-semibold uppercase mb-1">Recommended Action</p>
                      <p className="text-xs text-fg">{aiAnalysis.recommended_action}</p>
                    </div>

                    {/* Top contributing features */}
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted font-semibold uppercase">Top Anomalous Features</p>
                      {aiAnalysis.contributions.filter((c) => c.is_anomalous).slice(0, 3).map((c, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px]">
                          <span className="text-muted font-mono w-32 truncate">{c.feature.replace(/_/g, " ")}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-white/60 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${c.contribution_score * 100}%`,
                                backgroundColor: c.contribution_score > 0.8 ? "#ef4444" : c.contribution_score > 0.6 ? "#eab308" : "#22c55e",
                              }}
                            />
                          </div>
                          <span className="text-fg font-mono w-8 text-right">{c.value.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!aiAnalysis && !aiLoading && (
                  <p className="text-xs text-muted text-center py-2">
                    Click "Run AI" to analyze this tourist's movement patterns.
                  </p>
                )}
              </div>

              {/* AI First Response Triage */}
              <div className="p-3 rounded-xl bg-bg border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-primary" />
                    AI First Response Triage
                  </h4>
                  <Badge variant={selected.triage_status === "completed" ? "success" : "warning"} size="sm">
                    {selected.triage_status === "completed" ? "Triage Complete" : "Triage Pending"}
                  </Badge>
                </div>

                {selected.triage_status === "completed" && (
                  <div className="p-2.5 rounded-lg bg-surface/50 border border-border flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 animate-pulse">
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-semibold text-fg block">Listen to Voice Triage</span>
                        <span className="text-[10px] text-muted font-mono">Multilingual AI Voice Assistant (Nepali/Hindi/EN)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0 px-2">
                      <div className="w-0.5 h-3 bg-primary/45 rounded-full"></div>
                      <div className="w-0.5 h-4 bg-primary/75 rounded-full"></div>
                      <div className="w-0.5 h-2 bg-primary/45 rounded-full"></div>
                      <div className="w-0.5 h-5 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-0.5 h-3 bg-primary/75 rounded-full"></div>
                    </div>
                  </div>
                )}

                {selected.triage_transcript ? (
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-1 border-l-2 border-primary/20 pl-3 text-xs">
                    {parseTranscript(selected.triage_transcript).map((chat: any, i: number) => (
                      <div key={i} className="space-y-0.5">
                        <span className={cn("font-bold block uppercase tracking-wider text-[8px]", chat.role === "assistant" ? "text-primary" : "text-fg")}>
                          {chat.role === "assistant" ? "AI Assistant (Voice)" : "Tourist (Voice)"}
                        </span>
                        <p className="text-fg leading-relaxed bg-surface/30 p-1.5 rounded-lg border border-border/20">
                          {chat.text}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 py-1 text-center">
                    <p className="text-xs text-muted max-w-sm mx-auto">
                      No triage transcript recorded. Simulate a voice triage conversation to capture emergency status before dispatch.
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleStartTriageSimulation(selected)}
                      className="w-full justify-center"
                      icon={<MessageSquare className="w-3.5 h-3.5" />}
                    >
                      Start AI Triage Simulation
                    </Button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {selected.status === "new" && (
                  <Button variant="secondary" size="sm" onClick={() => handleStatusUpdate(selected.id, AlertStatus.ACKNOWLEDGED)} icon={<CheckCircle className="w-3.5 h-3.5" />}>
                    Acknowledge
                  </Button>
                )}
                {(selected.status === "new" || selected.status === "acknowledged") && (
                  <Button variant="secondary" size="sm" onClick={() => handleStatusUpdate(selected.id, AlertStatus.UNDER_REVIEW)} icon={<Eye className="w-3.5 h-3.5" />}>
                    Under Review
                  </Button>
                )}
                {selected.status !== AlertStatus.RESOLVED && selected.status !== AlertStatus.FALSE_POSITIVE && (
                  <Button variant="danger" size="sm" onClick={() => setShowEscalateModal(true)} icon={<ArrowUpCircle className="w-3.5 h-3.5" />}>
                    Escalate
                  </Button>
                )}
                {selected.status !== AlertStatus.RESOLVED && selected.status !== AlertStatus.FALSE_POSITIVE && (
                  <Button variant="primary" size="sm" onClick={() => setShowResolveModal(true)} icon={<CheckCircle className="w-3.5 h-3.5" />}>
                    Resolve
                  </Button>
                )}
                {selected.status !== AlertStatus.RESOLVED && selected.status !== AlertStatus.FALSE_POSITIVE && (
                  <Button variant="outline" size="sm" onClick={() => handleGenerateEfir(selected)} disabled={actionLoading} icon={<FileText className="w-3.5 h-3.5" />}>
                    Generate E-FIR
                  </Button>
                )}
                {selected.status !== AlertStatus.FALSE_POSITIVE && selected.status !== AlertStatus.RESOLVED && (
                  <Button variant="ghost" size="sm" onClick={() => handleStatusUpdate(selected.id, AlertStatus.FALSE_POSITIVE, "Marked as false positive")} icon={<Ban className="w-3.5 h-3.5" />}>
                    False Positive
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Escalate Modal */}
      <Modal open={showEscalateModal} onClose={() => setShowEscalateModal(false)} title="Escalate Alert" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted">Escalating will notify senior officers and mark this alert for immediate attention.</p>
          <textarea
            value={escalateNotes}
            onChange={(e) => setEscalateNotes(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all resize-none"
            rows={3}
            placeholder="Add escalation notes (optional)..."
          />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowEscalateModal(false)}>Cancel</Button>
            <Button variant="danger" className="flex-1" loading={actionLoading} onClick={() => selected && handleStatusUpdate(selected.id, AlertStatus.ESCALATED, escalateNotes || undefined)}>
              Escalate
            </Button>
          </div>
        </div>
      </Modal>

      {/* Resolve Modal */}
      <Modal open={showResolveModal} onClose={() => setShowResolveModal(false)} title="Resolve Alert" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted">Mark this alert as resolved. It will no longer appear in the active alerts list.</p>
          <textarea
            value={resolveNotes}
            onChange={(e) => setResolveNotes(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all resize-none"
            rows={3}
            placeholder="Resolution notes (optional)..."
          />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowResolveModal(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1" loading={actionLoading} onClick={() => selected && handleStatusUpdate(selected.id, AlertStatus.RESOLVED, resolveNotes || undefined)}>
              Resolve Alert
            </Button>
          </div>
        </div>
      </Modal>

      {/* AI Triage Simulation Modal */}
      <Modal open={showTriageModal} onClose={() => setShowTriageModal(false)} title="AI Multilingual Voice Triage Assistant" size="sm">
        <div className="space-y-4">
          <p className="text-xs text-muted">
            Simulate the multilingual voice assistant triaging the tourist's safety to collect context for rescue dispatch.
          </p>

          <div className="rounded-xl border border-border bg-bg/50 overflow-hidden flex flex-col h-72">
            <div className="bg-primary/5 px-3 py-2 border-b border-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-fg">
                <Brain className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Sikkim Emergency AI (Voice)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse"></span>
                <span className="text-[10px] text-muted uppercase">Connected</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {triageMessages.map((m, i) => (
                <div key={i} className={cn("flex flex-col max-w-[85%] space-y-0.5", m.role === "assistant" ? "mr-auto items-start" : "ml-auto items-end")}>
                  <span className="text-[8px] text-muted font-bold tracking-wider uppercase">
                    {m.role === "assistant" ? "AI Voice Assistant" : "Tourist Response"}
                  </span>
                  <div className={cn("rounded-xl px-3 py-2 text-xs border", 
                    m.role === "assistant" ? "bg-white text-fg border-border" : "bg-primary text-white border-primary"
                  )}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            
            {triageStep < TRIAGE_DIALOG_MULTILINGUAL[triageLang].length && (
              <div className="bg-primary/5 px-3 py-2 border-t border-border flex items-center justify-center gap-1">
                <span className="text-[10px] text-primary font-medium font-mono mr-2">Voice Spectrum:</span>
                <div className="flex items-center gap-0.5 h-4">
                  <div className="w-0.5 h-2 bg-primary/60 rounded animate-pulse"></div>
                  <div className="w-0.5 h-3.5 bg-primary rounded animate-pulse"></div>
                  <div className="w-0.5 h-1.5 bg-primary/45 rounded animate-pulse"></div>
                  <div className="w-0.5 h-4 bg-primary rounded animate-pulse"></div>
                  <div className="w-0.5 h-2 bg-primary/60 rounded animate-pulse"></div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {triageStep < TRIAGE_DIALOG_MULTILINGUAL[triageLang].length && TRIAGE_DIALOG_MULTILINGUAL[triageLang][triageStep]?.options.map((opt: any, i: number) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => handleTriageOptionSelect(opt)}
                className="w-full justify-start text-xs border border-primary/20 hover:border-primary/50 hover:bg-primary/5 whitespace-normal py-2 text-left"
              >
                {opt.text}
              </Button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
