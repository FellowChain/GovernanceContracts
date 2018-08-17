pragma solidity ^0.4.23;
import './Token.sol';
import './Vault.sol';

contract TargetFund  is Ownable{

  FellowChainToken public token;
  Vault public vault;
  uint256 public price ;
  string public fundsRole;

  constructor(address _t,address _v,string _fundsRole) public{
    token = FellowChainToken(_t);
    price = 10**18;
    vault = Vault(_v);
    fundsRole = _fundsRole;
  }

  function donateInToken(address _beneficiary,uint256 value) onlyOwner() public{
        require(token.balanceOf(address(this))>=value);
        token.transfer(_beneficiary,value);
        emit DonationPayed(_beneficiary,value);
    }

  function donateInEth(address _beneficiary,uint256 value) onlyOwner(){
       vault.getEth(value);
       _beneficiary.transfer(value);
       emit DonationPayedEth(_beneficiary,value);
    }

  event DonationPayed(address indexed _benef,uint256 value);
  event TokenSold(address indexed _benef,uint256 amount);
  event DonationPayedEth(address indexed _benef,uint256 value);
}
