import fs from "fs";
import path from "path";
import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    throw new Error("No ETH for deployment");
  }

  const addresses = {};

  // -------------------------------
  // 1. Deploy Mock Tokens
  // -------------------------------
  console.log("\n--- Deploying Tokens ---");

  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");

  const usdc = await MockERC20.deploy("USD Coin", "USDC");
  await usdc.waitForDeployment();
  addresses.USDC = await usdc.getAddress();
  console.log("USDC:", addresses.USDC);

  const dai = await MockERC20.deploy("Dai Stablecoin", "DAI");
  await dai.waitForDeployment();
  addresses.DAI = await dai.getAddress();
  console.log("DAI:", addresses.DAI);

  const weth = await MockERC20.deploy("Wrapped Ether", "WETH");
  await weth.waitForDeployment();
  addresses.WETH = await weth.getAddress();
  console.log("WETH:", addresses.WETH);

  // -------------------------------
  // 2. Deploy Oracle
  // -------------------------------
  console.log("\n--- Deploying Oracle ---");

  const PriceOracle = await hre.ethers.getContractFactory("PriceOracle");
  const oracle = await PriceOracle.deploy();
  await oracle.waitForDeployment();
  addresses.PriceOracle = await oracle.getAddress();
  console.log("Oracle:", addresses.PriceOracle);

  // Set initial prices (VERY IMPORTANT)
  console.log("\n--- Setting Prices ---");

  await (await oracle.setPrice(addresses.USDC, hre.ethers.parseUnits("1", 8))).wait();
  await (await oracle.setPrice(addresses.DAI, hre.ethers.parseUnits("1", 8))).wait();
  await (await oracle.setPrice(addresses.WETH, hre.ethers.parseUnits("2000", 8))).wait();
  console.log("Prices initialized");

  // -------------------------------
  // 3. Deploy Interest Model
  // -------------------------------
  const InterestRateModel = await hre.ethers.getContractFactory("InterestRateModel");
  const interestModel = await InterestRateModel.deploy();
  await interestModel.waitForDeployment();
  addresses.InterestRateModel = await interestModel.getAddress();

  // -------------------------------
  // 4. Deploy Collateral Manager
  // -------------------------------
  const CollateralManager = await hre.ethers.getContractFactory("CollateralManager");
  const collateralManager = await CollateralManager.deploy();
  await collateralManager.waitForDeployment();
  addresses.CollateralManager = await collateralManager.getAddress();

  // -------------------------------
  // 5. Deploy Core
  // -------------------------------
  console.log("\n--- Deploying Core ---");

  const AagesLendCore = await hre.ethers.getContractFactory("AagesLendCore");
  const core = await AagesLendCore.deploy();
  await core.waitForDeployment();
  addresses.AagesLendCore = await core.getAddress();
  console.log("Core:", addresses.AagesLendCore);

  // -------------------------------
  // 6. Whitelist Tokens (FIXED)
  // -------------------------------
  console.log("\n--- Whitelisting Tokens ---");

  const coreContract = await hre.ethers.getContractAt(
    "AagesLendCore",
    addresses.AagesLendCore
  );

  // LTV values (realistic)
  await (await coreContract.addSupportedToken(addresses.USDC, 80)).wait(); // stable
  await (await coreContract.addSupportedToken(addresses.DAI, 80)).wait();  // stable
  await (await coreContract.addSupportedToken(addresses.WETH, 70)).wait(); // volatile

  console.log("Tokens whitelisted");

  // -------------------------------
  // 7. Deploy Pool
  // -------------------------------
  console.log("\n--- Deploying Pool ---");

  const LiquidityPool = await hre.ethers.getContractFactory("LiquidityPool");
  const pool = await LiquidityPool.deploy(addresses.AagesLendCore);
  await pool.waitForDeployment();
  addresses.LiquidityPool = await pool.getAddress();
  console.log("Pool:", addresses.LiquidityPool);

  // -------------------------------
  // 8. Deploy Liquidation Engine
  // -------------------------------
  console.log("\n--- Deploying Liquidation ---");

  const LiquidationEngine = await hre.ethers.getContractFactory("LiquidationEngine");
  const engine = await LiquidationEngine.deploy(
    addresses.AagesLendCore,
    addresses.LiquidityPool,
    addresses.PriceOracle,
    addresses.CollateralManager
  );

  await engine.waitForDeployment();
  addresses.LiquidationEngine = await engine.getAddress();

  console.log("Liquidation:", addresses.LiquidationEngine);

  console.log("\n--- Deployment Complete ---");

  // -------------------------------
  // 9. Save to frontend
  // -------------------------------
  const frontendDir = path.join(process.cwd(), "frontend", "src", "utils");

  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }

  const filePath = path.join(frontendDir, "addresses.json");

  fs.writeFileSync(filePath, JSON.stringify(addresses, null, 2));

  console.log("Addresses saved to:", filePath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});



