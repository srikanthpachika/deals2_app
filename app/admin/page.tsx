'use client';
import { useEffect, useState } from 'react';

async function gate(token: string) {
  const r = await fetch('/api/check', { headers: { 'x-admin-token': token } });
  return r.ok;
}

export default function Admin() {
  const [ok, setOk] = useState(false);
  const [status, setStatus] = useState('');
  const [tokenInput, setTokenInput] = useState('');

  const [url, setUrl] = useState('');
  const [form, setForm] = useState({
    title: '',
    url: '',
    price: '',
    image: '',
    description: '',
    source: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem('ADMIN_TOKEN');
    if (saved) gate(saved).then(valid => setOk(valid));
  }, []);

  const unlock = async () => {
    const pass = tokenInput.trim();
    if (!pass) {
      setStatus('Enter your admin token.');
      return;
    }
    setStatus('Checking…');
    const valid = await gate(pass);
    if (valid) {
      localStorage.setItem('ADMIN_TOKEN', pass);
      setOk(true);
      setStatus('Unlocked.');
    } else {
      setStatus('Invalid token.');
    }
  };

  const doImport = async () => {
    setStatus('Importing…');
    const res = await fetch('/api/import', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-token': localStorage.getItem('ADMIN_TOKEN') || '',
      },
      body: JSON.stringify({ url }),
    });

    if (!res.ok) {
      setStatus('Import failed.');
      return;
    }
    const data = await res.json();
    setForm({
      title: data.title || '',
      url,
      price: data.price || '',
      image: data.image || '',
      description: data.description || '',
      source: data.siteName || '',
    });
    setStatus('Imported metadata. Review and save.');
  };

  const save = async () => {
    setStatus('Saving…');
    const res = await fetch('/api/deals', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-token': localStorage.getItem('ADMIN_TOKEN') || '',
      },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setStatus('Saved!');
    } else if (res.status === 409) {
      setStatus('Daily limit reached (50/day).');
    } else {
      setStatus('Save failed (duplicate URL or DB error).');
    }
  };

  if (!ok) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Admin</h1>
        <div className="flex gap-2">
          <input
            type="password"
            className="border rounded p-2"
            placeholder="Enter admin token"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
          />
          <button className="border rounded px-3 py-2" onClick={unlock}>
            Unlock
          </button>
        </div>
        <p className="text-sm opacity-70">{status}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Admin — Import or Add Deal</h1>

      <div className="space-y-2">
        <input
          className="border rounded p-2 w-full"
          placeholder="Paste product/deal URL…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button className="border rounded px-3 py-2" onClick={doImport}>
          Fetch Metadata
        </button>
      </div>

      <div className="grid gap-2">
        {(['title', 'url', 'price', 'description', 'source'] as const).map((k) => (
          <input
            key={k}
            className="border rounded p-2 w-full"
            placeholder={k}
            value={(form as any)[k]}
            onChange={(e) => setForm((prev) => ({ ...prev, [k]: e.target.value }))}
          />
        ))}

        {/* IMAGE FIELD WITH PREVIEW */}
        <div className="space-y-2">
          <input
            className="border rounded p-2 w-full"
            placeholder="image (paste full image URL)"
            value={form.image}
            onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
          />
          {form.image ? (
            <img
              src={form.image}
              alt="preview"
              className="border rounded-xl"
              style={{ maxWidth: 320 }}
              onError={() => setForm((prev) => ({ ...prev, image: '' }))}
            />
          ) : (
            <p className="text-sm opacity-70">
              No image — paste one manually if needed.
            </p>
          )}
        </div>

        <button className="border rounded px-3 py-2" onClick={save}>
          Save Deal
        </button>
      </div>

      <p className="text-sm opacity-70">{status}</p>
    </div>
  );
}
