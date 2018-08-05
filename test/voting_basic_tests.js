import latestTime from 'zeppelin-solidity/test/helpers/latestTime';
import { advanceBlock } from 'zeppelin-solidity/test/helpers/advanceToBlock';
import { increaseTimeTo, duration } from 'zeppelin-solidity/test/helpers/increaseTime';
const DevelopmentFund = artifacts.require('./DevelopmentFund.sol');
const VotingContract = artifacts.require('./VotingContract.sol');
const VotingProxy = artifacts.require('./VotingProxy.sol');

var assertRevert= async function(promise){

  try {
    await promise;
    assert.fail('Expected revert not received');
  } catch (error) {
    const revertFound = error.message.search('revert') >= 0;
    assert(revertFound, `Expected "revert", got ${error} instead`);
  }
}

contract('DevelopmentFund', function ([ownerAddr, operatorAddr, otherAddr1, otherAddr2]) {
  var data = {};

  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  beforeEach(async function () {
    data.voting = await VotingContract.deployed();
    data.devFund = await DevelopmentFund.deployed();

  });

  describe('deployment', function () {


    it('should have non zero address of devFund',async function(){
      var actual = data.devFund.address;
      var notExpected = ZERO_ADDRESS;
      assert.isTrue(actual!==notExpected,'address should not be zero');
    });

    it('should have non zero address of voting',async function(){
      var actual = data.voting.address;
      var notExpected = ZERO_ADDRESS;
      assert.isTrue(actual!==notExpected,'address should not be zero');
    });
  });

  describe('proxies', function () {


    it('devFund should have proxy',async function(){
      var devAddr = data.devFund.address;
      var proxyAddr = await data.voting.proxies(devAddr);
      var notExpected = ZERO_ADDRESS;
      assert.isTrue(proxyAddr!==notExpected,'proxy address should not be zero');
    });
    it('getProxy should return same address',async function(){
      var devAddr = data.devFund.address;
      var proxyAddr = await data.voting.proxies(devAddr);
      var proxyAddr2 = await data.voting.getProxy(devAddr);
      assert.isTrue(proxyAddr==proxyAddr2,'proxy address should not be zero');
    });
    it('_addr should be set to devFund',async function(){
      var devAddr = data.devFund.address;
      var proxyAddr2 = await data.voting.getProxy(devAddr);
      var proxyCntrct = await VotingProxy.at(proxyAddr2);
      var inProxyAddr = await proxyCntrct._adr();
      assert.isTrue(inProxyAddr==devAddr,'proxy has incorrect address set');
    });

  });

  describe('proxy call',function(){
    var proxy = undefined;
    var devAddr = undefined;
    var bNumber = 0;
    beforeEach(async function () {
      bNumber = web3.eth.blockNumber;
      if(proxy===undefined){
        devAddr = data.devFund.address;
        var proxyAddr = await data.voting.getProxy(devAddr);
        proxy = await DevelopmentFund.at(proxyAddr);
      }
    });
    it('should not fail on calling as devFund',async function(){
      await proxy.setPrice(1000000);
    })
    it('should emit VotingTimeSet',async function(){
      return new Promise(async (res,rej)=>{
      //    var blockNumber
          await proxy.setPrice(1000000);
          var votingTimeSetEvent ;
          var events = data.voting.allEvents({fromBlock: bNumber, toBlock: 'latest'});
          events.get(function(error, logs){
            votingTimeSetEvent = logs.filter((el)=> el.event==='VotingTimeSet').slice(-1)[0];
            events.stopWatching();
            if(votingTimeSetEvent==undefined){
              rej('VotingTimeSet missing');
            }
            else{
              if(
                votingTimeSetEvent.args['endTime'].toNumber()
                  -votingTimeSetEvent.args['time'].toNumber()!=600){
                rej('VotingTimeSet incorrectValues '+(votingTimeSetEvent.args['endTime'].toNumber()
                  -votingTimeSetEvent.args['time'].toNumber()));
              }
              res('VotingTimeSet');
            }
           });
        })
      })
    it('should emit VotingRegistered',async function(){
      return new Promise(async (res,rej)=>{
      //    var blockNumber
          await proxy.setPrice(1000000);
          var votingRegiseredEvent ;
          var events = data.voting.allEvents({fromBlock: bNumber, toBlock: 'latest'});
          events.get(function(error, logs){
            votingRegiseredEvent = logs.filter((el)=> el.event==='VotingRegistered').slice(-1)[0];
            events.stopWatching();
            if(votingRegiseredEvent==undefined){
              rej('VotingRegistered missing');
            }
            else{
              if(votingRegiseredEvent.args['_to']!==devAddr ||
              votingRegiseredEvent.args['callIdx'].toNumber()!=2){
                rej('VotingRegistered incorrectValues');
              }
              res('votingRegiseredEvent');
            }
           });
        })
      })
  });


  describe('vote',function(){
      var proxy = undefined;
      var devAddr = undefined;
      var bNumber = 0;
      var callIdx =0;
      var votingTimeSetEvent = undefined;
      beforeEach(async function () {
        bNumber = web3.eth.blockNumber;
        if(proxy===undefined){
          devAddr = data.devFund.address;
          var proxyAddr = await data.voting.getProxy(devAddr);
          proxy = await DevelopmentFund.at(proxyAddr);
        }
        await proxy.setPrice(1000000);
        await new Promise((res,rej)=>{

          var events = data.voting.allEvents({fromBlock: bNumber, toBlock: 'latest'});
          events.get(function(error, logs){
            votingTimeSetEvent = logs.filter((el)=> el.event==='VotingRegistered').slice(-1)[0];
            events.stopWatching();
      //      console.log(votingTimeSetEvent);
            callIdx = votingTimeSetEvent.args["callIdx"].toNumber();
            res(callIdx);
          });
        }).catch(()=>{
          rej('fail');
        });
      });

      it('should not fail when called',async function (){
        await data.voting.vote(callIdx, true);
      })

      it('should not fail when called',async function (){
        await data.voting.vote(callIdx, true);
      })
    })
})
