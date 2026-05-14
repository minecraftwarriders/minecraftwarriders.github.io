export const products = [
  {
    id: "trail-personal-sunshine",
    name: "Personal Sunshine",
    description: "A warm golden dust trail.",
    amountCents: 199,
    currency: "usd",
    stripePriceId: process.env.STRIPE_PRICE_TRAIL_PERSONAL_SUNSHINE || "",
    targetServer: "survival",
    commands: ["lp user {player} permission set warriders.cosmetic.trail.personal_sunshine true"]
  },
  {
    id: "trail-coffee-wisps",
    name: "Coffee Wisps",
    description: "Soft roasted smoke wisps.",
    amountCents: 199,
    currency: "usd",
    stripePriceId: process.env.STRIPE_PRICE_TRAIL_COFFEE_WISPS || "",
    targetServer: "survival",
    commands: ["lp user {player} permission set warriders.cosmetic.trail.coffee_wisps true"]
  },
  {
    id: "trail-bubble-world",
    name: "Bubble World",
    description: "A clear bubble trail.",
    amountCents: 199,
    currency: "usd",
    stripePriceId: process.env.STRIPE_PRICE_TRAIL_BUBBLE_WORLD || "",
    targetServer: "survival",
    commands: ["lp user {player} permission set warriders.cosmetic.trail.bubble_world true"]
  },
  {
    id: "trail-soul-flame",
    name: "Soul Flame",
    description: "A blue soul fire trail.",
    amountCents: 249,
    currency: "usd",
    stripePriceId: process.env.STRIPE_PRICE_TRAIL_SOUL_FLAME || "",
    targetServer: "survival",
    commands: ["lp user {player} permission set warriders.cosmetic.trail.soul_flame true"]
  },
  {
    id: "trail-enchanted-glyphs",
    name: "Enchanted Glyphs",
    description: "Glowing arcane trail particles.",
    amountCents: 299,
    currency: "usd",
    stripePriceId: process.env.STRIPE_PRICE_TRAIL_ENCHANTED_GLYPHS || "",
    targetServer: "survival",
    commands: ["lp user {player} permission set warriders.cosmetic.trail.enchanted_glyphs true"]
  },
  {
    id: "pet-gerald",
    name: "Gerald",
    description: "A chicken companion.",
    amountCents: 399,
    currency: "usd",
    stripePriceId: process.env.STRIPE_PRICE_PET_GERALD || "",
    targetServer: "survival",
    commands: ["lp user {player} permission set warriders.cosmetic.pet.gerald true"]
  },
  {
    id: "pet-business-cat",
    name: "Business Cat",
    description: "A cat in a tiny tie.",
    amountCents: 499,
    currency: "usd",
    stripePriceId: process.env.STRIPE_PRICE_PET_BUSINESS_CAT || "",
    targetServer: "survival",
    commands: ["lp user {player} permission set warriders.cosmetic.pet.business_cat true"]
  },
  {
    id: "pet-sad-crab",
    name: "Sad Crab",
    description: "A crab doing his best.",
    amountCents: 399,
    currency: "usd",
    stripePriceId: process.env.STRIPE_PRICE_PET_SAD_CRAB || "",
    targetServer: "survival",
    commands: ["lp user {player} permission set warriders.cosmetic.pet.sad_crab true"]
  },
  {
    id: "pet-biscuit",
    name: "Biscuit",
    description: "A golden retriever puppy.",
    amountCents: 499,
    currency: "usd",
    stripePriceId: process.env.STRIPE_PRICE_PET_BISCUIT || "",
    targetServer: "survival",
    commands: ["lp user {player} permission set warriders.cosmetic.pet.biscuit true"]
  },
  {
    id: "pet-mochi",
    name: "Mochi",
    description: "A tiny round cat.",
    amountCents: 499,
    currency: "usd",
    stripePriceId: process.env.STRIPE_PRICE_PET_MOCHI || "",
    targetServer: "survival",
    commands: ["lp user {player} permission set warriders.cosmetic.pet.mochi true"]
  },
  {
    id: "hat-sunny-side-up",
    name: "Sunny Side Up",
    description: "A fried egg hat.",
    amountCents: 199,
    currency: "usd",
    stripePriceId: process.env.STRIPE_PRICE_HAT_SUNNY_SIDE_UP || "",
    targetServer: "survival",
    commands: ["lp user {player} permission set warriders.cosmetic.hat.sunny_side_up true"]
  },
  {
    id: "hat-fedora",
    name: "The Fedora",
    description: "A stylish hat cosmetic.",
    amountCents: 199,
    currency: "usd",
    stripePriceId: process.env.STRIPE_PRICE_HAT_FEDORA || "",
    targetServer: "survival",
    commands: ["lp user {player} permission set warriders.cosmetic.hat.fedora true"]
  },
  {
    id: "tag-certified-menace",
    name: "[Certified Menace]",
    description: "A cosmetic chat tag.",
    amountCents: 199,
    currency: "usd",
    stripePriceId: process.env.STRIPE_PRICE_TAG_CERTIFIED_MENACE || "",
    targetServer: "survival",
    commands: ["lp user {player} permission set warriders.cosmetic.tag.certified_menace true"]
  },
  {
    id: "tag-doing-my-best",
    name: "[Doing My Best]",
    description: "A cosmetic chat tag.",
    amountCents: 149,
    currency: "usd",
    stripePriceId: process.env.STRIPE_PRICE_TAG_DOING_MY_BEST || "",
    targetServer: "survival",
    commands: ["lp user {player} permission set warriders.cosmetic.tag.doing_my_best true"]
  }
];

export function getProduct(productId) {
  return products.find((product) => product.id === productId);
}
