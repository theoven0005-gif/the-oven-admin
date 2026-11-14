/**
 * The Oven — real menu seed data (from the restaurant flyers, Oct 2026).
 *
 * Each entry: { name, description, price (base/smallest price), category,
 * available, featured, sizes? }.
 * Pizzas carry a `sizes` array with per-size pricing; the `price` field is the
 * smallest/starting price so list views stay simple.
 *
 * Seeding is idempotent: the Menu page checks whether `menuItems` is empty
 * before writing these (see Menu.tsx `seedMenu`).
 */

export interface SeedMenuItem {
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  featured: boolean;
  sizes?: { label: string; price: number }[];
}

export interface SeedCategory {
  name: string;
  description: string;
  sortOrder: number;
  active: boolean;
}

export const categorySeed: SeedCategory[] = [
  { name: 'Pizza', description: 'Fresh from the oven', sortOrder: 1, active: true },
  { name: 'Burgers', description: 'Juicy grilled & crispy', sortOrder: 2, active: true },
  { name: 'Wraps', description: 'Wraps & sandwiches', sortOrder: 3, active: true },
  { name: 'Sides', description: 'Fries, platters & pasta', sortOrder: 4, active: true },
  { name: 'Shawarma', description: 'Rolled fresh to order', sortOrder: 5, active: true },
  { name: 'Wings', description: 'Crispy & juicy', sortOrder: 6, active: true },
  { name: 'Drinks', description: 'Hot & cold beverages', sortOrder: 7, active: true },
  { name: 'Deals', description: 'Family & party combos', sortOrder: 8, active: true },
  { name: 'Extra Toppings', description: 'Make it yours', sortOrder: 9, active: true },
];

