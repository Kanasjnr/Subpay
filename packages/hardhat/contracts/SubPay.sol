// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import '@openzeppelin/contracts/utils/Pausable.sol';

/**
 * @title SubPay
 * @dev A DeFi-based subscription payment protocol built on Celo
 */
contract SubPay is Ownable, ReentrancyGuard, Pausable {
  // ============ STORAGE VARIABLES ============

  // Supported payment tokens (cUSD, cEUR)
  mapping(address => bool) public supportedTokens;

  // Protocol fee percentage (in basis points, e.g., 50 = 0.5%)
  uint256 public protocolFeeRate = 50; // 0.5% default

  // Fee collector address
  address public feeCollector;

  // ============ SUBSCRIPTION MANAGEMENT ============

  struct SubscriptionPlan {
    address merchant;
    address paymentToken;
    uint256 amount;
    uint256 frequency; // in seconds
    uint256 trialPeriod; // in seconds, 0 if no trial
    bool active;
    string metadata; // IPFS hash for additional plan details
  }

  struct Subscription {
    uint256 planId;
    address subscriber;
    uint256 startTime;
    uint256 nextPaymentTime;
    uint256 lastPaymentTime;
    bool active;
  }

  // Plan ID => Plan details
  mapping(uint256 => SubscriptionPlan) public plans;

  // Subscription ID => Subscription details
  mapping(uint256 => Subscription) public subscriptions;

  // Merchant => array of plan IDs
  mapping(address => uint256[]) public merchantPlans;

  // Subscriber => array of subscription IDs
  mapping(address => uint256[]) public subscriberSubscriptions;

  // Counter for generating unique IDs
  uint256 private nextPlanId = 1;
  uint256 private nextSubscriptionId = 1;

  // ============ CREDIT SCORING ============

  // Base score for new users (out of 1000)
  uint256 public baseScore = 500;
  uint256 public maxScore = 1000;
  uint256 public minScore = 0;
  uint256 public successBonus = 5;
  uint256 public failurePenalty = 20;
  uint256 public decayRate = 1;

  // Mapping of user addresses to credit scores
  mapping(address => uint256) public creditScores;
  mapping(address => uint256) public lastUpdated;

  struct PaymentRecord {
    uint256 timestamp;
    bool success;
    uint256 amount;
    address token;
    string metadata;
  }

  // Mapping of user addresses to payment history
  mapping(address => PaymentRecord[]) public paymentHistory;
  mapping(address => bool) public authorizedProviders;

  // ============ PAYMENT PREDICTION ============

  uint256 public highSuccessThreshold = 750;
  uint256 public mediumSuccessThreshold = 500;
  uint256 public highBalanceRatio = 5;
  uint256 public mediumBalanceRatio = 2;

  mapping(address => bool) public authorizedOracles;
  mapping(uint256 => uint256) public successLikelihood;
  mapping(uint256 => uint256) public lastPredicted;
  mapping(uint256 => string) public riskFactors;

  enum RiskLevel {
    High,
    Medium,
    Low
  }

  // ============ DISPUTE RESOLUTION ============

  uint256 public disputeFeeRate = 100; // 1% default
  uint256 public minDisputeAmount = 1e18; // 1 token unit
  uint256 public resolutionTimeout = 7 days;

  mapping(address => bool) public arbitrators;

  enum DisputeStatus {
    None,
    Opened,
    EvidenceSubmitted,
    Resolved,
    Cancelled
  }

  enum Resolution {
    None,
    MerchantWins,
    SubscriberWins,
    Compromise
  }

  struct Dispute {
    uint256 subscriptionId;
    address subscriber;
    address merchant;
    address paymentToken;
    uint256 amount;
    uint256 createdAt;
    uint256 resolvedAt;
    DisputeStatus status;
    Resolution resolution;
    string reason;
    string merchantEvidence;
    string subscriberEvidence;
    string resolutionNotes;
    address resolver;
    uint256 refundAmount;
  }

  mapping(uint256 => Dispute) public disputes;
  uint256 private nextDisputeId = 1;

  // ============ EVENTS ============

  // Subscription Events
  event PlanCreated(
    uint256 indexed planId,
    address indexed merchant,
    uint256 amount,
    uint256 frequency
  );
  event PlanUpdated(
    uint256 indexed planId,
    bool active,
    uint256 amount,
    uint256 frequency
  );
  event SubscriptionCreated(
    uint256 indexed subscriptionId,
    uint256 indexed planId,
    address indexed subscriber
  );
  event SubscriptionCancelled(
    uint256 indexed subscriptionId,
    address indexed subscriber
  );
  event PaymentProcessed(
    uint256 indexed subscriptionId,
    address indexed subscriber,
    address indexed merchant,
    uint256 amount
  );
  event PaymentFailed(
    uint256 indexed subscriptionId,
    address indexed subscriber,
    string reason
  );
  event TokenAdded(address indexed token);
  event TokenRemoved(address indexed token);
  event FeeRateUpdated(uint256 oldRate, uint256 newRate);
  event FeeCollectorUpdated(address oldCollector, address newCollector);

  // Credit Scoring Events
  event ScoreUpdated(address indexed user, uint256 oldScore, uint256 newScore);
  event PaymentRecorded(
    address indexed user,
    bool success,
    uint256 amount,
    address token
  );
  event ProviderAuthorized(address indexed provider);
  event ProviderDeauthorized(address indexed provider);
  event CreditParametersUpdated(
    uint256 baseScore,
    uint256 successBonus,
    uint256 failurePenalty,
    uint256 decayRate
  );

  // Payment Prediction Events
  event PredictionUpdated(
    uint256 indexed subscriptionId,
    uint256 likelihood,
    RiskLevel riskLevel
  );
  event OracleAuthorized(address indexed oracle);
  event OracleDeauthorized(address indexed oracle);
  event PredictionThresholdsUpdated(
    uint256 highSuccessThreshold,
    uint256 mediumSuccessThreshold,
    uint256 highBalanceRatio,
    uint256 mediumBalanceRatio
  );

  // Dispute Resolution Events
  event DisputeOpened(
    uint256 indexed disputeId,
    uint256 indexed subscriptionId,
    address indexed subscriber,
    string reason
  );
  event EvidenceSubmitted(
    uint256 indexed disputeId,
    address indexed submitter,
    string evidence
  );
  event DisputeResolved(
    uint256 indexed disputeId,
    Resolution resolution,
    address resolver,
    uint256 refundAmount
  );
  event DisputeCancelled(uint256 indexed disputeId, address canceller);
  event ArbitratorAdded(address indexed arbitrator);
  event ArbitratorRemoved(address indexed arbitrator);
  event DisputeParametersUpdated(
    uint256 disputeFeeRate,
    uint256 minDisputeAmount,
    uint256 resolutionTimeout
  );

  // ============ CONSTRUCTOR ============

  constructor(
    address initialOwner,
    address _feeCollector
  ) Ownable(initialOwner) {
    feeCollector = _feeCollector;
  }

  // ============ PROTOCOL ADMINISTRATION ============

  function addSupportedToken(address token) external onlyOwner {
    require(token != address(0), 'Invalid token address');
    supportedTokens[token] = true;
    emit TokenAdded(token);
  }

  function removeSupportedToken(address token) external onlyOwner {
    supportedTokens[token] = false;
    emit TokenRemoved(token);
  }

  function updateFeeRate(uint256 newFeeRate) external onlyOwner {
    require(newFeeRate <= 500, 'Fee rate too high'); // Max 5%
    uint256 oldRate = protocolFeeRate;
    protocolFeeRate = newFeeRate;
    emit FeeRateUpdated(oldRate, newFeeRate);
  }

  function updateFeeCollector(address newFeeCollector) external onlyOwner {
    require(newFeeCollector != address(0), 'Invalid fee collector address');
    address oldCollector = feeCollector;
    feeCollector = newFeeCollector;
    emit FeeCollectorUpdated(oldCollector, newFeeCollector);
  }

  function pause() external onlyOwner {
    _pause();
  }

  function unpause() external onlyOwner {
    _unpause();
  }

  // ============ SUBSCRIPTION MANAGEMENT FUNCTIONS ============

  function createPlan(
    address paymentToken,
    uint256 amount,
    uint256 frequency,
    uint256 trialPeriod,
    string calldata metadata
  ) external whenNotPaused returns (uint256 planId) {
    require(supportedTokens[paymentToken], 'Unsupported payment token');
    require(amount > 0, 'Amount must be greater than 0');
    require(frequency >= 86400, 'Frequency must be at least 1 day');

    planId = nextPlanId++;

    plans[planId] = SubscriptionPlan({
      merchant: msg.sender,
      paymentToken: paymentToken,
      amount: amount,
      frequency: frequency,
      trialPeriod: trialPeriod,
      active: true,
      metadata: metadata
    });

    merchantPlans[msg.sender].push(planId);

    emit PlanCreated(planId, msg.sender, amount, frequency);
  }

  function updatePlan(
    uint256 planId,
    bool active,
    uint256 amount,
    uint256 frequency
  ) external whenNotPaused {
    SubscriptionPlan storage plan = plans[planId];
    require(plan.merchant == msg.sender, 'Not plan owner');
    require(amount > 0, 'Amount must be greater than 0');
    require(frequency >= 86400, 'Frequency must be at least 1 day');

    plan.active = active;
    plan.amount = amount;
    plan.frequency = frequency;

    emit PlanUpdated(planId, active, amount, frequency);
  }

  function subscribe(
    uint256 planId
  ) external whenNotPaused nonReentrant returns (uint256 subscriptionId) {
    SubscriptionPlan storage plan = plans[planId];
    require(plan.merchant != address(0), 'Plan does not exist');
    require(plan.active, 'Plan is not active');

    IERC20 token = IERC20(plan.paymentToken);

    // Check if user has approved enough tokens
    require(
      token.allowance(msg.sender, address(this)) >= plan.amount,
      'Insufficient allowance'
    );

    // Check if user has enough balance
    require(token.balanceOf(msg.sender) >= plan.amount, 'Insufficient balance');

    subscriptionId = nextSubscriptionId++;

    uint256 startTime = block.timestamp;
    uint256 nextPaymentTime;

    if (plan.trialPeriod > 0) {
      nextPaymentTime = startTime + plan.trialPeriod;
    } else {
      // Process first payment immediately
      bool success = _processPayment(
        subscriptionId,
        plan.merchant,
        msg.sender,
        plan.paymentToken,
        plan.amount
      );
      require(success, 'Initial payment failed');
      nextPaymentTime = startTime + plan.frequency;
    }

    subscriptions[subscriptionId] = Subscription({
      planId: planId,
      subscriber: msg.sender,
      startTime: startTime,
      nextPaymentTime: nextPaymentTime,
      lastPaymentTime: plan.trialPeriod > 0 ? 0 : startTime,
      active: true
    });

    subscriberSubscriptions[msg.sender].push(subscriptionId);

    emit SubscriptionCreated(subscriptionId, planId, msg.sender);
  }

  function cancelSubscription(uint256 subscriptionId) external whenNotPaused {
    Subscription storage subscription = subscriptions[subscriptionId];
    require(subscription.subscriber == msg.sender, 'Not subscription owner');
    require(subscription.active, 'Subscription already inactive');

    subscription.active = false;

    emit SubscriptionCancelled(subscriptionId, msg.sender);
  }

  function _processPayment(
    uint256 subscriptionId,
    address merchant,
    address subscriber,
    address paymentToken,
    uint256 amount
  ) private returns (bool success) {
    IERC20 token = IERC20(paymentToken);

    // Calculate protocol fee
    uint256 fee = (amount * protocolFeeRate) / 10000;
    uint256 merchantAmount = amount - fee;

    try token.transferFrom(subscriber, merchant, merchantAmount) {
      // Transfer fee to fee collector if fee > 0
      if (fee > 0) {
        token.transferFrom(subscriber, feeCollector, fee);
      }

      // Record successful payment for credit scoring with transaction hash
      _recordPayment(subscriber, true, amount, paymentToken, string(abi.encodePacked("0x", bytes32(uint256(uint160(msg.sender))).toHexString())));

      emit PaymentProcessed(subscriptionId, subscriber, merchant, amount);
      return true;
    } catch (bytes memory reason) {
      // Record failed payment for credit scoring with transaction hash
      _recordPayment(subscriber, false, amount, paymentToken, string(abi.encodePacked("0x", bytes32(uint256(uint160(msg.sender))).toHexString())));

      emit PaymentFailed(subscriptionId, subscriber, string(reason));
      return false;
    }
  }

  // Helper struct to avoid stack too deep errors
  struct PaymentProcessingData {
    uint256 subscriptionId;
    address merchant;
    address subscriber;
    address paymentToken;
    uint256 amount;
    uint256 frequency;
  }

  function processDuePayments(
    uint256[] calldata subscriptionIds
  ) external whenNotPaused nonReentrant returns (uint256 processed) {
    uint256 count = 0;

    for (uint256 i = 0; i < subscriptionIds.length; i++) {
      uint256 subscriptionId = subscriptionIds[i];
      Subscription storage subscription = subscriptions[subscriptionId];

      if (
        !subscription.active || subscription.nextPaymentTime > block.timestamp
      ) {
        continue;
      }

      SubscriptionPlan storage plan = plans[subscription.planId];

      PaymentProcessingData memory data = PaymentProcessingData({
        subscriptionId: subscriptionId,
        merchant: plan.merchant,
        subscriber: subscription.subscriber,
        paymentToken: plan.paymentToken,
        amount: plan.amount,
        frequency: plan.frequency
      });

      bool success = _processPayment(
        data.subscriptionId,
        data.merchant,
        data.subscriber,
        data.paymentToken,
        data.amount
      );

      if (success) {
        subscription.lastPaymentTime = block.timestamp;
        subscription.nextPaymentTime = block.timestamp + data.frequency;
        count++;
      }
    }

    return count;
  }

  function getMerchantPlans(
    address merchant
  ) external view returns (uint256[] memory) {
    return merchantPlans[merchant];
  }

  function getSubscriberSubscriptions(
    address subscriber
  ) external view returns (uint256[] memory) {
    return subscriberSubscriptions[subscriber];
  }

  function getDueSubscriptions(
    uint256 limit
  ) external view returns (uint256[] memory) {
    uint256[] memory result = new uint256[](limit);
    uint256 count = 0;

    for (uint256 i = 1; i < nextSubscriptionId && count < limit; i++) {
      Subscription storage subscription = subscriptions[i];

      if (
        subscription.active && subscription.nextPaymentTime <= block.timestamp
      ) {
        result[count] = i;
        count++;
      }
    }

    // Resize array to actual count
    uint256[] memory resized = new uint256[](count);
    for (uint256 i = 0; i < count; i++) {
      resized[i] = result[i];
    }

    return resized;
  }

  // ============ CREDIT SCORING FUNCTIONS ============

  function authorizeProvider(address provider) external onlyOwner {
    require(provider != address(0), 'Invalid provider address');
    authorizedProviders[provider] = true;
    emit ProviderAuthorized(provider);
  }

  function deauthorizeProvider(address provider) external onlyOwner {
    authorizedProviders[provider] = false;
    emit ProviderDeauthorized(provider);
  }

  function updateCreditParameters(
    uint256 _baseScore,
    uint256 _successBonus,
    uint256 _failurePenalty,
    uint256 _decayRate
  ) external onlyOwner {
    require(_baseScore <= maxScore, 'Base score too high');
    require(_successBonus <= 100, 'Success bonus too high');
    require(_failurePenalty <= 100, 'Failure penalty too high');
    require(_decayRate <= 10, 'Decay rate too high');

    baseScore = _baseScore;
    successBonus = _successBonus;
    failurePenalty = _failurePenalty;
    decayRate = _decayRate;

    emit CreditParametersUpdated(
      baseScore,
      successBonus,
      failurePenalty,
      decayRate
    );
  }

  function _recordPayment(
    address user,
    bool success,
    uint256 amount,
    address token,
    string memory metadata
  ) private {
    // Add payment record to history
    paymentHistory[user].push(
      PaymentRecord({
        timestamp: block.timestamp,
        success: success,
        amount: amount,
        token: token,
        metadata: metadata
      })
    );

    // Update credit score
    uint256 oldScore = getCreditScore(user);
    uint256 newScore;

    if (success) {
      // Increase score for successful payment, capped at maxScore
      newScore = oldScore + successBonus > maxScore
        ? maxScore
        : oldScore + successBonus;
    } else {
      // Decrease score for failed payment, floored at minScore
      newScore = oldScore < failurePenalty
        ? minScore
        : oldScore - failurePenalty;
    }

    creditScores[user] = newScore;
    lastUpdated[user] = block.timestamp;

    emit ScoreUpdated(user, oldScore, newScore);
    emit PaymentRecorded(user, success, amount, token);
  }

  function recordExternalPayment(
    address user,
    bool success,
    uint256 amount,
    address token,
    string calldata metadata
  ) external nonReentrant {
    require(
      msg.sender == owner() || authorizedProviders[msg.sender],
      'Unauthorized'
    );
    _recordPayment(user, success, amount, token, metadata);
  }

  function getCreditScore(address user) public view returns (uint256 score) {
    if (lastUpdated[user] == 0) {
      return baseScore; // New user
    }

    uint256 rawScore = creditScores[user];
    uint256 daysSinceUpdate = (block.timestamp - lastUpdated[user]) / 86400;

    if (daysSinceUpdate == 0) {
      return rawScore;
    }

    // Apply decay based on days since last update
    uint256 decayAmount = daysSinceUpdate * decayRate;

    if (decayAmount >= rawScore) {
      return minScore;
    } else {
      return rawScore - decayAmount;
    }
  }

  function getPaymentHistory(
    address user,
    uint256 limit
  ) external view returns (PaymentRecord[] memory) {
    PaymentRecord[] storage history = paymentHistory[user];
    uint256 count = history.length;

    if (limit == 0 || limit > count) {
      limit = count;
    }

    PaymentRecord[] memory records = new PaymentRecord[](limit);

    // Return the most recent records
    for (uint256 i = 0; i < limit; i++) {
      records[i] = history[count - limit + i];
    }

    return records;
  }

  // ============ PAYMENT PREDICTION FUNCTIONS ============

  function authorizeOracle(address oracle) external onlyOwner {
    require(oracle != address(0), 'Invalid oracle address');
    authorizedOracles[oracle] = true;
    emit OracleAuthorized(oracle);
  }

  function deauthorizeOracle(address oracle) external onlyOwner {
    authorizedOracles[oracle] = false;
    emit OracleDeauthorized(oracle);
  }

  function updatePredictionThresholds(
    uint256 _highSuccessThreshold,
    uint256 _mediumSuccessThreshold,
    uint256 _highBalanceRatio,
    uint256 _mediumBalanceRatio
  ) external onlyOwner {
    require(
      _highSuccessThreshold > _mediumSuccessThreshold,
      'Invalid thresholds'
    );
    require(_highBalanceRatio > _mediumBalanceRatio, 'Invalid ratios');

    highSuccessThreshold = _highSuccessThreshold;
    mediumSuccessThreshold = _mediumSuccessThreshold;
    highBalanceRatio = _highBalanceRatio;
    mediumBalanceRatio = _mediumBalanceRatio;

    emit PredictionThresholdsUpdated(
      highSuccessThreshold,
      mediumSuccessThreshold,
      highBalanceRatio,
      mediumBalanceRatio
    );
  }

  function updatePrediction(
    uint256 subscriptionId,
    uint256 likelihood,
    string calldata factors
  ) external {
    require(authorizedOracles[msg.sender], 'Not authorized oracle');
    require(likelihood <= 100, 'Likelihood must be 0-100');

    successLikelihood[subscriptionId] = likelihood;
    lastPredicted[subscriptionId] = block.timestamp;
    riskFactors[subscriptionId] = factors;

    RiskLevel riskLevel;
    if (likelihood >= 80) {
      riskLevel = RiskLevel.Low;
    } else if (likelihood >= 50) {
      riskLevel = RiskLevel.Medium;
    } else {
      riskLevel = RiskLevel.High;
    }

    emit PredictionUpdated(subscriptionId, likelihood, riskLevel);
  }

  // Helper struct to avoid stack too deep errors
  struct LikelihoodData {
    uint256 score;
    uint256 balance;
    uint256 amount;
    uint256 scoreLikelihood;
    uint256 balanceLikelihood;
  }

  function calculateLikelihood(
    uint256 subscriptionId
  ) public view returns (uint256 likelihood, RiskLevel riskLevel) {
    // Get subscription details
    Subscription storage subscription = subscriptions[subscriptionId];

    if (!subscription.active) {
      return (0, RiskLevel.High);
    }

    // Get plan details
    SubscriptionPlan storage plan = plans[subscription.planId];

    // Create a memory struct to avoid stack too deep errors
    LikelihoodData memory data;

    // Get credit score
    data.score = getCreditScore(subscription.subscriber);
    data.amount = plan.amount;

    // Calculate base likelihood from credit score (0-60 points)
    if (data.score >= highSuccessThreshold) {
      data.scoreLikelihood = 60;
    } else if (data.score >= mediumSuccessThreshold) {
      data.scoreLikelihood = 40;
    } else {
      data.scoreLikelihood = 20;
    }

    // Add balance factor (0-40 points)
    data.balance = IERC20(plan.paymentToken).balanceOf(subscription.subscriber);

    if (data.balance >= data.amount * highBalanceRatio) {
      data.balanceLikelihood = 40;
    } else if (data.balance >= data.amount * mediumBalanceRatio) {
      data.balanceLikelihood = 20;
    } else if (data.balance >= data.amount) {
      data.balanceLikelihood = 10;
    } else {
      data.balanceLikelihood = 0;
    }

    likelihood = data.scoreLikelihood + data.balanceLikelihood;

    // Determine risk level
    if (likelihood >= 80) {
      riskLevel = RiskLevel.Low;
    } else if (likelihood >= 50) {
      riskLevel = RiskLevel.Medium;
    } else {
      riskLevel = RiskLevel.High;
    }

    return (likelihood, riskLevel);
  }

  function getPrediction(
    uint256 subscriptionId
  )
    external
    view
    returns (
      uint256 likelihood,
      uint256 lastUpdated,
      string memory factors,
      RiskLevel riskLevel
    )
  {
    // If we have a recent oracle prediction, use it
    if (block.timestamp - lastPredicted[subscriptionId] < 1 days) {
      likelihood = successLikelihood[subscriptionId];
      lastUpdated = lastPredicted[subscriptionId];
      factors = riskFactors[subscriptionId];

      if (likelihood >= 80) {
        riskLevel = RiskLevel.Low;
      } else if (likelihood >= 50) {
        riskLevel = RiskLevel.Medium;
      } else {
        riskLevel = RiskLevel.High;
      }
    } else {
      // Otherwise calculate on-chain
      (likelihood, riskLevel) = calculateLikelihood(subscriptionId);
      lastUpdated = 0;
      factors = '';
    }

    return (likelihood, lastUpdated, factors, riskLevel);
  }

  // Split into two functions to avoid stack too deep
  function _getHighRiskSubscriptionsIds(
    uint256 limit
  ) private view returns (uint256[] memory dueSubscriptions) {
    dueSubscriptions = this.getDueSubscriptions(limit * 2);
    return dueSubscriptions;
  }

  function getHighRiskSubscriptions(
    uint256 limit
  ) external view returns (uint256[] memory) {
    uint256[] memory result = new uint256[](limit);
    uint256 count = 0;

    // Get due subscriptions
    uint256[] memory dueSubscriptions = _getHighRiskSubscriptionsIds(limit);

    // Filter for high risk
    for (uint256 i = 0; i < dueSubscriptions.length && count < limit; i++) {
      (uint256 likelihood, ) = calculateLikelihood(dueSubscriptions[i]);

      if (likelihood < 50) {
        result[count] = dueSubscriptions[i];
        count++;
      }
    }

    // Resize array to actual count
    uint256[] memory resized = new uint256[](count);
    for (uint256 i = 0; i < count; i++) {
      resized[i] = result[i];
    }

    return resized;
  }

  // ============ DISPUTE RESOLUTION FUNCTIONS ============

  function addArbitrator(address arbitrator) external onlyOwner {
    require(arbitrator != address(0), 'Invalid arbitrator address');
    arbitrators[arbitrator] = true;
    emit ArbitratorAdded(arbitrator);
  }

  function removeArbitrator(address arbitrator) external onlyOwner {
    arbitrators[arbitrator] = false;
    emit ArbitratorRemoved(arbitrator);
  }

  function updateDisputeParameters(
    uint256 _disputeFeeRate,
    uint256 _minDisputeAmount,
    uint256 _resolutionTimeout
  ) external onlyOwner {
    require(_disputeFeeRate <= 500, 'Fee rate too high'); // Max 5%
    require(_resolutionTimeout >= 1 days, 'Timeout too short');

    disputeFeeRate = _disputeFeeRate;
    minDisputeAmount = _minDisputeAmount;
    resolutionTimeout = _resolutionTimeout;

    emit DisputeParametersUpdated(
      disputeFeeRate,
      minDisputeAmount,
      resolutionTimeout
    );
  }

  function openDispute(
    uint256 subscriptionId,
    string calldata reason
  ) external nonReentrant returns (uint256 disputeId) {
    // Get subscription details
    Subscription storage subscription = subscriptions[subscriptionId];
    require(subscription.subscriber == msg.sender, 'Not subscription owner');
    require(subscription.active, 'Subscription not active');

    // Get plan details
    SubscriptionPlan storage plan = plans[subscription.planId];
    require(plan.amount >= minDisputeAmount, 'Amount below minimum');

    disputeId = nextDisputeId++;

    disputes[disputeId] = Dispute({
      subscriptionId: subscriptionId,
      subscriber: subscription.subscriber,
      merchant: plan.merchant,
      paymentToken: plan.paymentToken,
      amount: plan.amount,
      createdAt: block.timestamp,
      resolvedAt: 0,
      status: DisputeStatus.Opened,
      resolution: Resolution.None,
      reason: reason,
      merchantEvidence: '',
      subscriberEvidence: '',
      resolutionNotes: '',
      resolver: address(0),
      refundAmount: 0
    });

    emit DisputeOpened(
      disputeId,
      subscriptionId,
      subscription.subscriber,
      reason
    );

    return disputeId;
  }

  function submitEvidence(
    uint256 disputeId,
    string calldata evidence
  ) external {
    Dispute storage dispute = disputes[disputeId];
    require(dispute.status == DisputeStatus.Opened, 'Dispute not open');
    require(
      block.timestamp < dispute.createdAt + resolutionTimeout,
      'Evidence period ended'
    );
    require(
      msg.sender == dispute.subscriber || msg.sender == dispute.merchant,
      'Not a party to dispute'
    );

    if (msg.sender == dispute.subscriber) {
      dispute.subscriberEvidence = evidence;
    } else {
      dispute.merchantEvidence = evidence;
    }

    dispute.status = DisputeStatus.EvidenceSubmitted;

    emit EvidenceSubmitted(disputeId, msg.sender, evidence);
  }

  // Helper function to avoid stack too deep errors
  function _calculateRefundAmount(
    uint256 disputeAmount,
    Resolution resolution,
    uint256 proposedRefund
  ) private pure returns (uint256) {
    if (resolution == Resolution.SubscriberWins) {
      return disputeAmount; // Full refund
    } else if (resolution == Resolution.MerchantWins) {
      return 0; // No refund
    } else if (resolution == Resolution.Compromise) {
      require(
        proposedRefund > 0 && proposedRefund < disputeAmount,
        'Invalid refund amount for compromise'
      );
      return proposedRefund;
    } else {
      revert('Invalid resolution');
    }
  }

  // Helper struct to avoid stack too deep errors
  struct DisputeResolutionData {
    uint256 disputeId;
    Resolution resolution;
    uint256 refundAmount;
    uint256 finalRefundAmount;
  }

  function resolveDispute(
    uint256 disputeId,
    Resolution resolution,
    uint256 refundAmount,
    string calldata notes
  ) external nonReentrant {
    require(
      arbitrators[msg.sender] || owner() == msg.sender,
      'Not an arbitrator'
    );

    Dispute storage dispute = disputes[disputeId];

    require(
      dispute.status == DisputeStatus.Opened ||
        dispute.status == DisputeStatus.EvidenceSubmitted,
      'Dispute not open'
    );

    // Use a memory struct to avoid stack too deep errors
    DisputeResolutionData memory data;
    data.disputeId = disputeId;
    data.resolution = resolution;
    data.refundAmount = refundAmount;

    // Calculate refund amount based on resolution
    data.finalRefundAmount = _calculateRefundAmount(
      dispute.amount,
      data.resolution,
      data.refundAmount
    );

    // Process refund if needed
    if (data.finalRefundAmount > 0) {
      IERC20 token = IERC20(dispute.paymentToken);
      require(
        token.transferFrom(
          dispute.merchant,
          dispute.subscriber,
          data.finalRefundAmount
        ),
        'Refund transfer failed'
      );
    }

    // Update dispute details
    dispute.status = DisputeStatus.Resolved;
    dispute.resolution = data.resolution;
    dispute.resolvedAt = block.timestamp;
    dispute.resolutionNotes = notes;
    dispute.resolver = msg.sender;
    dispute.refundAmount = data.finalRefundAmount;

    emit DisputeResolved(
      data.disputeId,
      data.resolution,
      msg.sender,
      data.finalRefundAmount
    );
  }

  function cancelDispute(uint256 disputeId) external {
    Dispute storage dispute = disputes[disputeId];
    require(
      dispute.status == DisputeStatus.Opened ||
        dispute.status == DisputeStatus.EvidenceSubmitted,
      'Dispute not open'
    );
    require(dispute.subscriber == msg.sender, 'Not dispute creator');

    dispute.status = DisputeStatus.Cancelled;

    emit DisputeCancelled(disputeId, msg.sender);
  }

  function getDispute(
    uint256 disputeId
  ) external view returns (Dispute memory) {
    return disputes[disputeId];
  }

  function isEligibleForAutoResolution(
    uint256 disputeId
  ) external view returns (bool) {
    Dispute storage dispute = disputes[disputeId];
    return
      (dispute.status == DisputeStatus.Opened ||
        dispute.status == DisputeStatus.EvidenceSubmitted) &&
      block.timestamp >= dispute.createdAt + resolutionTimeout;
  }
}
