import hre from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
    const configPath = path.join(process.cwd(), 'frontend', 'src', 'utils', 'addresses.json');
    if (!fs.existsSync(configPath)) {
        throw new Error("No deployment limits found. Run deploy.js setup natively.");
    }

    const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    console.log("Executing Sepolia Native Source Verification Limit...");

    // Mock Token
    try {
        await hre.run("verify:verify", {
            address: data.USDC,
            constructorArguments: ["USD Coin", "USDC"],
        });
        console.log("USDC Verified!");
    } catch (e) { console.warn("Failed mapping USDC natively ->", e.message); }

    // Oracle
    try {
        await hre.run("verify:verify", { address: data.PriceOracle, constructorArguments: [] });
    } catch (e) { console.warn("Oracle Verification bounded ->", e.message); }

    // Core
    try {
         await hre.run("verify:verify", {
            address: data.AagesLendCore,
            constructorArguments: [data.LiquidityPool, data.CollateralManager],
        });
    } catch(e) { console.warn("Core Execution verification bounded ->", e.message); }

    console.log("Verification process complete.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
