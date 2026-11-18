# Catalog API — Next.js + Neon PostgreSQL

Gotowa aplikacja do wyszukiwania i dodawania produktów, z panelem WWW oraz REST API. Przystosowana do Vercel (bez zapisywania danych na nietrwałym dysku serwera).

## Funkcje

- **GET `/api/products`** — wyszukiwanie po nazwie, opisie i SKU, filtrowanie po kategorii, sortowanie, paginacja.
- **POST `/api/products`** — dodawanie produktów, walidacja danych, ochrona kluczem API.
- **GET `/api/health`** — sprawdzenie połączenia z bazą.
- Panel WWW z listą produktów, wyszukiwarką, filtrami i formularzem dodawania.
- PostgreSQL w Neon, bezpieczne zapytania parametryzowane, obsługa błędów.

## 1. Przygotuj bazę (Neon)

1. Utwórz darmowy projekt PostgreSQL na https://neon.tech.
2. W panelu Neon otwórz **SQL Editor** i wykonaj zawartość `db/schema.sql`.
3. Aby dodać 8 przykładowych produktów, wykonaj dodatkowo `db/seed.sql`.
4. Skopiuj połączenie (`Connection string`) w formacie `postgresql://...`.

## 2. Uruchom lokalnie

Wymagany Node.js 20.9+ (zalecany Node.js 22 lub 24).

```bash
npm install
cp .env.example .env.local
```

Edytuj `.env.local` i ustaw:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require"
PRODUCTS_API_KEY="tu-wpisz-dlugi-losowy-klucz"
```

Klucz możesz wygenerować poleceniem `openssl rand -hex 32`.

```bash
npm run dev
```

Otwórz http://localhost:3000.

## 3. Deploy na Vercel

1. Wypakuj ZIP, utwórz repozytorium GitHub i wyślij pliki (bez `.env.local`).
2. Wejdź na https://vercel.com/new, zaimportuj repozytorium.
3. W **Project Settings → Environment Variables** dodaj `DATABASE_URL` i `PRODUCTS_API_KEY` (dla Production, ewentualnie Preview/Development).
4. Wdrażaj projekt z domyślnym frameworkiem **Next.js**. Baza Neon pozostaje niezależna od serwerów Vercel.
5. Sprawdź `https://twoj-projekt.vercel.app/api/health` (powinien zwrócić `{"status":"ok","database":"connected"}`).

**Ważne:** Przed pierwszym wdrożeniem wykonaj `db/schema.sql` w bazie Neon, inaczej API nie znajdzie tabeli `products`. Nie używaj SQLite/pliku JSON jako stałego magazynu danych na Vercel.

## Endpointy i przykłady

### GET /api/products

```bash
curl "http://localhost:3000/api/products?q=sluchawki&page=1&limit=8&sort=price_asc"
```

Parametry opcjonalne:

| Parametr | Typ | Domyślnie | Opis |
| --- | --- | --- | --- |
| `q` | string | `""` | Wyszukiwanie: nazwa, opis, SKU (`ILIKE`; bez rozróżniania wielkości liter) |
| `category` | string | `""` | Dokładna nazwa kategorii |
| `page` | integer | `1` | Strona >= 1 |
| `limit` | integer | `12` | Liczba wyników 1–100 |
| `sort` | string | `newest` | `newest`, `price_asc`, `price_desc`, `name_asc` |

Sukces (HTTP 200):

```json
{
  "data": [{
    "id": "uuid",
    "name": "Lampka biurkowa Arc",
    "description": "Minimalistyczna lampka LED z regulacją jasności.",
    "category": "Dom i ogród",
    "price": 189,
    "currency": "PLN",
    "stock": 18,
    "imageUrl": "",
    "sku": "ARC-002",
    "createdAt": "2026-11-17T00:00:00.000Z"
  }],
  "pagination": { "page": 1, "limit": 12, "total": 1, "totalPages": 1 }
}
```

`createdAt` jest przykładową wartością; w praktyce API zwraca datę zapisu w bazie.

### POST /api/products

```bash
curl -X POST "http://localhost:3000/api/products" \
  -H "Content-Type: application/json" \
  -H "x-api-key: tu-wpisz-dlugi-losowy-klucz" \
  -d '{
    "name": "Nowy produkt",
    "description": "Przykładowy opis",
    "category": "Elektronika",
    "price": 199.99,
    "currency": "PLN",
    "stock": 10,
    "imageUrl": "",
    "sku": "NEW-001"
  }'
```

Sukces: **201**, `{ "data": { ...nowyProdukt } }`.

Pola wymagane: `name` (2–120 znaków), `category` (`Elektronika`, `Dom i ogród`, `Sport`, `Moda`, `Biuro`, `Inne`), `price` (liczba >= 0, max 2 miejsca po przecinku), `stock` (liczba całkowita >= 0), `sku` (unikalne, 2–64 znaków, litery/cyfry/`_`/`-`). Opcjonalne: `description`, `imageUrl` (pusty lub poprawny adres HTTPS), `currency` (tylko `PLN`).

Błędy: **400** (walidacja/JSON), **401** (zły klucz), **409** (duplikat SKU), **415** (niepoprawny content type), **503** (problem z konfiguracją/bazą).

### GET /api/health

```bash
curl "http://localhost:3000/api/health"
```

## Bezpieczeństwo

- Nigdy nie publikuj `DATABASE_URL` ani `PRODUCTS_API_KEY` w repozytorium, ani w zmiennych `NEXT_PUBLIC_*`.
- Formularz dodawania prosi o klucz API w przeglądarce; klucz nie jest zapisywany w localStorage ani cookies. Wpisuj go tylko na zaufanej domenie swojej aplikacji.
- Endpoint GET jest publiczny, a POST wymaga nagłówka `x-api-key`.
- Wdrożenie w internecie z dużym ruchem warto uzupełnić o rate limiting, audyt zmian i docelowo uwierzytelnianie użytkowników.
- API jest udostępniane pod tą samą domeną co strona, bez otwartego CORS dla zewnętrznych stron. Klienci serwerowi mogą korzystać z niego normalnie.

## Struktura

```text
app/
  api/products/route.ts  # GET i POST
  api/health/route.ts    # healthcheck
  page.tsx               # panel WWW
  layout.tsx
  globals.css
components/catalog.tsx   # frontend
lib/db.ts                # Neon PostgreSQL
lib/products.ts          # walidacja i typy
db/schema.sql            # utworzenie tabeli
db/seed.sql              # dane demonstracyjne
.env.example             # przykład zmiennych środowiskowych
```