/* import fs from "fs";
import path from "path";
import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying mapping limits initialized via:", deployer.address);

  // Balance checking natively preventing drops
  const provider = hre.ethers.provider;
  const balance = await provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    throw new Error("Insufficient funds to execute blockchain bounds.");
  }

  const addresses = {};

  // 1. Deploy Test Tokens
  console.log("\n--- Deploying Test Tokens ---");
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const USDC = await MockERC20.deploy("USD Coin", "USDC");
  await USDC.waitForDeployment();
  addresses.USDC = await USDC.getAddress();
  console.log("USDC mock deployed to:", addresses.USDC);

  //--- Deploy DAI ---
  const dai = await hre.ethers.deployContract("MockERC20", [
    "Dai Stablecoin",
    "DAI"
  ])
  await dai.waitForDeployment()
  addresses.DAI = await dai.getAddress()
  console.log("DAI deployed to:", addresses.DAI)

  // --- Deploy WETH ---
  const weth = await hre.ethers.deployContract("MockERC20", [
    "Wrapped Ether",
    "WETH"
  ])
  await weth.waitForDeployment()
  addresses.WETH = await weth.getAddress()
  console.log("WETH deployed to:", addresses.WETH)

  // 2. Deploy Oracle
  console.log("\n--- Deploying PriceOracle ---");
  const PriceOracle = await hre.ethers.getContractFactory("PriceOracle");
  const oracle = await PriceOracle.deploy();
  await oracle.waitForDeployment();
  addresses.PriceOracle = await oracle.getAddress();
  console.log("PriceOracle deployed to:", addresses.PriceOracle);

  // 3. Deploy Interest Rate Model Tracker
  console.log("\n--- Deploying InterestRateModel ---");
  const InterestRateModel = await hre.ethers.getContractFactory("InterestRateModel");
  const interestModel = await InterestRateModel.deploy();
  await interestModel.waitForDeployment();
  addresses.InterestRateModel = await interestModel.getAddress();
  console.log("InterestRateModel deployed to:", addresses.InterestRateModel);

  // 4. Deploy Collateral Logic Tracker
  console.log("\n--- Deploying CollateralManager ---");
  const CollateralManager = await hre.ethers.getContractFactory("CollateralManager");
  const collateralManager = await CollateralManager.deploy();
  await collateralManager.waitForDeployment();
  addresses.CollateralManager = await collateralManager.getAddress();
  console.log("CollateralManager deployed to:", addresses.CollateralManager);

  // 5. Deploy Routing Core Wrapper
  // AagesLendCore has no constructor arguments and is needed by LiquidityPool and LiquidationEngine
  console.log("\n--- Deploying AagesLendCore ---");
  const AagesLendCore = await hre.ethers.getContractFactory("AagesLendCore");
  const core = await AagesLendCore.deploy();
  await core.waitForDeployment();
  addresses.AagesLendCore = await core.getAddress();
  console.log("AagesLendCore deployed to:", addresses.AagesLendCore);

  // 6. Deploy Pool
  // LiquidityPool expects `_coreAddress` in its constructor
  console.log("\n--- Deploying LiquidityPool ---");
  const LiquidityPool = await hre.ethers.getContractFactory("LiquidityPool");
  const pool = await LiquidityPool.deploy(addresses.AagesLendCore);
  await pool.waitForDeployment();
  addresses.LiquidityPool = await pool.getAddress();
  console.log("LiquidityPool deployed to:", addresses.LiquidityPool);

  //console.log("\n--- Whitelisting Tokens ---");

  // Make sure we use hre.ethers (not plain ethers)
  const coreContract = await hre.ethers.getContractAt(
    "AagesLendCore",
    addresses.AagesLendCore
  );

  // Add tokens to protocol
  await coreContract.addSupportedToken(addresses.USDC);
  await coreContract.addSupportedToken(addresses.DAI);
  await coreContract.addSupportedToken(addresses.WETH);

  console.log("All tokens successfully whitelisted");

  // 7. Deploy Seizure Mapping Logic
  // LiquidationEngine expects: _core, _pool, _oracle, _collateralManager
  console.log("\n--- Deploying LiquidationEngine ---");
  const LiquidationEngine = await hre.ethers.getContractFactory("LiquidationEngine");
  const engine = await LiquidationEngine.deploy(
    addresses.AagesLendCore,
    addresses.LiquidityPool,
    addresses.PriceOracle,
    addresses.CollateralManager
  );
  await engine.waitForDeployment();
  addresses.LiquidationEngine = await engine.getAddress();
  console.log("LiquidationEngine deployed to:", addresses.LiquidationEngine);

  console.log("\n--- Contracts Deployed Globally Successfully ---");

  // Format mappings logic dynamically binding to frontend
  const frontendConfigDir = path.join(process.cwd(), "frontend", "src", "utils");
  if (!fs.existsSync(frontendConfigDir)) {
    fs.mkdirSync(frontendConfigDir, { recursive: true });
  }

  const frontendConfig = path.join(frontendConfigDir, "addresses.json");
  fs.writeFileSync(frontendConfig, JSON.stringify(addresses, null, 2));
  console.log(`Live Address mappings safely written down targeting frontend wrappers locally -> ${frontendConfig}`);
}

main().catch((error) => {
  console.error("Execution limit deployment reverting:", error);
  process.exitCode = 1;
});
*/