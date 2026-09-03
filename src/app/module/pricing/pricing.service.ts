interface PricingInput {
  weight: number;
  packageType: string;
  isInterCity: boolean;
}

const calculatePrice = async (payload: PricingInput) => {
  const { weight, packageType, isInterCity } = payload;

  let baseRate = isInterCity ? 120 : 60; 
  let perKgRate = isInterCity ? 25 : 15;

  const packageTypeMultipliers: Record<string, number> = {
    DOCUMENT: 0.8,
    SMALL_PARCEL: 1.0,
    MEDIUM_PARCEL: 1.2,
    LARGE_PARCEL: 1.5,
    FRAGILE: 1.8,
    HAZARDOUS: 2.2,
  };

  const multiplier = packageTypeMultipliers[packageType] || 1.0;
  const extraWeight = Math.max(0, weight - 1);
  const totalFee = Math.round(
    (baseRate + extraWeight * perKgRate) * multiplier,
  );

  return {
    weight,
    packageType,
    isInterCity,
    baseRate,
    multiplier,
    estimatedDeliveryFee: totalFee,
    currency: "BDT",
  };
};

export const PricingService = {
  calculatePrice,
};
