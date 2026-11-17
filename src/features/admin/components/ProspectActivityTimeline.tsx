"use client";
import { getDisplayErrorMessage } from "@/lib/error-message";

import { FormEvent, useEffect, useState } from "react";
import {
  FiActivity,
  FiCalendar,
  FiCheckCircle,
  FiMail,
  FiMessageCircle,
  FiPhone,
  FiPlus,
} from "react-icons/fi";
import { Select } from "@/components/ui/select";
import { Button } from "./ui/Button";

type Activity = {
  id: string;
  type: string;
  content: string;
  occurredAt: string;
};
const activityIcons: Record<string, typeof FiActivity> = {
  note: FiActivity,
  call: FiPhone,
  email: FiMail,
  message: FiMessageCircle,
  meeting: FiCalendar,
  "status-change": FiCheckCircle,
};
const typeLabels: Record<string, string> = {
  note: "Note",
  call: "Call",
  email: "Email",
  message: "Message",
  meeting: "Meeting",
  "status-change": "Status",
};

function csrfToken() {
  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("nlarge_admin_csrf="))
    ?.split("=")[1];
}

export default function ProspectActivityTimeline({
  prospectId,
  initialActivities,
  hasMore: initiallyHasMore,
}: {
  prospectId: string;
  initialActivities: Activity[];
  hasMore: boolean;
}) {
  const [activities, setActivities] = useState(initialActivities);
  const [hasMore, setHasMore] = useState(initiallyHasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setActivities(initialActivities);
    setHasMore(initiallyHasMore);
  }, [initialActivities, initiallyHasMore]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const token = csrfToken();
    setPending(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/prospects/${prospectId}/activities`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "x-csrf-token": decodeURIComponent(token) } : {}),
          },
          body: JSON.stringify(data),
        },
      );
      const result = (await response.json()) as {
        activity?: Activity;
        error?: string;
      };
      if (!response.ok || !result.activity) {
        setError(result.error ?? "Unable to save activity.");
        return;
      }
      setActivities((current) => [result.activity!, ...current]);
      form.reset();
    } catch (error) {
      setError(
        getDisplayErrorMessage(
          error,
          "Unable to save activity. Check your connection and try again.",
        ),
      );
    } finally {
      setPending(false);
    }
  }

  async function loadMore() {
    const oldest = activities.at(-1);
    if (!oldest || loadingMore) return;
    setLoadingMore(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/prospects/${prospectId}/activities?before=${encodeURIComponent(oldest.id)}`,
      );
      const result = (await response.json()) as {
        activities?: Activity[];
        hasMore?: boolean;
        error?: string;
      };
      if (!response.ok || !result.activities) {
        setError(result.error ?? "Unable to load older activity.");
        return;
      }
      setActivities((current) => [...current, ...result.activities!]);
      setHasMore(Boolean(result.hasMore));
    } catch (error) {
      setError(
        getDisplayErrorMessage(
          error,
          "Unable to load older activity. Check your connection and try again.",
        ),
      );
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <section
      aria-labelledby="prospect-activity-heading"
      className="rounded-2xl border border-[#e8e0da] bg-white p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="prospect-activity-heading" className="text-lg font-semibold">
            Activity
          </h2>
          <p className="mt-1 text-sm text-black/55">
            Keep notes on conversations and next steps.
          </p>
        </div>
        <span className="rounded-full bg-[#f4f1ed] px-3 py-1 text-xs font-medium text-black/65 shrink-0">
          {activities.length} shown
        </span>
      </div>
      <form onSubmit={submit} className="mt-5 rounded-xl bg-[#fffdfb]">
        <label className="block text-sm font-medium">
          Add an activity
          <Select name="type" defaultValue="note" className="mt-1.5">
            <option value="note">Note</option>
            <option value="call">Call</option>
            <option value="email">Email</option>
            <option value="message">Message</option>
            <option value="meeting">Meeting</option>
          </Select>
        </label>
        <label className="mt-3 block text-sm font-medium">
          What happened?
          <textarea
            name="content"
            required
            maxLength={3000}
            rows={3}
            className="mt-1.5 w-full rounded-xl border border-black/15 bg-white p-3 outline-none focus-visible:ring-2 focus-visible:ring-[#602329]"
          />
        </label>
        {error && (
          <p role="alert" className="mt-3 text-sm text-[#602329]">
            {error}
          </p>
        )}
        <Button type="submit" disabled={pending} className="mt-3 gap-2">
          <FiPlus aria-hidden="true" />
          {pending ? "Adding…" : "Add activity"}
        </Button>
      </form>

      {activities.length ? (
        <ol className="mt-5">
          {activities.map((activity, index) => {
            const Icon = activityIcons[activity.type] ?? FiActivity;
            return (
              <li
                key={activity.id}
                className="relative flex gap-3 pb-5 last:pb-0"
              >
                {index !== activities.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[0.9rem] top-8 h-[calc(100%-1rem)] w-px bg-[#e8e0da]"
                  />
                )}
                <span
                  className={`relative z-10 grid size-8 shrink-0 place-items-center rounded-full ${activity.type === "status-change" ? "bg-[#f7efed] text-[#602329]" : "bg-[#f4f1ed] text-black/65"}`}
                >
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <h3 className="text-sm font-semibold">
                      {typeLabels[activity.type] ?? "Activity"}
                    </h3>
                    <time
                      className="text-xs tabular-nums text-black/65"
                      dateTime={activity.occurredAt}
                    >
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(activity.occurredAt))}
                    </time>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-black/70">
                    {activity.content}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-6 rounded-xl border border-dashed border-black/15 px-4 py-8 text-center text-sm text-black/55">
          No activity yet. Add a note to start the history.
        </p>
      )}
      {hasMore && (
        <Button
          type="button"
          variant="outline"
          disabled={loadingMore}
          onClick={loadMore}
          className="mt-5 w-full"
        >
          {loadingMore ? "Loading…" : "Load older activity"}
        </Button>
      )}
    </section>
  );
}
