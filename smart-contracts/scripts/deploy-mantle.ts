import hre from "hardhat";
import { JsonRpcProvider, Wallet, ContractFactory, formatEther, parseEther } from "ethers";
import "dotenv/config";

async function main() {
    console.log("🚀 Starting Bazigr DeFi Module Deployment on Mantle Sepolia Testnet\n");

    // Setup provider and deployer (using credentials from parent .env)
    const rpcUrl = "https://rpc.sepolia.mantle.xyz";
    const privateKey = "9d0b6c976265af1f174e94e651c1e36f020958367997c7e4afc195adb22ed9e3";

    const provider = new JsonRpcProvider(rpcUrl);
    const deployer = new Wallet(privateKey, provider);

    console.log("📍 Deploying contracts with account:", deployer.address);
    console.log("💰 Account balance:", formatEther(await provider.getBalance(deployer.address)), "MNT\n");

    // Step 1: Deploy BAZ Token
    console.log("📝 Step 1: Deploying BAZ Token...");
    const bazigrArtifact = await hre.artifacts.readArtifact("contracts/Bazigar.sol:Bazigr");
    const bazigrFactory = new ContractFactory(bazigrArtifact.abi, bazigrArtifact.bytecode, deployer);
    const bazToken = await bazigrFactory.deploy();
    await bazToken.waitForDeployment();
    const BAZ_TOKEN_ADDRESS = await bazToken.getAddress();
    console.log("✅ BAZ Token deployed to:", BAZ_TOKEN_ADDRESS, "\n");

    // Step 2: Deploy WMANTLE (WCELO contract)
    console.log("📝 Step 2: Deploying WMANTLE...");
    const wmantleArtifact = await hre.artifacts.readArtifact("contracts/WCELO.sol:WCELO");
    const wmantleFactory = new ContractFactory(wmantleArtifact.abi, wmantleArtifact.bytecode, deployer);
    const wmantle = await wmantleFactory.deploy();
    await wmantle.waitForDeployment();
    const wmantleAddress = await wmantle.getAddress();
    console.log("✅ WMANTLE deployed to:", wmantleAddress, "\n");

    // Step 3: Deploy Uniswap V2 Factory
    console.log("📝 Step 3: Deploying Uniswap V2 Factory...");
    const factoryArtifact = await hre.artifacts.readArtifact("contracts/UniswapV2Factory.sol:UniswapV2Factory");
    const factoryFactory = new ContractFactory(factoryArtifact.abi, factoryArtifact.bytecode, deployer);
    const factory = await factoryFactory.deploy();
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log("✅ Factory deployed to:", factoryAddress, "\n");

    // Step 4: Deploy Uniswap V2 Router
    console.log("📝 Step 4: Deploying Uniswap V2 Router...");
    const routerArtifact = await hre.artifacts.readArtifact("contracts/UniswapV2Router.sol:UniswapV2Router");
    const routerFactory = new ContractFactory(routerArtifact.abi, routerArtifact.bytecode, deployer);
    const router = await routerFactory.deploy(factoryAddress, wmantleAddress);
    await router.waitForDeployment();
    const routerAddress = await router.getAddress();
    console.log("✅ Router deployed to:", routerAddress, "\n");

    // Step 5: Deploy MasterChef
    console.log("📝 Step 5: Deploying MasterChef...");
    const currentBlock = await provider.getBlockNumber();
    const startBlock = currentBlock + 10; // Start farming in 10 blocks
    const bazPerBlock = parseEther("10"); // 10 BAZ per block

    const masterChefArtifact = await hre.artifacts.readArtifact("contracts/MasterChef.sol:MasterChef");
    const masterChefFactory = new ContractFactory(masterChefArtifact.abi, masterChefArtifact.bytecode, deployer);
    const masterChef = await masterChefFactory.deploy(
        BAZ_TOKEN_ADDRESS,
        bazPerBlock,
        startBlock
    );
    await masterChef.waitForDeployment();
    const masterChefAddress = await masterChef.getAddress();
    console.log("✅ MasterChef deployed to:", masterChefAddress);
    console.log("   BAZ per block:", formatEther(bazPerBlock));
    console.log("   Start block:", startBlock, "\n");

    // Step 6: Create liquidity pair (BAZ/WMANTLE)
    console.log("📝 Step 6: Creating BAZ/WMANTLE liquidity pair...");
    const createPairTx = await factory.createPair(BAZ_TOKEN_ADDRESS, wmantleAddress);
    await createPairTx.wait();
    const bazWmantlePair = await factory.getPair(BAZ_TOKEN_ADDRESS, wmantleAddress);
    console.log("✅ BAZ/WMANTLE pair:", bazWmantlePair, "\n");

    // Step 7: Add pool to MasterChef
    console.log("📝 Step 7: Adding BAZ/WMANTLE LP pool to MasterChef...");
    const addPoolTx = await masterChef.add(100, bazWmantlePair, false);
    await addPoolTx.wait();
    console.log("✅ Pool 0: BAZ/WMANTLE (100 allocation points)\n");

    // Summary
    console.log("=".repeat(60));
    console.log("🎉 DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));
    console.log("\n📋 Contract Addresses:\n");
    console.log("BAZ Token:                ", BAZ_TOKEN_ADDRESS);
    console.log("WMANTLE:                  ", wmantleAddress);
    console.log("Uniswap V2 Factory:       ", factoryAddress);
    console.log("Uniswap V2 Router:        ", routerAddress);
    console.log("MasterChef:               ", masterChefAddress);
    console.log("\n🔗 Liquidity Pairs:\n");
    console.log("BAZ/WMANTLE:              ", bazWmantlePair);
    console.log("\n💎 MasterChef Pools:\n");
    console.log("Pool 0: BAZ/WMANTLE (100 allocation points)");
    console.log("\n⚙️  Configuration:\n");
    console.log("BAZ per block:            ", formatEther(bazPerBlock), "BAZ");
    console.log("Farming starts at block:  ", startBlock);
    console.log("\n⚠️  IMPORTANT: Fund MasterChef with BAZ tokens for rewards!");
    console.log("   Run: await bazToken.transfer(masterChefAddress, amount)");
    console.log("=".repeat(60));

    // Save deployment info to file
    const deploymentInfo = {
        network: "mantle-sepolia",
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {
            BAZ_TOKEN: BAZ_TOKEN_ADDRESS,
            WMANTLE: wmantleAddress,
            FACTORY: factoryAddress,
            ROUTER: routerAddress,
            MASTERCHEF: masterChefAddress,
            BAZ_WMANTLE_PAIR: bazWmantlePair,
        },
        config: {
            BAZ_PER_BLOCK: formatEther(bazPerBlock),
            START_BLOCK: startBlock,
        },
    };

    console.log("\n📄 Deployment info saved to deployment-mantle.json");

    const fs = await import("fs");
    fs.writeFileSync(
        "deployment-mantle.json",
        JSON.stringify(deploymentInfo, null, 2)
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
