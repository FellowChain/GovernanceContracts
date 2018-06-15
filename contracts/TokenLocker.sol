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

  function isWithdrawPossible(address person) view public returns(bool){
    return now>endTime[person];
  }

  function withdraw() public{
    require(now>endTime[msg.sender]);
    _totalLocked = _totalLocked - amount[msg.sender];
    if(token.transfer(msg.sender,amount[msg.sender])){ 
      amount[msg.sender]=0;
      endTime[msg.sender]=0;
    }
  }

  function lockAllForVoting() public{
      uint256 allowenceLvl = token.allowance(msg.sender,address(this));
      if(allowenceLvl>token.balanceOf(msg.sender)){
        allowenceLvl = token.balanceOf(msg.sender);
      }
      if(token.transferFrom(msg.sender,address(this),allowenceLvl)){
        amount[msg.sender] = amount[msg.sender]+allowenceLvl;
        _totalLocked = _totalLocked+allowenceLvl;
        endTime[msg.sender]=now;
      }
  }

  function lockForVoting(uint256 value) public{
    uint256 allowenceLvl = token.allowance(msg.sender,address(this));
    require(allowenceLvl>=value);
    if(token.transferFrom(msg.sender,address(this),value)){
      amount[msg.sender] = amount[msg.sender]+value;
      _totalLocked = _totalLocked+value;
      endTime[msg.sender]=now;
    }
  }

  event DonationPayed(address indexed _benef,uint256 value);
  event DonationPayedEth(address indexed _benef,uint256 value);
}
