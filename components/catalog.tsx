"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowDownUp, ArrowLeft, ArrowRight, ArrowUpRight, Box, Check, ChevronDown, CircleHelp, Code2, Database, KeyRound, LayoutGrid, LoaderCircle, Package, Plus, Search, ShoppingBag, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { categories, type Product } from "@/lib/products";

type ResponseData = { data: Product[]; pagination: { page: number; limit: number; total: number; totalPages: number }; error?: string };
const formatter = new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" });
const gradients = ["violet", "coral", "mint", "sky", "sun", "lavender"];
const initialForm = { name: "", sku: "", description: "", category: "Elektronika" as (typeof categories)[number], price: "", stock: "", imageUrl: "" };

function ProductTile({ product, index }: { product: Product; index: number }) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasImage = Boolean(product.imageUrl) && !imageFailed;
  return <article className="product-card">
    <div className={`product-art art-${gradients[index % gradients.length]}`}>
      <span className="art-orbit orbit-a"/><span className="art-orbit orbit-b"/>
      {hasImage ? <img src={product.imageUrl} alt={product.name} className="product-photo" onError={() => setImageFailed(true)}/> : <Package size={54} strokeWidth={1.1} className="art-icon"/>}
      <span className="category-chip">{product.category}</span>
    </div>
    <div className="product-info">
      <div className="product-sku">SKU: {product.sku}</div>
      <h3>{product.name}</h3>
      <p>{product.description || "Produkt w naszym katalogu."}</p>
      <div className="product-bottom"><strong>{formatter.format(product.price)}</strong><span className={product.stock > 0 ? "stock in" : "stock out"}><i/>{product.stock > 0 ? `${product.stock} szt.` : "Brak"}</span></div>
    </div>
  </article>;
}

