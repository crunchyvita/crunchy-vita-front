/**
 * Fires a Meta Pixel e-commerce event using our own metaContentId as content_ids —
 * never the Mongo _id. Skips (and warns) if metaContentId is missing, rather than
 * sending an invalid id.
 */
export function trackMetaPixelEvent(eventName, metaContentId, params = {}) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;

  if (!metaContentId) {
    console.warn(`[MetaPixel] Skipping ${eventName}: missing metaContentId`);
    return;
  }

  window.fbq("track", eventName, {
    content_type: "product",
    content_ids: [metaContentId],
    ...params,
  });
}

/**
 * Purchase covers a whole order (possibly several products). Items without a
 * metaContentId are excluded from content_ids and warned about individually;
 * the event only fires if at least one item has a valid id.
 */
export function trackMetaPurchaseEvent(items, params = {}) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;

  const contentIds = [];
  for (const item of items || []) {
    if (item.metaContentId) {
      contentIds.push(item.metaContentId);
    } else {
      console.warn(
        `[MetaPixel] Purchase: excluding line item (productId=${item.productId}) — missing metaContentId`
      );
    }
  }

  if (contentIds.length === 0) {
    console.warn("[MetaPixel] Skipping Purchase: no line item has a metaContentId");
    return;
  }

  window.fbq("track", "Purchase", {
    content_type: "product",
    content_ids: contentIds,
    ...params,
  });
}
