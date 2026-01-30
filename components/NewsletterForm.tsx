"use client";

import { useState, type FormEvent } from "react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "loading" | "success" | "error";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !EMAIL_REGEX.test(trimmed)) {
      setStatus("error");
      setMessage("Enter a valid email address.");
      return;
    }

    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: trimmed, source: "homepage" }),
      });

      if (res.ok) {
        setStatus("success");
        setMessage("You're on the list. Expect fresh drops soon.");
        setEmail("");
      } else if (res.status === 400) {
        setStatus("error");
        setMessage("That email looks invalid. Double-check it.");
      } else {
        setStatus("error");
        setMessage("Something went wrong. Try again in a moment.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Try again shortly.");
    }
  };

  return (
    <form className="panel-form" onSubmit={submit}>
      <label className="label" htmlFor="newsletter-email">
        Email
      </label>
      <input
        id="newsletter-email"
        className="input"
        type="email"
        placeholder="you@email.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <button className="btn btn--primary" type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Saving..." : "Notify me"}
      </button>
      {message ? (
        <p
          className={`form-status form-status--${status}`}
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
