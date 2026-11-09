"use client";

import { useState } from "react";

type AddToBagButtonProps = {
  productId: string;
  stockQuantity: number;
};

export default function AddToBagButton({
  productId,
  stockQuantity,
}: AddToBagButtonProps) {
  const [added, setAdded] = useState(false);

  function addToBag() {
    try {
      const saved = localStorage.getItem("littleRedlineCart");
      const cart = saved ? (JSON.parse(saved) as Record<string, number>) : {};
      const currentQuantity = Number(cart[productId]) || 0;
      if (currentQuantity >= stockQuantity) return;

      cart[productId] = currentQuantity + 1;
      localStorage.setItem("littleRedlineCart", JSON.stringify(cart));
      setAdded(true);
    } catch {
      setAdded(false);
    }
  }

  return (
    <button
      className="button button-red product-detail-add"
      type="button"
      onClick={addToBag}
      disabled={added}
    >
      {added ? "Added to your bag ✓" : "Add to bag"}
      {!added && <span>↗</span>}
    </button>
  );
}
