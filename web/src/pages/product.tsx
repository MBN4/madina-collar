import { ChevronDown, ChevronRight, ChevronUp, ShoppingBag } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import PageShell from "../components/PageShell";
import Loader from "../components/ui/Loader";
import SizeLabel from "../components/SizeLabel";
import StaggerItem from "../components/ui/StaggerItem";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { useCartStore } from "../store/cartStore";
import styles from "../styles/Product.module.css";
import { DEFAULT_QUALITY_THEME, QUALITY_THEMES } from "../styles/theme";
import { ProductAttribute, Quality } from "../types";
import api, { getImageUrl } from "../utils/api";
import { sizeToNumber } from "../utils/sizeOrder";

export default function Product() {
  const router = useRouter();
  const isAuthenticated = useRequireAuth();
  const { qualityId, qualityName } = router.query as {
    qualityId?: string;
    qualityName?: string;
  };
  const [qualityData, setQualityData] = useState<Quality | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<ProductAttribute | null>(null);
  const [selectedWidth, setSelectedWidth] = useState<ProductAttribute | null>(
    null,
  );
  const [activeColorBySize, setActiveColorBySize] = useState<
    Record<number, number>
  >({});
  const { updateQuantity, cart, getTotalItems } = useCartStore();

  const currentTheme = (qualityName && QUALITY_THEMES[qualityName]) || DEFAULT_QUALITY_THEME;

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!qualityId) return;
    setLoading(true);
    api
      .get("/admin/qualities")
      .then((res) => {
        const found = res.data.find((q: Quality) => q.id === Number(qualityId));
        setQualityData(found || null);
        if (found?.Styles?.length) {
          setSelectedType(found.Styles[0].name);
        }
      })
      .catch(() => setError("Unable to load product."))
      .finally(() => setLoading(false));
  }, [isAuthenticated, qualityId]);

  const currentStyle = useMemo(() => {
    return (
      qualityData?.Styles?.find((style) => style.name === selectedType) || null
    );
  }, [qualityData, selectedType]);

  const categories = useMemo(
    () =>
      currentStyle?.ProductAttributes?.filter((a) => a.type === "category") ||
      [],
    [currentStyle],
  );
  const colors = useMemo(
    () =>
      currentStyle?.ProductAttributes?.filter((a) => a.type === "color") || [],
    [currentStyle],
  );
  const widths = useMemo(
    () =>
      currentStyle?.ProductAttributes?.filter((a) => a.type === "width") || [],
    [currentStyle],
  );
  const sizes = useMemo(() => {
    const raw =
      currentStyle?.ProductAttributes?.filter((a) => a.type === "size") || [];
    return [...raw].sort((a, b) => sizeToNumber(a.value) - sizeToNumber(b.value));
  }, [currentStyle]);

  useEffect(() => {
    if (!selectedType || !currentStyle) return;
    if (categories.length) setSelectedCategory(categories[0]);
    setSelectedWidth(widths.length ? widths[0] : null);
  }, [selectedType, currentStyle]);

  const getMatrixPrice = (sizeId: number, color: ProductAttribute) => {
    if (!selectedCategory) return 0;
    const match = currentStyle?.PriceMatrices?.find(
      (p) =>
        p.categoryId === selectedCategory.id &&
        p.colorId === color.id &&
        (widths.length > 0 ? p.widthId === selectedWidth?.id : true) &&
        p.sizeId === sizeId,
    );
    return match ? Number(match.price) : 0;
  };

  const totalPrice = useMemo(() => {
    let total = 0;
    Object.entries(cart).forEach(([key, sizesMap]) => {
      if (!qualityName || !key.startsWith(qualityName)) return;
      const parts = key.split("|");
      const styleName = parts[1];
      const catVal = parts[2];
      const colVal = parts[3];
      const widVal = parts[4] || null;
      const styleObj = qualityData?.Styles?.find((s) => s.name === styleName);
      if (!styleObj) return;
      const catAttr = styleObj.ProductAttributes?.find(
        (a) => a.type === "category" && a.value === catVal,
      );
      const colAttr = styleObj.ProductAttributes?.find(
        (a) => a.type === "color" && a.value === colVal,
      );
      const widAttr = widVal
        ? styleObj.ProductAttributes?.find(
            (a) => a.type === "width" && a.value === widVal,
          )
        : null;
      if (!catAttr || !colAttr) return;
      Object.entries(sizesMap).forEach(([szVal, qty]) => {
        const szAttr = styleObj.ProductAttributes?.find(
          (a) => a.type === "size" && a.value === szVal,
        );
        if (!szAttr) return;
        const match = styleObj.PriceMatrices?.find(
          (p) =>
            p.categoryId === catAttr.id &&
            p.colorId === colAttr.id &&
            (widAttr ? p.widthId === widAttr.id : true) &&
            p.sizeId === szAttr.id,
        );
        total += (Number(match?.price) || 0) * qty;
      });
    });
    return total;
  }, [cart, qualityData, qualityName]);

  const buildCartKey = (color: ProductAttribute) => {
    if (!qualityName || !selectedType || !selectedCategory) return null;
    let key = `${qualityName}|${selectedType}|${selectedCategory.value}|${color.value}`;
    if (selectedWidth) key += `|${selectedWidth.value}`;
    return key;
  };

  const getActiveColor = (size: ProductAttribute) => {
    const activeId = activeColorBySize[size.id];
    return colors.find((c) => c.id === activeId) || colors[0];
  };

  const handleAdjust = (sizeValue: string, color: ProductAttribute, delta: number) => {
    const cartKey = buildCartKey(color);
    if (!cartKey) return;
    updateQuantity(cartKey, sizeValue, delta);
  };

  const handleManualInput = (sizeValue: string, color: ProductAttribute, text: string) => {
    const cartKey = buildCartKey(color);
    if (!cartKey) return;
    const newVal = parseInt(text.replace(/[^0-9]/g, ""), 10) || 0;
    const currentQty = cart[cartKey]?.[sizeValue] || 0;
    updateQuantity(cartKey, sizeValue, newVal - currentQty);
  };

  const totalItems = getTotalItems();

  if (!isAuthenticated) return null;
  if (loading)
    return (
      <PageShell title="">
        <Loader label="Syncing catalog..." />
      </PageShell>
    );
  if (error || !qualityData)
    return (
      <PageShell title="Product">
        <div className={styles.loadingState}>Unable to load product.</div>
      </PageShell>
    );

  return (
    <PageShell title={qualityData.name || "Product"}>
      <div className={styles.productShell}>
        <div className={styles.heroCard} style={{ background: currentTheme.gradient }}>
          <div>
            <div className={styles.heroBadges}>
              <span className={styles.heroPillAlt}>Mobile-style flow</span>
            </div>
            <h2 className={styles.heroTitle}>{qualityData.name}</h2>
            <p className={styles.heroText}>
              Mirror the same ordering flow as the mobile app: choose the style,
              pick the category and color, then set quantities for every size.
            </p>
          </div>
          <div className={styles.priceBox}>{Number(qualityData.price) > 0 ? `Rs ${qualityData.price}` : 'NA'}</div>
        </div>

        <div className={styles.productGrid}>
          <div className={styles.imagePanel}>
            <div className={styles.tag}>{qualityData.tag || "Premium"}</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getImageUrl(qualityData.image_url)}
              alt={qualityData.name}
            />
          </div>

          <div className={styles.detailsPanel}>
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2>Choose Style</h2>
                <span className={styles.sectionCopy}>
                  Pick the design family first
                </span>
              </div>
              <div className={styles.buttonRow}>
                {qualityData.Styles.map((style, index) => (
                  <StaggerItem key={style.id} index={index} staggerMs={150} direction="down">
                    <button
                      className={style.name === selectedType ? styles.activeTab : ""}
                      onClick={() => setSelectedType(style.name)}
                    >
                      {style.name}
                    </button>
                  </StaggerItem>
                ))}
              </div>
            </div>

            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2>Options</h2>
                <span className={styles.sectionCopy}>
                  Category and width stay in sync — pick a color per size below
                </span>
              </div>
              <div className={styles.optionGroups}>
                {categories.length > 0 && (
                  <div>
                    <div className={styles.optionLabel}>Category</div>
                    <div className={styles.buttonRow}>
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          className={
                            selectedCategory?.id === category.id
                              ? styles.activeTab
                              : ""
                          }
                          onClick={() => setSelectedCategory(category)}
                        >
                          {category.value}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {widths.length > 0 && (
                  <div>
                    <div className={styles.optionLabel}>Width</div>
                    <div className={styles.buttonRow}>
                      {widths.map((width) => (
                        <button
                          key={width.id}
                          className={
                            selectedWidth?.id === width.id
                              ? styles.activeTab
                              : ""
                          }
                          onClick={() => setSelectedWidth(width)}
                        >
                          <SizeLabel value={width.value} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2>Sizes & Quantities</h2>
                <span className={styles.sectionCopy}>
                  {selectedCategory
                    ? `${selectedCategory.value} — pick a color per size, then set quantity`
                    : "Choose a category to unlock size options"}
                </span>
              </div>
              {!selectedCategory || !colors.length ? (
                <div className={styles.selectPrompt}>
                  {!selectedCategory
                    ? "Select a Category to see sizes"
                    : "No colors configured for this style"}
                </div>
              ) : (
                <div className={styles.sizeList}>
                  {sizes.map((size, index) => {
                    const outOfStock = !size.in_stock;
                    const activeColor = getActiveColor(size);
                    const cartKey = buildCartKey(activeColor);
                    const price = getMatrixPrice(size.id, activeColor);
                    const qty = cartKey
                      ? cart[cartKey]?.[size.value] || 0
                      : 0;
                    const unpriced = !(price > 0);
                    const unavailable = outOfStock || unpriced;
                    return (
                      <StaggerItem
                        key={size.id}
                        index={index}
                        staggerMs={20}
                        direction="right"
                      >
                        <div className={styles.sizeRow}>
                          <div className={styles.sizeRowLabel}>
                            <SizeLabel value={size.value} />
                          </div>

                          <div className={styles.colorChips}>
                            {colors.map((color) => (
                              <button
                                key={color.id}
                                type="button"
                                className={`${styles.colorChip} ${activeColor?.id === color.id ? styles.colorChipActive : ""}`}
                                style={{ backgroundColor: color.hex_code || "#ccc" }}
                                onClick={() =>
                                  setActiveColorBySize((prev) => ({
                                    ...prev,
                                    [size.id]: color.id,
                                  }))
                                }
                                title={color.value}
                                aria-label={color.value}
                                aria-pressed={activeColor?.id === color.id}
                              />
                            ))}
                          </div>

                          <div
                            className={`${styles.sizeRowCounter} ${unavailable ? styles.outOfStock : ""}`}
                          >
                            {unavailable ? (
                              <span className={styles.cellNa}>
                                {outOfStock ? "Out of Stock" : "NA"}
                              </span>
                            ) : (
                              <>
                                <span className={styles.cellPrice}>Rs {price}</span>
                                <div className={styles.sizeBottom}>
                                  <input
                                    className={styles.qtyInput}
                                    type="text"
                                    inputMode="numeric"
                                    value={qty}
                                    onChange={(e) =>
                                      handleManualInput(
                                        size.value,
                                        activeColor,
                                        e.target.value,
                                      )
                                    }
                                  />
                                  <div>
                                    <button
                                      onClick={() =>
                                        handleAdjust(size.value, activeColor, 1)
                                      }
                                      aria-label="Increase"
                                    >
                                      <ChevronUp size={16} strokeWidth={3} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleAdjust(size.value, activeColor, -1)
                                      }
                                      aria-label="Decrease"
                                    >
                                      <ChevronDown size={16} strokeWidth={3} />
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </StaggerItem>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={styles.footerBar}>
              <div className={styles.footerData}>
                <div className={styles.basketBadge}>
                  <ShoppingBag size={12} />
                  {totalItems} ITEMS
                </div>
                <div className={styles.grandPrice}>
                  {totalItems > 0 ? `Rs ${totalPrice}` : "Add items to continue"}
                </div>
              </div>
              <button
                className={styles.primaryAction}
                onClick={() => router.push("/checkout")}
                disabled={totalItems === 0}
              >
                Proceed
                <span className={styles.primaryActionIcon}>
                  <ChevronRight size={20} color={currentTheme.primary} />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
