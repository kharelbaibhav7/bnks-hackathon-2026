import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

export const changeWallet = async ({
  userId,
  amount,
  type,
  description,
  counterparty,
  order,
  allocation,
}) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("Wallet account not found");

  const nextBalance = Number((user.walletBalance + amount).toFixed(2));
  if (nextBalance < 0) {
    throw new Error(
      `${user.storeName || user.name} does not have enough AgriFlow wallet balance`
    );
  }

  user.walletBalance = nextBalance;
  await user.save();

  const tx = await Transaction.create({
    user: user._id,
    counterparty,
    type,
    amount,
    order,
    allocation,
    description,
    balanceAfter: nextBalance,
  });

  return { user, tx };
};

export const payFarmerOnHandover = async ({ retailerId, farmerId, amount, order, allocation, note }) => {
  if (amount <= 0) return null;

  await changeWallet({
    userId: retailerId,
    amount: -amount,
    type: "order_payment",
    description: note || "Payment released on goods handover",
    counterparty: farmerId,
    order,
    allocation,
  });

  await changeWallet({
    userId: farmerId,
    amount,
    type: "order_receipt",
    description: note || "Payment received on goods handover",
    counterparty: retailerId,
    order,
    allocation,
  });

  return true;
};
