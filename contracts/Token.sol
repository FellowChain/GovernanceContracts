pragma solidity ^0.4.23;
import 'zeppelin-solidity/contracts/token/ERC20/MintableToken.sol';

contract FellowChainToken is MintableToken {

	string public constant name = "Fellow Chain Token";
	string public constant symbol = "FCT";

	//TODO consider to change to 18 
	uint256 public constant decimals = 8;

  function burn(address _a,uint256 amount) public onlyOwner{
    uint256 _b = balanceOf(_a);
    require(_b>=amount);
    balances[_a]=_b-amount;
    totalSupply_ = totalSupply_-amount;
  }

	function init() public{

	   require(totalSupply_ == 0);
			
			mint(address(owner),(10**decimals)*(10000000));
    	mintingFinished = true;
	}
}