export default function Catalog() {
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"catalog" | "api">("catalog");

  const loadProducts = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ q: query, category, sort, page: String(page), limit: "8" });
      const res = await fetch(`/api/products?${params}`, { signal, cache: "no-store" });
      const json = await res.json() as ResponseData;
      if (!res.ok) throw new Error(json.error || "Nie udało się pobrać produktów");
      setResponse(json);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Wystąpił błąd");
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [query, category, sort, page]);

  useEffect(() => { const controller = new AbortController(); void loadProducts(controller.signal); return () => controller.abort(); }, [loadProducts]);
  useEffect(() => { const timer = setTimeout(() => { setPage(1); setQuery(queryInput); }, 300); return () => clearTimeout(timer); }, [queryInput]);

  async function submitProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true); setFormError("");
    try {
      const res = await fetch("/api/products", {
        method: "POST", headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({ ...form, price: Number(form.price), stock: Number(form.stock), currency: "PLN" }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Nie udało się dodać produktu");
      setModalOpen(false); setForm(initialForm); setSuccess(`Dodano produkt „${body.data.name}”`);
      setQueryInput(""); setQuery(""); setCategory(""); setSort("newest"); setPage(1); setActiveTab("catalog");
      void loadProducts();
      window.setTimeout(() => setSuccess(""), 5000);
    } catch (e) { setFormError(e instanceof Error ? e.message : "Wystąpił błąd"); }
    finally { setSaving(false); }
  }

  return <div className="shell">
    <aside className="sidebar">
      <a className="brand" href="/"><span className="brand-mark"><Box size={22} strokeWidth={2.1}/></span><span>catalog<span className="brand-dot">.</span><small>PRODUCT API</small></span></a>
      <div className="side-label">WORKSPACE</div>
      <button className={`side-link ${activeTab === "catalog" ? "selected" : ""}`} onClick={() => setActiveTab("catalog")}><LayoutGrid size={18}/> Katalog produktów <span className="side-indicator"/></button>
      <button className={`side-link ${activeTab === "api" ? "selected" : ""}`} onClick={() => setActiveTab("api")}><Code2 size={18}/> Dokumentacja API</button>
      <div className="sidebar-bottom"><div className="sidebar-mini-icon"><Database size={20}/></div><strong>Gotowe na produkcję</strong><p>Dane przechowywane w PostgreSQL, aplikacja gotowa do wdrożenia na Vercel.</p><a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer">Deploy na Vercel <ArrowUpRight size={14}/></a></div>
      <div className="side-footer"><span className="online-dot"/> REST API · v1.0</div>
    </aside>

    <main className="main">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>{activeTab === "catalog" ? "Katalog produktów" : "Dokumentacja API"}</strong></div><div className="top-right"><span className="api-label"><span className="online-dot"/> REST API</span><button className="btn btn-dark top-add" onClick={() => setModalOpen(true)}><Plus size={16}/> Dodaj produkt</button></div></header>
      <div className="content">
        {activeTab === "catalog" ? <>
          <div className="page-intro"><div className="eyebrow"><Sparkles size={14}/> TWOJA BAZA PRODUKTÓW</div><div className="intro-row"><div><h1>Katalog produktów<span className="title-dot">.</span></h1><p>Wszystkie produkty w jednym miejscu. Wyszukuj, filtruj i zarządzaj asortymentem.</p></div><button className="btn btn-dark hero-add" onClick={() => setModalOpen(true)}><Plus size={17}/> Dodaj produkt</button></div></div>
          <div className="stats-row"><div className="stat-card"><span className="stat-icon lavender-bg"><Package size={20}/></span><div><small>Wszystkie produkty</small><strong>{response?.pagination.total ?? "—"}</strong></div></div><div className="stat-card"><span className="stat-icon mint-bg"><Database size={20}/></span><div><small>Baza danych</small><strong>PostgreSQL</strong></div></div><div className="stat-card"><span className="stat-icon peach-bg"><Code2 size={20}/></span><div><small>Endpoint</small><strong className="stat-endpoint">/api/products</strong></div></div></div>
          <section className="listing"><div className="listing-head"><div><h2>Przeglądaj produkty <span>{response?.pagination.total ?? 0}</span></h2><p>Przeglądaj i odkrywaj produkty w katalogu</p></div><button className="text-action" onClick={() => setActiveTab("api")}>Zobacz API <ArrowUpRight size={16}/></button></div>
            <div className="filters"><div className="search-box"><Search size={18}/><input aria-label="Szukaj produktów" placeholder="Szukaj po nazwie, opisie lub SKU..." value={queryInput} onChange={(e) => setQueryInput(e.target.value)}/>{queryInput && <button aria-label="Wyczyść wyszukiwanie" onClick={() => setQueryInput("")}><X size={16}/></button>}</div><label className="select-wrapper"><SlidersHorizontal size={16}/><select aria-label="Kategoria" value={category} onChange={(e) => {setCategory(e.target.value);setPage(1);}}><option value="">Wszystkie kategorie</option>{categories.map((c) => <option key={c} value={c}>{c}</option>)}</select><ChevronDown size={15}/></label><label className="select-wrapper sort-wrapper"><ArrowDownUp size={15}/><select aria-label="Sortowanie" value={sort} onChange={(e) => {setSort(e.target.value);setPage(1);}}><option value="newest">Najnowsze</option><option value="price_asc">Cena: rosnąco</option><option value="price_desc">Cena: malejąco</option><option value="name_asc">Nazwa: A–Z</option></select><ChevronDown size={15}/></label></div>
            {success && <div className="success-alert"><Check size={17}/>{success}<button onClick={() => setSuccess("")}><X size={14}/></button></div>}
            {error ? <div className="state-message"><CircleHelp size={28}/><h3>Nie można wczytać produktów</h3><p>{error}</p><p className="state-tip">Sprawdź DATABASE_URL i uruchom skrypt db/schema.sql w Neon.</p><button className="btn btn-light" onClick={() => void loadProducts()}>Spróbuj ponownie</button></div> : loading ? <div className="state-message"><LoaderCircle className="spin" size={30}/><p>Wczytywanie produktów...</p></div> : !response?.data.length ? <div className="state-message"><ShoppingBag size={36}/><h3>Nie znaleziono produktów</h3><p>Zmień filtry lub dodaj pierwszy produkt.</p><button className="btn btn-dark" onClick={() => setModalOpen(true)}><Plus size={16}/> Dodaj produkt</button></div> : <div className="product-grid">{response.data.map((p, i) => <ProductTile key={p.id} product={p} index={i + (page - 1) * 8}/>)}</div>}
            {!!response?.pagination.totalPages && response.pagination.totalPages > 1 && <div className="pagination"><span>Strona {page} z {response.pagination.totalPages}</span><div><button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ArrowLeft size={16}/> Poprzednia</button><button className="page-btn" disabled={page >= response.pagination.totalPages} onClick={() => setPage(p => p + 1)}>Następna <ArrowRight size={16}/></button></div></div>}
          </section>
        </> : <div className="docs"><div className="eyebrow"><Code2 size={14}/> DEVELOPER RESOURCES</div><h1>Dokumentacja API<span className="title-dot">.</span></h1><p className="docs-lead">Proste REST API dla Twojego katalogu produktów. Wszystkie odpowiedzi są w formacie JSON.</p><div className="docs-base"><span>BASE URL</span><code>{typeof window !== "undefined" ? window.location.origin : "https://twoja-aplikacja.vercel.app"}</code></div>
          <section className="doc-section"><div className="doc-title"><span className="method get">GET</span><h2>/api/products</h2></div><p>Wyszukiwanie produktów z filtrowaniem, sortowaniem i paginacją. Publiczny endpoint.</p><div className="params"><h3>Parametry zapytania</h3><div><code>q</code><span>Wyszukiwanie po nazwie, opisie lub SKU</span></div><div><code>category</code><span>Filtrowanie po kategorii</span></div><div><code>page</code><span>Numer strony (domyślnie 1)</span></div><div><code>limit</code><span>Liczba wyników 1–100 (domyślnie 12)</span></div><div><code>sort</code><span>newest, price_asc, price_desc, name_asc</span></div></div><pre><code>{`curl "${typeof window !== "undefined" ? window.location.origin : "https://twoja-aplikacja.vercel.app"}/api/products?q=lampka&limit=10"`}</code></pre></section>
          <section className="doc-section"><div className="doc-title"><span className="method post">POST</span><h2>/api/products</h2></div><p>Dodaje produkt. Wymaga nagłówka <code>x-api-key</code> zgodnego z <code>PRODUCTS_API_KEY</code> ustawionym na serwerze.</p><pre><code>{`curl -X POST "${typeof window !== "undefined" ? window.location.origin : "https://twoja-aplikacja.vercel.app"}/api/products" \\\n  -H "Content-Type: application/json" \\\n  -H "x-api-key: TWOJ_TAJNY_KLUCZ" \\\n  -d '{"name":"Nowy produkt","description":"Opis","category":"Elektronika","price":199.99,"currency":"PLN","stock":10,"imageUrl":"","sku":"NEW-001"}'`}</code></pre><p className="hint"><KeyRound size={15}/> Nie umieszczaj klucza API w publicznym repozytorium ani we frontendowych zmiennych NEXT_PUBLIC_*.</p></section>
          <section className="doc-section"><div className="doc-title"><span className="method get">GET</span><h2>/api/health</h2></div><p>Sprawdza połączenie aplikacji z bazą danych.</p></section>
        </div>}
      </div><footer className="footer"><span>© 2026 Catalog API</span><span>Built with Next.js + Neon <span className="footer-heart">✦</span></span></footer>
    </main>

    {modalOpen && <div className="modal-backdrop" onMouseDown={(e) => {if (e.target === e.currentTarget) setModalOpen(false);}}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><div><span className="eyebrow">NOWY WPIS</span><h2 id="modal-title">Dodaj produkt</h2><p>Uzupełnij informacje o nowym produkcie.</p></div><button className="modal-close" aria-label="Zamknij" onClick={() => setModalOpen(false)}><X size={20}/></button></div><form onSubmit={submitProduct} className="product-form"><div className="field"><label>Nazwa produktu *</label><input required minLength={2} maxLength={120} placeholder="np. Słuchawki bezprzewodowe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/></div><div className="field-row"><div className="field"><label>SKU *</label><input required minLength={2} maxLength={64} placeholder="np. SKU-001" value={form.sku} onChange={e => setForm({...form, sku:e.target.value})}/></div><div className="field"><label>Kategoria *</label><select value={form.category} onChange={e => setForm({...form, category: e.target.value as (typeof categories)[number]})}>{categories.map(c => <option key={c}>{c}</option>)}</select></div></div><div className="field"><label>Opis</label><textarea rows={3} maxLength={2000} placeholder="Krótki opis produktu..." value={form.description} onChange={e => setForm({...form, description:e.target.value})}/></div><div className="field-row"><div className="field"><label>Cena (PLN) *</label><input type="number" required min="0" max="99999999.99" step="0.01" placeholder="199.99" value={form.price} onChange={e => setForm({...form, price:e.target.value})}/></div><div className="field"><label>Stan magazynowy *</label><input type="number" required min="0" max="1000000" step="1" placeholder="10" value={form.stock} onChange={e => setForm({...form,stock:e.target.value})}/></div></div><div className="field"><label>URL zdjęcia <span>(opcjonalnie, HTTPS)</span></label><input type="url" placeholder="https://example.com/zdjecie.jpg" value={form.imageUrl} onChange={e => setForm({...form, imageUrl:e.target.value})}/></div><div className="field"><label>Klucz API *</label><div className="input-with-icon"><KeyRound size={17}/><input type="password" required autoComplete="off" placeholder="Wartość PRODUCTS_API_KEY" value={apiKey} onChange={e => setApiKey(e.target.value)}/></div><small>Klucz jest wysyłany tylko do API podczas dodawania produktu.</small></div>{formError && <div className="form-error">{formError}</div>}<div className="modal-actions"><button type="button" className="btn btn-light" onClick={() => setModalOpen(false)}>Anuluj</button><button type="submit" className="btn btn-dark" disabled={saving}>{saving ? <LoaderCircle size={17} className="spin"/> : <Plus size={17}/>} {saving ? "Dodawanie..." : "Dodaj produkt"}</button></div></form></div></div>}
  </div>;
}
