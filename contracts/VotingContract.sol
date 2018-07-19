pragma solidity ^0.4.23;
import "./TokenLocker.sol";

contract VotingProxy{

    address _adr;
    VotingContract _caller;

    constructor(address _calledAddress, address callerAddr) public{

        _adr = _calledAddress;
        _caller = VotingContract(callerAddr);
    }

    //everyone can call this - voting DDoS !  
    function () public payable{
        _caller.registerNewCall.value(msg.value)(msg.data,_adr);
    }
}

contract VotingContract is Ownable {

    uint64 constant VOTES_MASK = 2**64;

    struct CallData{
        address adr;
        bool isExecuted;
        bytes data;
        uint256 val;
        string method;
    }

    struct VotingData {
        uint64 votesForSum ;
        uint64 votesAgainstSum ;
        uint endTime;
        //64-127 bits - votes for
        //0 -63 bits - votes against
        mapping(address=>uint) votes;
    }

    uint32 public votingTimeSpan ;
    uint32 public minorityAdvantagePercent ;
    uint32 public lowAttendanceFactor ;

    CallData[] public calls ;
    TokenLocker _locker;
   
    mapping(address=>address) public proxies;
    mapping(bytes32=>uint256) public _customTimeSpan;
    VotingData[] public votingResults;

    modifier onlyProxy(address _adr){

        require(proxies[_adr]==msg.sender);
        _;
    }

    constructor(address _votesLocker) public{
        _locker = TokenLocker(_votesLocker);
    }

    //TODO should be any check is _votesLocker an instance of TokenLocker ? 
    function updateLocker(address _votesLocker) public onlyOwner(){
        _locker = TokenLocker(_votesLocker);
    }

    function init(uint32 _span) public{
        require(proxies[address(this)]==address(0));
        proxies[address(this)] = address(new VotingProxy(address(this),address(this)));
        votingTimeSpan = _span;
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

        uint time = votingResults[callIndex].endTime;

        require(time > now);

        _locker.postponeLock(msg.sender,time);
        uint64 votesAmount = _locker.getLockedAmount(msg.sender);

        voteInternal(callIndex, msg.sender,votesAmount,isFor);
        emit VoteCasted(msg.sender, votesAmount,callIndex,isFor);
    }

    //TODO is voteCount will not cause overflow ?? 
    function voteInternal(uint256 callIndex, address voter,uint64 voteCount,bool votedFor) private {

        VotingData storage votingData = votingResults[callIndex];

        uint64 votesAgainst = uint64(votingData.votes[voter]) & (VOTES_MASK-1);
        uint64 votesFor = uint64(votingData.votes[voter] / VOTES_MASK);

        if(votedFor && votesAgainst > 0){
            votingData.votesAgainstSum = votingData.votesAgainstSum-votesAgainst;
            votesAgainst = 0;
        }
        else if(votedFor == false && votesFor>0){
            votingData.votesForSum = votingData.votesForSum-votesFor;
            votesFor = 0;
        }
        
        if(votedFor){
            votingData.votesForSum = votingData.votesForSum + voteCount - votesFor;
            votesFor = voteCount;
        }
        else{
            votingData.votesAgainstSum = votingData.votesAgainstSum + voteCount - votesAgainst;
            votesAgainst = voteCount;
        }

        require (votesFor == 0 || votesAgainst == 0);

        votingData.votes[voter] = (votesFor * (2**64)) | votesAgainst;
    }

    /*conservative, there must be twice that much people for than against
      not voting is like 1/5 against to prevent decision made with very low
      attendence rate
    */
    function isAccepted(uint256 idx) public view returns(bool){
        
        bool isNotExecuted = calls[idx].isExecuted == false;
        bool isVotingPending = votingResults[idx].endTime < now;

        uint256 totalPossible = _locker.getTotalLocked();
        uint256 voteFor = votingResults[idx].votesForSum;
        uint256 voteAgainst = votingResults[idx].votesAgainstSum;

        return isNotExecuted && isVotingPending &&
         (voteFor> (voteAgainst*minorityAdvantagePercent/100)+(totalPossible-voteFor-voteAgainst)/lowAttendanceFactor);
    }

    // function isFinished(uint256 idx) view public returns(bool){

    //     uint256 votingEndTime = votingResults[idx].endTime;
    // }

    function cancel(uint256 idx) public{
        require(votingResults[idx].endTime < now && isAccepted(idx) == false);

        calls[idx].isExecuted = true;
        emit DecisionDeclined(idx);
    }

    function execute(uint256 idx) public {
        require(isAccepted(idx));
        
        require(calls[idx].adr.call.value(calls[idx].val)(calls[idx].data));

        calls[idx].isExecuted = true;
        emit DecisionExecuted(idx);
    }

    function addMnemonic(string _method, uint256 idx) public{
        bytes4 prefix = extractHead(calls[idx].data);
        require(bytes4(keccak256(bytes(_method))) == prefix);

        calls[idx].method = _method;
    }

    function registerProxy(address _adrToProxy) public onlyOwner(){
        require(proxies[_adrToProxy]==address(0));
        // || _adrToProxy == address(this) if is true first require will catch it 
        require(Ownable(_adrToProxy).owner()==address(this));

        proxies[_adrToProxy] = address(new VotingProxy(_adrToProxy,address(this)));
    }

    function setCustomTimeSpan(address _adr,bytes4 method, uint256 _timeSpan) public onlyOwner(){
        _customTimeSpan[keccak256(_adr,method)] = _timeSpan;
    }

    function sendOwnFunds(address _destination) public onlyOwner(){
        (address(_destination)).transfer(address(this).balance);
    }

    function getTime(address _adr,bytes4 header) view public returns(uint){
        uint256 _custom = _customTimeSpan[keccak256(_adr,header)] ;
        if (_custom==0){
            return now + votingTimeSpan;
        }
        else{
            return now + _custom;
        }
    }

    function registerNewCall(bytes _data,address _adr) public payable onlyProxy(_adr){
        calls.push(CallData(_adr,false,_data,msg.value,""));
        uint time = getTime(_adr,extractHead(_data));
        votingResults.push(VotingData(0,0,time));
        emit VotingRegistered(_adr,_data,calls.length-1,time);
    }


    function extractHead(bytes _b) private pure returns(bytes4){
        uint32 _val=0;
        for(uint8 i=0;i<4;i++){
            _val=_val*256+uint32(_b[i]);
        }
        return (bytes4(_val));
    }

    event VotingRegistered(address _to,bytes _data, uint256 indexed callIdx, uint256 time);
    event DecisionExecuted(uint256 indexed idx);
    event DecisionDeclined(uint256 indexed idx);
    event VoteCasted(address indexed voter, uint64 power,uint256 caseIdx,bool votingFor);
}
