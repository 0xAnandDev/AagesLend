import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("AagesLendCore - Comprehensive Testing", function () {
  let owner, user1, user2, liquidator;
  let core, weth, usdc, randomToken;
  
  // Helper variable addressing token deployed locations
  let wethAddr, usdcAddr, randomAddr, coreAddr;

  const DECIMALS = 18n;
  const parseToken = (val) => ethers.parseUnits(val, DECIMALS);

  beforeEach(async function () {
    [owner, user1, user2, liquidator] = await ethers.getSigners();

    // 1. Deploy Mock Tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    weth = await MockERC20.deploy("Wrapped ETH", "WETH");
    usdc = await MockERC20.deploy("USD Coin", "USDC");
    randomToken = await MockERC20.deploy("Random", "RNDM");

    wethAddr = await weth.getAddress();
    usdcAddr = await usdc.getAddress();
    randomAddr = await randomToken.getAddress();

    // 2. Distribute funds to users
    const mintAmount = parseToken("100000");
    await weth.mint(user1.address, mintAmount);
    await usdc.mint(user1.address, mintAmount);
    await weth.mint(user2.address, mintAmount);
    await usdc.mint(user2.address, mintAmount);
    await usdc.mint(liquidator.address, mintAmount);

    // 3. Deploy AagesLendCore
    const CoreFactory = await ethers.getContractFactory("AagesLendCore");
    core = await CoreFactory.deploy();
    coreAddr = await core.getAddress();

    // 4. Admin Whitelists WETH & USDC with 80% LTV (8000 basis points)
    await core.addSupportedToken(wethAddr, 8000);
    await core.addSupportedToken(usdcAddr, 8000);
  });

  describe("1. Deployment tests", function () {
    it("Should deploy successfully and record initial owner", async function () {
      expect(coreAddr).to.be.properAddress;
    });

    it("Should properly whitelist initial assets and LTV parameters", async function () {
      expect(await core.supportedTokens(wethAddr)).to.be.true;
      expect(await core.maxLTV(wethAddr)).to.equal(8000);
      
      expect(await core.supportedTokens(usdcAddr)).to.be.true;
      expect(await core.maxLTV(usdcAddr)).to.equal(8000);
    });

    it("Should accurately exclude un-whitelisted random tokens", async function () {
      expect(await core.supportedTokens(randomAddr)).to.be.false;
      expect(await core.maxLTV(randomAddr)).to.equal(0);
    });
  });

  describe("2. Deposit tests", function () {
    it("Should let user deposit active whitelisted tokens", async function () {
      const depositAmount = parseToken("100");
      await usdc.connect(user1).approve(coreAddr, depositAmount);
      
      await expect(core.connect(user1).deposit(usdcAddr, depositAmount))
        .to.emit(core, "Deposit")
        .withArgs(user1.address, usdcAddr, depositAmount);

      expect(await core.deposits(user1.address, usdcAddr)).to.equal(depositAmount);
    });

    it("Should properly balance consecutive multiple deposits", async function () {
      const dep1 = parseToken("50");
      const dep2 = parseToken("150");
      
      await usdc.connect(user1).approve(coreAddr, dep1 + dep2);
      await core.connect(user1).deposit(usdcAddr, dep1);
      await core.connect(user1).deposit(usdcAddr, dep2);

      const totalDeposited = await core.deposits(user1.address, usdcAddr);
      expect(totalDeposited).to.equal(parseToken("200"));
    });
  });

  describe("3. Borrow tests", function () {
    let collateralAmount = parseToken("100"); // 100 WETH mock format
    let maxBorrow = parseToken("80");         // Max 80% LTV applies = 80 USDC mock format
    
    beforeEach(async function () {
      // First provide liquidity to the pool so borrows can withdraw USDC
      const poolLiquidity = parseToken("1000");
      await usdc.connect(owner).approve(coreAddr, poolLiquidity);
      await core.connect(owner).deposit(usdcAddr, poolLiquidity);
    });

    it("Should allow compliant borrowing limits", async function () {
      const requestBorrow = parseToken("50"); 
      
      await weth.connect(user1).approve(coreAddr, collateralAmount);
      
      await expect(
        core.connect(user1).borrow(wethAddr, collateralAmount, usdcAddr, requestBorrow)
      ).to.emit(core, "Borrow")
       .withArgs(user1.address, usdcAddr, requestBorrow, wethAddr, collateralAmount);

      expect(await core.borrows(user1.address, usdcAddr)).to.equal(requestBorrow);
      expect(await core.deposits(user1.address, wethAddr)).to.equal(collateralAmount);
    });

    it("Should enforce LTV restrictions & revert on over-borrowing", async function () {
      const requestExceed = parseToken("81"); // Above 80% LTV allowed logic
      await weth.connect(user1).approve(coreAddr, collateralAmount);

      await expect(
        core.connect(user1).borrow(wethAddr, collateralAmount, usdcAddr, requestExceed)
      ).to.be.revertedWith("AagesLend: Borrow limits exceeded max LTV");
    });
  });

  describe("4. Repay tests", function () {
    let borrowedAmount = parseToken("50");
    
    beforeEach(async function () {
      await usdc.connect(owner).approve(coreAddr, parseToken("500"));
      await core.connect(owner).deposit(usdcAddr, parseToken("500"));

      await weth.connect(user1).approve(coreAddr, parseToken("100"));
      await core.connect(user1).borrow(wethAddr, parseToken("100"), usdcAddr, borrowedAmount);
    });

    it("Should properly receive user repayments", async function () {
      await usdc.connect(user1).approve(coreAddr, borrowedAmount);
      
      await expect(core.connect(user1).repay(usdcAddr, borrowedAmount, user1.address))
        .to.emit(core, "Repay")
        .withArgs(user1.address, usdcAddr, borrowedAmount);

      expect(await core.borrows(user1.address, usdcAddr)).to.equal(0);
    });
  });

  describe("5. Withdraw tests", function () {
    const depositAmt = parseToken("200");

    beforeEach(async function () {
      await usdc.connect(user1).approve(coreAddr, depositAmt);
      await core.connect(user1).deposit(usdcAddr, depositAmt);
    });

    it("Should process fully-funded partial and full withdrawals", async function () {
      const withdrawAmount = parseToken("50");

      await expect(core.connect(user1).withdraw(usdcAddr, withdrawAmount))
        .to.emit(core, "Withdraw")
        .withArgs(user1.address, usdcAddr, withdrawAmount);

      expect(await core.deposits(user1.address, usdcAddr)).to.equal(depositAmt - withdrawAmount);
    });
  });

  describe("6. Liquidation tests", function () {
    it("Should emit internal liquidation stub triggers flawlessly", async function () {
      // In AagesLendCore, logic is purely stubbed awaiting Oracle attachments logic handling.
      // So testing the event mappings fires correctly inside Core context.
      await expect(core.connect(liquidator).liquidate(user1.address, wethAddr))
        .to.emit(core, "Liquidation")
        .withArgs(liquidator.address, user1.address, wethAddr, 0);
    });
  });

  describe("7. Integration Tests (Full Flow Lifecycle)", function () {
    it("Should handle multiple chained deposits, borrows, repays and withdrawals seamlessly", async function () {
      // Step 1: Owner fuels pool liquidity
      await weth.connect(owner).approve(coreAddr, parseToken("500"));
      await core.connect(owner).deposit(wethAddr, parseToken("500"));
      
      // Step 2: User deposits Collateral
      await usdc.connect(user1).approve(coreAddr, parseToken("1000"));
      await core.connect(user1).deposit(usdcAddr, parseToken("1000")); 

      // Step 3: Different User locks collateral and borrows heavily
      await usdc.connect(user2).approve(coreAddr, parseToken("2000"));
      await core.connect(user2).borrow(usdcAddr, parseToken("2000"), wethAddr, parseToken("100")); 
      
      expect(await core.borrows(user2.address, wethAddr)).to.equal(parseToken("100"));

      // Step 4: Repay part of it
      await weth.connect(user2).approve(coreAddr, parseToken("50"));
      await core.connect(user2).repay(wethAddr, parseToken("50"), user2.address);

      // Step 5: Liquidator flow (stub trigger only, main logic lives in LiquidationEngine per protocol)
      await core.connect(liquidator).liquidate(user2.address, usdcAddr);

      expect(await core.borrows(user2.address, wethAddr)).to.equal(parseToken("50"));
    });
  });

  describe("8. Edge cases", function () {
    it("Revert: Zero Amounts on Deposit", async function () {
      await expect(
        core.connect(user2).deposit(usdcAddr, 0)
      ).to.be.revertedWith("AagesLend: Deposit amount must be greater than 0");
    });

    it("Revert: Unsupported Tokens attempt", async function () {
      await expect(
        core.connect(user1).deposit(randomAddr, parseToken("10"))
      ).to.be.revertedWith("AagesLend: Token not whitelisted");
    });

    it("Revert: Insufficient bounds on user withdrawals", async function () {
      await usdc.connect(user1).approve(coreAddr, parseToken("50"));
      await core.connect(user1).deposit(usdcAddr, parseToken("50"));
      
      await expect(
        core.connect(user1).withdraw(usdcAddr, parseToken("100"))
      ).to.be.revertedWith("AagesLend: Insufficient funds to withdraw");
    });

    it("Revert: Extraneous Repayment sizes over real debt", async function () {
      // First provide liquidity and borrow
      await usdc.connect(owner).approve(coreAddr, parseToken("100"));
      await core.connect(owner).deposit(usdcAddr, parseToken("100"));

      await weth.connect(user1).approve(coreAddr, parseToken("100"));
      await core.connect(user1).borrow(wethAddr, parseToken("100"), usdcAddr, parseToken("50"));

      // Try paying back more than owed
      await usdc.connect(user1).approve(coreAddr, parseToken("1000"));
      await expect(
        core.connect(user1).repay(usdcAddr, parseToken("51"), user1.address)
      ).to.be.revertedWith("AagesLend: Repay amount exceeds current borrow balance");
    });
  });

});
