import "dotenv/config";
import { Sequelize } from "sequelize";
import { sequelize } from "./config/db.js";
import Quality from "./models/Quality.js";
import Style from "./models/Style.js";
import ProductAttribute from "./models/ProductAttribute.js";
import OrderItem from "./models/OrderItem.js";
import "./models/PriceMatrix.js";

// Ensure associations are set up (mirrors server.js if you have that pattern)
Quality.hasMany(Style, { foreignKey: "qualityId" });
Style.belongsTo(Quality, { foreignKey: "qualityId" });
Style.hasMany(ProductAttribute, { foreignKey: "styleId" });
ProductAttribute.belongsTo(Style, { foreignKey: "styleId" });

(async () => {
  try {
    await sequelize.authenticate();

    const qualities = await Quality.findAll({
      include: [{ model: Style, include: [ProductAttribute] }],
      order: [["id", "ASC"]],
    });

    console.log("\n== Qualities in DB ==");
    for (const q of qualities) {
      console.log(`- ${q.name} (${q.Styles?.length || 0} styles)`);
      for (const s of q.Styles || []) {
        const sizes = (s.ProductAttributes || []).filter((a) => a.type === "size");
        console.log(`   • ${s.name} — sizes: ${sizes.map((z) => z.value).join(", ") || "(none)"}`);
      }
    }

    const totals = await OrderItem.findAll({
      attributes: [
        "quality",
        "style",
        "size",
        [Sequelize.fn("SUM", Sequelize.col("quantity")), "totalOrdered"],
      ],
      group: ["quality", "style", "size"],
    });

    console.log("\n== OrderItem aggregates (quality | style | size = qty) ==");
    if (!totals.length) console.log("(none — no orders placed yet)");
    for (const t of totals) {
      console.log(
        `  ${t.get("quality")} | ${t.get("style")} | ${t.get("size")} = ${t.get("totalOrdered")}`,
      );
    }

    console.log("\n(If Quality/Style/Size strings in the aggregates don't EXACTLY match the catalog names + attribute values above, the report will show zeros.)");
    process.exit(0);
  } catch (err) {
    console.error("diag-stock failed:", err.message);
    process.exit(1);
  }
})();
