pragma solidity ^0.4.23;
import './TokenLocker.sol';

contract VotingProxy{

    address _adr;
    VotingContract _caller;

    constructor(address _calledAddress, address callerAddr) public{

        _adr = _calledAddress;
        _caller = VotingContract(callerAddr);
    }

    function () public payable{
        _caller.registerNewCall.value(msg.value)(msg.data,_adr,msg.value);
    }
}

contract VotingData {

      uint64 public votesForSum ;
      uint64 public votesAgainstSum ;
      uint64 public endTime;
      address public parent;
      mapping(address=>uint64) votesFor;
      mapping(address=>uint64) votesAgainst;

      function getEndTime() public view returns(uint64){
        return endTime;
      }

      modifier onlyParent(){
        require(msg.sender==parent);
        _;
      }

      constructor(uint64 _time) public{
        endTime = _time;
        parent = msg.sender;
      }

      function vote(address voter,uint64 voteCount,bool votedFor) onlyParent() public{
          if(votedFor && votesAgainst[voter]>0){
            votesAgainstSum=votesAgainstSum-votesAgainst[voter];
            votesAgainst[voter]=0;
          }
          if(votedFor==false && votesFor[voter]>0){
            votesForSum=votesForSum-votesFor[voter];
            votesFor[voter]=0;
          }
          if(votedFor){
            votesForSum = votesForSum + voteCount - votesFor[voter];
            votesFor[voter] = voteCount;
          }
          if(votedFor==false){
            votesAgainstSum = votesAgainstSum + voteCount - votesAgainst[voter];
            votesAgainst[voter] = voteCount;
          }
          require (votesFor[voter]==0 || votesAgainst[voter]==0);
          emit VoteCasted(votesForSum,votesAgainstSum,voter,voteCount,votedFor);
      }
      event VoteCasted(uint votesFor,uint votesAgainst,address voter,uint voterVotesCount,bool voteDirection);
}

contract VotingContract is Ownable {

    struct CallData{
        bytes data;
        address adr;
        uint256 val;
        string method;
        bytes32 hash;
        bool isExecuted;
    }
    CallData[] public calls ;
    TokenLocker _locker;
    uint32 public votingTimeSpan ;
    uint32 public minorityAdvantagePercent ;
    uint32 public lowAttendanceFactor ;
    mapping(address=>address) public proxies;
    mapping(bytes32=>uint256) public _customTimeSpan;
    VotingData[] public votingResults;

    modifier onlyProxy(address _adr){

          require(proxies[_adr]==msg.sender);
          _;
    }

    constructor(address _votesLocker) public{
        _locker = TokenLocker(_votesLocker);
        owner = msg.sender;
    }

    function updateLocker(address _votesLocker) public onlyOwner(){
      _locker = _votesLocker;
    }

    function init() public{
        require(proxies[address(this)]==address(0));
        proxies[address(this)] = address(new VotingProxy(address(this),address(this)));
        votingTimeSpan = 24*3600*7;
        minorityAdvantagePercent = 200;
        lowAttendanceFactor = 5;
    }

    function setVotingTimeSpan(uint32 _span) public onlyOwner(){
        votingTimeSpan = _span;
    }

    function setMinorityAdvantagePercent(uint32 _val) public onlyOwner(){
        minorityAdvantagePercent = _val;
    }

    function setLowAttendanceFactor(uint32 _val) public onlyOwner(){
        lowAttendanceFactor = _val;
    }

    function getProxy(address _adr) public view returns(address){
        return proxies[_adr];
    }

    function vote(uint256 callIndex,bool isFor) public{

        uint64 time = votingResults[callIndex].getEndTime();
        require(time>now);
        _locker.postponeLock(msg.sender,time);
        uint64 votesAmount  = _locker.getLockedAmount(msg.sender);

        votingResults[callIndex].vote(msg.sender,votesAmount,isFor);
        emit VoteCasted(msg.sender, votesAmount,callIndex,isFor);
    }

    /*conservative, there must be twice that much people for than against
      not voting is like 1/5 against to prevent decision made with very low
      attendence rate
    */
    function isAccepted(uint256 idx) private view returns(bool){
        uint256 totalPossible = _locker.getTotalLocked();
        bool executed = calls[idx].isExecuted;
        uint256 votingEndTime = votingResults[idx].getEndTime();
        uint256 voteFor = votingResults[idx].votesForSum();
        uint256 voteAgainst = votingResults[idx].votesAgainstSum();
        return (voteFor> (voteAgainst*minorityAdvantagePercent/100)+(totalPossible-voteFor-voteAgainst)/lowAttendanceFactor)
                && (votingEndTime>now) && (executed==false);
    }

    function isFinished(uint256 idx) view public returns(bool){

        uint256 votingEndTime = votingResults[idx].getEndTime();
    }

    function cancel(uint256 idx) public{
      uint256 votingEndTime = votingResults[idx].getEndTime();
      if(votingEndTime<now && isAccepted(idx)==false){
        calls[idx].isExecuted = true;
        DecisionDeclined(idx,address(votingResults[idx]));
      }
      else{
        revert();
      }
    }

    function execute(uint256 idx) public {
        if(isAccepted(idx)){
            if(calls[idx].adr.call.value(calls[idx].val)(calls[idx].data)==false){
                revert();
            }
            calls[idx].isExecuted = true;
            emit DecisionExecuted(idx,address(votingResults[idx]));

        }
        else{
          revert();
        }
    }

    function addMnemonic(string _method, bytes32 hash,uint256 idx) public{
        calls[idx].method=_method;
        calls[idx].hash = hash ;
        bytes4 prefix=extractHead(calls[idx].data);
        require(bytes4(keccak256(bytes(_method)))==prefix);
    }

    function registerProxy(address _adrToProxy) public onlyOwner(){
        require(proxies[_adrToProxy]==address(0));
        proxies[_adrToProxy] = address(new VotingProxy(_adrToProxy,address(this)));
    }

    function setCustomTimeSpan(address _adr,string method, uint256 _timeSpan) public onlyOwner(){
      _customTimeSpan[keccak256(_adr,bytes4(keccak256(method)))] = _timeSpan;
    }

   function sendOwnFunds(address _destination) public onlyOwner(){
      (address(_destination)).transfer(this.balance);
   }

   function getTime(address _adr,bytes4 header) returns(uint64){
      uint256 _custom = _customTimeSpan[keccak256(_adr,header)] ;
      if (_custom==0){
        return uint64(now)+uint64(votingTimeSpan);
      }
      else{
        return uint64(now)+uint64(_custom);
      }
    }

    function registerNewCall(bytes _data,address _adr, uint256 _val) public payable onlyProxy(_adr){
        calls.push(CallData(_data,_adr,_val,"",bytes32(0),false));
        uint64 time = getTime(_adr,extractHead(_data));
        votingResults.push(new VotingData(time));
        emit VotingRegistered(_adr,_data,calls.length-1,time,address(votingResults[votingResults.length-1]));
    }


    function extractHead(bytes _b) private pure returns(bytes4){
            uint32 _val=0;
            for(uint8 i=0;i<4;i++){
                _val=_val*256+uint32(_b[i]);
            }
            return (bytes4(_val));
        }

    event VotingRegistered(address _to,bytes _data, uint256 indexed callIdx, uint256 time, address votingContract);
    event DecisionExecuted(uint256 idx,address voting);
    event DecisionDeclined(uint256 idx,address voting);
    event VoteCasted(address indexed voter, uint64 power,uint256 caseIdx,bool votingFor);
}
