# Fabric Retailer Data Integration Research

## Overview

This document outlines the research findings for integrating fabric data from major quilting retailers into Quillty's fabric library. The goal is to pull fabric patterns with usable images so users can browse and link out to purchase.

## Retailer Selection

After evaluating multiple options, **Fat Quarter Shop** was selected as the initial data source.

### Comparison of Options

| Retailer | Commission | Cookie | Data Feed Access | Popularity |
|----------|------------|--------|------------------|------------|
| Fat Quarter Shop | 6% | 7 days | Via Awin | Very High |
| Missouri Star Quilt Co | Undisclosed | Unknown | Unclear | Highest (largest US retailer) |
| Connecting Threads | 10% | Unknown | Own program | High |
| CreateForLess | 10% | 45 days | Via ShareASale | Moderate |
| Spoonflower | 5% | Unknown | No API | High |

### Why Fat Quarter Shop

- Consistently ranked as a top favorite among quilters
- Structured data feed access via Awin affiliate network
- Well-organized product categories with clear naming conventions
- Strong brand recognition in quilting community

## Data Access Method

### Awin Affiliate Network

Fat Quarter Shop provides product data through **Awin** (advertiser ID: 89535).

#### Setup Steps

1. Sign up for Awin publisher account at https://www.awin.com
2. Apply to Fat Quarter Shop's affiliate program
3. Once approved, access product feed via Awin's Product Feed List Download tool
4. Download feed in CSV or XML format

#### Documentation Links

- [How to access a product feed](https://success.awin.com/s/article/How-can-I-access-a-Product-Feed?language=en_US)
- [Accepted feed formats](https://help.awin.com/docs/accepted-feed-formats)
- [Fat Quarter Shop on Awin](https://ui.awin.com/merchant-profile/89535)

### Feed Data Fields

| Field (CSV) | Field (XML) | Description |
|-------------|-------------|-------------|
| `aw_product_id` | `pid` | Unique Awin product ID |
| `merchant_product_id` | `merchant_pid` | SKU (e.g., `30150-395`) |
| `product_name` | `name` | Product title |
| `merchant_category` | `category` | Category hierarchy |
| `merchant_image_url` | `imgurl` | Product image URL |
| `aw_deep_link` | `awlink` | Affiliate tracking link |
| `description` | `desc` | Product description |
| `search_price` | `price` | Current price |
| `currency` | `currency` | Price currency |

## Product Categories

### Fat Quarter Shop URL Structure

- Main site: `fatquartershop.com`
- Yardage: `/quilting-fabric-by-the-yard`
- Bundles: `/fat-quarter-bundles`
- Product pages: `/[collection]-[color]-[design]-yardage`

### SKU Naming Convention

SKUs follow manufacturer patterns:
- Moda: `30150-395` (Grunge Basics)
- Robert Kaufman: `B031-1387` (Brussels Washer)
- Product URLs include SKU: `SKU# 30150-395`

## Filtering for Usable Pattern Images

### The Problem

Not all product images are suitable for a fabric pattern library:
- **Yardage products**: Show flat fabric swatches with the actual pattern
- **Bundle products**: Show stacked/folded fabrics (multiple patterns, unusable)

### Product Types

#### Usable (Individual Pattern Images)

| Category | Description | Image Type |
|----------|-------------|------------|
| Quilting Fabric by the Yard | Individual fabric sold by yard | Flat swatch showing pattern |
| Individual Fat Quarters | Single fat quarter cuts | Flat swatch showing pattern |

#### Not Usable (Bundle/Stack Images)

| Category | Description | Why Unusable |
|----------|-------------|--------------|
| Fat Quarter Bundles | 6-42 coordinated fat quarters | Shows stacked fabrics |
| Charm Packs | 5" square bundles | Shows stacked squares |
| Layer Cakes | 10" square bundles | Shows stacked squares |
| Jelly Rolls | 2.5" strip bundles | Shows rolled strips |
| Honey Buns | 1.5" strip bundles | Shows rolled strips |
| Half Yard Bundles | 18" x 44" bundles | Shows folded stack |
| One Yard Bundles | 36" x 44" bundles | Shows folded stack |
| Mini Charm Packs | 2.5" square bundles | Shows stacked squares |
| Jolly Bars | 5" x 10" bundles | Shows stacked pieces |

### Recommended Filter Logic

```sql
-- Include products with usable pattern images
SELECT *
FROM products
WHERE (
    merchant_category LIKE '%Fabric by the Yard%'
    OR merchant_category LIKE '%Yardage%'
    OR product_name LIKE '%Yardage'
)
AND merchant_category NOT LIKE '%Bundle%'
AND merchant_category NOT LIKE '%Pack%'
AND merchant_category NOT LIKE '%Cake%'
AND merchant_category NOT LIKE '%Roll%'
AND merchant_category NOT LIKE '%Precut%'
AND product_name NOT LIKE '%Bundle%'
AND product_name NOT LIKE '%Pack%'
AND product_name NOT LIKE '%Cake%'
AND product_name NOT LIKE '%Roll%'
```

### Alternative: Product Name Suffix Check

```javascript
// Simple check: yardage products end with "Yardage"
const isUsableFabric = (productName) => {
  return productName.trim().endsWith('Yardage');
};
```

## Implementation Considerations

### Data Refresh

- Awin feeds are typically updated daily by merchants
- Consider caching feed data and refreshing on a schedule
- Track `last_updated` timestamps to identify stale products

### Image Handling

- Store `merchant_image_url` for direct linking
- Consider caching/proxying images for performance
- Verify image dimensions are suitable for fabric preview

### Affiliate Links

- Always use `aw_deep_link` for user-facing links
- Awin handles click tracking and commission attribution
- 7-day cookie duration means purchases within 7 days of click earn commission

### Category Mapping

Awin categories use hierarchical format:
```
Fabric > Quilting Fabric by the Yard > Moda Fabrics > Grunge Basics
```

Can be parsed to extract:
- Top-level category (Fabric)
- Product type (Quilting Fabric by the Yard)
- Manufacturer (Moda Fabrics)
- Collection (Grunge Basics)

## Future Expansion

### Additional Retailers

If expanding beyond Fat Quarter Shop:

1. **Missouri Star Quilt Company** - Largest US retailer, would require direct partnership inquiry
2. **CreateForLess** - 10% commission, 45-day cookie, ShareASale feed with 60K+ products

### Data Enrichment

Consider supplementing feed data with:
- Color extraction from images
- Pattern type classification (floral, geometric, solid, etc.)
- Designer/collection metadata

## References

- [Fat Quarter Shop - Quilting Fabric by the Yard](https://www.fatquartershop.com/quilting-fabric-by-the-yard)
- [Fat Quarter Shop - Precut Fabric Guide](https://www.fatquartershop.com/pre-cut-quilt-fabric-guide)
- [Awin Partner Success Center](https://success.awin.com)
- [Awin Developer Documentation](https://developer.awin.com)
