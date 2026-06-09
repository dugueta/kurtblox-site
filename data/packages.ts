export type PackageVisual = "coin" | "stack" | "pile";

export type RobuxPackage = {
  id: string;
  amount: string;
  oldPrice?: string;
  price: string;
  bonus: string;
  bonusNote: string;
  visual: PackageVisual;
  image: string;
  stock: number;
  featured?: boolean;
};

export const packages: RobuxPackage[] = [
  { id: "p2400", amount: "2.400", price: "R$ 19,90", bonus: "+1.200 a mais", bonusNote: "75% off", visual: "coin", image: "/robux-packages/23-90.png", stock: 38 },
  { id: "p3400", amount: "3.400", price: "R$ 24,90", bonus: "+1.700 a mais", bonusNote: "79% off", visual: "coin", image: "/robux-packages/43-90.png", stock: 24, featured: true },
  {
    id: "p6300",
    amount: "6.300",
    price: "R$ 39,90",
    bonus: "+3.150 a mais",
    bonusNote: "80% off",
    visual: "stack",
    image: "/robux-packages/99-90.png",
    stock: 31,
  },
  { id: "p9000", amount: "9.000", price: "R$ 49,90", bonus: "+4.500 a mais", bonusNote: "83% off", visual: "stack", image: "/robux-packages/99-90.png", stock: 17 },
  { id: "p20000", amount: "20.000", price: "R$ 89,90", bonus: "+10.000 a mais", bonusNote: "85% off", visual: "pile", image: "/robux-packages/209-90.png", stock: 9 },
  { id: "p45000", amount: "45.000", price: "R$ 149,90", bonus: "+22.500 a mais", bonusNote: "87% off", visual: "pile", image: "/robux-packages/439-90.png", stock: 6 },
];

export function getPackageById(id?: string) {
  return packages.find((item) => item.id === id) ?? packages.find((item) => item.featured) ?? packages[0];
}
