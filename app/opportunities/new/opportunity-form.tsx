"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createOpportunity, initialCreateState } from "./actions";

export function NewOpportunityForm({
  organizations,
}: {
  organizations: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createOpportunity, initialCreateState);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Organization" required>
        <select
          name="organizationId"
          required
          defaultValue={organizations[0]?.id}
          className="w-full rounded-sm border border-base-3 bg-base-0 px-2 py-1.5 text-sm text-ink-primary"
        >
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Title" required>
        <input
          name="title"
          required
          placeholder="What's the opportunity called?"
          className="w-full rounded-sm border border-base-3 bg-base-0 px-2 py-1.5 text-sm text-ink-primary placeholder:text-ink-tertiary"
        />
      </Field>

      <Field label="Description">
        <textarea
          name="description"
          rows={2}
          placeholder="One or two sentences — what is this?"
          className="w-full rounded-sm border border-base-3 bg-base-0 px-2 py-1.5 text-sm text-ink-primary placeholder:text-ink-tertiary"
        />
      </Field>

      <Field label="Problem statement">
        <textarea
          name="problemStatement"
          rows={2}
          placeholder="What pain does this address, for whom?"
          className="w-full rounded-sm border border-base-3 bg-base-0 px-2 py-1.5 text-sm text-ink-primary placeholder:text-ink-tertiary"
        />
      </Field>

      <Field label="Solution hypothesis">
        <textarea
          name="solutionHypothesis"
          rows={2}
          placeholder="What would you build?"
          className="w-full rounded-sm border border-base-3 bg-base-0 px-2 py-1.5 text-sm text-ink-primary placeholder:text-ink-tertiary"
        />
      </Field>

      <Field label="Buyer description">
        <input
          name="buyerDescription"
          placeholder="Who buys this? (role, company type, etc.)"
          className="w-full rounded-sm border border-base-3 bg-base-0 px-2 py-1.5 text-sm text-ink-primary placeholder:text-ink-tertiary"
        />
      </Field>

      <Field label="Price hypothesis">
        <input
          name="priceHypothesis"
          placeholder="e.g. $99/mo per seat"
          className="w-full rounded-sm border border-base-3 bg-base-0 px-2 py-1.5 text-sm text-ink-primary placeholder:text-ink-tertiary"
        />
      </Field>

      <Field label="MVP estimate (days)">
        <input
          name="mvpDays"
          type="number"
          min={0}
          placeholder="e.g. 14"
          className="w-32 rounded-sm border border-base-3 bg-base-0 px-2 py-1.5 text-sm text-ink-primary placeholder:text-ink-tertiary"
        />
      </Field>

      {state.error && (
        <p className="rounded-sm border border-signal-red bg-base-1 px-3 py-2 text-sm text-signal-red">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-sm bg-signal-gold px-4 py-2 text-sm font-medium text-base-0 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create opportunity"}
        </button>
        <Link
          href="/opportunities"
          className="font-mono text-micro uppercase tracking-wide text-ink-tertiary hover:text-ink-primary"
        >
          Cancel
        </Link>
      </div>
      <p className="font-mono text-micro text-ink-tertiary">
        Starts at DISCOVER. Everything above is optional except title and
        organization — you can fill in the rest, plus PBV evidence, gates, and
        commitments, from the opportunity's own page.
      </p>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block font-mono text-micro uppercase tracking-wide text-ink-tertiary">
        {label}
        {required && <span className="text-signal-gold"> *</span>}
      </label>
      {children}
    </div>
  );
}
