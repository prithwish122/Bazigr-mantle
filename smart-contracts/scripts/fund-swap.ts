import hre from "hardhat";
import { JsonRpcProvider, Wallet, Contract, parseEther, formatEther } from "ethers";

async function main() {
  console.log("💰 Funding Swap Contract with BAZ tokens\n");

  const rpcUrl = "https://rpc.sepolia.mantle.xyz";
  const privateKey = "9d0b6c976265af1f174e94e651c1e36f020958367997c7e4afc195adb22ed9e3";

  const tokenAddress = "0x0e4D19ac0ed1CAa536A90C9bb06B6167F1341AFF";
  const swapAddress = "0x674DEB50b0402bca07c97c1DD34eeD4f9648eE79";

  const provider = new JsonRpcProvider(rpcUrl);
  const deployer = new Wallet(privateKey, provider);

  console.log("Account:", deployer.address);
  console.log("Balance:", formatEther(await provider.getBalance(deployer.address)), "MNT\n");

  // Get token contract
  const tokenArtifact = await hre.artifacts.readArtifact("contracts/Bazigar.sol:Bazigr");
  const tokenContract = new Contract(tokenAddress, tokenArtifact.abi, deployer);

  // Mint 10 BAZ to swap contract
  const bazAmount = parseEther("10");
  console.log("Minting 10 BAZ to swap contract...");
  const mintTx = await tokenContract.mint(swapAddress, bazAmount);
  await mintTx.wait();
  console.log("✅ Swap Contract funded with 10 BAZ");
  console.log("   Transaction:", mintTx.hash);

  // Verify balances
  console.log("\n🔍 Swap Contract Balances:");
  console.log("MNT:", formatEther(await provider.getBalance(swapAddress)), "MNT");
  console.log("BAZ:", formatEther(await tokenContract.balanceOf(swapAddress)), "BAZ");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
