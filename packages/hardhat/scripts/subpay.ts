import { network, run } from "hardhat"
import { ethers } from "hardhat"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

// Token addresses for Celo Mainnet
const TOKENS = {
  celo: {
    cUSD: "0x765DE816845861e75A25fCA122bb6898B8B1282a", // Celo Dollar (cUSD)
    cEUR: "0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73", // Celo Euro (cEUR)
  }
}

async function main() {
  console.log("🚀 Starting SubPay Mainnet Deployment")
  console.log("==========================================")
  console.log(`🌐 Network: ${network.name}`)
  console.log(`🔗 Chain ID: ${network.config.chainId}`)
  console.log("==========================================")

  if (network.name !== "celo") {
    throw new Error("This script is intended for Celo Mainnet deployment only")
  }

  console.log("⚠️  ATTENTION: Deploying to Celo Mainnet")
  console.log("💰 This will cost real CELO tokens")
  console.log("🔒 Make sure you have sufficient funds for deployment")
  console.log("==========================================")

  // Get signers
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const feeCollector = signers.length > 1 ? signers[1] : deployer;
  const arbitrator = signers.length > 2 ? signers[2] : deployer;
  const oracle = signers.length > 3 ? signers[3] : deployer;
  const provider = signers.length > 4 ? signers[4] : deployer;
  
  console.log("👥 Role Assignments:")
  console.log(`   👤 Deployer: ${deployer.address}`)
  console.log(`   💰 Fee Collector: ${feeCollector.address}`)
  console.log(`   ⚖️  Arbitrator: ${arbitrator.address}`)
  console.log(`   🔮 Oracle: ${oracle.address}`)
  console.log(`   🏥 Provider: ${provider.address}`)
  console.log("==========================================")

  // Get token addresses
  const cUSDAddress = TOKENS.celo.cUSD
  const cEURAddress = TOKENS.celo.cEUR

  console.log("💎 Token Addresses:")
  console.log(`   💵 cUSD: ${cUSDAddress}`)
  console.log(`   💶 cEUR: ${cEURAddress}`)
  console.log("==========================================")

  // Deploy SubPay contract
  console.log("📦 Deploying SubPay contract...")
  const SubPay = await ethers.getContractFactory("SubPay")
  const subPay = await SubPay.deploy(deployer.address, feeCollector.address)
  await subPay.waitForDeployment()

  const subPayAddress = await subPay.getAddress()
  console.log(`✅ SubPay deployed to: ${subPayAddress}`)
  console.log("==========================================")

  // Configure SubPay contract
  console.log("⚙️  Configuring SubPay contract...")

  // Add supported tokens
  console.log("➕ Adding supported tokens...")
  await (await subPay.addSupportedToken(cUSDAddress)).wait()
  console.log("   ✅ Added cUSD token")
  await (await subPay.addSupportedToken(cEURAddress)).wait()
  console.log("   ✅ Added cEUR token")

  // Add arbitrator
  console.log("➕ Adding arbitrator...")
  await (await subPay.addArbitrator(arbitrator.address)).wait()
  console.log("   ✅ Arbitrator added")

  // Authorize oracle and provider
  console.log("🔑 Authorizing roles...")
  await (await subPay.authorizeOracle(oracle.address)).wait()
  console.log("   ✅ Oracle authorized")
  await (await subPay.authorizeProvider(provider.address)).wait()
  console.log("   ✅ Provider authorized")

  console.log("✅ SubPay configuration complete!")
  console.log("==========================================")

  // Verify contract on Celoscan
  console.log("🔍 Verifying contract on Celoscan...")
  try {
    await run("verify:verify", {
      address: subPayAddress,
      constructorArguments: [deployer.address, feeCollector.address],
    })
    console.log("✅ Contract verified on Celoscan!")
  } catch (error) {
    console.error("❌ Error verifying contract:", error)
  }

  // Return deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    subPay: subPayAddress,
    cUSD: cUSDAddress,
    cEUR: cEURAddress,
    deployer: deployer.address,
    feeCollector: feeCollector.address,
    arbitrator: arbitrator.address,
    oracle: oracle.address,
    provider: provider.address,
  }

  console.log("📋 Deployment Summary:")
  console.log(JSON.stringify(deploymentInfo, null, 2))
  console.log("==========================================")

  return deploymentInfo
}

// Execute the deployment
main()
  .then((deploymentInfo) => {
    console.log("🎉 Deployment successful!")
    console.log("==========================================")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Error during deployment:", error)
    console.log("==========================================")
    process.exit(1)
  })