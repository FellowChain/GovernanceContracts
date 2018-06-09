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


contract Voting is Ownable {

    struct CallData{
        bytes data;
        address adr;
        uint256 val;
        string method;
    }
    struct VotingData{
        uint64 votesFor;
        uint64 votesAgainst;
        uint64 votingEndTime;
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
        require(now<votingResults[callIndex].votingEndTime);
        _locker.postponeLock(msg.sender,votingResults[callIndex].votingEndTime);

    }

    function extractHead(bytes _b) private pure returns(bytes4){
        uint32 _val=0;
        for(uint8 i=0;i<4;i++){
            _val=_val*256+uint32(_b[i]);
        }
        return (bytes4(_val));
    }
    /*conservative, there must be twice that much people for than against
      not voting is like 1/5 against to prevent decision made with very low
      attendence rate
    */
    function isAccepted(uint256 idx) private view returns(bool){
        uint256 totalPossible = _locker.getTotalLocked();
        uint256 votingEndTime = votingResults[idx].votingEndTime;
        uint256 voteFor = votingResults[idx].votesFor;
        uint256 voteAgainst = votingResults[idx].votesAgainst;
        return (voteFor> (voteAgainst*minorityAdvantagePercent/100)-(totalPossible-voteFor-voteAgainst)/lowAttendanceFactor)
                && (votingEndTime>now);
    }

    function execute(uint256 idx) public {
        if(isAccepted(idx)){
            if(calls[idx].adr.call.value(calls[idx].val)(calls[idx].data)==false){
                revert();
            }
        }
        else{
            revert();
        }
    }

    function addMnemonic(string _method,uint256 idx){
        calls[idx].method=_method;
        bytes4 prefix=extractHead(calls[idx].data);
        require(bytes4(sha3(_method))==prefix);
    }

    function registerProxy(address _adrToProxy) public onlyOwner(){
        require(proxies[_adrToProxy]==address(0));
        proxies[_adrToProxy] = address(new VotingProxy(_adrToProxy,address(this)));
    }

    function registerNewCall(bytes _data,address _adr, uint256 _val) public{
        require(proxies[_adr]==msg.sender);
        calls.push(CallData(_data,_adr,_val,""));
        uint64 time = uint64(now)+uint64(votingTimeSpan);
        votingResults.push(VotingData(0,0,time));

    }
}