export const menuSeed: SeedMenuItem[] = [
  /* ------------------------------ PIZZA ------------------------------ */
  {
    name: 'Arabic Bite', description: 'Middle-Eastern inspired pizza with spiced chicken and garlic sauce.',
    price: 1300, category: 'Pizza', available: true, featured: false,
    sizes: [{ label: 'M', price: 1300 }, { label: 'L', price: 1800 }],
  },
  {
    name: 'Emperor Pizza', description: 'Loaded royal pizza with double cheese and premium toppings.',
    price: 1550, category: 'Pizza', available: true, featured: false,
    sizes: [{ label: 'M', price: 1550 }, { label: 'L', price: 2050 }],
  },
  {
    name: 'Oven Special Stuff', description: 'Our signature stuffed-crust pizza, baked fresh in the oven.',
    price: 1550, category: 'Pizza', available: true, featured: false,
    sizes: [{ label: 'M', price: 1550 }, { label: 'L', price: 2150 }],
  },
  {
    name: 'Pizza Pasta', description: 'Fusion favourite — pizza flavours tossed with pasta.',
    price: 1500, category: 'Pizza', available: true, featured: false,
    sizes: [{ label: 'M', price: 1500 }, { label: 'L', price: 2050 }],
  },
  {
    name: 'Crown Crust', description: 'Signature pizza with a crust made of cheese-filled crowns.',
    price: 1200, category: 'Pizza', available: true, featured: true,
    sizes: [{ label: 'M', price: 1200 }, { label: 'L', price: 1550 }],
  },
  {
    name: 'Special Extreme Plus', description: 'The ultimate loaded pizza — everything, turned up.',
    price: 850, category: 'Pizza', available: true, featured: false,
    sizes: [{ label: 'S', price: 850 }, { label: 'M', price: 1550 }, { label: 'L', price: 2050 }],
  },
  {
    name: 'Shawarma Pizza', description: 'Shawarma-spiced chicken, garlic sauce and mozzarella.',
    price: 700, category: 'Pizza', available: true, featured: false,
    sizes: [{ label: 'S', price: 700 }, { label: 'M', price: 1050 }, { label: 'L', price: 1400 }],
  },
  {
    name: 'Creamy Pizza', description: 'Rich creamy sauce with tender chicken pieces.',
    price: 700, category: 'Pizza', available: true, featured: false,
    sizes: [{ label: 'S', price: 700 }, { label: 'M', price: 1100 }, { label: 'L', price: 1350 }],
  },
  {
    name: 'Special Fajita', description: 'Classic fajita chicken with capsicum, onion and mozzarella.',
    price: 650, category: 'Pizza', available: true, featured: true,
    sizes: [{ label: 'S', price: 650 }, { label: 'M', price: 950 }, { label: 'L', price: 1150 }],
  },
  {
    name: 'Chicken Tikka', description: 'Smoky chicken tikka, onions and a desi spice blend.',
    price: 650, category: 'Pizza', available: true, featured: true,
    sizes: [{ label: 'S', price: 650 }, { label: 'M', price: 950 }, { label: 'L', price: 1150 }],
  },
  {
    name: 'Cheese Lover', description: 'Triple cheese delight for the true cheese fan.',
    price: 450, category: 'Pizza', available: true, featured: false,
    sizes: [{ label: 'S', price: 450 }, { label: 'M', price: 800 }, { label: 'L', price: 950 }],
  },
  {
    name: 'Special Extreme', description: 'Extra toppings, extra cheese, extra everything.',
    price: 750, category: 'Pizza', available: true, featured: false,
    sizes: [{ label: 'S', price: 750 }, { label: 'M', price: 1200 }, { label: 'L', price: 1550 }],
  },
  {
    name: 'Extra Large Pizza', description: 'Our biggest pizza — choose Special or Regular flavour.',
    price: 2100, category: 'Pizza', available: true, featured: false,
    sizes: [{ label: 'Regular', price: 2100 }, { label: 'Special', price: 2700 }],
  },

  /* ----------------------------- BURGERS ----------------------------- */
  { name: 'Zinger Burger', description: 'Crispy fried chicken fillet with spicy mayo and lettuce.', price: 420, category: 'Burgers', available: true, featured: true },
  { name: 'Chicken Burger', description: 'Juicy grilled chicken patty with fresh veggies.', price: 350, category: 'Burgers', available: true, featured: false },
  { name: 'Tower Burger', description: 'Double-decker tower of chicken, cheese and sauces.', price: 700, category: 'Burgers', available: true, featured: false },
  { name: 'Chicken & Chapli Burger', description: 'Best of both — chicken fillet plus a desi chapli patty.', price: 450, category: 'Burgers', available: true, featured: false },
  { name: 'Chapli Burger', description: 'Traditional chapli kebab patty in a soft bun.', price: 350, category: 'Burgers', available: true, featured: false },
  { name: 'Grill Burger', description: 'Flame-grilled chicken with smoky BBQ sauce.', price: 600, category: 'Burgers', available: true, featured: false },
  { name: 'Oven Special Grill Burger', description: 'Our chef\u2019s special grilled creation.', price: 700, category: 'Burgers', available: true, featured: true },
  { name: 'Emperor Burger', description: 'Double patty giant burger with extra cheese.', price: 800, category: 'Burgers', available: true, featured: true },

  /* ------------------------------ WRAPS ------------------------------ */
  { name: 'Tortilla Grill Wrap', description: 'Grilled chicken wrapped in a soft tortilla.', price: 550, category: 'Wraps', available: true, featured: false },
  { name: 'Behari Wrap', description: 'Spicy chicken behari boti rolled in a fresh paratha.', price: 650, category: 'Wraps', available: true, featured: false },
  { name: 'Emperor Wrap', description: 'Royal wrap loaded with chicken and sauces.', price: 650, category: 'Wraps', available: true, featured: false },
  { name: 'Grill Sandwich', description: 'Triple-layer grilled sandwich with chicken.', price: 700, category: 'Wraps', available: true, featured: false },
  { name: 'Pan Sandwich', description: 'Pressed pan sandwich with melty cheese.', price: 700, category: 'Wraps', available: true, featured: false },

  /* ------------------------------ SIDES ------------------------------ */
  {
    name: 'Loaded Fries', description: 'Crispy fries loaded with chicken, cheese and sauces.',
    price: 500, category: 'Sides', available: true, featured: true,
    sizes: [{ label: 'S', price: 500 }, { label: 'M', price: 750 }, { label: 'L', price: 1050 }],
  },
  { name: 'Shawarma Platter', description: 'Open shawarma platter with fries and sauces.', price: 550, category: 'Sides', available: true, featured: false },
  { name: 'Pizza Platter', description: 'Bite-size pizza pieces, perfect for sharing.', price: 1200, category: 'Sides', available: true, featured: false },
  {
    name: 'Chicken Cheese Pasta', description: 'Creamy white-sauce pasta with chicken and cheese.',
    price: 550, category: 'Sides', available: true, featured: false,
    sizes: [{ label: 'S', price: 550 }, { label: 'L', price: 800 }],
  },
  {
    name: 'Chicken Crunchy Pasta', description: 'Creamy pasta topped with crunchy chicken pieces.',
    price: 550, category: 'Sides', available: true, featured: false,
    sizes: [{ label: 'S', price: 550 }, { label: 'L', price: 800 }],
  },
  { name: 'Regular Fries', description: 'Golden crispy classic fries.', price: 250, category: 'Sides', available: true, featured: false },
  { name: 'Large Fries', description: 'A generous basket of golden fries.', price: 400, category: 'Sides', available: true, featured: false },
  { name: 'Hotshots Nuggets', description: 'Spicy bite-size chicken hotshots.', price: 400, category: 'Sides', available: true, featured: false },

  /* ----------------------------- SHAWARMA ---------------------------- */
  { name: 'Plain Shawarma', description: 'Classic chicken shawarma in soft pita.', price: 250, category: 'Shawarma', available: true, featured: false },
  { name: 'Chicken Cheese Shawarma', description: 'Shawarma with a molten cheese core.', price: 320, category: 'Shawarma', available: true, featured: false },
  { name: 'Zinger Shawarma', description: 'Crispy zinger strips rolled shawarma-style.', price: 380, category: 'Shawarma', available: true, featured: true },
  { name: 'Malai Boti Shawarma', description: 'Creamy malai boti in a soft wrap.', price: 300, category: 'Shawarma', available: true, featured: false },
  { name: 'Grill Shawarma', description: 'Smoky grilled chicken shawarma.', price: 300, category: 'Shawarma', available: true, featured: false },
  { name: 'Paratha Wrap', description: 'Shawarma rolled in a flaky desi paratha.', price: 400, category: 'Shawarma', available: true, featured: false },
  { name: 'Twister Wrap', description: 'Twisted tortilla wrap with crispy chicken.', price: 400, category: 'Shawarma', available: true, featured: false },

  /* ------------------------------ WINGS ------------------------------ */
  {
    name: 'Hot Wings', description: 'Fiery tossed wings — 5 or 10 pieces.',
    price: 380, category: 'Wings', available: true, featured: false,
    sizes: [{ label: '5 pc', price: 380 }, { label: '10 pc', price: 720 }],
  },
  {
    name: 'Juicy Wings', description: 'Tender, juicy wings with house glaze.',
    price: 400, category: 'Wings', available: true, featured: true,
    sizes: [{ label: '5 pc', price: 400 }, { label: '10 pc', price: 800 }],
  },
  {
    name: 'Special Juicy Wings', description: 'Our special-recipe wings, extra saucy.',
    price: 500, category: 'Wings', available: true, featured: false,
    sizes: [{ label: '5 pc', price: 500 }, { label: '10 pc', price: 850 }],
  },
  { name: 'Fried Chest Piece', description: 'Crispy fried chicken chest piece.', price: 500, category: 'Wings', available: true, featured: false },

  /* ------------------------------ DRINKS ----------------------------- */
  { name: 'Cappuccino', description: 'Classic frothy Italian coffee.', price: 180, category: 'Drinks', available: true, featured: false },
  { name: 'Latte', description: 'Smooth milky espresso.', price: 180, category: 'Drinks', available: true, featured: false },
  { name: 'Karak Chai', description: 'Strong desi doodh patti.', price: 100, category: 'Drinks', available: true, featured: false },
  { name: 'Cardamom Chai', description: 'Fragrant elaichi chai.', price: 160, category: 'Drinks', available: true, featured: false },
  { name: 'Kashmiri Chai', description: 'Pink tea with crushed nuts.', price: 130, category: 'Drinks', available: true, featured: false },
  { name: 'Green Tea', description: 'Light and refreshing.', price: 100, category: 'Drinks', available: true, featured: false },
  { name: 'Blue Lagoon', description: 'Citrus-blue fizzy cooler.', price: 150, category: 'Drinks', available: true, featured: false },
  { name: 'Blue Sapphire', description: 'Signature blue mocktail.', price: 200, category: 'Drinks', available: true, featured: false },
  { name: 'Mint Margrita', description: 'Fresh mint and lemon cooler.', price: 200, category: 'Drinks', available: true, featured: true },
  { name: 'Ice Cream Shake', description: 'Thick shake with a scoop of ice cream.', price: 300, category: 'Drinks', available: true, featured: false },
  { name: 'Cocktail Shake', description: 'Mixed fruit cocktail shake.', price: 300, category: 'Drinks', available: true, featured: false },
  { name: 'Pina Colada', description: 'Pineapple-coconut classic.', price: 250, category: 'Drinks', available: true, featured: false },
  { name: 'Cocktail Juice', description: 'Fresh mixed fruit juice.', price: 200, category: 'Drinks', available: true, featured: false },
  { name: 'Cold Coffee', description: 'Iced blended coffee.', price: 300, category: 'Drinks', available: true, featured: false },
  { name: 'Ice Cream Single Scoop', description: 'One scoop of creamy ice cream.', price: 120, category: 'Drinks', available: true, featured: false },
  { name: 'Regular Drink', description: 'Chilled soft drink (345ml).', price: 100, category: 'Drinks', available: true, featured: false },
  { name: '500ml Drink', description: 'Soft drink bottle 500ml.', price: 120, category: 'Drinks', available: true, featured: false },
  { name: '1 Litre Drink', description: 'Family-size soft drink 1L.', price: 180, category: 'Drinks', available: true, featured: false },
  { name: '1.5 Litre Drink', description: 'Party-size soft drink 1.5L.', price: 230, category: 'Drinks', available: true, featured: false },
  { name: 'Water Large', description: 'Mineral water 1.5L.', price: 120, category: 'Drinks', available: true, featured: false },
  { name: 'Water Small', description: 'Mineral water 500ml.', price: 70, category: 'Drinks', available: true, featured: false },

  /* -------------------------- EXTRA TOPPINGS ------------------------- */
  {
    name: 'Extra Chicken', description: 'Add extra chicken to any pizza.',
    price: 150, category: 'Extra Toppings', available: true, featured: false,
    sizes: [{ label: 'S', price: 150 }, { label: 'M', price: 200 }, { label: 'L', price: 250 }],
  },
  {
    name: 'Extra Cheese', description: 'Add extra mozzarella to any pizza.',
    price: 150, category: 'Extra Toppings', available: true, featured: false,
    sizes: [{ label: 'S', price: 150 }, { label: 'M', price: 200 }, { label: 'L', price: 250 }],
  },

  /* ------------------------------ DEALS ------------------------------ */
  { name: 'Deal 1', description: '2 Zinger Burgers + 500ml Drink', price: 890, category: 'Deals', available: true, featured: false },
  { name: 'Deal 2', description: '4 Zinger Burgers + 1L Drink', price: 1760, category: 'Deals', available: true, featured: true },
  { name: 'Deal 3', description: '1 Zinger Burger + Regular Fries + 500ml Drink', price: 720, category: 'Deals', available: true, featured: false },
  { name: 'Deal 4', description: '8 Zinger Burgers + 1.5L Drink', price: 3470, category: 'Deals', available: true, featured: false },
  { name: 'Deal 5', description: '2 Small Pizzas + 500ml Drink', price: 1350, category: 'Deals', available: true, featured: false },
  { name: 'Deal 6', description: '2 Medium Pizzas + 1L Drink', price: 1980, category: 'Deals', available: true, featured: true },
  { name: 'Deal 7', description: '2 Large Pizzas + 1.5L Drink', price: 2410, category: 'Deals', available: true, featured: false },
  { name: 'Deal 8', description: '1 Medium + 1 Small Pizza + 1L Drink', price: 1680, category: 'Deals', available: true, featured: false },
  { name: 'Deal 9', description: '1 Large + 1 Medium Pizza + 1.5L Drink', price: 2210, category: 'Deals', available: true, featured: false },
  { name: 'Deal 10', description: '1 Small Creamy + 1 Small Extreme Pizza + 500ml Drink', price: 1500, category: 'Deals', available: true, featured: false },
  { name: 'Deal 11', description: '1 Medium Creamy + 1 Medium Extreme Pizza + 1L Drink', price: 2380, category: 'Deals', available: true, featured: false },
  { name: 'Deal 12', description: '1 Large Creamy + 1 Large Extreme Pizza + 1.5L Drink', price: 3010, category: 'Deals', available: true, featured: false },
  { name: 'Deal 13', description: '2 Pizza Paratha + 500ml Drink', price: 1450, category: 'Deals', available: true, featured: false },
  { name: 'Deal 14', description: '1 Small Regular Pizza + 1 Zinger Burger + 500ml Drink', price: 1120, category: 'Deals', available: true, featured: false },
  { name: 'Deal 15', description: '1 Large Pizza + 10 Hot Wings + 1.5L Drink', price: 1980, category: 'Deals', available: true, featured: false },
  { name: 'Deal 16', description: '1 Medium Pizza + 5 Hot Wings + 1L Drink', price: 1410, category: 'Deals', available: true, featured: false },
  { name: 'Deal 17', description: '4 Plain Chicken Shawarmas + 1L Drink', price: 1080, category: 'Deals', available: true, featured: false },
  { name: 'Deal 18', description: '1 Small Pizza + 1 Half Pasta + 5 Hot Wings + 1L Drink', price: 1660, category: 'Deals', available: true, featured: false },
  { name: 'Deal 19', description: '1 Medium Pizza + 2 Zinger Burgers + 1 Half Pasta + 5 Hot Wings + 1.5L Drink', price: 2830, category: 'Deals', available: true, featured: false },
  { name: 'Deal 20', description: '1 Large Pizza (Tikka/Fajita) + 2 Zinger Burgers + 1 Full Pasta + 10 Hot Wings + 1.5L Drink', price: 3620, category: 'Deals', available: true, featured: false },
  { name: 'Party Deal 21', description: '2 Large Pizzas + 4 Zinger Burgers + 1 Full Pasta + 10 Hot Wings + 1 Half Pasta + 2x 1L Drink', price: 6230, category: 'Deals', available: true, featured: true },
  { name: 'Party Deal 22', description: '1 Crown Crust Large + 1 Afghani Large + 2 Zinger Burgers + 10 Hot Wings + 2x 1L Drink', price: 5290, category: 'Deals', available: true, featured: false },
];
