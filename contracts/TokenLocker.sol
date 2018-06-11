pragma solidity ^0.4.23;
import './Token.sol';

contract TokenLocker  is Ownable{

  FellowChainToken token;
  mapping(address => uint256)public amount ;
  mapping(address => uint256)public endTime ;
  uint256 public _totalLocked ;
  constructor(address _t) public{
    owner = msg.sender;
    token = FellowChainToken(_t);
  }

  function getTotalLocked() view public returns(uint64){
    return uint64(_totalLocked);
  }

  function getLockedAmount(address _adr) view public returns(uint64){
    return uint64(amount[_adr]);
  }

  function postponeLock(address _for,uint256 _untilTime) public onlyOwner{
    if(endTime[_for]<_untilTime &&now<_untilTime){
      endTime[_for] = _untilTime;
    }
  }

  function withdraw() public{
    require(now>endTime[msg.sender]);
    _totalLocked = _totalLocked - amount[msg.sender];
    amount[msg.sender]=0;
    endTime[msg.sender]=0;
    token.transfer(msg.sender,amount[msg.sender]);
  }

  function lockAllForVoting(address _benef) public{
      uint256 allowenceLvl = token.allowance(_benef,address(this));
      amount[_benef] = amount[_benef]+allowenceLvl;
      _totalLocked = _totalLocked+allowenceLvl;
      token.transferFrom(_benef,address(this),allowenceLvl);
  }

  function lockForVoting(address _benef, uint256 value) public{
    uint256 allowenceLvl = token.allowance(_benef,address(this));
    require(allowenceLvl>=value);
    amount[_benef] = amount[_benef]+value;
    _totalLocked = _totalLocked+value;
    token.transferFrom(_benef,address(this),value);
  }

  event DonationPayed(address indexed _benef,uint256 value);
  event DonationPayedEth(address indexed _benef,uint256 value);
}
