pragma solidity ^0.4.23;
import './TokenLocker.sol';

contract VotingProxy{

    address _adr;
    Voting _caller;

    constructor(address _calledAddress, address callerAddr) public{

        _adr = _calledAddress;
        _caller = Voting(callerAddr);
    }

    function () public payable{
        _caller.registerNewCall(msg.data,_adr,msg.value);
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
          }
          if(votedFor==false){
            votesAgainstSum = votesAgainstSum + voteCount - votesAgainst[voter];
          }
          require (votesFor[voter]==0 || votesAgainst[voter]==0);
      }
}

contract Voting is Ownable {

    struct CallData{
        bytes data;
        address adr;
        uint256 val;
        string method;
        bool isExecuted;
    }
    CallData[] public calls ;
    TokenLocker _locker;
    uint32 public votingTimeSpan ;
    uint32 public minorityAdvantagePercent ;
    uint32 public lowAttendanceFactor ;
    mapping(address=>address) proxies;
    VotingData[] public votingResults;

    constructor(address _votesLocker) public{
        _locker = TokenLocker(_votesLocker);
    }

    function init() public{
        require(proxies[address(this)]==address(0));
        proxies[address(this)] = address(new VotingProxy(address(this),address(this)));
        owner = address(this);
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
        return (voteFor> (voteAgainst*minorityAdvantagePercent/100)-(totalPossible-voteFor-voteAgainst)/lowAttendanceFactor)
                && (votingEndTime>now) && (executed==false);
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

    function addMnemonic(string _method,uint256 idx) public{
        calls[idx].method=_method;
        bytes4 prefix=extractHead(calls[idx].data);
        require(bytes4(keccak256(bytes(_method)))==prefix);
    }

    function registerProxy(address _adrToProxy) public onlyOwner(){
        require(proxies[_adrToProxy]==address(0));
        proxies[_adrToProxy] = address(new VotingProxy(_adrToProxy,address(this)));
    }

    function registerNewCall(bytes _data,address _adr, uint256 _val) public{
        require(proxies[_adr]==msg.sender);
        calls.push(CallData(_data,_adr,_val,"",false));
        uint64 time = uint64(now)+uint64(votingTimeSpan);

        votingResults.push(new VotingData(time));
        emit VotingRegistered(_adr,_data);
    }


    function extractHead(bytes _b) private pure returns(bytes4){
            uint32 _val=0;
            for(uint8 i=0;i<4;i++){
                _val=_val*256+uint32(_b[i]);
            }
            return (bytes4(_val));
        }
    event VotingRegistered(address _to,bytes _data);
    event DecisionExecuted(uint256 idx,address voting);
    event VoteCasted(address indexed voter, uint64 power,uint256 caseIdx,bool votingFor);
}
