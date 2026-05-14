export const products = [
  {
    id: "rank-knight",
    name: "Knight",
    description: "Gold name + [KNIGHT] tag + chat styling.",
    amountCents: 499,
    currency: "usd",
    stripePriceId: process.env.STRIPE_PRICE_RANK_KNIGHT || "",
    targetServer: "survival",
    commands: [
      "lp user {player} parent add knight",
      "lp user {player} permission set warriders.cosmetic.rank.knight true"
    ]
  },
  {
    id: "rank-warlord",
    name: "Warlord",
    description: "Premium cosmetic tag, name styling, and tab flare.",
    amountCents: 999,
    currency: "usd",
    stripePriceId: process.env.STRIPE_PRICE_RANK_WARLORD || "",
    targetServer: "survival",
    commands: [
      "lp user {player} parent add warlord",
      "lp user {player} permission set warriders.cosmetic.rank.warlord true"
    ]
  },
  {
    id: "particle-ember",
    name: "Ember Aura",
    description: "Soft ember particles around your character.",
    amountCents: 299,
    currency: "usd",
    stripePriceId: process.env.STRIPE_PRICE_PARTICLE_EMBER || "",
    targetServer: "survival",
    commands: ["lp user {player} permission set warriders.cosmetic.particle.ember true"]
  },
  {
    id: "pet-baby-slime",
    name: "Baby Slime Pet",
    description: "A tiny slime follows you.",
    amountCents: 399,
    currency: "usd",
    stripePriceId: process.env.STRIPE_PRICE_PET_BABY_SLIME || "",
    targetServer: "survival",
    commands: ["lp user {player} permission set warriders.cosmetic.pet.baby_slime true"]
  }
];

export function getProduct(productId) {
  return products.find((product) => product.id === productId);
}
