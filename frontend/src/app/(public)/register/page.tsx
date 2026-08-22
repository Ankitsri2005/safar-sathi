"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/ui/Toast";
import {
  Shield,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  User,
  CreditCard,
  MapPin,
  Phone,
  FileText,
  Plus,
  Trash2,
  Upload,
  Camera,
  MapPinned,
  CalendarDays,
  AlertTriangle,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Navigation,
  Mail,
  Info,
  Globe,
} from "lucide-react";

const idNumberPattern: Record<string, RegExp> = {
  aadhaar: /^\d{12}$/,
  passport: /^[A-PR-WY][0-9]{7}$/i,
  other: /^.{3,}$/,
};

const idNumberHint: Record<string, string> = {
  aadhaar: "12-digit Aadhaar number (e.g. 1234 5678 9012)",
  passport: "Passport number (e.g. A1234567)",
  other: "Minimum 3 characters",
};

const schema = z
  .object({
    full_name: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Name is too long"),
    id_type: z.enum(["aadhaar", "passport", "other"], {
      required_error: "Please select an identity type",
    }),
    id_number: z.string().min(1, "Identity number is required"),
    emergency_contact_name: z
      .string()
      .min(2, "Contact name must be at least 2 characters"),
    emergency_contact_phone: z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .max(15, "Phone number is too long")
      .regex(/^\+?[\d\s-]+$/, "Invalid phone number format"),
    phone: z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .max(15, "Phone number is too long")
      .regex(/^\+?[\d\s-]+$/, "Invalid phone number format"),
    email: z.string().email("Please enter a valid email address"),
    trip_start: z.string().min(1, "Trip start date is required"),
    trip_end: z.string().min(1, "Trip end date is required"),
    itinerary: z
      .array(
        z.object({
          place: z.string().min(1, "Place name is required"),
          lat: z.coerce.number().min(-90).max(90),
          lng: z.coerce.number().min(-180).max(180),
          planned_date: z.string().min(1, "Date is required"),
        })
      )
      .min(1, "Please add at least one itinerary stop"),
    consent_tracking: z.literal(true, {
      errorMap: () => ({
        message: "You must consent to location tracking for safety purposes",
      }),
    }),
  })
  .refine(
    (data) => {
      const pattern = idNumberPattern[data.id_type];
      return pattern ? pattern.test(data.id_number) : true;
    },
    {
      message: "Invalid identity number format for the selected ID type",
      path: ["id_number"],
    }
  )
  .refine(
    (data) => {
      if (data.trip_start && data.trip_end) {
        return new Date(data.trip_end) >= new Date(data.trip_start);
      }
      return true;
    },
    {
      message: "Trip end date must be on or after the start date",
      path: ["trip_end"],
    }
  )
  .refine(
    (data) => {
      if (data.trip_start) {
        return new Date(data.trip_start) >= new Date(new Date().toDateString());
      }
      return true;
    },
    {
      message: "Trip start date cannot be in the past",
      path: ["trip_start"],
    }
  );

type FormData = z.infer<typeof schema>;

const steps = [
  { id: 1, title: "Personal", subtitle: "Your details", icon: User, color: "primary" },
  { id: 2, title: "Identity", subtitle: "Verification", icon: CreditCard, color: "accent" },
  { id: 3, title: "Emergency", subtitle: "Safety contact", icon: Phone, color: "danger" },
  { id: 4, title: "Itinerary", subtitle: "Trip plan", icon: MapPinned, color: "success" },
  { id: 5, title: "Review", subtitle: "Consent & submit", icon: ShieldCheck, color: "primary" },
];

const stepFields: Record<number, (keyof FormData)[]> = {
  1: ["full_name"],
  2: ["id_type", "id_number"],
  3: ["emergency_contact_name", "emergency_contact_phone"],
  4: ["trip_start", "trip_end", "itinerary"],
  5: ["phone", "email", "consent_tracking"],
};

