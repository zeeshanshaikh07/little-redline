"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Car = {
  id: string;
  name: string;
  series: string;
  cardNumber: string;
  seriesNumber: string;
  price: number;
  condition: string;
  tag: string;
  stockQty: number;
  imageUrl: string | null;
};

type ProductRow = {
  id: string;
  name: string;
  series: string;
  card_number: string | null;
  series_number: string | null;
  price_inr: number;
  condition_note: string;
  badge: string;
  stock_qty: number;
  image_url: string | null;
};

function money(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function VehicleArt({ name }: { name: string }) {
  return (
    <svg
      className="product-vehicle"
      viewBox="0 0 300 150"
      role="img"
      aria-label={`Illustration of ${name}`}
    >
      <ellipse cx="150" cy="132" rx="118" ry="9" fill="#746b5e" opacity=".15" />
      <path
        d="m25 111 17-28q5-8 16-11l34-7 25-32q5-7 14-7h49q12 0 21 10l27 31 35 9q13 4 17 18l5 19q2 11-10 14l-19 1q-5-26-29-25t-29 27l-79 2q-5-26-28-25t-29 27l-23 1q-12 0-12-12z"
        fill="#e23c2e"
        stroke="#282723"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="m99 64 25-31q4-5 10-5h46q8 0 14 8l24 30z"
        fill="#a9c0bb"
        stroke="#292824"
        strokeWidth="3"
      />
      <path d="M157 30v36" stroke="#59635f" strokeWidth="2" />
      <path
        d="M43 94q71 15 207 4l5 10q-88 15-220 6z"
        fill="#f0ca66"
        opacity=".96"
      />
      <g fill="#252522" stroke="#ddd8ca" strokeWidth="4">
        <circle cx="83" cy="119" r="18" />
        <circle cx="239" cy="118" r="18" />
      </g>
      <g fill="#858176">
        <circle cx="83" cy="119" r="7" />
        <circle cx="239" cy="118" r="7" />
      </g>
      <path
        d="m48 97 12-1M273 98l8 3"
        stroke="#f5d36b"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [cartLoaded, setCartLoaded] = useState(false);
  const [cars, setCars] = useState<Car[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setProductsLoading(true);
      setProductsError("");

      try {
        const { data, error } = await supabase
          .from("products")
          .select(
            "id, name, series, card_number, series_number, price_inr, condition_note, badge, stock_qty, image_url",
          )
          .eq("published", true)
          .gt("stock_qty", 0)
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true });

        if (cancelled) return;

        if (error) {
          setProductsError(error.message);
          setCars([]);
          return;
        }

        const rows = (data ?? []) as unknown as ProductRow[];

        setCars(
          rows.map((row) => ({
            id: row.id,
            name: row.name,
            series: row.series,
            cardNumber: row.card_number ?? "",
            seriesNumber: row.series_number ?? "",
            price: row.price_inr,
            condition: row.condition_note,
            tag: row.badge,
            stockQty: row.stock_qty,
            imageUrl: row.image_url,
          })),
        );
      } catch (error) {
        if (!cancelled) {
          setProductsError(
            error instanceof Error
              ? error.message
              : "Could not reach Supabase.",
          );
          setCars([]);
        }
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    }

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("littleRedlineCart");
      if (stored) setCart(JSON.parse(stored) as Record<string, number>);
    } catch {
      localStorage.removeItem("littleRedlineCart");
    }
    setCartLoaded(true);
  }, []);

  useEffect(() => {
    if (cartLoaded) {
      localStorage.setItem("littleRedlineCart", JSON.stringify(cart));
    }
  }, [cart, cartLoaded]);

  const visibleCars = useMemo(() => {
    const query = search.trim().toLowerCase();

    return cars.filter(
      (car) =>
        !query || `${car.name} ${car.series}`.toLowerCase().includes(query),
    );
  }, [cars, search]);

  const cartEntries = Object.entries(cart).filter(
    ([, quantity]) => quantity > 0,
  );
  const cartQuantity = cartEntries.reduce(
    (total, [, quantity]) => total + quantity,
    0,
  );
  const subtotal = cartEntries.reduce((total, [id, quantity]) => {
    const car = cars.find((item) => item.id === id);
    return total + (car?.price ?? 0) * quantity;
  }, 0);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  function addToCart(car: Car) {
    if ((cart[car.id] ?? 0) >= car.stockQty) {
      notify("No more of this car is available.");
      return;
    }
    setCart((current) => ({
      ...current,
      [car.id]: (current[car.id] ?? 0) + 1,
    }));
    notify(`${car.name} added to your bag`);
  }

  function removeFromCart(id: string) {
    setCart((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  return (
    <>
      <div className="announcement">
        <span className="announcement-dot" /> SMALL CARS. BIG COLLECTOR ENERGY.
        <span>·</span> Shipping across India
      </div>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="Little Redline home">
          <span className="brand-mark">LR</span>
          <span className="brand-name">
            little<span>redline</span>
          </span>
        </a>

        <nav className="main-nav" aria-label="Main navigation">
          <a href="#shop">Shop all</a>
          <a href="#about">Our story</a>
        </nav>

        <button
          className="cart-trigger"
          onClick={() => setCartOpen(true)}
          aria-label="Open shopping bag"
        >
          Bag <span>{cartQuantity}</span>
          <span className="cart-icon">↗</span>
        </button>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-line" /> THE COLLECTOR&apos;S PIT LANE
            </div>
            <h1>
              Good things
              <br />
              come in <em>1:64.</em>
            </h1>
            <p>
              A little corner of the internet for the cars that made you look
              twice. Handpicked Hot Wheels, ready for a new home.
            </p>
            <div className="hero-actions">
              <a className="button button-dark" href="#shop">
                Find your next car <span>↘</span>
              </a>
            </div>
            <div className="hero-stats">
              <div>
                <strong>1:64</strong>
                <span>small scale, big joy</span>
              </div>
              <div>
                <strong>Handpicked</strong>
                <span>every car, checked</span>
              </div>
              <div>
                <strong>India</strong>
                <span>packed with care</span>
              </div>
            </div>
          </div>

          <div
            className="hero-art"
            aria-label="Illustration of a collectible red toy car"
          >
            <div className="sun-disc" />
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="art-label label-top">
              COLLECTOR SERIES <span>№ 001</span>
            </div>
            <div className="art-car">
              <div className="car-shadow" />
              <div className="car-roof" />
              <div className="car-window" />
              <div className="car-body">
                <span className="car-stripe" />
                <span className="car-number">68</span>
              </div>
              <div className="car-wheel wheel-left">
                <i />
              </div>
              <div className="car-wheel wheel-right">
                <i />
              </div>
            </div>
            <div className="art-label label-bottom">
              <span>BUILT FOR THE SHELF</span>
              <span>1:64 SCALE ↗</span>
            </div>
            <span className="art-star star-a">✳</span>
            <span className="art-star star-b">✴</span>
            <span className="art-coordinate">
              19°04&apos; N
              <br />
              72°52&apos; E
            </span>
          </div>
        </section>

        <section className="ticker" aria-label="Shop highlights">
          <div className="ticker-track">
            <span>THE HUNT IS ON</span>
            <i>✳</i>
            <span>NEW FINDS, OLD FAVORITES</span>
            <i>✳</i>
            <span>MADE FOR THE DISPLAY CASE</span>
            <i>✳</i>
            <span>THE HUNT IS ON</span>
            <i>✳</i>
            <span>NEW FINDS, OLD FAVORITES</span>
            <i>✳</i>
            <span>MADE FOR THE DISPLAY CASE</span>
            <i>✳</i>
          </div>
        </section>

        <section className="shop-section" id="shop">
          <div className="section-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" /> BROWSE THE COLLECTION
              </div>
              <h2>
                Find your <em>favorite.</em>
              </h2>
            </div>
            <p>
              Every car has a story.{" "}
              <br />
              Here&apos;s where yours starts.
            </p>
          </div>

          <div className="shop-toolbar">
            <div className="filter-tabs" aria-label="Product count">
              <span className="filter-tab active">
                All cars <span>{cars.length.toString().padStart(2, "0")}</span>
              </span>
            </div>

            <label className="search-box">
              <span>⌕</span>
              <input
                type="search"
                placeholder="Find a car..."
                aria-label="Search cars"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>

          <div className="product-grid" aria-live="polite">
            {productsLoading ? (
              <div className="no-results">Loading cars from the garage…</div>
            ) : productsError ? (
              <div className="no-results">
                Couldn't load the collection: {productsError}
              </div>
            ) : visibleCars.length ? (
              visibleCars.map((car, index) => (
                <article
                  className="product-card"
                  style={{ animationDelay: `${index * 35}ms` }}
                  key={car.id}
                >
                  <div className="product-image">
                    <span
                      className={`product-tag ${
                        car.tag.toLowerCase().includes("treasure hunt") ? "red" : ""
                      }`}
                    >
                      {car.tag}
                    </span>
                    {car.imageUrl ? (
                      <img
                        className="product-photo"
                        src={car.imageUrl}
                        alt={`${car.name} Hot Wheels car`}
                      />
                    ) : (
                      <VehicleArt name={car.name} />
                    )}
                    <button
                      className="quick-add"
                      onClick={() => addToCart(car)}
                      aria-label={`Add ${car.name} to bag`}
                      disabled={(cart[car.id] ?? 0) >= car.stockQty}
                    >
                      +
                    </button>
                  </div>
                  <div className="product-info">
                    <span className="product-series">{car.series}</span>
                    <h3>{car.name}</h3>
                    <strong className="product-price">
                      {money(car.price)}
                    </strong>
                    <span className="product-condition">{car.condition}</span>
                    {(car.cardNumber || car.seriesNumber) && (
                      <span className="product-numbers">
                        {car.cardNumber && <span>Card {car.cardNumber}</span>}
                        {car.cardNumber && car.seriesNumber && <span aria-hidden="true">·</span>}
                        {car.seriesNumber && <span>Series {car.seriesNumber}</span>}
                      </span>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <div className="no-results">
                No cars found. Try another search or browse all cars.
              </div>
            )}
          </div>

          <div className="catalog-foot">
            <span>
              Showing {visibleCars.length} collector favorite
              {visibleCars.length === 1 ? "" : "s"}
            </span>
            <span className="catalog-foot-mark">
              LITTLE REDLINE · EST. FOR COLLECTORS
            </span>
          </div>
        </section>

        <section className="collector-note" id="about">
          <div className="note-mark">“</div>
          <div className="note-copy">
            <div className="eyebrow">
              <span className="eyebrow-line" /> A NOTE FROM THE GARAGE
            </div>
            <h2>
              Not just a toy.
              <br />
              <em>A tiny time machine.</em>
            </h2>
            <p>
              We believe every collector remembers their first favorite. Little
              Redline is for the ones you missed, the ones you never let go, and
              the ones you haven&apos;t met yet.
            </p>
            <a href="#shop" className="text-link">
              Take a look around <span>↗</span>
            </a>
          </div>
          <div className="note-stamp">
            BUILT FOR
            <br />
            THE LOVE
            <br />
            OF THE HUNT <span>✳</span>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#top">
          <span className="brand-mark">LR</span>
          <span className="brand-name">
            little<span>redline</span>
          </span>
        </a>
        <span>For the love of the little things. © 2026 Little Redline</span>
        <div>
          <a href="mailto:hello@littleredline.in">Say hello ↗</a>
          <a href="#shop">Back to top ↑</a>
        </div>
      </footer>

      <div
        className={`overlay ${cartOpen ? "visible" : ""}`}
        hidden={!cartOpen}
        onClick={() => setCartOpen(false)}
      />

      <aside
        className={`cart-drawer ${cartOpen ? "open" : ""}`}
        aria-label="Shopping bag"
        aria-hidden={!cartOpen}
      >
        <div className="drawer-head">
          <div>
            <span className="eyebrow">YOUR PIT STOP</span>
            <h2>
              Your bag <span>({cartQuantity})</span>
            </h2>
          </div>
          <button
            className="close-button"
            onClick={() => setCartOpen(false)}
            aria-label="Close bag"
          >
            ×
          </button>
        </div>

        <div className="cart-items">
          {cartEntries.map(([id, quantity]) => {
            const car = cars.find((item) => item.id === id);
            if (!car) return null;

            return (
              <div className="cart-row" key={id}>
                <div className="cart-thumb">
                  {car.imageUrl ? (
                    <img
                      className="product-photo"
                      src={car.imageUrl}
                      alt={`${car.name} Hot Wheels car`}
                    />
                  ) : (
                    <VehicleArt name={car.name} />
                  )}
                </div>
                <div>
                  <h3>{car.name}</h3>
                  <p>
                    {quantity} × {money(car.price)}
                  </p>
                  <button
                    className="remove-item"
                    onClick={() => removeFromCart(id)}
                  >
                    Remove
                  </button>
                </div>
                <strong>{money(quantity * car.price)}</strong>
              </div>
            );
          })}
        </div>

        {cartQuantity === 0 ? (
          <div className="cart-empty">
            <span>✳</span>
            <h3>Nothing in the garage yet.</h3>
            <p>Your next favorite is out there.</p>
            <button
              className="button button-dark"
              onClick={() => setCartOpen(false)}
            >
              Keep browsing <span>↘</span>
            </button>
          </div>
        ) : (
          <div className="drawer-foot">
            <div className="subtotal">
              <span>Subtotal</span>
              <strong>{money(subtotal)}</strong>
            </div>
            <p>Shipping calculated at checkout.</p>
            <button
              className="button button-red checkout-button"
              onClick={() =>
                notify(
                  "Checkout will be available when payments are connected.",
                )
              }
            >
              Checkout <span>↗</span>
            </button>
            <small>Demo storefront · Checkout isn&apos;t connected yet.</small>
          </div>
        )}
      </aside>

      <div
        className={`toast ${toast ? "show" : ""}`}
        role="status"
        aria-live="polite"
      >
        {toast}
      </div>
    </>
  );
}
