"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "../../lib/supabase";

type Product = {
  id: string;
  name: string;
  series: string;
  price_inr: number;
  condition_note: string;
  badge: string;
  stock_qty: number;
  published: boolean;
  sort_order: number;
  image_url: string | null;
};

type ProductForm = {
  name: string;
  series: string;
  price_inr: string;
  condition_note: string;
  badge: string;
  stock_qty: string;
  published: boolean;
  sort_order: string;
  image_url: string;
};

const emptyForm = (): ProductForm => ({
  name: "",
  series: "",
  price_inr: "",
  condition_note: "",
  badge: "",
  stock_qty: "1",
  published: false,
  sort_order: "0",
  image_url: "",
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AdminPage() {
  const [screen, setScreen] = useState<"checking" | "login" | "admin">(
    "checking",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(photoFile);
    setPhotoPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [photoFile]);

  async function loadProducts() {
    setLoadingProducts(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    setLoadingProducts(false);

    if (error) {
      setMessage(`Could not load products: ${error.message}`);
      return false;
    }

    setProducts((data ?? []) as Product[]);
    return true;
  }

  async function verifyAdmin(userId: string) {
    const { data, error } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      setMessage(
        error
          ? `Could not verify admin access: ${error.message}`
          : "This account is not on the admin list.",
      );
      return false;
    }

    const loaded = await loadProducts();
    if (loaded) setScreen("admin");
    return loaded;
  }

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();
      if (cancelled) return;

      if (error) {
        setMessage(error.message);
        setScreen("login");
        return;
      }

      if (!data.session) {
        setScreen("login");
        return;
      }

      const isAdmin = await verifyAdmin(data.session.user.id);
      if (!isAdmin && !cancelled) {
        await supabase.auth.signOut();
        setScreen("login");
      }
    }

    void checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateField<K extends keyof ProductForm>(
    key: K,
    value: ProductForm[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      setMessage(error?.message ?? "Could not sign in.");
      setBusy(false);
      return;
    }

    const isAdmin = await verifyAdmin(data.user.id);
    if (!isAdmin) await supabase.auth.signOut();
    setBusy(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setProducts([]);
    setScreen("login");
    setMessage("");
  }

  function startNewProduct() {
    setEditingId(null);
    setForm(emptyForm());
    setPhotoFile(null);
    setMessage("");
  }

  function editProduct(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      series: product.series,
      price_inr: String(product.price_inr),
      condition_note: product.condition_note,
      badge: product.badge,
      stock_qty: String(product.stock_qty),
      published: product.published,
      sort_order: String(product.sort_order),
      image_url: product.image_url ?? "",
    });
    setPhotoFile(null);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const price = Number(form.price_inr);
    const stock = Number(form.stock_qty);
    const sortOrder = Number(form.sort_order || 0);

    if (!form.name.trim()) {
      setMessage("Enter a car name.");
      setBusy(false);
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setMessage("Enter a valid price in rupees.");
      setBusy(false);
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setMessage("Stock must be a whole number of zero or more.");
      setBusy(false);
      return;
    }

    const id = editingId ?? slugify(form.name);
    if (!id) {
      setMessage("The car name must include letters or numbers.");
      setBusy(false);
      return;
    }

    try {
      let imageUrl = form.image_url.trim() || null;

      if (photoFile) {
        const extension = photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const safeExtension = extension.replace(/[^a-z0-9]/g, "") || "jpg";
        const path = `${id}-${crypto.randomUUID()}.${safeExtension}`;

        const { error: uploadError } = await supabase.storage
          .from("product-photos")
          .upload(path, photoFile, {
            contentType: photoFile.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        imageUrl = supabase.storage
          .from("product-photos")
          .getPublicUrl(path).data.publicUrl;
      }

      const product = {
        id,
        name: form.name.trim(),
        series: form.series.trim(),
        price_inr: price,
        condition_note: form.condition_note.trim(),
        badge: form.badge.trim(),
        stock_qty: stock,
        published: form.published,
        sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
        image_url: imageUrl,
      };

      let saveError;

      if (editingId) {
        const { id: unchangedId, ...changes } = product;
        void unchangedId;
        const result = await supabase
          .from("products")
          .update(changes)
          .eq("id", editingId);
        saveError = result.error;
      } else {
        const result = await supabase.from("products").insert(product);
        saveError = result.error;
      }

      if (saveError) throw saveError;

      const loaded = await loadProducts();
      if (loaded) {
        setMessage(editingId ? "Car updated." : "Car added.");
        setEditingId(null);
        setForm(emptyForm());
        setPhotoFile(null);
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not save this car.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-page">
      <div className="admin-announcement">
        <span className="announcement-dot" /> THE COLLECTOR&apos;S GARAGE
        <span>·</span> STORE MANAGEMENT
      </div>

      {screen === "checking" ? (
        <div className="admin-loading">Checking your garage access…</div>
      ) : screen === "login" ? (
        <section className="admin-login-card">
          <a className="brand" href="/" aria-label="Little Redline home">
            <span className="brand-mark">LR</span>
            <span className="brand-name">
              little<span>redline</span>
            </span>
          </a>
          <div className="eyebrow admin-kicker">
            <span className="eyebrow-line" /> PRIVATE PIT LANE
          </div>
          <h1>Welcome back,<br /><em>collector.</em></h1>
          <p className="admin-intro">
            Sign in to add cars, update stock, and keep your listings in tune.
          </p>
          <form className="admin-form" onSubmit={handleLogin}>
            <label>
              Email
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {message && <p className="admin-message">{message}</p>}
            <button className="button button-dark" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"} <span>↗</span>
            </button>
          </form>
          <a className="admin-back-link" href="/">← Back to the shop</a>
        </section>
      ) : (
        <div className="admin-shell">
          <header className="admin-header">
            <div>
              <a className="brand" href="/" aria-label="Little Redline home">
                <span className="brand-mark">LR</span>
                <span className="brand-name">
                  little<span>redline</span>
                </span>
              </a>
              <div className="eyebrow admin-kicker">
                <span className="eyebrow-line" /> YOUR COLLECTION
              </div>
              <h1>Cars in the <em>garage.</em></h1>
            </div>
            <div className="admin-header-actions">
              <a className="button button-dark" href="/">
                View shop <span>↗</span>
              </a>
              <button
                className="admin-text-button"
                onClick={handleLogout}
                type="button"
              >
                Sign out
              </button>
            </div>
          </header>

          <div className="admin-grid">
            <section className="admin-panel editor-panel">
              <div className="admin-panel-heading">
                <div>
                  <p className="admin-label">
                    {editingId ? "EDIT A LISTING" : "ADD TO THE LINEUP"}
                  </p>
                  <h2>{editingId ? "Tune this listing" : "Add a car"}</h2>
                </div>
                {editingId && (
                  <button
                    className="admin-text-button"
                    type="button"
                    onClick={startNewProduct}
                  >
                    Cancel
                  </button>
                )}
              </div>

              <form className="admin-form" onSubmit={handleSave}>
                <label>
                  Car name
                  <input
                    required
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="e.g. Nissan Skyline GT-R"
                  />
                </label>

                <label>
                  Series
                  <input
                    value={form.series}
                    onChange={(event) => updateField("series", event.target.value)}
                    placeholder="e.g. JDM Legends"
                  />
                </label>

                <div className="admin-form-row">
                  <label>
                    Price (INR)
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={form.price_inr}
                      onChange={(event) => updateField("price_inr", event.target.value)}
                    />
                  </label>
                  <label>
                    Stock
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={form.stock_qty}
                      onChange={(event) => updateField("stock_qty", event.target.value)}
                    />
                  </label>
                </div>

                <label>
                  Condition and packaging notes
                  <textarea
                    rows={3}
                    value={form.condition_note}
                    onChange={(event) => updateField("condition_note", event.target.value)}
                    placeholder="Describe the car and card condition accurately."
                  />
                </label>

                <label>
                  Listing badge
                  <input
                    value={form.badge}
                    onChange={(event) => updateField("badge", event.target.value)}
                    placeholder="COLLECTOR PICK"
                  />
                </label>

                <label>
                  Display order
                  <input
                    type="number"
                    step="1"
                    value={form.sort_order}
                    onChange={(event) => updateField("sort_order", event.target.value)}
                  />
                </label>

                <label>
                  Product photo
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      if (file && file.size > 5 * 1024 * 1024) {
                        setMessage("Choose an image smaller than 5 MB.");
                        event.target.value = "";
                        return;
                      }
                      setMessage("");
                      setPhotoFile(file);
                    }}
                  />
                  <span className="admin-help">
                    Choosing a new photo replaces the listing photo.
                  </span>
                </label>

                {(photoPreview || form.image_url) && (
                  <img
                    className="admin-photo-preview"
                    src={photoPreview || form.image_url}
                    alt="Selected product preview"
                  />
                )}

                <label className="admin-publish-toggle">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(event) => updateField("published", event.target.checked)}
                  />
                  <span>
                    <strong>Publish this listing</strong>
                    <small>Published cars with stock appear in the shop.</small>
                  </span>
                </label>

                {message && <p className="admin-message">{message}</p>}

                <button className="button button-red admin-save-button" disabled={busy}>
                  {busy
                    ? "Saving listing…"
                    : editingId
                      ? "Save changes"
                      : "Add car"}
                  <span>↗</span>
                </button>

                {!editingId && (
                  <p className="admin-help admin-slug-help">
                    Listing ID: <code>{slugify(form.name) || "car-name"}</code>
                  </p>
                )}
              </form>
            </section>

            <section className="admin-inventory">
              <div className="admin-inventory-heading">
                <div>
                  <p className="admin-label">THE COLLECTION</p>
                  <h2>{products.length} {products.length === 1 ? "car" : "cars"}</h2>
                </div>
                <button
                  className="admin-add-button"
                  type="button"
                  onClick={startNewProduct}
                >
                  + New listing
                </button>
              </div>

              {loadingProducts ? (
                <p className="admin-empty-state">Loading the garage…</p>
              ) : products.length === 0 ? (
                <p className="admin-empty-state">No cars in your collection yet.</p>
              ) : (
                <div className="admin-product-list">
                  {products.map((product) => (
                    <article className="admin-product-row" key={product.id}>
                      <div className="admin-product-thumb">
                        {product.image_url ? (
                          <img src={product.image_url} alt="" />
                        ) : (
                          <span>✳</span>
                        )}
                      </div>
                      <div className="admin-product-info">
                        <h3>{product.name}</h3>
                        <p>
                          {product.series || "Collector car"} <span>·</span> {formatPrice(product.price_inr)}
                          <span> · </span>{product.stock_qty} in stock
                        </p>
                        <p className="admin-product-status">
                          <span className={product.published ? "status-live" : "status-draft"}>
                            {product.published ? "PUBLISHED" : "DRAFT"}
                          </span>
                          {product.image_url ? " · PHOTO ADDED" : " · NO PHOTO"}
                        </p>
                      </div>
                      <button
                        className="admin-edit-button"
                        type="button"
                        onClick={() => editProduct(product)}
                      >
                        Edit <span>↗</span>
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </main>
  );
}
