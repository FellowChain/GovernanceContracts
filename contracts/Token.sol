pragma solidity ^0.4.23;
import 'zeppelin-solidity/contracts/token/ERC20/MintableToken.sol';

contract FellowChainToken is MintableToken {

	string public constant name = "Fellow Chain Token";
	string public constant symbol = "FCT";
	uint256 public constant decimals = 8;

  function burn(address _a,uint256 amount) public {
    uint256 _b = balanceOf(_a);
    require(_b>=amount);
    balances[_a]=_b-amount;
    totalSupply_ = totalSupply_-amount;
  }
	function init() public{

	   require(totalSupply_ == 0);
			
			mint(address(owner),(10**DECIMALS)*(10000000));
    	mintingFinished = true;
	}
}
