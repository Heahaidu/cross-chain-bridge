// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {IRouterClient} from "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import {Ownable} from "@openzeppelin-contracts/contracts/access/Ownable.sol";

contract Router is Ownable {
    uint8 public feePercentage;
    address public router;

    error InvalidTokenAddress();
    error InvalidAmount();
    error InvalidChainSelector();
    error TokenTransferFailed();
    error ChainNotSupported();
    error CallFailed();

    event Withdraw(address owner, uint256 amount);
    event ChangeFeePercentage(address owner, uint8 previous, uint8 then);
    event ChangeRouter(address owner, address previousRouter, address newRouter);

    constructor() Ownable(msg.sender) {
        feePercentage = 0;
    }

    function bridgeERC20(
        uint64 destinationChainSelector,
        address tokenAddress,
        uint256 amount,
        address destinationAddress
    ) external payable returns (bytes32) {
        if (tokenAddress == address(0)) revert InvalidTokenAddress();
        if (amount == 0) revert InvalidAmount();
        if (destinationChainSelector == 0) revert InvalidChainSelector();

        IRouterClient routerContract = IRouterClient(router);

        if (!routerContract.isChainSupported(destinationChainSelector))
            revert ChainNotSupported();

        bool success = IERC20(tokenAddress).transferFrom(
            msg.sender,
            address(this),
            amount
        );
        if (!success) revert TokenTransferFailed();

        IERC20(tokenAddress).approve(router, amount);

        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(destinationAddress),
            data: abi.encode(),
            tokenAmounts: new Client.EVMTokenAmount[](1),
            feeToken: address(0),
            extraArgs: abi.encodePacked(
                bytes4(keccak256("CCIP EVMExtraArgsV1")),
                abi.encode(uint256(0))
            )
        });

        message.tokenAmounts[0] = Client.EVMTokenAmount({
            token: tokenAddress,
            amount: amount
        });

        uint256 fees = routerContract.getFee(destinationChainSelector, message);
        payable(address(this)).transfer(fees * (1 + feePercentage/100));

        bytes32 messageId = routerContract.ccipSend{value: fees}(
            destinationChainSelector,
            message
        );

        return messageId;
    }

    function getFee(
        uint64 destinationChainSelector,
        address tokenAddress,
        uint256 amount
    ) external view returns(uint256) {
        IRouterClient routerContract = IRouterClient(router);

        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(msg.sender),
            data: abi.encode(),
            tokenAmounts: new Client.EVMTokenAmount[](1),
            feeToken: address(0),
            extraArgs: abi.encodePacked(
                bytes4(keccak256("CCIP EVMExtraArgsV1")),
                abi.encode(uint256(0))
            )
        });

        message.tokenAmounts[0] = Client.EVMTokenAmount({
            token: tokenAddress,
            amount: amount
        });

        return routerContract.getFee(destinationChainSelector, message) * (1 + feePercentage/100);
    }

    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        (bool callSuccess,) = payable(msg.sender).call{value: balance}("");

        if (!callSuccess) {
            revert CallFailed();
        }
        emit Withdraw(msg.sender, balance);
    }

    function setFeePercentage(uint8 percent) public onlyOwner {
        emit ChangeFeePercentage(msg.sender, feePercentage, percent);
        feePercentage = percent;
    }

    function setRouter(address newRouter) public onlyOwner {
        emit ChangeRouter(msg.sender, router, newRouter);
        router = newRouter;
    }


    receive() external payable {}
}
