@echo off
echo ========================================
echo Deploying Smart Contracts
echo ========================================
echo.
echo Make sure Hardhat node is running first!
echo (Run start-hardhat-node.bat in another window)
echo.
echo ========================================
echo.

npx hardhat run scripts/deploy.js --network localhost

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
pause