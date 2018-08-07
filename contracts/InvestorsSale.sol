pragma solidity ^0.4.23;
import './Token.sol';
import './Vault.sol';

contract InvestorSale  is Ownable{

  FellowChainToken public token;
  address public operator;
  Vault public vault;
  uint256 public price ;
  mapping(address=>bool) isWhiteListed;

  constructor(address _t, address _operator, address _vault) public{
    token = FellowChainToken(_t);
    price = 10**18;
    vault = Vault(_vault);
  }

  function addToWhiteList(address _user) public {
    require(operator==msg.sender);
    isWhiteListed[_user]=true;
  }

  function removeFromWhiteList(address _user) public {
    require(operator==msg.sender);
    isWhiteListed[_user]=false;
  }

  function setPrice(uint256 _newPrice) onlyOwner() public{
    require(_newPrice>price);
    price = _newPrice;
  }

  function () payable public{
    require(isWhiteListed[msg.sender]);
    uint value = (msg.value*(10**token.decimals())/price);
    require(token.transfer(msg.sender,value));
    vault.supplyFunds.value(address(this).balance)();
    emit TokenSold(msg.sender,value);
  }

  event TokenSold(address indexed _benef,uint256 amount);
}
