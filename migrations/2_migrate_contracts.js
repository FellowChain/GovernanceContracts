var FellowChainToken = artifacts.require("./FellowChainToken.sol");
var TokenLocker = artifacts.require("./TokenLocker.sol");
var VotingContract = artifacts.require("./VotingContract.sol");
var NameRegistry = artifacts.require("./NameRegistry.sol");
var DevelopmentFund = artifacts.require("./DevelopmentFund.sol");



module.exports = function(deployer,network,accounts) {

  var pendingTransactions = {};
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

  var data = {};

  if(network=='test'){
    return;
  }
  return deployer.deploy(NameRegistry).then(
    function(){
      return NameRegistry.deployed()
    }  
  )
  .then(
    function(instance){
      data['reg'] = instance; 
    }
  )
  .then(function(){
    return deployer.deploy(FellowChainToken).then(function(){
      return FellowChainToken.deployed()
    })
    .then(function(instance){
        data['tok'] = instance; 
      })
  })
  .then(function(){
    return deployer.deploy(TokenLocker,data['tok'].address).then(function(){
      return TokenLocker.deployed()
    })
    .then(function(instance){
        data['devFund'] = instance; 
      })
  })
  .then(function(){return data['tok'].init();})
  .then(function(){
      return data['tok'].balanceOf(accounts[0])
            .then(function(balance){
              console.log("transfer tokens to devFund "+balance.toString());
              return data['tok'].transfer(data['devFund'].address,balance);})
          })
  .then(function(){
    return deployer.deploy(DevelopmentFund,data['tok'].address).then(function(){
      return DevelopmentFund.deployed()
    })
    .then(function(instance){
        data['lkr'] = instance; 
      })
  })
  .then(function(){
    return deployer
      .deploy(VotingContract,data['lkr'].address)
      .then(function(){
          return VotingContract.deployed()
        })
        .then(function(instance){
            data['vote'] = instance; 
            return true;
          })
  })
  .then(function(){ 
    console.log("tok.transferOwnership"); return data['tok'].transferOwnership(data['vote'].address) ;
  })
  .then(function(){
    console.log("lkr.transferOwnership");  return data['lkr'].transferOwnership(data['vote'].address) ;
  })
  .then(function(){ 
    console.log("devFund.transferOwnership"); return data['devFund'].transferOwnership(data['vote'].address) ;
  })
  .then(function(){ console.log("vote.registerProxy('tok'-"+data['tok'].address+")"); return data['vote'].registerProxy(data['tok'].address);})
  .then(function(){ console.log("vote.registerProxy('lkr')"); return data['vote'].registerProxy(data['lkr'].address);})
  .then(function(){ console.log("vote.registerProxy('devFund')"); return data['vote'].registerProxy(data['devFund'].address);})
  .then(function(){ console.log("vote.registerProxy('vote')"); return data['vote'].registerProxy(data['vote'].address);})
  .then(function(){
    return data['reg'].setAddress('tok',data['tok'].address) ;
  })
  .then(function(){
    return data['reg'].setAddress('lkr',data['lkr'].address) ;
  })
  .then(function(){
    return data['reg'].setAddress('devFund',data['devFund'].address) ;
  })
  .then(function(){
    return data['reg'].setAddress('vote',data['vote'].address) ;
  })
  .then(function(){ console.log("vote.transferOwnership"); 
    return data['vote'].transferOwnership(data['vote'].address);})
  .then(function(){
    console.log("Deployment done "+data['reg'].address);
  });
};
