"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

async function gate(token: string) {
  const r = await fetch("/api/check", { headers: { "x-admin-token": token } });
  return r.ok;
}

export default function Admin() {
  const [ok, setOk] = useState(false);
  const [status, setStatus] = useState("");
  const [tokenInput, setTokenInput] = useState("");

  const [url, setUrl] = useState("");
  const [form, setForm] = useState({
    title: "",
    url: "",
    price: "",
    image: "",
    description: "",
    source: "amazon.com",
  });

  useEffect(() => {
    const saved = localStorage.getItem("ADMIN_TOKEN");
    if (saved) gate(saved).then((valid) => setOk(valid));
  }, []);

  const unlock = async () => {
    const pass = tokenInput.trim();
    if (!pass) {
      setStatus("Enter your admin token.");
      return;
    }
    setStatus("Checking...");
    const valid = await gate(pass);
    if (valid) {
      localStorage.setItem("ADMIN_TOKEN", pass);
      setOk(true);
      setStatus("Unlocked.");
    } else {
      setStatus("Invalid token.");
    }
  };

  const doImport = async () => {
    setStatus("Importing...");
    const res = await fetch("/api/import", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-admin-token": localStorage.getItem("ADMIN_TOKEN") || "",
      },
      body: JSON.stringify({ url }),
    });

    if (!res.ok) {
      if (res.status === 400) {
        setStatus("Amazon product URL required.");
      } else {
        setStatus("Import failed.");
      }
      return;
    }
    const data = await res.json();
    if (data.url) setUrl(data.url);
    setForm({
      title: data.title || "",
      url: data.url || url,
      price: data.price || "",
      image: data.image || "",
      description: data.description || "",
      source: data.siteName || "amazon.com",
    });
    setStatus("Imported metadata. Review and save.");
  };

  const save = async () => {
    setStatus("Saving...");
    const res = await fetch("/api/deals", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-admin-token": localStorage.getItem("ADMIN_TOKEN") || "",
      },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setStatus("Saved!");
    } else if (res.status === 409) {
      setStatus("Daily limit reached (50/day).");
    } else if (res.status === 400) {
      setStatus("Amazon product URL required.");
    } else {
      setStatus("Save failed (duplicate URL or DB error).");
    }
  };

  if (!ok) {
    return (
      <div className="page admin-page">
        <header className="page-header">
          <div>
            <p className="eyebrow">Admin</p>
            <h1 className="page-title">Unlock dashboard</h1>
            <p className="page-subtitle">
              Enter your admin token to continue.
            </p>
          </div>
          <Link href="/" className="btn btn--ghost">
            Back to site
          </Link>
        </header>

        <section className="card">
          <div className="field field--full">
            <label className="label" htmlFor="admin-token">
              Admin token
            </label>
            <input
              id="admin-token"
              type="password"
              className="input"
              placeholder="Enter admin token"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
            />
          </div>
          <div className="form-actions">
            <button className="btn btn--primary" onClick={unlock}>
              Unlock
            </button>
          </div>
          {status ? (
            <p className="status" role="status">
              {status}
            </p>
          ) : null}
        </section>
      </div>
    );
  }

  return (
    <div className="page admin-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="page-title">Import or add an Amazon deal</h1>
          <p className="page-subtitle">
            Fetch metadata fast or enter the details manually. Amazon only.
          </p>
        </div>
        <Link href="/" className="btn btn--ghost">
          Back to site
        </Link>
      </header>

      <section className="card">
        <h2 className="card__title">Import metadata</h2>
        <p className="muted">
          Paste an Amazon product URL and fetch title, description, and image.
        </p>
        <div className="field field--full">
          <label className="label" htmlFor="import-url">
            Deal URL
          </label>
          <input
            id="import-url"
            className="input"
            placeholder="https://www.amazon.com/dp/PRODUCTID"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className="form-actions">
          <button className="btn btn--primary" onClick={doImport}>
            Fetch metadata
          </button>
        </div>
      </section>

      <section className="card">
        <h2 className="card__title">Deal details</h2>
        <div className="form-grid">
          <div className="field field--full">
            <label className="label" htmlFor="deal-title">
              Title
            </label>
            <input
              id="deal-title"
              className="input"
              placeholder="Deal title"
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
            />
          </div>

          <div className="field field--full">
            <label className="label" htmlFor="deal-url">
              URL
            </label>
            <input
              id="deal-url"
              className="input"
              placeholder="https://www.amazon.com/dp/PRODUCTID"
              value={form.url}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, url: e.target.value }))
              }
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="deal-price">
              Price
            </label>
            <input
              id="deal-price"
              className="input"
              placeholder="$49.99"
              value={form.price}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, price: e.target.value }))
              }
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="deal-source">
              Source
            </label>
            <input
              id="deal-source"
              className="input"
              placeholder="amazon.com"
              value={form.source}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, source: e.target.value }))
              }
            />
          </div>

          <div className="field field--full">
            <label className="label" htmlFor="deal-description">
              Description
            </label>
            <textarea
              id="deal-description"
              className="textarea"
              placeholder="Short summary of the deal"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>

          <div className="field field--full">
            <label className="label" htmlFor="deal-image">
              Image URL
            </label>
            <input
              id="deal-image"
              className="input"
              placeholder="https://..."
              value={form.image}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, image: e.target.value }))
              }
            />
          </div>
        </div>

        {form.image ? (
          <img
            src={form.image}
            alt="preview"
            className="preview-image"
            onError={() => setForm((prev) => ({ ...prev, image: "" }))}
          />
        ) : (
          <p className="muted">No image yet. Paste one if needed.</p>
        )}

        <div className="form-actions">
          <button className="btn btn--primary" onClick={save}>
            Save deal
          </button>
          <Link href="/" className="btn btn--ghost">
            Preview site
          </Link>
        </div>

        {status ? (
          <p className="status" role="status">
            {status}
          </p>
        ) : null}
      </section>
    </div>
  );
}
