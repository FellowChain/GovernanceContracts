var FellowChainToken = artifacts.require("./FellowChainToken.sol");
var TokenLocker = artifacts.require("./TokenLocker.sol");
var VotingContract = artifacts.require("./VotingContract.sol");
var NameRegistry = artifacts.require("./NameRegistry.sol");
var DevelopmentFund = artifacts.require("./DevelopmentFund.sol");

function pause(timeoutVal){
  return function(){
//    console.log('Pause executed');
    return new Promise((res,rej)=>{
  //      console.log("Stert timer "+timeoutVal);
        setTimeout(function(){
          res(true);
  //        console.log("End timer "+timeoutVal);
        },0);
      })
    };
}

module.exports = function(deployer,network,accounts) {
  var authorAddress = "0xdecefa2655ac1f4e48f838a1d7c42041ca352cf7";
  var pendingTransactions = {};

    if(network=='test'){
      return;
    }
    /*
  web3.eth.filter("pending", function(error, result){
    if (!error)
    {
      web3.eth.getTransaction(result,function(e,v){
        if(v!==undefined && v!==null){
          if(v.from===accounts[0]){
            console.log("new Trans "+result+ " nonce "+v.nonce);
            pendingTransactions[result] = true;
          }
        }
        else{
          if(e!=undefined && e!=null){
            console.log(e);
          }
        }
      })
    }
  });
*/
  var data = {};

  return deployer.deploy(NameRegistry)
  .then(
    function(){
      return NameRegistry.deployed()
    }
  )
  .then(
    function(instance){
      data['reg'] = instance;
      return true;
    }
  )
  .then(pause(30000))
  .then(function(retVal){
    console.log("after "+retVal);
    return deployer.deploy(FellowChainToken)
    .then(function(){
      return FellowChainToken.deployed()
    })
    .then(function(instance){
        data['tok'] = instance;
      })
  })
  .then(function(){
    return data['reg'].setAddress('tok',data['tok'].address) ;
  })
  .then(function(){
    return deployer.deploy(TokenLocker,data['tok'].address)
    .then(function(){
      return TokenLocker.deployed();
    })
    .then(function(instance){
        data['lkr'] = instance;
      })
  })
  .then(function(){
    return data['reg'].setAddress('lkr',data['lkr'].address) ;
  })
  .then(pause(30000))
  .then(function(){return data['tok'].init();})
  .then(function(){
      return deployer.deploy(DevelopmentFund,data['tok'].address).then(function(){
          return DevelopmentFund.deployed()
        })
        .then(function(instance){
          data['devFund'] = instance;
        })
  })
  .then(function(){
    return data['reg'].setAddress('devFund',data['devFund'].address) ;
  })
  .then(function(){
      return new Promise((res,rej)=>{

          data['tok'].balanceOf(accounts[0])
          .then(function(balance){
            console.log("transfer tokens to "+data['devFund'].address+" "+(balance*99/100).toString());
            console.log("transfer tokens to "+authorAddress+" "+(balance*1/100).toString());
            data['tok'].transfer(data['devFund'].address,balance*99/100)
            .then(function(){
              data['tok'].transfer(authorAddress,balance*1/100)})
              .then(pause(30000))
              .then(function(a,b){
                             console.log("transfer finish");
                             res(true);
                           });
            }).catch(function(e){
              console.log("transfer Failed "+e);
              rej(e);
            });
        })
  })
  .then(()=>{

      console.log("Waiting before voting");
  })
  .then(pause(30000))
  .then(function(){
    return deployer
      .deploy(VotingContract,data['lkr'].address)
      .then(pause(30000))
      .then(function(){
          console.log("Voting deployed");
          return VotingContract.deployed()
        })
        .then(function(instance){
            console.log("Voting deployment assignment");
            data['vote'] = instance;
            return true;
          })
  })
  .then(function(){
    return data['reg'].setAddress('vote',data['vote'].address) ;
  })
  .then(pause(30000))
  .then(function(){
    console.log("tok.transferOwnership"); return data['tok'].transferOwnership(data['devFund'].address) ;
  })
  .then(pause(30000))
  .then(function(){
    console.log("lkr.transferOwnership");  return data['lkr'].transferOwnership(data['vote'].address) ;
  })
  .then(pause(30000))
  .then(function(){
    console.log("devFund.transferOwnership"); return data['devFund'].transferOwnership(data['vote'].address) ;
  })
  .then(pause(30000))
  .then(function(){ console.log("vote.registerProxy('lkr')"); return data['vote'].registerProxy(data['lkr'].address);})
  .then(pause(30000))
  .then(function(){ console.log("vote.registerProxy('devFund')"); return data['vote'].registerProxy(data['devFund'].address);})
  .then(pause(30000))
  .then(function(){
    var value = 600;
    if(network==99){
      value = 3600*24;
    }
    console.log("vote.init("+value+")");

    return data['vote'].init(value);})
  .then(pause(30000))
  .then(function(){
    console.log("vote.transferOwnership");
    return data['vote'].transferOwnership(data['vote'].address);})
  .then(function(){
    console.log("Deployment done "+data['reg'].address);
  });
};