const CONFETTI_COLORS = [
  "#0f766e", "#f97316", "#16a34a", "#dc2626",
  "#d97706", "#7c3aed", "#0891b2", "#be185d",
];

function ConfettiPiece({ delay, left, color }: { delay: number; left: number; color: string }) {
  const size = 6 + Math.random() * 8;
  const rotation = Math.random() * 360;
  return (
    <div
      className="confetti-piece"
      style={{
        left: `${left}%`,
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        transform: `rotate(${rotation}deg)`,
        animationDuration: `${2 + Math.random() * 2}s`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

function SuccessCheckmark() {
  return (
    <div className="relative w-24 h-24 mx-auto mb-6">
      <div className="absolute inset-0 rounded-full bg-success-100 animate-success-ring" />
      <div
        className="absolute inset-2 rounded-full bg-success flex items-center justify-center"
        style={{ animationDelay: "0.15s" }}
      >
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 13l4 4L19 7"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-checkmark"
            style={{ strokeDasharray: 24 }}
          />
        </svg>
      </div>
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            top: "50%",
            left: "50%",
            animation: `float-particle 1.2s ease-out ${0.3 + i * 0.1}s forwards`,
            transform: `rotate(${i * 60}deg)`,
          }}
        />
      ))}
    </div>
  );
}

