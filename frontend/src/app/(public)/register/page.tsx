"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/api";

const schema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  id_type: z.enum(["aadhaar", "passport", "other"]),
  id_number: z.string().min(1, "ID number is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Valid email required"),
  emergency_contact_name: z.string().min(1, "Required"),
  emergency_contact_phone: z.string().min(1, "Required"),
  trip_start: z.string().min(1, "Required"),
  trip_end: z.string().min(1, "Required"),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const [step, setStep] = useState<"form" | "success">("form");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      setError("");
      const itinerary = [
        {
          place: "Gangtok",
          lat: 27.3389,
          lng: 88.6065,
          planned_date: data.trip_start,
        },
      ];
      const res = await api.post("/register", { ...data, itinerary });
      setResult(res.data);
      setStep("success");
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed");
    }
  };

  if (step === "success" && result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Registration Complete</h1>
          </div>

          <div className="border rounded-xl p-4 mb-4">
            <h2 className="font-semibold text-lg mb-2">Your Digital Tourist ID</h2>
            <img
              src={result.qrDataUrl}
              alt="QR Code"
              className="mx-auto my-4"
            />
            <p className="text-sm text-gray-600 text-center">
              Tourist ID: <span className="font-mono">{result.tourist.id}</span>
            </p>
            <p className="text-sm text-gray-600 text-center">
              Block ID: <span className="font-mono">{result.digitalId.block_id}</span>
            </p>
            <p className="text-sm text-gray-600 text-center">
              Valid: {new Date(result.digitalId.issued_at).toLocaleDateString()} —{" "}
              {new Date(result.digitalId.expires_at).toLocaleDateString()}
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center text-sm text-green-700">
            ✅ Secured on blockchain ledger — Block #{result.digitalId.block_id.slice(0, 8)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tourist Registration</h1>
          <p className="text-gray-600 mt-2">Create your Digital Tourist ID</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-2xl shadow-sm border p-8 space-y-6"
        >
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                {...register("full_name")}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              {errors.full_name && (
                <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Type
              </label>
              <select
                {...register("id_type")}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="aadhaar">Aadhaar</option>
                <option value="passport">Passport</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Number
              </label>
              <input
                {...register("id_number")}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              {errors.id_number && (
                <p className="text-red-500 text-xs mt-1">{errors.id_number.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                {...register("phone")}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                {...register("email")}
                type="email"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Contact Name
              </label>
              <input
                {...register("emergency_contact_name")}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              {errors.emergency_contact_name && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.emergency_contact_name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Contact Phone
              </label>
              <input
                {...register("emergency_contact_phone")}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              {errors.emergency_contact_phone && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.emergency_contact_phone.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trip Start Date
              </label>
              <input
                {...register("trip_start")}
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              {errors.trip_start && (
                <p className="text-red-500 text-xs mt-1">{errors.trip_start.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trip End Date
              </label>
              <input
                {...register("trip_end")}
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              {errors.trip_end && (
                <p className="text-red-500 text-xs mt-1">{errors.trip_end.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Registering..." : "Register & Get Digital ID"}
          </button>
        </form>
      </div>
    </div>
  );
}
