import hre from "hardhat";
import { ContractFactory, Wallet, JsonRpcProvider, parseEther, formatEther } from "ethers";
import * as fs from "fs";

async function main() {
    console.log("🚀 Bazigr Swap Contract - Mantle Sepolia Deployment\n");

    // Hardcoded values from .env
    const rpcUrl = "https://rpc.sepolia.mantle.xyz";
    const privateKey = "0x9d0b6c976265af1f174e94e651c1e36f020958367997c7e4afc195adb22ed9e3";

    const provider = new JsonRpcProvider(rpcUrl);
    const deployer = new Wallet(privateKey, provider);

    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", formatEther(await provider.getBalance(deployer.address)), "MNT\n");

    // Use the already deployed BAZ token from Mantle
    const tokenAddress = "0x0e4D19ac0ed1CAa536A90C9bb06B6167F1341AFF";
    console.log("Using existing BAZ Token at:", tokenAddress);

    // Deploy Swap Contract
    console.log("🔨 Deploying Swap Contract...");
    const swapArtifact = await hre.artifacts.readArtifact("contracts/Swap.sol:FixedRateSwap");
    const swapFactory = new ContractFactory(swapArtifact.abi, swapArtifact.bytecode, deployer);
    const swapContract = await swapFactory.deploy(tokenAddress, deployer.address);
    await swapContract.deploymentTransaction()?.wait();
    const swapAddress = await swapContract.getAddress();
    console.log("✅ Swap Contract deployed to:", swapAddress);

    console.log("\n📋 Contract Addresses:");
    console.log("BAZ Token:", tokenAddress);
    console.log("Swap Contract:", swapAddress);

    // Fund Swap Contract with 0.5 MNT
    console.log("\n💰 Funding Swap Contract with 0.5 MNT...");
    const mntAmount = parseEther("0.5");
    const fundMntTx = await deployer.sendTransaction({
        to: swapAddress,
        value: mntAmount
    });
    await fundMntTx.wait();
    console.log("✅ Swap Contract funded with 0.5 MNT");
    console.log("   Transaction:", fundMntTx.hash);

    // Mint equivalent BAZ tokens to Swap Contract (0.5 MNT * 20 = 10 BAZ)
    console.log("💰 Minting 10 BAZ tokens to Swap Contract...");
    const bazAmount = parseEther("10"); // 0.5 * 20 = 10 BAZ
    const tokenArtifact = await hre.artifacts.readArtifact("contracts/Bazigar.sol:Bazigr");
    const tokenContract = new hre.ethers.Contract(tokenAddress, tokenArtifact.abi, deployer);
    const mintTx = await tokenContract.mint(swapAddress, bazAmount);
    await mintTx.wait();
    console.log("✅ Swap Contract funded with 10 BAZ tokens");
    console.log("   Transaction:", mintTx.hash);

    // Verify contract states
    console.log("\n🔍 Contract Verification:");
    console.log("Swap Contract MNT Balance:", formatEther(await provider.getBalance(swapAddress)), "MNT");
    console.log("Swap Contract BAZ Balance:", formatEther(await tokenContract.balanceOf(swapAddress)), "BAZ");

    // Save deployment info
    const deploymentInfo = {
        network: "mantle-sepolia",
        chainId: 5003,
        deployer: deployer.address,
        contracts: {
            BAZ_TOKEN: tokenAddress,
            SWAP: swapAddress
        },
        funding: {
            MNT: "0.5",
            BAZ: "10"
        },
        timestamp: new Date().toISOString()
    };

    fs.writeFileSync(
        "deployment-swap-mantle.json",
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n🎉 Deployment completed successfully!");
    console.log("\n📝 Deployment saved to: deployment-swap-mantle.json");
    console.log("\n🔧 Frontend Configuration:");
    console.log("Update swap contract address in frontend:");
    console.log(`SWAP_ADDRESS = "${swapAddress}";`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
