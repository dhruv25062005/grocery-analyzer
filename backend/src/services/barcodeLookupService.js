async function lookupBarcode(barcode) {
  const cleanBarcode = String(barcode || "").trim();

  if (!cleanBarcode) {
    throw new Error("Barcode is required");
  }

  const url =
    `https://world.openfoodfacts.org/api/v3/product/` +
    `${encodeURIComponent(cleanBarcode)}` +
    `?product_type=all` +
    `&fields=code,product_name,brands,categories,quantity,brand_owner,image_front_url`;

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "SmartCart/1.0 (SmartCart grocery self-checkout application)",
    },
  });

  // Product does not exist in Open Food Facts
  if (response.status === 404) {
    return {
      found: false,
      barcode: cleanBarcode,
    };
  }

  if (!response.ok) {
    throw new Error(
      `Open Food Facts request failed: ${response.status}`
    );
  }

  const data = await response.json();

  // Open Food Facts product found
  if (!data.product) {
    return {
      found: false,
      barcode: cleanBarcode,
    };
  }

  const product = data.product;

  return {
    found: true,

    product: {
      barcode: cleanBarcode,
      name: product.product_name || "",
      brand: product.brands || "",
      category: product.categories || "",
      quantity: product.quantity || "",
      manufacturer: product.brand_owner || "",
      imageUrl: product.image_front_url || "",
    },
  };
}

module.exports = {
  lookupBarcode,
};