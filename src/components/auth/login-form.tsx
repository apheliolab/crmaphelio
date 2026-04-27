"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, LoaderCircle, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("apheliolab@gmail.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nextPath = searchParams.get("next") || "/dashboard";

  return (
    <div className="form-panel rounded-lg p-6">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.22em] text-accent">Acesso seguro</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Entrar no Aphelio CRM</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Use suas credenciais do Supabase Auth para acessar seu ambiente.
        </p>
      </div>

      <form
        className="grid gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);
          setLoading(true);

          try {
            const supabase = createClient();
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (signInError) {
              setError(signInError.message);
              return;
            }

            router.replace(nextPath);
            router.refresh();
          } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : "Nao foi possivel iniciar a sessao.");
          } finally {
            setLoading(false);
          }
        }}
      >
        <label className="grid gap-2 text-sm">
          Email
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label className="grid gap-2 text-sm">
          Senha
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>

        {error ? (
          <div className="rounded-md border border-[#8f2531]/30 bg-[#8f2531]/12 p-3 text-sm text-[#ffb8c0]">
            {error}
          </div>
        ) : null}

        <Button type="submit" size="lg" className="mt-2" disabled={loading}>
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          Entrar no CRM
        </Button>
      </form>

      <div className="mt-6 flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.045] p-3 text-xs text-muted">
        <LockKeyhole className="h-4 w-4 text-accent" />
        Sessao protegida por Supabase Auth e pronta para perfis `admin` e `user`.
      </div>
    </div>
  );
}