function ReviewField({
  icon: Icon,
  label,
  value,
  color = "text-muted",
}: {
  icon: typeof User;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-bg/50 field-animate">
      <div className={`w-8 h-8 rounded-lg bg-surface-light/10 flex items-center justify-center shrink-0`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted font-medium">{label}</p>
        <p className="text-sm text-fg font-medium truncate">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [mode, setMode] = useState<"form" | "success">("form");
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [stepAnimating, setStepAnimating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [apiError, setApiError] = useState("");
  const [showIdNumber, setShowIdNumber] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { toasts, toast, removeToast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    trigger,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "",
      id_type: "aadhaar",
      id_number: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      phone: "",
      email: "",
      trip_start: "",
      trip_end: "",
      itinerary: [{ place: "", lat: 27.3389, lng: 88.6065, planned_date: "" }],
      consent_tracking: undefined as any,
    },
  });

  const { fields: itineraryFields, append: addStop, remove: removeStop } = useFieldArray({
    control,
    name: "itinerary",
  });

  const watchIdType = watch("id_type");
  const watchItinerary = watch("itinerary");
  const watchConsent = watch("consent_tracking");
  const watchTripStart = watch("trip_start");
  const watchFullName = watch("full_name");

  const [confetti, setConfetti] = useState<
    { id: number; delay: number; left: number; color: string }[]
  >([]);

  const triggerConfetti = useCallback(() => {
    const pieces = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      delay: Math.random() * 0.8,
      left: Math.random() * 100,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    }));
    setConfetti(pieces);
    setTimeout(() => setConfetti([]), 4000);
  }, []);

  const goToStep = async (target: number) => {
    if (stepAnimating) return;
    if (target > currentStep) {
      const valid = await trigger(stepFields[currentStep]);
      if (!valid) {
        toast.error("Please fix the errors before continuing");
        return;
      }
    }
    setDirection(target > currentStep ? "forward" : "backward");
    setStepAnimating(true);
    setTimeout(() => {
      setCurrentStep(target);
      setStepAnimating(false);
    }, 300);
  };

  const nextStep = () => goToStep(currentStep + 1);
  const prevStep = () => goToStep(currentStep - 1);

  const onSubmit = async (data: FormData) => {
    try {
      setApiError("");
      const payload = {
        full_name: data.full_name,
        id_type: data.id_type,
        id_number: data.id_number,
        phone: data.phone,
        email: data.email,
        emergency_contact_name: data.emergency_contact_name,
        emergency_contact_phone: data.emergency_contact_phone,
        trip_start: data.trip_start ? new Date(data.trip_start).toISOString() : new Date().toISOString(),
        trip_end: data.trip_end ? new Date(data.trip_end).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString(),
        itinerary: Array.isArray(data.itinerary) ? data.itinerary : [],
        consent_tracking: data.consent_tracking,
      };
      const res = await api.post("/register", payload);
      setResult(res.data);
      setMode("success");
      toast.success("Registration successful! Your Digital Tourist ID has been created.");
      setTimeout(triggerConfetti, 400);
    } catch (err: any) {
      let msg = "Registration failed. Please try again.";
      if (err.response?.data) {
        const d = err.response.data;
        if (Array.isArray(d.details) && d.details.length > 0) {
          msg = d.details.map((item: any) => item.msg || item.message || JSON.stringify(item)).join(", ");
        } else if (typeof d.details === "string" && d.details.trim()) {
          msg = d.details;
        } else if (d.error) {
          msg = d.error;
        } else if (d.message) {
          msg = d.message;
        }
      }
      setApiError(msg);
      toast.error(msg);
    }
  };

  const getProgressPercent = () => ((currentStep - 1) / (steps.length - 1)) * 100;

  const renderStepContent = () => {
    const animClass = stepAnimating
      ? direction === "forward"
        ? "animate-step-out-left"
        : "animate-step-out-right"
      : direction === "forward"
      ? "animate-step-in-right"
      : "animate-step-in-left";

    return (
      <div key={currentStep} className={animClass}>
        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-fg">Personal Information</h2>
                <p className="text-xs text-muted">Tell us about yourself</p>
              </div>
            </div>

            <div className="field-animate field-stagger-1">
              <Input
                label="Full Name"
                placeholder="e.g. Rahul Sharma"
                icon={<User className="w-4 h-4" />}
                error={errors.full_name?.message}
                {...register("full_name")}
              />
            </div>

            {watchFullName && watchFullName.length >= 2 && (
              <div className="field-animate field-stagger-2 p-3 rounded-lg bg-primary-50 border border-primary-200 flex items-center gap-2">
                <Info className="w-4 h-4 text-primary shrink-0" />
                <p className="text-xs text-primary-dark">
                  Name will appear on your Digital Tourist ID
                </p>
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-fg">Identity Verification</h2>
                <p className="text-xs text-muted">Secure identity for blockchain registration</p>
              </div>
            </div>

            <div className="field-animate field-stagger-1">
              <Controller
                control={control}
                name="id_type"
                render={({ field }) => (
                  <Select
                    label="Identity Type"
                    error={errors.id_type?.message}
                    options={[
                      { value: "aadhaar", label: "Aadhaar Card" },
                      { value: "passport", label: "Passport" },
                      { value: "other", label: "Other Government ID" },
                    ]}
                    {...field}
                  />
                )}
              />
            </div>

            <div className="field-animate field-stagger-2">
              <div className="relative">
                <Input
                  label={`${watchIdType === "aadhaar" ? "Aadhaar" : watchIdType === "passport" ? "Passport" : "ID"} Number`}
                  placeholder={
                    watchIdType === "aadhaar"
                      ? "1234 5678 9012"
                      : watchIdType === "passport"
                      ? "A1234567"
                      : "Enter ID number"
                  }
                  icon={<CreditCard className="w-4 h-4" />}
                  type={showIdNumber ? "text" : "password"}
                  error={errors.id_number?.message}
                  {...register("id_number")}
                />
                <button
                  type="button"
                  onClick={() => setShowIdNumber(!showIdNumber)}
                  className="absolute right-3 top-[38px] text-muted hover:text-fg transition-colors"
                >
                  {showIdNumber ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted mt-1.5 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {idNumberHint[watchIdType] || "Enter your identity number"}
              </p>
            </div>

            <div className="field-animate field-stagger-3">
              <div className="p-3 rounded-lg bg-warning-50 border border-warning-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-warning-dark font-medium">Privacy Notice</p>
                  <p className="text-xs text-warning-dark/80 mt-0.5">
                    Do not use real Aadhaar or passport data during testing. Use mock data only.
                  </p>
                </div>
              </div>
            </div>

            <div className="field-animate field-stagger-4">
              <label className="block text-sm font-medium text-fg mb-2">
                Identity Photograph <span className="text-muted font-normal">(optional)</span>
              </label>
              <div className="flex items-center gap-4">
                <div
                  className={`w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all duration-300 ${
                    photoPreview
                      ? "border-success bg-success-50"
                      : "border-border bg-bg hover:border-primary hover:bg-primary-50"
                  }`}
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="ID preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="w-6 h-6 text-muted" />
                  )}
                </div>
                <div>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-fg hover:bg-surface-light/5 transition-all">
                    <Upload className="w-4 h-4" />
                    {photoPreview ? "Change Photo" : "Upload Photo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setPhotoPreview(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  <p className="text-xs text-muted mt-1">JPEG or PNG, max 5MB</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-danger-100 flex items-center justify-center">
                <Phone className="w-5 h-5 text-danger" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-fg">Emergency Contact</h2>
                <p className="text-xs text-muted">Someone we can reach in case of emergency</p>
              </div>
            </div>

            <div className="field-animate field-stagger-1">
              <Input
                label="Contact Full Name"
                placeholder="e.g. Priya Sharma"
                icon={<User className="w-4 h-4" />}
                error={errors.emergency_contact_name?.message}
                {...register("emergency_contact_name")}
              />
            </div>

            <div className="field-animate field-stagger-2">
              <Input
                label="Contact Phone Number"
                placeholder="+91 98765 43210"
                icon={<Phone className="w-4 h-4" />}
                error={errors.emergency_contact_phone?.message}
                {...register("emergency_contact_phone")}
              />
            </div>

            <div className="field-animate field-stagger-3 p-4 rounded-xl bg-surface-light/5 border border-border">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-danger-100 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-danger" />
                </div>
                <div>
                  <p className="text-sm font-medium text-fg">Why do we need this?</p>
                  <p className="text-xs text-muted mt-1">
                    In case of emergencies, alerts, or safety incidents, our system will automatically
                    notify your emergency contact along with your last known location.
                  </p>
                </div>
              </div>
            </div>

            <div className="field-animate field-stagger-4">
              <Link
                href="/emergency"
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-dark transition-colors"
              >
                <Phone className="w-4 h-4" />
                View all emergency helpline numbers
              </Link>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-success-100 flex items-center justify-center">
                <MapPinned className="w-5 h-5 text-success" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-fg">Trip Itinerary</h2>
                <p className="text-xs text-muted">Plan your journey for safety monitoring</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 field-animate field-stagger-1">
              <Input
                label="Trip Start Date"
                type="date"
                icon={<CalendarDays className="w-4 h-4" />}
                error={errors.trip_start?.message}
                {...register("trip_start")}
              />
              <Input
                label="Trip End Date"
                type="date"
                icon={<CalendarDays className="w-4 h-4" />}
                error={errors.trip_end?.message}
                {...register("trip_end")}
              />
            </div>

            {errors.trip_end && !errors.trip_start && (
              <p className="text-danger text-xs animate-shake flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {errors.trip_end.message}
              </p>
            )}

            <div className="field-animate field-stagger-2">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-fg">Planned Stops</label>
                <span className="text-xs text-muted bg-surface-light/10 px-2 py-0.5 rounded-full">
                  {itineraryFields.length} stop{itineraryFields.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-3">
                {itineraryFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="relative p-4 rounded-xl border border-border bg-bg/50 field-animate"
                    style={{ animationDelay: `${index * 0.08}s` }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-success text-white flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-fg">
                        Stop {index + 1}
                      </span>
                      {itineraryFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeStop(index)}
                          className="ml-auto p-1.5 rounded-lg text-danger hover:bg-danger-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        placeholder="Place name (e.g. Gangtok)"
                        icon={<MapPin className="w-4 h-4" />}
                        error={errors.itinerary?.[index]?.place?.message}
                        {...register(`itinerary.${index}.place`)}
                      />
                      <Input
                        type="date"
                        icon={<CalendarDays className="w-4 h-4" />}
                        error={errors.itinerary?.[index]?.planned_date?.message}
                        {...register(`itinerary.${index}.planned_date`)}
                      />
                      <input
                        type="hidden"
                        {...register(`itinerary.${index}.lat`)}
                      />
                      <input
                        type="hidden"
                        {...register(`itinerary.${index}.lng`)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {errors.itinerary && typeof errors.itinerary === "object" && !Array.isArray(errors.itinerary) && (
                <p className="text-danger text-xs mt-2 flex items-center gap-1 animate-shake">
                  <AlertTriangle className="w-3 h-3" />
                  {errors.itinerary.message}
                </p>
              )}
            </div>

            <div className="field-animate field-stagger-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  addStop({
                    place: "",
                    lat: 27.3389,
                    lng: 88.6065,
                    planned_date: watchTripStart || "",
                  })
                }
                icon={<Plus className="w-4 h-4" />}
              >
                Add Another Stop
              </Button>
            </div>

            <div className="field-animate field-stagger-4 p-4 rounded-xl bg-success-50 border border-success-200">
              <div className="flex items-start gap-3">
                <Navigation className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-success-dark">Safety Monitoring Active</p>
                  <p className="text-xs text-success-dark/70 mt-0.5">
                    Your itinerary helps our system detect anomalies and ensure your safety. If you
                    deviate significantly from your plan, authorities will be notified.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-fg">Review & Consent</h2>
                <p className="text-xs text-muted">Verify your details and provide consent</p>
              </div>
            </div>

            <div className="field-animate field-stagger-1">
              <h3 className="text-sm font-medium text-fg mb-3">Personal Details</h3>
              <div className="grid grid-cols-2 gap-2">
                <ReviewField icon={User} label="Full Name" value={watch("full_name")} />
                <ReviewField
                  icon={CreditCard}
                  label="Identity"
                  value={`${watchIdType.toUpperCase()} • ${showIdNumber ? watch("id_number") : "••••••••"}`}
                />
              </div>
            </div>

            <div className="field-animate field-stagger-2">
              <h3 className="text-sm font-medium text-fg mb-3">Contact Information</h3>
              <div className="grid grid-cols-2 gap-2">
                <ReviewField icon={Phone} label="Phone" value={watch("phone")} color="text-primary" />
                <ReviewField icon={Mail} label="Email" value={watch("email")} color="text-primary" />
                <ReviewField
                  icon={User}
                  label="Emergency Contact"
                  value={watch("emergency_contact_name")}
                  color="text-danger"
                />
                <ReviewField
                  icon={Phone}
                  label="Emergency Phone"
                  value={watch("emergency_contact_phone")}
                  color="text-danger"
                />
              </div>
            </div>

            <div className="field-animate field-stagger-3">
              <h3 className="text-sm font-medium text-fg mb-3">Trip Details</h3>
              <div className="grid grid-cols-2 gap-2">
                <ReviewField
                  icon={CalendarDays}
                  label="Start Date"
                  value={watchTripStart ? new Date(watchTripStart).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                  color="text-success"
                />
                <ReviewField
                  icon={CalendarDays}
                  label="End Date"
                  value={watch("trip_end") ? new Date(watch("trip_end")).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                  color="text-success"
                />
              </div>
              {watchItinerary && watchItinerary.length > 0 && (
                <div className="mt-2 p-3 rounded-lg bg-bg/50">
                  <p className="text-xs text-muted font-medium mb-2">Itinerary ({watchItinerary.length} stops)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {watchItinerary.map(
                      (stop, i) =>
                        stop.place && (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success-50 text-success-dark text-xs font-medium border border-success-200"
                          >
                            <MapPin className="w-3 h-3" />
                            {stop.place}
                          </span>
                        )
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="field-animate field-stagger-4">
              <h3 className="text-sm font-medium text-fg mb-3">
                Contact Details <span className="text-danger">*</span>
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Phone Number"
                  placeholder="+91 98765 43210"
                  icon={<Phone className="w-4 h-4" />}
                  error={errors.phone?.message}
                  {...register("phone")}
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  icon={<Mail className="w-4 h-4" />}
                  error={errors.email?.message}
                  {...register("email")}
                />
              </div>
            </div>

            <div className="field-animate field-stagger-5">
              <div
                className={`p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                  watchConsent
                    ? "border-success bg-success-50"
                    : errors.consent_tracking
                    ? "border-danger bg-danger-50"
                    : "border-border bg-bg/50 hover:border-primary"
                }`}
                onClick={() => {
                  const current = watch("consent_tracking");
                  // We can't programmatically set with register, so we use a real checkbox
                }}
              >
                <Controller
                  control={control}
                  name="consent_tracking"
                  render={({ field }) => (
                    <label className="flex items-start gap-3 cursor-pointer">
                      <div className="relative mt-0.5">
                        <input
                          type="checkbox"
                          checked={!!field.value}
                          onChange={(e) => field.onChange(e.target.checked ? true : undefined)}
                          className="sr-only"
                        />
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                            field.value
                              ? "bg-success border-success"
                              : errors.consent_tracking
                              ? "border-danger"
                              : "border-border"
                          }`}
                        >
                          {field.value && (
                            <CheckCircle className="w-3.5 h-3.5 text-white" />
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-fg">
                          I consent to real-time location tracking{" "}
                          <span className="text-danger">*</span>
                        </p>
                        <p className="text-xs text-muted mt-1">
                          Your GPS location will be monitored during your trip for safety purposes.
                          This enables instant alerts to authorities and your emergency contact if an
                          anomaly is detected. Data is encrypted and stored on a blockchain ledger.
                        </p>
                      </div>
                    </label>
                  )}
                />
              </div>
              {errors.consent_tracking && (
                <p className="text-danger text-xs mt-2 flex items-center gap-1 animate-shake">
                  <AlertTriangle className="w-3 h-3" />
                  {errors.consent_tracking.message}
                </p>
              )}
            </div>

            <div className="field-animate field-stagger-6">
              <div className="p-4 rounded-xl bg-primary-50 border border-primary-200">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-primary-dark">How your data is protected</p>
                    <ul className="text-xs text-primary-dark/70 mt-1.5 space-y-1">
                      <li className="flex items-center gap-1.5">
                        <Globe className="w-3 h-3" />
                        Blockchain-secured digital identity
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Shield className="w-3 h-3" />
                        End-to-end encrypted data transmission
                      </li>
                      <li className="flex items-center gap-1.5">
                        <FileText className="w-3 h-3" />
                        Data retention per government policy
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (mode === "success" && result) {
    return (
      <div className="min-h-screen bg-bg py-12 pt-24">
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
        {confetti.map((c) => (
          <ConfettiPiece key={c.id} {...c} />
        ))}
        <div className="max-w-lg mx-auto px-4 animate-bounce-in">
          <Card variant="elevated" className="text-center">
            <SuccessCheckmark />

            <h1 className="text-2xl font-bold text-fg mb-2">Registration Complete!</h1>
            <p className="text-muted text-sm mb-6">
              Your blockchain-secured Digital Tourist ID is ready
            </p>

            <div className="border border-border rounded-xl p-5 mb-4 bg-bg/50">
              <h2 className="font-semibold text-fg mb-1">Your Digital Tourist ID</h2>
              <p className="text-xs text-muted mb-3">
                {result.tourist?.full_name || watchFullName}
              </p>

              <div className="relative inline-block mb-4">
                <img
                  src={result.qrDataUrl}
                  alt="QR Code"
                  className="mx-auto rounded-xl shadow-lg border border-border"
                />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-success rounded-full flex items-center justify-center shadow-lg">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted">
                <p>
                  Tourist ID:{" "}
                  <span className="font-mono text-fg text-xs bg-surface-light/10 px-2 py-0.5 rounded">
                    {result.tourist?.id}
                  </span>
                </p>
                <p>
                  Block ID:{" "}
                  <span className="font-mono text-fg text-xs bg-surface-light/10 px-2 py-0.5 rounded">
                    {result.digitalId?.block_id}
                  </span>
                </p>
                <p>
                  Valid:{" "}
                  {new Date(result.digitalId?.issued_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  —{" "}
                  {new Date(result.digitalId?.expires_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="bg-success-50 border border-success-200 rounded-xl p-3 text-center text-sm text-success font-medium mb-4">
              <div className="flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Secured on blockchain — Block #{result.digitalId?.block_id?.slice(0, 8)}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={`/digital-id?id=${result.tourist?.id}&block=${result.digitalId?.block_id}`} className="flex-1">
                <Button variant="accent" className="w-full" icon={<Sparkles className="w-4 h-4" />}>
                  View Digital ID
                </Button>
              </Link>
              <Link href="/safety" className="flex-1">
                <Button variant="outline" className="w-full" icon={<Shield className="w-4 h-4" />}>
                  Safety Tips
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button variant="primary" className="w-full">
                  Go to Home
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pt-24 pb-12">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="relative inline-block mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg animate-float">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center animate-bounce-in">
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-fg">
            Tourist{" "}
            <span className="gradient-text">Registration</span>
          </h1>
          <p className="text-muted mt-2 text-sm">
            Create your blockchain-secured Digital Tourist ID
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 animate-fade-in-up">
          <div className="relative">
            {/* Progress Bar Background */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-border rounded-full mx-10" />
            {/* Progress Bar Fill */}
            <div
              className="absolute top-5 left-0 h-1 bg-gradient-to-r from-primary to-success rounded-full mx-10 progress-animated transition-all duration-500"
              style={{ width: `calc(${getProgressPercent()}% - 5rem)` }}
            />

            <div className="relative flex items-center justify-between">
              {steps.map((s, i) => {
                const Icon = s.icon;
                const isActive = currentStep === s.id;
                const isCompleted = currentStep > s.id;
                return (
                  <div
                    key={s.id}
                    className="flex flex-col items-center cursor-pointer"
                    onClick={() => {
                      if (s.id < currentStep) goToStep(s.id);
                    }}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? "bg-success text-white shadow-md"
                          : isActive
                          ? "bg-primary text-white shadow-glow animate-counter-pulse"
                          : "bg-white border-2 border-border text-muted hover:border-primary/50"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`text-xs mt-1.5 font-medium transition-colors hidden sm:block ${
                        isActive ? "text-primary" : isCompleted ? "text-success" : "text-muted"
                      }`}
                    >
                      {s.title}
                    </span>
                    <span className="text-[10px] text-muted mt-0.5 hidden sm:block">
                      {s.subtitle}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          {apiError && (
            <div className="bg-danger-50 border border-danger-200 text-danger p-3 rounded-xl text-sm mb-4 animate-shake flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {apiError}
            </div>
          )}

          <Card variant="elevated" ref={cardRef} className="overflow-hidden">
            {/* Step Header Badge */}
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
              <div className="text-xs font-medium text-muted bg-surface-light/10 px-2.5 py-1 rounded-full">
                Step {currentStep} of {steps.length}
              </div>
              <div className="text-xs text-muted">—</div>
              <div className="text-xs font-medium text-fg">
                {steps[currentStep - 1].title}
              </div>
            </div>

            {renderStepContent()}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              <div>
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={prevStep}
                    icon={<ChevronLeft className="w-4 h-4" />}
                  >
                    Back
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {currentStep < 5 ? (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={nextStep}
                    iconRight={<ChevronRight className="w-4 h-4" />}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="accent"
                    loading={isSubmitting}
                    icon={<Sparkles className="w-4 h-4" />}
                  >
                    Register & Get Digital ID
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Trust Indicators */}
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted animate-fade-in">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-success" />
              <span>256-bit Encrypted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span>Blockchain Secured</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-accent" />
              <span>GDPR Compliant</span>
            </div>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}
