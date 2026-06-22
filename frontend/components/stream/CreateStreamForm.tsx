"use client";

import { useState } from "react";
import { useStreamOperations } from "@/hooks/useStreamOperations";
import { useWallet } from "@/context/wallet-context";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

const MOCK_CONTRACT_ID =
  "CA4CJE3MOWW5Q3J4W6DXLX4JRUBGMY4KTJ2FWQ2SPNB2B7IXWNFQR3C7";

const SUPPORTED_TOKENS = [
  { address: "CA4CJE3MOWW5Q3J4W6DXLX4JRUBGMY4KTJ2FWQ2SPNB2B7IXWNFQR3C7", symbol: "XLM" },
  { address: "CCW67TSZV3VQV2KET2DA3C5ZGM4BFK3N5SG7ZPDMMF5KEMPBQFEU42XA", symbol: "USDC" },
  { address: "CDOOWXTET5QPP2NFPJA5GGUN7JGWHYZQW33WMYV3MHTJFRHXN4BPOLDE", symbol: "EURC" },
] as const;

interface FormData {
  recipient: string;
  tokenAddress: string;
  amount: string;
  duration: string;
}

interface FormErrors {
  recipient?: string;
  amount?: string;
  duration?: string;
}

export function CreateStreamForm() {
  const { session } = useWallet();
  const { createStream, isLoading, error } = useStreamOperations(MOCK_CONTRACT_ID);
  const [formData, setFormData] = useState<FormData>({
    recipient: "",
    tokenAddress: SUPPORTED_TOKENS[0].address,
    amount: "",
    duration: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [streamId, setStreamId] = useState<string | null>(null);

  const validate = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.recipient.trim()) {
      errors.recipient = "Recipient address is required.";
    } else if (!formData.recipient.startsWith("G") || formData.recipient.length < 30) {
      errors.recipient = "Enter a valid Stellar public key (starts with G).";
    }

    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      errors.amount = "Enter a valid positive amount.";
    }

    const duration = parseInt(formData.duration, 10);
    if (!formData.duration || isNaN(duration) || duration <= 0) {
      errors.duration = "Enter a valid duration in seconds.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStreamId(null);

    const params = {
      recipient: formData.recipient.trim(),
      tokenAddress: formData.tokenAddress,
      amount: parseFloat(formData.amount),
      duration: parseInt(formData.duration, 10),
    };

    createStream(params, (id) => {
      setStreamId(id);
    });
  };

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field as keyof FormErrors];
        return next;
      });
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-slate-500">Connect your wallet to create a stream.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card rounded-2xl p-6 sm:p-8 space-y-6 max-w-xl mx-auto"
      data-testid="create-stream-form"
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground">Create Payment Stream</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Set up a real-time payment stream to any Stellar address.
        </p>
      </div>

      {streamId && (
        <div
          className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/10 p-4"
          data-testid="stream-success"
        >
          <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Stream created successfully
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              ID: {streamId}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label
            htmlFor="recipient"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Recipient Address
          </label>
          <input
            id="recipient"
            type="text"
            value={formData.recipient}
            onChange={(e) => updateField("recipient", e.target.value)}
            placeholder="GABCDEFGHIJKLMNOPQRSTUVWXYZ..."
            className="w-full rounded-xl border border-glass-border bg-glass px-4 py-3 text-sm text-foreground font-mono placeholder:text-slate-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
            data-testid="input-recipient"
          />
          {formErrors.recipient && (
            <p className="mt-1 text-xs text-red-400">{formErrors.recipient}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="token"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Token
          </label>
          <select
            id="token"
            value={formData.tokenAddress}
            onChange={(e) => updateField("tokenAddress", e.target.value)}
            className="w-full rounded-xl border border-glass-border bg-glass px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
            data-testid="select-token"
          >
            {SUPPORTED_TOKENS.map((token) => (
              <option key={token.address} value={token.address}>
                {token.symbol}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Total Amount
            </label>
            <input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => updateField("amount", e.target.value)}
              min="0"
              step="0.01"
              placeholder="100"
              className="w-full rounded-xl border border-glass-border bg-glass px-4 py-3 text-sm text-foreground placeholder:text-slate-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
              data-testid="input-amount"
            />
            {formErrors.amount && (
              <p className="mt-1 text-xs text-red-400">{formErrors.amount}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="duration"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Duration (seconds)
            </label>
            <input
              id="duration"
              type="number"
              value={formData.duration}
              onChange={(e) => updateField("duration", e.target.value)}
              min="1"
              step="1"
              placeholder="3600"
              className="w-full rounded-xl border border-glass-border bg-glass px-4 py-3 text-sm text-foreground placeholder:text-slate-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
              data-testid="input-duration"
            />
            {formErrors.duration && (
              <p className="mt-1 text-xs text-red-400">{formErrors.duration}</p>
            )}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !!streamId}
        className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-accent text-background font-semibold text-sm shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        data-testid="btn-create-stream"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating Stream…
          </>
        ) : (
          <>
            Create Stream
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}
