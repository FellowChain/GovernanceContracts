pragma solidity ^0.4.23;
import './Token.sol';

contract Vault {

  mapping(address=>bool) isWhiteListed;
  address[] omitedAddresses;

  function init(address[] _whiteListedAddresses,address[] _omitedAddresses ) public{
    require(_omitedAddresses.length>0);
    require(omitedAddresses.length==0);
    uint i=0;
    for(i=0;i<_whiteListedAddresses.length;i++){
      isWhiteListed[_whiteListedAddresses[i]]=true;
      emit AddedToWhiteList(_whiteListedAddresses[i]);
    }
    for(i=0;i<_omitedAddresses.length;i++){

      omitedAddresses.push(_omitedAddresses[i]);
      emit AddedToOmitedList(_omitedAddresses[i]);
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
  event AddedToOmitedList(address indexed _user);
}
