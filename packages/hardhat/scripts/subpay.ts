import { ethers, network, run } from "hardhat"

// Constants for cUSD and cEUR addresses on different networks
const TOKENS = {
 
  // Celo Alfajores Testnet
  alfajores: {
    cUSD: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
    cEUR: "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F",
  },
  // Hardhat Network (will deploy mock tokens)
  hardhat: {
    cUSD: "",
    cEUR: "",
  },
  
}

async function main() {
  console.log(`Deploying SubPay to ${network.name}...`)

  // Get signers - FIXED: Handle case where not all signers are available
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const feeCollector = signers.length > 1 ? signers[1] : deployer;
  const arbitrator = signers.length > 2 ? signers[2] : deployer;
  const oracle = signers.length > 3 ? signers[3] : deployer;
  const provider = signers.length > 4 ? signers[4] : deployer;
  
  console.log(`Deployer address: ${deployer.address}`)
  console.log(`Fee collector address: ${feeCollector.address}`)
  console.log(`Arbitrator address: ${arbitrator.address}`)
  console.log(`Oracle address: ${oracle.address}`)
  console.log(`Provider address: ${provider.address}`)

  // Deploy mock tokens if on local network
  let cUSDAddress = TOKENS[network.name]?.cUSD
  let cEURAddress = TOKENS[network.name]?.cEUR

  if (!cUSDAddress || !cEURAddress) {
    console.log("Deploying mock tokens for local development...")

    const MockToken = await ethers.getContractFactory("MockERC20")

    const mockCUSD = await MockToken.deploy("Mock cUSD", "cUSD", 18)
    await mockCUSD.waitForDeployment()
    cUSDAddress = await mockCUSD.getAddress()
    console.log(`Mock cUSD deployed to: ${cUSDAddress}`)

    const mockCEUR = await MockToken.deploy("Mock cEUR", "cEUR", 18)
    await mockCEUR.waitForDeployment()
    cEURAddress = await mockCEUR.getAddress()
    console.log(`Mock cEUR deployed to: ${cEURAddress}`)
  } else {
    console.log(`Using existing token addresses for ${network.name}:`)
    console.log(`cUSD: ${cUSDAddress}`)
    console.log(`cEUR: ${cEURAddress}`)
  }

  // Deploy SubPay contract
  const SubPay = await ethers.getContractFactory("SubPay")
  const subPay = await SubPay.deploy(deployer.address, feeCollector.address)
  await subPay.waitForDeployment()

  const subPayAddress = await subPay.getAddress()
  console.log(`SubPay deployed to: ${subPayAddress}`)

  // Configure SubPay contract
  console.log("Configuring SubPay contract...")

  // Add supported tokens
  console.log("Adding supported tokens...")
  await (await subPay.addSupportedToken(cUSDAddress)).wait()
  await (await subPay.addSupportedToken(cEURAddress)).wait()

  // Add arbitrator
  console.log("Adding arbitrator...")
  await (await subPay.addArbitrator(arbitrator.address)).wait()

  // Authorize oracle and provider
  console.log("Authorizing oracle and provider...")
  await (await subPay.authorizeOracle(oracle.address)).wait()
  await (await subPay.authorizeProvider(provider.address)).wait()

  console.log("SubPay configuration complete!")

  // Verify contract on Etherscan if on a public network
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Verifying contract on Etherscan...")
    try {
      await run("verify:verify", {
        address: subPayAddress,
        constructorArguments: [deployer.address, feeCollector.address],
      })
      console.log("Contract verified on Etherscan!")
    } catch (error) {
      console.error("Error verifying contract:", error)
    }
  }

  // Return deployment info
  return {
    subPay: subPayAddress,
    cUSD: cUSDAddress,
    cEUR: cEURAddress,
    deployer: deployer.address,
    feeCollector: feeCollector.address,
    arbitrator: arbitrator.address,
    oracle: oracle.address,
    provider: provider.address,
  }
}

// Execute the deployment
main()
  .then((deploymentInfo) => {
    console.log("Deployment successful!")
    console.log("Deployment Info:", deploymentInfo)
    process.exit(0)
  })
  .catch((error) => {
    console.error("Error during deployment:", error)
    process.exit(1)
  })