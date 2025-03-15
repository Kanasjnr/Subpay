import { ethers } from "hardhat";

async function main() {
  const args = [
    "0xF3709C87432488B6aAEb9629cf5cb5BA6Db793F0", // Deployer address
    "0xF3709C87432488B6aAEb9629cf5cb5BA6Db793F0"  // Fee Collector address
  ];

  // Encode constructor arguments
  const encodedArgs = ethers.AbiCoder.defaultAbiCoder().encode(["address", "address"], args);

  console.log("ABI-encoded constructor arguments:", encodedArgs);
}

// Execute script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
