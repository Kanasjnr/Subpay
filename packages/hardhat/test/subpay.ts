import { ethers } from "hardhat"
import { expect } from "chai"
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { time } from "@nomicfoundation/hardhat-network-helpers"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

const CUSD_ADDRESS = process.env.CUSD_ADDRESS 
const CEUR_ADDRESS = process.env.CEUR_ADDRESS 

describe("SubPay", () => {
  // Test fixture to deploy the contract and set up test environment
  async function deploySubPayFixture() {
    const [owner, feeCollector, merchant, subscriber, arbitrator, oracle, provider] = await ethers.getSigners()

    // Deploy mock tokens for testing
    const MockToken = await ethers.getContractFactory("MockERC20")
    const mockCUSD = await MockToken.deploy("Mock cUSD", "cUSD", 18)
    const mockCEUR = await MockToken.deploy("Mock cEUR", "cEUR", 18)

    // Deploy SubPay contract
    const SubPay = await ethers.getContractFactory("SubPay")
    const subPay = await SubPay.deploy(owner.address, feeCollector.address)

    // Add supported tokens
    await subPay.addSupportedToken(await mockCUSD.getAddress())
    await subPay.addSupportedToken(await mockCEUR.getAddress())

    // Add arbitrator
    await subPay.addArbitrator(arbitrator.address)

    // Authorize oracle and provider
    await subPay.authorizeOracle(oracle.address)
    await subPay.authorizeProvider(provider.address)

    // Mint tokens to subscriber for testing
    const mintAmount = ethers.parseEther("1000")
    await mockCUSD.mint(subscriber.address, mintAmount)
    await mockCEUR.mint(subscriber.address, mintAmount)

    return {
      subPay,
      mockCUSD,
      mockCEUR,
      owner,
      feeCollector,
      merchant,
      subscriber,
      arbitrator,
      oracle,
      provider,
    }
  }

  describe("Deployment", () => {
    it("Should set the correct owner and fee collector", async () => {
      const { subPay, owner, feeCollector } = await loadFixture(deploySubPayFixture)
      expect(await subPay.owner()).to.equal(owner.address)
      expect(await subPay.feeCollector()).to.equal(feeCollector.address)
    })

    it("Should have the correct default protocol fee rate", async () => {
      const { subPay } = await loadFixture(deploySubPayFixture)
      expect(await subPay.protocolFeeRate()).to.equal(50) // 0.5%
    })
  })

  describe("Protocol Administration", () => {
    it("Should add supported tokens", async () => {
      const { subPay, mockCUSD, mockCEUR } = await loadFixture(deploySubPayFixture)
      expect(await subPay.supportedTokens(await mockCUSD.getAddress())).to.be.true
      expect(await subPay.supportedTokens(await mockCEUR.getAddress())).to.be.true
    })

    it("Should remove supported tokens", async () => {
      const { subPay, mockCUSD } = await loadFixture(deploySubPayFixture)
      await subPay.removeSupportedToken(await mockCUSD.getAddress())
      expect(await subPay.supportedTokens(await mockCUSD.getAddress())).to.be.false
    })

    it("Should update fee rate", async () => {
      const { subPay } = await loadFixture(deploySubPayFixture)
      await subPay.updateFeeRate(100) // 1%
      expect(await subPay.protocolFeeRate()).to.equal(100)
    })

    it("Should update fee collector", async () => {
      const { subPay, owner } = await loadFixture(deploySubPayFixture)
      await subPay.updateFeeCollector(owner.address)
      expect(await subPay.feeCollector()).to.equal(owner.address)
    })

    it("Should pause and unpause the contract", async () => {
      const { subPay } = await loadFixture(deploySubPayFixture)
      await subPay.pause()
      expect(await subPay.paused()).to.be.true
      await subPay.unpause()
      expect(await subPay.paused()).to.be.false
    })
  })

  describe("Subscription Plan Management", () => {
    it("Should create a subscription plan", async () => {
      const { subPay, mockCUSD, merchant } = await loadFixture(deploySubPayFixture)

      const amount = ethers.parseEther("10")
      const frequency = 30 * 24 * 60 * 60 // 30 days
      const trialPeriod = 7 * 24 * 60 * 60 // 7 days
      const metadata = "ipfs://QmHash"

      await subPay.connect(merchant).createPlan(await mockCUSD.getAddress(), amount, frequency, trialPeriod, metadata)

      const plan = await subPay.plans(1)
      expect(plan.merchant).to.equal(merchant.address)
      expect(plan.paymentToken).to.equal(await mockCUSD.getAddress())
      expect(plan.amount).to.equal(amount)
      expect(plan.frequency).to.equal(frequency)
      expect(plan.trialPeriod).to.equal(trialPeriod)
      expect(plan.active).to.be.true
      expect(plan.metadata).to.equal(metadata)
    })

    it("Should update a subscription plan", async () => {
      const { subPay, mockCUSD, merchant } = await loadFixture(deploySubPayFixture)

      // Create plan
      await subPay
        .connect(merchant)
        .createPlan(
          await mockCUSD.getAddress(),
          ethers.parseEther("10"),
          30 * 24 * 60 * 60,
          7 * 24 * 60 * 60,
          "ipfs://QmHash",
        )

      // Update plan
      const newAmount = ethers.parseEther("15")
      const newFrequency = 60 * 24 * 60 * 60 // 60 days

      await subPay.connect(merchant).updatePlan(1, true, newAmount, newFrequency)

      const plan = await subPay.plans(1)
      expect(plan.amount).to.equal(newAmount)
      expect(plan.frequency).to.equal(newFrequency)
    })

    it("Should get merchant plans", async () => {
      const { subPay, mockCUSD, mockCEUR, merchant } = await loadFixture(deploySubPayFixture)

      // Create two plans
      await subPay
        .connect(merchant)
        .createPlan(await mockCUSD.getAddress(), ethers.parseEther("10"), 30 * 24 * 60 * 60, 0, "ipfs://QmHash1")

      await subPay
        .connect(merchant)
        .createPlan(await mockCEUR.getAddress(), ethers.parseEther("15"), 60 * 24 * 60 * 60, 0, "ipfs://QmHash2")

      const merchantPlans = await subPay.getMerchantPlans(merchant.address)
      expect(merchantPlans.length).to.equal(2)
      expect(merchantPlans[0]).to.equal(1n)
      expect(merchantPlans[1]).to.equal(2n)
    })
  })

  describe("Subscription Management", () => {
    it("Should subscribe to a plan with trial period", async () => {
      const { subPay, mockCUSD, merchant, subscriber } = await loadFixture(deploySubPayFixture)

      // Create plan with trial
      const amount = ethers.parseEther("10")
      const frequency = 30 * 24 * 60 * 60 // 30 days
      const trialPeriod = 7 * 24 * 60 * 60 // 7 days

      await subPay
        .connect(merchant)
        .createPlan(await mockCUSD.getAddress(), amount, frequency, trialPeriod, "ipfs://QmHash")

      // Approve tokens
      await mockCUSD.connect(subscriber).approve(await subPay.getAddress(), amount)

      // Subscribe
      await subPay.connect(subscriber).subscribe(1)

      const subscription = await subPay.subscriptions(1)
      expect(subscription.planId).to.equal(1n)
      expect(subscription.subscriber).to.equal(subscriber.address)
      expect(subscription.active).to.be.true

      // Check that no payment was taken yet (trial period)
      const merchantBalance = await mockCUSD.balanceOf(merchant.address)
      expect(merchantBalance).to.equal(0n)
    })

    it("Should subscribe to a plan without trial period and process initial payment", async () => {
      const { subPay, mockCUSD, merchant, subscriber, feeCollector } = await loadFixture(deploySubPayFixture)

      // Create plan without trial
      const amount = ethers.parseEther("10")
      const frequency = 30 * 24 * 60 * 60 // 30 days

      await subPay.connect(merchant).createPlan(
        await mockCUSD.getAddress(),
        amount,
        frequency,
        0, // No trial
        "ipfs://QmHash",
      )

      // Approve tokens
      await mockCUSD.connect(subscriber).approve(await subPay.getAddress(), amount)

      // Subscribe
      await subPay.connect(subscriber).subscribe(1)

      // Check that payment was processed
      const fee = (amount * 50n) / 10000n // 0.5%
      const merchantAmount = amount - fee

      const merchantBalance = await mockCUSD.balanceOf(merchant.address)
      const feeCollectorBalance = await mockCUSD.balanceOf(feeCollector.address)

      expect(merchantBalance).to.equal(merchantAmount)
      expect(feeCollectorBalance).to.equal(fee)
    })

    it("Should cancel a subscription", async () => {
      const { subPay, mockCUSD, merchant, subscriber } = await loadFixture(deploySubPayFixture)

      // Create plan
      await subPay
        .connect(merchant)
        .createPlan(await mockCUSD.getAddress(), ethers.parseEther("10"), 30 * 24 * 60 * 60, 0, "ipfs://QmHash")

      // Approve tokens
      await mockCUSD.connect(subscriber).approve(await subPay.getAddress(), ethers.parseEther("10"))

      // Subscribe
      await subPay.connect(subscriber).subscribe(1)

      // Cancel
      await subPay.connect(subscriber).cancelSubscription(1)

      const subscription = await subPay.subscriptions(1)
      expect(subscription.active).to.be.false
    })

    it("Should get subscriber subscriptions", async () => {
      const { subPay, mockCUSD, mockCEUR, merchant, subscriber } = await loadFixture(deploySubPayFixture)

      // Create two plans
      await subPay
        .connect(merchant)
        .createPlan(await mockCUSD.getAddress(), ethers.parseEther("10"), 30 * 24 * 60 * 60, 0, "ipfs://QmHash1")

      await subPay
        .connect(merchant)
        .createPlan(await mockCEUR.getAddress(), ethers.parseEther("15"), 60 * 24 * 60 * 60, 0, "ipfs://QmHash2")

      // Approve tokens
      await mockCUSD.connect(subscriber).approve(await subPay.getAddress(), ethers.parseEther("10"))

      await mockCEUR.connect(subscriber).approve(await subPay.getAddress(), ethers.parseEther("15"))

      // Subscribe to both plans
      await subPay.connect(subscriber).subscribe(1)
      await subPay.connect(subscriber).subscribe(2)

      const subscriberSubscriptions = await subPay.getSubscriberSubscriptions(subscriber.address)
      expect(subscriberSubscriptions.length).to.equal(2)
      expect(subscriberSubscriptions[0]).to.equal(1n)
      expect(subscriberSubscriptions[1]).to.equal(2n)
    })
  })

  describe("Payment Processing", () => {
    it("Should process due payments", async () => {
      const { subPay, mockCUSD, merchant, subscriber } = await loadFixture(deploySubPayFixture)

      // Create plan with trial
      const amount = ethers.parseEther("10")
      const frequency = 30 * 24 * 60 * 60 // 30 days
      const trialPeriod = 7 * 24 * 60 * 60 // 7 days

      await subPay
        .connect(merchant)
        .createPlan(await mockCUSD.getAddress(), amount, frequency, trialPeriod, "ipfs://QmHash")

      // Approve tokens for multiple payments
      await mockCUSD.connect(subscriber).approve(await subPay.getAddress(), amount * 10n)

      // Subscribe
      await subPay.connect(subscriber).subscribe(1)

      // Fast forward to after trial period
      await time.increase(trialPeriod + 1)

      // Process due payments
      await subPay.processDuePayments([1])

      // Check that payment was processed
      const merchantBalance = await mockCUSD.balanceOf(merchant.address)
      expect(merchantBalance).to.be.greaterThan(0n)

      // Check that next payment time was updated
      const subscription = await subPay.subscriptions(1)
      expect(subscription.nextPaymentTime).to.be.greaterThan(subscription.startTime + BigInt(trialPeriod))
    })

    it("Should get due subscriptions", async () => {
      const { subPay, mockCUSD, merchant, subscriber } = await loadFixture(deploySubPayFixture)

      // Create plan with trial
      await subPay
        .connect(merchant)
        .createPlan(
          await mockCUSD.getAddress(),
          ethers.parseEther("10"),
          30 * 24 * 60 * 60,
          7 * 24 * 60 * 60,
          "ipfs://QmHash",
        )

      // Approve tokens
      await mockCUSD.connect(subscriber).approve(await subPay.getAddress(), ethers.parseEther("100"))

      // Subscribe
      await subPay.connect(subscriber).subscribe(1)

      // Fast forward to after trial period
      await time.increase(7 * 24 * 60 * 60 + 1)

      // Get due subscriptions
      const dueSubscriptions = await subPay.getDueSubscriptions(10)
      expect(dueSubscriptions.length).to.equal(1)
      expect(dueSubscriptions[0]).to.equal(1n)
    })
  })

  describe("Credit Scoring", () => {
    it("Should update credit score after payment", async () => {
      const { subPay, mockCUSD, merchant, subscriber } = await loadFixture(deploySubPayFixture)

      // Create plan without trial
      await subPay
        .connect(merchant)
        .createPlan(await mockCUSD.getAddress(), ethers.parseEther("10"), 30 * 24 * 60 * 60, 0, "ipfs://QmHash")

      // Get initial credit score
      const initialScore = await subPay.getCreditScore(subscriber.address)

      // Approve tokens
      await mockCUSD.connect(subscriber).approve(await subPay.getAddress(), ethers.parseEther("10"))

      // Subscribe (triggers payment)
      await subPay.connect(subscriber).subscribe(1)

      // Check updated credit score
      const updatedScore = await subPay.getCreditScore(subscriber.address)
      expect(updatedScore).to.be.greaterThan(initialScore)
    })

    it("Should record external payment", async () => {
      const { subPay, mockCUSD, provider, subscriber } = await loadFixture(deploySubPayFixture)

      // Get initial credit score
      const initialScore = await subPay.getCreditScore(subscriber.address)

      // Record external payment
      await subPay
        .connect(provider)
        .recordExternalPayment(
          subscriber.address,
          true,
          ethers.parseEther("50"),
          await mockCUSD.getAddress(),
          "External payment",
        )

      // Check updated credit score
      const updatedScore = await subPay.getCreditScore(subscriber.address)
      expect(updatedScore).to.be.greaterThan(initialScore)

      // Check payment history
      const history = await subPay.getPaymentHistory(subscriber.address, 1)
      expect(history.length).to.equal(1)
      expect(history[0].success).to.be.true
      expect(history[0].amount).to.equal(ethers.parseEther("50"))
    })

    it("Should apply score decay over time", async () => {
      const { subPay, mockCUSD, provider, subscriber } = await loadFixture(deploySubPayFixture)

      // Record successful payment
      await subPay
        .connect(provider)
        .recordExternalPayment(
          subscriber.address,
          true,
          ethers.parseEther("50"),
          await mockCUSD.getAddress(),
          "External payment",
        )

      const scoreAfterPayment = await subPay.getCreditScore(subscriber.address)

      // Fast forward 10 days
      await time.increase(10 * 24 * 60 * 60)

      // Check decayed score
      const decayedScore = await subPay.getCreditScore(subscriber.address)
      expect(decayedScore).to.be.lessThan(scoreAfterPayment)
    })
  })

  describe("Payment Prediction", () => {
    it("Should calculate payment likelihood", async () => {
      const { subPay, mockCUSD, merchant, subscriber } = await loadFixture(deploySubPayFixture)

      // Create plan
      await subPay
        .connect(merchant)
        .createPlan(await mockCUSD.getAddress(), ethers.parseEther("10"), 30 * 24 * 60 * 60, 0, "ipfs://QmHash")

      // Approve tokens
      await mockCUSD.connect(subscriber).approve(await subPay.getAddress(), ethers.parseEther("10"))

      // Subscribe
      await subPay.connect(subscriber).subscribe(1)

      // Calculate likelihood
      const [likelihood, riskLevel] = await subPay.calculateLikelihood(1)

      expect(likelihood).to.be.greaterThan(0n)
      // Risk level should be one of: 0 (High), 1 (Medium), 2 (Low)
      expect(riskLevel).to.be.lessThanOrEqual(2)
    })

    it("Should update prediction from oracle", async () => {
      const { subPay, mockCUSD, merchant, subscriber, oracle } = await loadFixture(deploySubPayFixture)

      // Create plan
      await subPay
        .connect(merchant)
        .createPlan(await mockCUSD.getAddress(), ethers.parseEther("10"), 30 * 24 * 60 * 60, 0, "ipfs://QmHash")

      // Approve tokens
      await mockCUSD.connect(subscriber).approve(await subPay.getAddress(), ethers.parseEther("10"))

      // Subscribe
      await subPay.connect(subscriber).subscribe(1)

      // Update prediction from oracle
      await subPay.connect(oracle).updatePrediction(
        1,
        90, // 90% likelihood
        '{"risk_factors": "low balance risk"}',
      )

      // Get prediction
      const [likelihood, lastUpdated, factors, riskLevel] = await subPay.getPrediction(1)

      expect(likelihood).to.equal(90n)
      expect(lastUpdated).to.be.greaterThan(0n)
      expect(factors).to.equal('{"risk_factors": "low balance risk"}')
      expect(riskLevel).to.equal(2) // Low risk (2)
    })

    it("Should get high risk subscriptions", async () => {
      const { subPay, mockCUSD, merchant, subscriber, oracle } = await loadFixture(deploySubPayFixture)

      // Create plan with minimum frequency
      await subPay.connect(merchant).createPlan(
        await mockCUSD.getAddress(),
        ethers.parseEther("10"),
        86400, // 1 day (minimum allowed)
        0, // No trial period
        "ipfs://QmHash",
      )

      // Approve tokens for only one payment (to ensure future payments might fail)
      await mockCUSD.connect(subscriber).approve(await subPay.getAddress(), ethers.parseEther("10"))

      // Subscribe
      await subPay.connect(subscriber).subscribe(1)

      // Drain most of the balance to ensure internal calculation also returns high risk
      await mockCUSD.connect(subscriber).transfer(merchant.address, ethers.parseEther("990"))

      // Verify the subscriber now has a low balance
      const balanceAfterDrain = await mockCUSD.balanceOf(subscriber.address)
      console.log("- Subscriber balance after drain:", balanceAfterDrain)

      // Get the subscription to check initial state
      const subBefore = await subPay.subscriptions(1)
      console.log("Initial subscription state:")
      console.log("- Active:", subBefore.active)
      console.log("- Next payment time:", subBefore.nextPaymentTime)
      console.log("- Current time:", await time.latest())

      // Update prediction to high risk (very low likelihood)
      await subPay.connect(oracle).updatePrediction(
        1,
        5, // 5% likelihood (definitely high risk)
        '{"risk_factors": "insufficient balance"}',
      )

      // Verify prediction was updated
      const [likelihood, lastUpdated, factors, riskLevel] = await subPay.getPrediction(1)
      console.log("Prediction updated:")
      console.log("- Likelihood:", likelihood.toString())
      console.log("- Risk level:", riskLevel) // 0 = High, 1 = Medium, 2 = Low

      // Fast forward to make subscription due
      await time.increase(86400 * 2) // 2 days to ensure it's due

      // Get the subscription again to check if it's due
      const subAfter = await subPay.subscriptions(1)
      const currentTime = await time.latest()
      console.log("After time increase:")
      console.log("- Next payment time:", subAfter.nextPaymentTime)
      console.log("- Current time:", currentTime)
      console.log("- Is due:", subAfter.nextPaymentTime <= BigInt(currentTime))

      // Check if the subscription is active
      console.log("- Is active:", subAfter.active)

      // Check the subscriber's balance
      const subscriberBalance = await mockCUSD.balanceOf(subscriber.address)
      console.log("- Subscriber balance:", subscriberBalance)

      // Check the contract's implementation of getHighRiskSubscriptions
      // This is a direct call to calculateLikelihood to see what it returns
      const [calcLikelihood, calcRiskLevel] = await subPay.calculateLikelihood(1)
      console.log("Calculated likelihood:", calcLikelihood.toString())
      console.log("Calculated risk level:", calcRiskLevel)

      // Get high risk subscriptions
      const highRiskSubs = await subPay.getHighRiskSubscriptions(10)
      console.log("High risk subscriptions:", highRiskSubs)

      // Check if at least one subscription is found
      expect(highRiskSubs.length).to.be.greaterThan(0)
    })
  })

  describe("Dispute Resolution", () => {
    it("Should open a dispute", async () => {
      const { subPay, mockCUSD, merchant, subscriber } = await loadFixture(deploySubPayFixture)

      // Create plan without trial
      await subPay
        .connect(merchant)
        .createPlan(await mockCUSD.getAddress(), ethers.parseEther("10"), 30 * 24 * 60 * 60, 0, "ipfs://QmHash")

      // Approve tokens
      await mockCUSD.connect(subscriber).approve(await subPay.getAddress(), ethers.parseEther("10"))

      // Subscribe
      await subPay.connect(subscriber).subscribe(1)

      // Open dispute
      await subPay.connect(subscriber).openDispute(1, "Service not provided")

      // Check dispute
      const dispute = await subPay.getDispute(1)
      expect(dispute.subscriptionId).to.equal(1n)
      expect(dispute.subscriber).to.equal(subscriber.address)
      expect(dispute.merchant).to.equal(merchant.address)
      expect(dispute.status).to.equal(1) // Opened
      expect(dispute.reason).to.equal("Service not provided")
    })

    it("Should submit evidence", async () => {
      const { subPay, mockCUSD, merchant, subscriber } = await loadFixture(deploySubPayFixture)

      // Create plan
      await subPay
        .connect(merchant)
        .createPlan(await mockCUSD.getAddress(), ethers.parseEther("10"), 30 * 24 * 60 * 60, 0, "ipfs://QmHash")

      // Approve tokens
      await mockCUSD.connect(subscriber).approve(await subPay.getAddress(), ethers.parseEther("10"))

      // Subscribe
      await subPay.connect(subscriber).subscribe(1)

      // Open dispute
      const tx = await subPay.connect(subscriber).openDispute(1, "Service not provided")
      await tx.wait() // Ensure transaction is mined

      // Verify dispute is open before submitting evidence
      const disputeBeforeEvidence = await subPay.getDispute(1)
      console.log("Dispute status before evidence:", disputeBeforeEvidence.status)
      expect(disputeBeforeEvidence.status).to.equal(1) // Opened

      // Submit evidence
      const subscriberEvidence = "ipfs://QmSubscriberEvidence"
      await subPay.connect(subscriber).submitEvidence(1, subscriberEvidence)

      // Check evidence was submitted
      const dispute = await subPay.getDispute(1)
      expect(dispute.subscriberEvidence).to.equal(subscriberEvidence)
    })

    it("Should resolve dispute in favor of subscriber", async () => {
      const { subPay, mockCUSD, merchant, subscriber, arbitrator } = await loadFixture(deploySubPayFixture)

      // Create plan
      const amount = ethers.parseEther("10")
      await subPay
        .connect(merchant)
        .createPlan(await mockCUSD.getAddress(), amount, 30 * 24 * 60 * 60, 0, "ipfs://QmHash")

      // Mint tokens to merchant for refund
      await mockCUSD.mint(merchant.address, amount)

      // Approve tokens for subscriber payment
      await mockCUSD.connect(subscriber).approve(await subPay.getAddress(), amount)

      // Subscribe
      await subPay.connect(subscriber).subscribe(1)

      // Open dispute
      await subPay.connect(subscriber).openDispute(1, "Service not provided")

      // Approve tokens for merchant refund
      await mockCUSD.connect(merchant).approve(await subPay.getAddress(), amount)

      // Resolve dispute in favor of subscriber
      await subPay.connect(arbitrator).resolveDispute(
        1,
        2, // SubscriberWins
        amount,
        "Subscriber's claim is valid",
      )

      // Check dispute resolution
      const dispute = await subPay.getDispute(1)
      expect(dispute.status).to.equal(3) // Resolved
      expect(dispute.resolution).to.equal(2) // SubscriberWins
    })

    it("Should resolve dispute with compromise", async () => {
      const { subPay, mockCUSD, merchant, subscriber, arbitrator } = await loadFixture(deploySubPayFixture)

      // Create plan
      const amount = ethers.parseEther("10")
      await subPay
        .connect(merchant)
        .createPlan(await mockCUSD.getAddress(), amount, 30 * 24 * 60 * 60, 0, "ipfs://QmHash")

      // Mint tokens to merchant for refund
      await mockCUSD.mint(merchant.address, amount)

      // Approve tokens for subscriber payment
      await mockCUSD.connect(subscriber).approve(await subPay.getAddress(), amount)

      // Subscribe
      await subPay.connect(subscriber).subscribe(1)

      // Open dispute
      await subPay.connect(subscriber).openDispute(1, "Partial service provided")

      // Approve tokens for merchant refund
      await mockCUSD.connect(merchant).approve(await subPay.getAddress(), amount)

      // Resolve dispute with compromise
      const refundAmount = amount / 2n
      await subPay.connect(arbitrator).resolveDispute(
        1,
        3, // Compromise
        refundAmount,
        "Partial refund is fair",
      )

      // Check dispute resolution
      const dispute = await subPay.getDispute(1)
      expect(dispute.status).to.equal(3) // Resolved
      expect(dispute.resolution).to.equal(3) // Compromise
      expect(dispute.refundAmount).to.equal(refundAmount)
    })

    it("Should cancel a dispute", async () => {
      const { subPay, mockCUSD, merchant, subscriber } = await loadFixture(deploySubPayFixture)

      // Create plan
      await subPay
        .connect(merchant)
        .createPlan(await mockCUSD.getAddress(), ethers.parseEther("10"), 30 * 24 * 60 * 60, 0, "ipfs://QmHash")

      // Approve tokens
      await mockCUSD.connect(subscriber).approve(await subPay.getAddress(), ethers.parseEther("10"))

      // Subscribe
      await subPay.connect(subscriber).subscribe(1)

      // Open dispute
      await subPay.connect(subscriber).openDispute(1, "Service not provided")

      // Cancel dispute
      await subPay.connect(subscriber).cancelDispute(1)

      // Check dispute status
      const dispute = await subPay.getDispute(1)
      expect(dispute.status).to.equal(4) // Cancelled
    })

    it("Should check if dispute is eligible for auto-resolution", async () => {
      const { subPay, mockCUSD, merchant, subscriber } = await loadFixture(deploySubPayFixture)

      // Create plan
      await subPay
        .connect(merchant)
        .createPlan(await mockCUSD.getAddress(), ethers.parseEther("10"), 30 * 24 * 60 * 60, 0, "ipfs://QmHash")

      // Approve tokens
      await mockCUSD.connect(subscriber).approve(await subPay.getAddress(), ethers.parseEther("10"))

      // Subscribe
      await subPay.connect(subscriber).subscribe(1)

      // Open dispute
      await subPay.connect(subscriber).openDispute(1, "Service not provided")

      // Fast forward past resolution timeout
      await time.increase(7 * 24 * 60 * 60 + 1) // 7 days + 1 second

      // Check eligibility
      const isEligible = await subPay.isEligibleForAutoResolution(1)
      expect(isEligible).to.be.true
    })
  })
})

