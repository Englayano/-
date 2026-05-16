"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Currency = "USD" | "EUR" | "GBP" | "SAR" | "JPY" | "INR" | "NGN" | "TRY";
type Renewal = "monthly" | "yearly";
type Tone = "violet" | "mint" | "rose" | "gold" | "sky" | "peach" | "aqua";

type Subscription = {
  id: string;
  name: string;
  price: number;
  currency: Currency;
  renewal: Renewal;
  renewalDate: string;
};

type Draft = Omit<Subscription, "id">;

const currencies: Currency[] = ["SAR", "USD", "EUR", "GBP", "JPY", "INR", "NGN", "TRY"];

const exchangeToUsd: Record<Currency, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  SAR: 0.27,
  JPY: 0.0064,
  INR: 0.012,
  NGN: 0.00064,
  TRY: 0.031,
};

const currencySymbols: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  SAR: "﷼",
  JPY: "¥",
  INR: "₹",
  NGN: "₦",
  TRY: "₺",
};

const currencyArabic: Record<Currency, string> = {
  USD: "دولار أمريكي",
  EUR: "يورو",
  GBP: "جنيه إسترليني",
  SAR: "ريال سعودي",
  JPY: "ين ياباني",
  INR: "روبية هندية",
  NGN: "نايرا نيجيرية",
  TRY: "ليرة تركية",
};

// ============ Helpers ============

function nextDate(offset: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isCurrency(value: unknown): value is Currency {
  return typeof value === "string" && currencies.includes(value as Currency);
}

function isRenewal(value: unknown): value is Renewal {
  return value === "monthly" || value === "yearly";
}

function isValidDateInput(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(new Date(`${value}T12:00:00`).getTime());
}

function readStoredSubscriptions(value: string | null) {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;

    return parsed
      .map((item, index): Subscription | null => {
        if (!item || typeof item !== "object") return null;
        const record = item as Partial<Subscription>;

        return {
          id: typeof record.id === "string" ? record.id : `stored-${index}`,
          name:
            typeof record.name === "string" && record.name.trim()
              ? record.name
              : "اشتراك جديد",
          price: Number.isFinite(Number(record.price))
            ? Math.max(0, Number(record.price))
            : 0,
          currency: isCurrency(record.currency) ? record.currency : "SAR",
          renewal: isRenewal(record.renewal) ? record.renewal : "monthly",
          renewalDate: isValidDateInput(record.renewalDate)
            ? record.renewalDate
            : nextDate(14),
        };
      })
      .filter((item): item is Subscription => Boolean(item));
  } catch {
    return null;
  }
}

function convert(amount: number, from: Currency, to: Currency) {
  return (amount * exchangeToUsd[from]) / exchangeToUsd[to];
}

function addInterval(date: Date, renewal: Renewal) {
  const next = new Date(date);
  if (renewal === "monthly") next.setMonth(next.getMonth() + 1);
  else next.setFullYear(next.getFullYear() + 1);
  return next;
}

