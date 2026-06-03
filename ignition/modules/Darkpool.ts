import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DarkPoolModule = buildModule("DarkPoolModule", (m) => {
  const darkPool = m.contract("DarkPoolAuction");
  return { darkPool };
});

export default DarkPoolModule;