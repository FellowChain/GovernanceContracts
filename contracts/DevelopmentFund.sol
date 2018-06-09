pragma solidity ^0.4.23;
import './Token.sol';

contract DevelopmentFund  is Ownable{

  FellowChainToken token;
  uint256 price;
  constructor(address _t) public{
    owner = msg.sender;
    token = FellowChainToken(_t);
    price = 10**18;
  }

  function setPrice(uint256 _newPrice){
    require(_newPrice>price);
    price = _newPrice;
  }

  function () payable public{
    token.transfer(msg.sender,(msg.value*(10**token.decimals())/price));
  }

  function payForWorkInToken(address _beneficiary,uint256 value) onlyOwner{
        require(token.balanceOf(address(this))>=value);
        token.transfer(_beneficiary,value);
        emit DonationPayed(_beneficiary,value);
    }

  function payForWorkInEth(address _beneficiary,uint256 value) onlyOwner{
       require(this.balance>=value);
       _beneficiary.transfer(value);
       emit DonationPayedEth(_beneficiary,value);
    }

  function exit(address _beneficiary) public{
      uint256 balanceToTransfer = address(this).balance;
      balanceToTransfer = balanceToTransfer *token.balanceOf(_beneficiary) / token.totalSupply();
      _beneficiary.transfer(balanceToTransfer);
      token.burn(_beneficiary,token.balanceOf(_beneficiary));

  }

  event DonationPayed(address indexed _benef,uint256 value);
  event DonationPayedEth(address indexed _benef,uint256 value);
}