function getNextRenewalDate(value: string, renewal: Renewal) {
  let date = new Date(`${value}T12:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // حماية من حلقة لا نهائية لو التاريخ قديم جداً
  let safety = 0;
  while (date < today && safety < 1000) {
    date = addInterval(date, renewal);
    safety++;
  }

  return date;
}

function daysUntil(value: string, renewal: Renewal) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = getNextRenewalDate(value, renewal);
  next.setHours(0, 0, 0, 0);
  return Math.ceil((next.getTime() - today.getTime()) / 86_400_000);
}

function isNextMonth(date: Date) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);
  return date >= start && date <= end;
}

function formatMoney(value: number, currency: Currency, hidden: boolean) {
  if (hidden) return "••••";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

function formatArabicDate(date: Date) {
  return new Intl.DateTimeFormat("ar-SA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function renewalLabel(renewal: Renewal) {
  return renewal === "monthly" ? "شهري" : "سنوي";
}

function remainingLabel(days: number) {
  if (days === 0) return "اليوم";
  if (days === 1) return "غداً";
  if (days === 2) return "بعد يومين";
  return `بعد ${days} يوم`;
}

function cardTier(priceInMainCurrency: number) {
  if (priceInMainCurrency >= 210) return "xl";
  if (priceInMainCurrency >= 75) return "large";
  if (priceInMainCurrency >= 30) return "medium";
  return "small";
}

function toneForSubscription(subscription: Subscription): Tone {
  const tones: Tone[] = ["violet", "mint", "rose", "gold", "sky", "peach", "aqua"];
  const seed = [...subscription.name].reduce(
    (sum, letter) => sum + letter.charCodeAt(0),
    0,
  );
  return tones[seed % tones.length];
}

function logoForName(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("youtube")) return { mark: "▶", className: "logo-youtube" };
  if (lower.includes("spotify")) return { mark: "≋", className: "logo-spotify" };
  if (lower.includes("netflix")) return { mark: "N", className: "logo-netflix" };
  if (lower.includes("icloud")) return { mark: "☁", className: "logo-icloud" };
  if (lower.includes("adobe")) return { mark: "∞", className: "logo-adobe" };
  if (lower.includes("notion")) return { mark: "N", className: "logo-notion" };
  if (lower.includes("canva")) return { mark: "C", className: "logo-canva" };
  if (name.includes("شاهد")) return { mark: "VIP", className: "logo-shahid" };
  return {
    mark: name.trim().charAt(0).toUpperCase() || "+",
    className: "logo-generic",
  };
}

// ============ Defaults ============

const blankDraft: Draft = {
  name: "",
  price: 9.99,
  currency: "SAR",
  renewal: "monthly",
  renewalDate: new Date().toISOString().slice(0, 10),
};

// ============ Component ============

export default function HomePage() {
  const [preferredCurrency, setPreferredCurrency] = useState<Currency | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [hidePrices, setHidePrices] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [ready, setReady] = useState(false);

  // تحميل البيانات من localStorage
  useEffect(() => {
    const storedCurrency = localStorage.getItem("subflow.currency") as Currency | null;
    const storedSubscriptions = localStorage.getItem("subflow.subscriptions");
    const storedPrivacy = localStorage.getItem("subflow.hidePrices");

    if (storedCurrency && currencies.includes(storedCurrency)) {
      setPreferredCurrency(storedCurrency);
    }

    const parsedSubscriptions = readStoredSubscriptions(storedSubscriptions);
    // المستخدم الجديد يبدأ بقائمة فاضية
    setSubscriptions(parsedSubscriptions ?? []);

    setHidePrices(storedPrivacy === "true");
    setReady(true);
  }, []);

  // حفظ الاشتراكات
  useEffect(() => {
    if (!ready) return;
    localStorage.setItem("subflow.subscriptions", JSON.stringify(subscriptions));
  }, [ready, subscriptions]);

  // حفظ العملة
  useEffect(() => {
    if (!ready || !preferredCurrency) return;
    localStorage.setItem("subflow.currency", preferredCurrency);
  }, [ready, preferredCurrency]);

  // حفظ تفضيل الإخفاء
  useEffect(() => {
    if (!ready) return;
    localStorage.setItem("subflow.hidePrices", String(hidePrices));
  }, [ready, hidePrices]);

  const mainCurrency = preferredCurrency ?? "SAR";

  const monthlyTotal = useMemo(() => {
    return subscriptions.reduce((total, sub) => {
      const nextRenewal = getNextRenewalDate(sub.renewalDate, sub.renewal);
      const shouldCount = sub.renewal === "monthly" || isNextMonth(nextRenewal);
      return shouldCount ? total + convert(sub.price, sub.currency, mainCurrency) : total;
    }, 0);
  }, [mainCurrency, subscriptions]);

  function openAddModal() {
    setEditingId(null);
    setDraft({ ...blankDraft, currency: mainCurrency, renewalDate: nextDate(14) });
    setModalOpen(true);
  }

  function openEditModal(subscription: Subscription) {
    setEditingId(subscription.id);
    setDraft({
      name: subscription.name,
      price: subscription.price,
      currency: subscription.currency,
      renewal: subscription.renewal,
      renewalDate: subscription.renewalDate,
    });
    setModalOpen(true);
  }

  function saveSubscription(event: FormEvent) {
    event.preventDefault();
    const normalized: Draft = {
      ...draft,
      name: draft.name.trim() || "اشتراك جديد",
      price: Math.max(0, Number(draft.price) || 0),
    };

    setSubscriptions((current) =>
      editingId
        ? current.map((sub) => (sub.id === editingId ? { ...sub, ...normalized } : sub))
        : [{ id: createId(), ...normalized }, ...current],
    );
    setModalOpen(false);
  }

  function deleteSubscription(id: string) {
    setSubscriptions((current) => current.filter((sub) => sub.id !== id));
    setModalOpen(false);
  }

  return (
    <main className="app-shell" dir="rtl">
      <div className="app-container">
        <header className="app-header">
          <div className="header-controls">
            <button
              className="round-control"
              onClick={() => setHidePrices((value) => !value)}
              title={hidePrices ? "إظهار الأسعار" : "إخفاء الأسعار"}
              type="button"
            >
              {hidePrices ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>

            <button
              className="round-control mobile-hidden"
              title="العملة الرئيسية"
              type="button"
              onClick={() => setPreferredCurrency(null)}
            >
              <Settings size={18} />
            </button>
          </div>

          <div className="header-title">
            <h1>اشتراكاتي</h1>
            <p>جميع اشتراكاتك في مكان واحد</p>
          </div>

          <button className="add-cluster" onClick={openAddModal} type="button" aria-label="إضافة اشتراك">
            <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}>
              <Plus size={44} />
            </motion.span>
            <small>إضافة اشتراك</small>
          </button>
        </header>

        <LayoutGroup>
          <motion.section className="subscription-grid" layout>
            <AnimatePresence initial={false}>
              {subscriptions.map((subscription) => {
                const convertedPrice = convert(
                  subscription.price,
                  subscription.currency,
                  mainCurrency,
                );
                const tier = cardTier(convertedPrice);
                const remaining = daysUntil(subscription.renewalDate, subscription.renewal);
                const close = remaining <= 5;
                const nextRenewal = getNextRenewalDate(
                  subscription.renewalDate,
                  subscription.renewal,
                );
                const logo = logoForName(subscription.name);
                const tone = toneForSubscription(subscription);

                return (
                  <motion.article
                    className={`subscription-card subscription-card-${tier} card-tone-${tone} ${close ? "is-close" : ""}`}
                    key={subscription.id}
                    layout
                    initial={{ opacity: 0, y: 18, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 330, damping: 30 }}
                    onDoubleClick={() => openEditModal(subscription)}
                  >
                    <div className="card-topline">
                      <div className={`app-logo ${logo.className}`}>{logo.mark}</div>
                      <span className="renewal-pill">{renewalLabel(subscription.renewal)}</span>
                    </div>

                    <div className="card-body">
                      <h2>{subscription.name}</h2>
                      <div className="price-line">
                        <strong>
                          {formatMoney(subscription.price, subscription.currency, hidePrices)}
                        </strong>
                        <span>{subscription.currency}</span>
                      </div>
                    </div>

                    <div className="card-divider" />

                    <footer className="card-footer">
                      <CalendarDays size={19} />
                      <div>
                        <p>تجديد في</p>
                        <strong>{formatArabicDate(nextRenewal)}</strong>
                      </div>
                      <span className="remaining-chip">{remainingLabel(remaining)}</span>
                    </footer>

                    <div className="card-actions">
                      <button
                        className="mini-button"
                        onClick={() => openEditModal(subscription)}
                        title="تعديل"
                        type="button"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="mini-button"
                        onClick={() => deleteSubscription(subscription.id)}
                        title="حذف"
                        type="button"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </motion.section>
        </LayoutGroup>

        {subscriptions.length === 0 && (
          <div className="empty-state">
            <p>لا توجد اشتراكات بعد</p>
            <span>أضف أول اشتراك وسيظهر ككرت جميل حسب سعره.</span>
          </div>
        )}

        <section className="bottom-summary">
          <div className="summary-icon">
            <BarChart3 size={30} />
          </div>
          <div className="summary-copy">
            <p>إجمالي الاشتراكات للشهر القادم</p>
            <strong>{formatMoney(monthlyTotal, mainCurrency, hidePrices)}</strong>
          </div>
          <div className="summary-divider" />
          <button
            className="summary-currency"
            onClick={() => setPreferredCurrency(null)}
            type="button"
          >
            <span>{currencySymbols[mainCurrency]}</span>
            {mainCurrency}
            <ChevronDown size={18} />
          </button>
          <small>تم تحويل العملات إلى {currencyArabic[mainCurrency]}</small>
        </section>

        <footer className="app-credit">
          هذا التطبيق تم تطويره بواسطة{" "}
          <a href="https://linktr.ee/EngLayan" rel="noreferrer" target="_blank">
            ليان
          </a>{" "}
          & كودكس
        </footer>
      </div>

      <AnimatePresence>
        {(!preferredCurrency || modalOpen) && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {!preferredCurrency ? (
              <motion.section
                className="modal-panel max-w-sm"
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.96 }}
              >
                <p className="modal-kicker">أول تشغيل</p>
                <h2>اختر العملة الرئيسية</h2>
                <p className="modal-subtitle">
                  سنستخدمها لحساب الإجمالي وتحويل كل الاشتراكات محلياً.
                </p>
                <div className="currency-grid">
                  {currencies.map((currency) => (
                    <button
                      className="currency-choice"
                      key={currency}
                      onClick={() => setPreferredCurrency(currency)}
                      type="button"
                    >
                      <span>{currencySymbols[currency]}</span>
                      <b>{currency}</b>
                      <small>{currencyArabic[currency]}</small>
                    </button>
                  ))}
                </div>
              </motion.section>
            ) : (
              <motion.section
                className="modal-panel"
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.96 }}
              >
                <div className="modal-head">
                  <h2>{editingId ? "تعديل الاشتراك" : "إضافة اشتراك"}</h2>
                  <button
                    className="round-control small"
                    onClick={() => setModalOpen(false)}
                    type="button"
                  >
                    <X size={18} />
                  </button>
                </div>
                <form className="form-grid" onSubmit={saveSubscription}>
                  <label className="field">
                    <span>اسم الاشتراك</span>
                    <input
                      autoFocus
                      onChange={(event) =>
                        setDraft((value) => ({ ...value, name: event.target.value }))
                      }
                      placeholder="Netflix"
                      required
                      value={draft.name}
                    />
                  </label>
                  <div className="two-columns">
                    <label className="field">
                      <span>السعر</span>
                      <input
                        min="0"
                        onChange={(event) =>
                          setDraft((value) => ({
                            ...value,
                            price: Number(event.target.value),
                          }))
                        }
                        step="0.01"
                        type="number"
                        value={draft.price}
                      />
                    </label>
                    <label className="field">
                      <span>العملة</span>
                      <select
                        onChange={(event) =>
                          setDraft((value) => ({
                            ...value,
                            currency: event.target.value as Currency,
                          }))
                        }
                        value={draft.currency}
                      >
                        {currencies.map((currency) => (
                          <option key={currency}>{currency}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="segmented">
                    {(["monthly", "yearly"] as Renewal[]).map((renewal) => (
                      <button
                        className={draft.renewal === renewal ? "active" : ""}
                        key={renewal}
                        onClick={() => setDraft((value) => ({ ...value, renewal }))}
                        type="button"
                      >
                        {renewalLabel(renewal)}
                      </button>
                    ))}
                  </div>
                  <label className="field">
                    <span>تاريخ التجديد</span>
                    <input
                      onChange={(event) =>
                        setDraft((value) => ({ ...value, renewalDate: event.target.value }))
                      }
                      required
                      type="date"
                      value={draft.renewalDate}
                    />
                  </label>
                  <button className="primary-button" type="submit">
                    {editingId ? "حفظ التعديلات" : "إضافة الاشتراك"}
                  </button>
                  {editingId && (
                    <button
                      className="delete-button"
                      onClick={() => deleteSubscription(editingId)}
                      type="button"
                    >
                      حذف الاشتراك
                    </button>
                  )}
                </form>
              </motion.section>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}