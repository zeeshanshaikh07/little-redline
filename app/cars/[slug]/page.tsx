import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToBagButton from "./add-to-bag-button";
import { getPublishedProduct } from "../../../lib/products";

const siteUrl = "https://little-redline.vercel.app";

type CarPageProps = {
  params: Promise<{ slug: string }>;
};

function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function productDescription(product: NonNullable<Awaited<ReturnType<typeof getPublishedProduct>>>) {
  const details = [product.series, product.condition_note]
    .filter(Boolean)
    .join(". ");

  return `Shop ${product.name}${details ? ` — ${details}` : ""} at Little Redline for ${formatPrice(product.price_inr)}. Available in India.`;
}

export async function generateMetadata({ params }: CarPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedProduct(slug);

  if (!product) {
    return {
      title: "Car not found | Little Redline",
      robots: { index: false, follow: false },
    };
  }

  const description = productDescription(product);
  const url = `${siteUrl}/cars/${encodeURIComponent(product.id)}`;

  return {
    title: `${product.name} | Little Redline`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `${product.name} | Little Redline`,
      description,
      siteName: "Little Redline",
      locale: "en_IN",
      images: product.image_url
        ? [{ url: product.image_url, alt: `${product.name} Hot Wheels car` }]
        : undefined,
    },
    twitter: {
      card: product.image_url ? "summary_large_image" : "summary",
      title: `${product.name} | Little Redline`,
      description,
      images: product.image_url ? [product.image_url] : undefined,
    },
  };
}

export default async function CarPage({ params }: CarPageProps) {
  const { slug } = await params;
  const product = await getPublishedProduct(slug);
  if (!product) notFound();

  const pageUrl = `${siteUrl}/cars/${encodeURIComponent(product.id)}`;
  const description = productDescription(product);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    sku: product.id,
    brand: { "@type": "Brand", name: "Hot Wheels" },
    category: product.series || "Die-cast cars",
    image: product.image_url ? [product.image_url] : undefined,
    offers: {
      "@type": "Offer",
      url: pageUrl,
      priceCurrency: "INR",
      price: product.price_inr,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <main className="product-detail-page">
      <nav className="product-breadcrumb" aria-label="Breadcrumb">
        <Link href="/#shop">The collection</Link>
        <span aria-hidden="true">/</span>
        <span>{product.name}</span>
      </nav>

      <article className="product-detail">
        <div className="product-detail-image">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={`${product.name} Hot Wheels package`}
              width={1200}
              height={1200}
            />
          ) : (
            <div className="product-detail-no-photo">Photo coming soon</div>
          )}
          {product.badge && <span className="product-detail-badge">{product.badge}</span>}
        </div>

        <div className="product-detail-copy">
          <p className="eyebrow">
            <span className="eyebrow-line" /> {product.series || "COLLECTOR CAR"}
          </p>
          <h1>{product.name}</h1>
          <p className="product-detail-price">{formatPrice(product.price_inr)}</p>
          {product.condition_note && (
            <p className="product-detail-condition">{product.condition_note}</p>
          )}

          {(product.card_number || product.series_number) && (
            <div className="product-detail-numbers" aria-label="Package numbering">
              {product.card_number && (
                <span>
                  <small>Card</small>
                  {product.card_number}
                </span>
              )}
              {product.series_number && (
                <span>
                  <small>Series</small>
                  {product.series_number}
                </span>
              )}
            </div>
          )}

          <p className="product-detail-availability">In stock · Ships across India</p>
          <AddToBagButton productId={product.id} stockQuantity={product.stock_qty} />
          <Link className="product-detail-back" href="/#shop">
            ← Back to the collection
          </Link>
        </div>
      </article>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
    </main>
  );
}
