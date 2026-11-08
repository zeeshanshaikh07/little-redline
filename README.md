# Little Redline

A collector-first Hot Wheels storefront built with Next.js, React, TypeScript, and Supabase.

## Requirements

- Node.js 20.9 or newer
- A Supabase project configured with the products table, Row Level Security policies, and a `product-photos` Storage bucket

## Run locally

Install dependencies:

```bash
npm install
```

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the storefront or [http://localhost:3000/admin](http://localhost:3000/admin) for product management.

Build the production app with:

```bash
npm run build
```

## Supabase setup

The storefront reads from `public.products`. Its current columns are:

| Column           | Purpose                                      |
| ---------------- | -------------------------------------------- |
| `id`             | Unique product slug, used as the primary key |
| `name`           | Car name                                     |
| `series`         | Series or collection name                    |
| `card_number`    | Package card number, such as `199/250`        |
| `series_number`  | Position in the subseries, such as `10/10`    |
| `price_inr`      | Price in whole rupees                        |
| `condition_note` | Car and packaging condition                  |
| `badge`          | Optional product label                       |
| `stock_qty`      | Available quantity                           |
| `published`      | Whether the listing is visible in the shop   |
| `sort_order`     | Product display order                        |
| `image_url`      | Public photo URL from Supabase Storage       |
| `created_at`     | Row creation timestamp                       |

Row Level Security should allow visitors to read only published products with stock. Admins are allowlisted in `public.admin_users`; policies grant them product reads and writes. The public `product-photos` bucket serves images, while its upload policy restricts uploads to admins. Do not expose a Supabase secret or service-role key in the browser.


## Admin page

Sign in at `/admin` with a Supabase Auth user whose ID is in `public.admin_users`. The page can:

- Add products and edit existing listings
- Set package numbering, price, quantity, condition notes, display order, and published status
- Upload JPEG, PNG, or WebP photos up to 5 MB to the `product-photos` bucket

New products receive a slug from their name. Keep names unique enough to avoid slug collisions.

## Current scope

- Responsive storefront with search by car name and series
- Product photos, condition notes, price in INR, and stock-aware add-to-bag controls
- Shopping bag saved in the visitor's browser local storage
- Admin login and product/photo management

Checkout, order storage, shipping calculation, customer notifications, and payment processing are not connected yet. The shop should not be used to accept orders until those flows are implemented and verified.

## Project structure

```text
app/
  admin/page.tsx   Admin sign-in and product editor
  globals.css      Storefront and admin styles
  layout.tsx       Root layout and metadata
  page.tsx         Storefront
lib/
  supabase.ts      Supabase browser client
supabase/
  migrations/      SQL schema changes
```

`.env.local`, `node_modules/`, and `.next/` are excluded by `.gitignore`.
