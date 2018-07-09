pragma solidity ^0.4.23;
import './Token.sol';

contract TokenLocker  is Ownable{

  FellowChainToken token;

   // amount of tokens locked for each account  
  mapping(address => uint256)public amount ;

  //locked end time for each account
  mapping(address => uint256)public endTime ;

  //total of locked tokens 
  uint256 public _totalLocked ;
  
  constructor(address _t) public{
    //done by Ownable contract
        //owner = msg.sender;
    token = FellowChainToken(_t);
  }

   //TODO  why to cast from uint to uint64 ??
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
        
    totalLocked = _totalLocked - amount[msg.sender];
        
    require(token.transfer(msg.sender,amount[msg.sender])); 
        
    amount[msg.sender]=0;
    endTime[msg.sender]=0;
  }

  function lockAllForVoting() public {
        uint256 allowenceLvl = token.allowance(msg.sender,address(this));
        uint balance = token.balanceOf(msg.sender);
        
        if(allowenceLvl>balance)
            allowenceLvl = balance;

        lockInternal(allowenceLvl);
    }

    function lockForVoting(uint256 value) public{
        uint256 allowenceLvl = token.allowance(msg.sender,address(this));
        require(allowenceLvl>=value);

        lockInternal(value);
    }

    function lockInternal(uint _value) private {

        //if accout balance is not sufficientit funnction will fail
        require(token.transferFrom(msg.sender,address(this),_value));

        amount[msg.sender] += _value;
        _totalLocked += _value;
        endTime[msg.sender] = now;

    }

   //TODO not used 
  event DonationPayed(address indexed _benef,uint256 value);
  event DonationPayedEth(address indexed _benef,uint256 value);
}
