import hre from "hardhat";
import { JsonRpcProvider, Wallet, Contract, parseEther, formatEther } from "ethers";

async function main() {
  console.log("💰 Funding Mantle Bridge with 100 BAZ tokens\n");

  const rpcUrl = "https://rpc.sepolia.mantle.xyz";
  const privateKey = "9d0b6c976265af1f174e94e651c1e36f020958367997c7e4afc195adb22ed9e3";

  const tokenAddress = "0x0e4D19ac0ed1CAa536A90C9bb06B6167F1341AFF";
  const bridgeAddress = "0x118b30B86500239442744A73F1384D97F8C9B63C"; // Mantle bridge

  const provider = new JsonRpcProvider(rpcUrl);
  const deployer = new Wallet(privateKey, provider);

  console.log("Account:", deployer.address);
  console.log("Balance:", formatEther(await provider.getBalance(deployer.address)), "MNT\n");

  // Get token contract
  const tokenArtifact = await hre.artifacts.readArtifact("contracts/Bazigar.sol:Bazigr");
  const tokenContract = new Contract(tokenAddress, tokenArtifact.abi, deployer);

  // Mint 100 BAZ to bridge contract
  const bazAmount = parseEther("100");
  console.log("Minting 100 BAZ to Mantle bridge...");
  const mintTx = await tokenContract.mint(bridgeAddress, bazAmount);
  await mintTx.wait();
  console.log("✅ Bridge funded with 100 BAZ");
  console.log("   Transaction:", mintTx.hash);

  // Verify balance
  console.log("\n🔍 Bridge BAZ Balance:");
  console.log("BAZ:", formatEther(await tokenContract.balanceOf(bridgeAddress)), "BAZ");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
