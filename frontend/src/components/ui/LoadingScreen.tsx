"use client";

export function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg">
      <div className="relative mb-8">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center animate-bounce-in">
          <span className="text-white font-bold text-xl">ST</span>
        </div>
        <div className="absolute inset-0 w-16 h-16 bg-primary rounded-2xl animate-pulse-ring opacity-50" />
      </div>
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce-in" style={{ animationDelay: "0s" }} />
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce-in" style={{ animationDelay: "0.1s" }} />
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce-in" style={{ animationDelay: "0.2s" }} />
      </div>
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}
