import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";

// Email + password sign-in / sign-up form, backed by Convex Auth's
// Password provider. Toggling `flow` switches between the two — Convex
// Auth treats them as distinct requests.
export function LoginForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await signIn("password", { email, password, flow });
    } catch (err) {
      toast.error(flow === "signIn" ? "Sign in failed" : "Sign up failed", {
        description:
          err instanceof Error
            ? err.message
            : "Check your email and password and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-1.5 text-left">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5 text-left">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete={flow === "signIn" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" size="lg" disabled={submitting} className="cursor-pointer">
        {submitting && <Loader2 className="size-4 animate-spin" />}
        {flow === "signIn" ? "Sign In" : "Create Account"}
      </Button>
      <button
        type="button"
        onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
        className="cursor-pointer text-xs text-muted-foreground hover:underline"
      >
        {flow === "signIn" ? "Need an account? Sign up" : "Already have an account? Sign in"}
      </button>
    </form>
  );
}
