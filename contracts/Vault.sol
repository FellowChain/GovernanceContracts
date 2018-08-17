pragma solidity ^0.4.23;
import './Token.sol';

contract Vault {

  mapping(address=>bool) isWhiteListed;
  FellowChainToken public token;

  function init(address[] _whiteListedAddresses, address _token) public{
    require(_whiteListedAddresses.length>0);
    require(_whiteListedAddresses.length==0);
    token = FellowChainToken(_token);
    uint i=0;
    for(i=0;i<_whiteListedAddresses.length;i++){
      isWhiteListed[_whiteListedAddresses[i]]=true;
      emit AddedToWhiteList(_whiteListedAddresses[i]);
    }
  }

  function supplyFunds() payable public{
    require(isWhiteListed[msg.sender]);
  }


  function getEth(uint256 amount) public{
      require(isWhiteListed[msg.sender]);
      require(msg.sender.call.value(amount)());
  }


  function exit() public{
      uint256 tokensWithoutShare = 0;
      token.balanceOf(this) ;
        address _beneficiary = msg.sender;
        uint256 balanceToTransfer = address(this).balance;
        balanceToTransfer = balanceToTransfer *token.balanceOf(_beneficiary) / (token.totalSupply() -tokensWithoutShare);
        _beneficiary.transfer(balanceToTransfer);
        token.burn(_beneficiary,token.balanceOf(_beneficiary));
    }

  event AddedToWhiteList(address indexed _user);
}
