pragma solidity ^0.4.23;
import './Token.sol';

contract DevelopmentFund  is Ownable{

  FellowChainToken public token;
  uint256 public price ;

  constructor(address _t) public{
    token = FellowChainToken(_t);
    price = 10**18;
  }

  //TODO why owner cant lower the price ??
  function setPrice(uint256 _newPrice) onlyOwner() public{
    require(_newPrice>price);
    price = _newPrice;
  }

  function () payable public{
    uint value = (msg.value*(10**token.decimals())/price);
    
    token.transfer(msg.sender,value);
    emit TokenSold(msg.sender,value);
  }

  function payForWorkInToken(address _beneficiary,uint256 value) onlyOwner() public{
        require(token.balanceOf(address(this))>=value);
        token.transfer(_beneficiary,value);
        emit DonationPayed(_beneficiary,value);
    }

  function payForWorkInEth(address _beneficiary,uint256 value) onlyOwner(){
       require(this.balance>=value);
       _beneficiary.transfer(value);
       emit DonationPayedEth(_beneficiary,value);
    }


  function exit() public{
      address _beneficiary = msg.sender;
      uint256 balanceToTransfer = address(this).balance;
      balanceToTransfer = balanceToTransfer *token.balanceOf(_beneficiary) / (token.totalSupply()-token.balanceOf(this));
      _beneficiary.transfer(balanceToTransfer);
      token.burn(_beneficiary,token.balanceOf(_beneficiary));
  }

  event DonationPayed(address indexed _benef,uint256 value);
  event TokenSold(address indexed _benef,uint256 amount);
  event DonationPayedEth(address indexed _benef,uint256 value);
}
