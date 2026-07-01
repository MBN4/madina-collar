import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import PageShell from "../components/PageShell";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { useCartStore } from "../store/cartStore";
import styles from "../styles/Product.module.css";
import { ProductAttribute, Quality } from "../types";
import api, { getImageUrl } from "../utils/api";

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
  const [selectedColor, setSelectedColor] = useState<ProductAttribute | null>(
    null,
  );
  const [selectedWidth, setSelectedWidth] = useState<ProductAttribute | null>(
    null,
  );
  const { updateQuantity, cart, getTotalItems } = useCartStore();

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
    return [...raw].sort((a, b) => {
      const va = parseFloat(a.value.replace(/[^\d.-]/g, "")) || 0;
      const vb = parseFloat(b.value.replace(/[^\d.-]/g, "")) || 0;
      return va - vb;
    });
  }, [currentStyle]);

  useEffect(() => {
    if (!selectedType || !currentStyle) return;
    if (categories.length) setSelectedCategory(categories[0]);
    if (colors.length) setSelectedColor(colors[0]);
    setSelectedWidth(widths.length ? widths[0] : null);
  }, [selectedType, currentStyle]);

  const getMatrixPrice = (sizeId: number) => {
    if (!selectedCategory || !selectedColor) return 0;
    const match = currentStyle?.PriceMatrices?.find(
      (p) =>
        p.categoryId === selectedCategory.id &&
        p.colorId === selectedColor.id &&
        (widths.length > 0 ? p.widthId === selectedWidth?.id : true) &&
        p.sizeId === sizeId,
    );
    return match ? Number(match.price) : 0;
  };

  const cartKey = useMemo(() => {
    if (!qualityName || !selectedType || !selectedCategory || !selectedColor)
      return null;
    let key = `${qualityName}|${selectedType}|${selectedCategory.value}|${selectedColor.value}`;
    if (selectedWidth) key += `|${selectedWidth.value}`;
    return key;
  }, [
    qualityName,
    selectedType,
    selectedCategory,
    selectedColor,
    selectedWidth,
  ]);

  const selectedSummary = useMemo(() => {
    const parts = [
      selectedType,
      selectedCategory?.value,
      selectedColor?.value,
      selectedWidth?.value,
    ].filter(Boolean) as string[];
    return parts.join(" • ");
  }, [selectedType, selectedCategory, selectedColor, selectedWidth]);

  const handleAdjust = (sizeValue: string, delta: number) => {
    if (!cartKey) return;
    updateQuantity(cartKey, sizeValue, delta);
  };

  const handleManualInput = (sizeValue: string, text: string) => {
    if (!cartKey) return;
    const newVal = parseInt(text.replace(/[^0-9]/g, ""), 10) || 0;
    const currentQty = cart[cartKey]?.[sizeValue] || 0;
    updateQuantity(cartKey, sizeValue, newVal - currentQty);
  };

  const totalItems = getTotalItems();

  if (!isAuthenticated) return null;
  if (loading)
    return (
      <PageShell title="Loading...">
        <div className={styles.loadingState}>Loading product...</div>
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
        <div className={styles.heroCard}>
          <div>
            <div className={styles.heroBadges}>
              <span className={styles.heroPill}>
                {qualityData.tag || "Premium"}
              </span>
              <span className={styles.heroPillAlt}>Mobile-style flow</span>
            </div>
            <h2 className={styles.heroTitle}>{qualityData.name}</h2>
            <p className={styles.heroText}>
              Mirror the same ordering flow as the mobile app: choose the style,
              pick the category and color, then set quantities for every size.
            </p>
          </div>
          <div className={styles.priceBox}>Rs {qualityData.price}</div>
        </div>

        <div className={styles.productGrid}>
          <div className={styles.imagePanel}>
            <div className={styles.tag}>{qualityData.tag || "Premium"}</div>
            <img
              src={getImageUrl(qualityData.image_url)}
              alt={qualityData.name}
            />
          </div>

          <div className={styles.detailsPanel}>
            <div className={styles.meta}>
              Starting at Rs {qualityData.price}
            </div>
            <div className={styles.summaryCard}>
              Choose the style, category, color, and width exactly like the
              mobile flow, then set quantities for each size.
            </div>
            <div className={styles.selectionSummary}>
              {selectedSummary || "Select a style to begin"}
            </div>

            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2>Choose Style</h2>
                <span className={styles.sectionCopy}>
                  Pick the design family first
                </span>
              </div>
              <div className={styles.buttonRow}>
                {qualityData.Styles.map((style) => (
                  <button
                    key={style.id}
                    className={
                      style.name === selectedType ? styles.activeTab : ""
                    }
                    onClick={() => setSelectedType(style.name)}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2>Options</h2>
                <span className={styles.sectionCopy}>
                  Category, color, and width stay in sync
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

                {colors.length > 0 && (
                  <div>
                    <div className={styles.optionLabel}>Color</div>
                    <div className={styles.colorRow}>
                      {colors.map((color) => (
                        <button
                          key={color.id}
                          className={`${styles.colorSwatch} ${selectedColor?.id === color.id ? styles.activeColor : ""}`}
                          style={{ backgroundColor: color.hex_code || "#ccc" }}
                          onClick={() => setSelectedColor(color)}
                          title={color.value}
                          aria-label={color.value}
                        />
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
                          {width.value}
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
                  {selectedCategory && selectedColor
                    ? `${selectedCategory.value} • ${selectedColor.value}`
                    : "Choose category and color to unlock size options"}
                </span>
              </div>
              {!selectedCategory || !selectedColor ? (
                <div className={styles.selectPrompt}>
                  Select Category &amp; Color to see sizes
                </div>
              ) : (
                <div className={styles.sizeGrid}>
                  {sizes.map((size) => {
                    const price = getMatrixPrice(size.id);
                    const qty = cartKey ? cart[cartKey]?.[size.value] || 0 : 0;
                    const outOfStock = !size.in_stock;
                    return (
                      <div
                        key={size.id}
                        className={`${styles.sizeCard} ${outOfStock ? styles.outOfStock : ""}`}
                      >
                        <div className={styles.sizeTop}>
                          <span>{size.value}</span>
                          <strong>Rs {price}</strong>
                        </div>
                        {outOfStock ? (
                          <div className={styles.outOfStockBadge}>
                            Out of Stock
                          </div>
                        ) : (
                          <div className={styles.sizeBottom}>
                            <button
                              onClick={() => handleAdjust(size.value, -1)}
                            >
                              −
                            </button>
                            <input
                              className={styles.qtyInput}
                              type="text"
                              inputMode="numeric"
                              value={qty}
                              onChange={(e) =>
                                handleManualInput(size.value, e.target.value)
                              }
                            />
                            <button onClick={() => handleAdjust(size.value, 1)}>
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              className={styles.primaryAction}
              onClick={() => router.push("/checkout")}
              disabled={totalItems === 0}
            >
              {totalItems > 0
                ? `Proceed to Checkout (${totalItems} items)`
                : "Add items to continue"}
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
