var Token = artifacts.require("./FellowChainToken.sol");
var TokenLocker = artifacts.require("./TokenLocker.sol");
var VotingContract = artifacts.require("./VotingContract.sol");
var DevelopmentFund = artifacts.require("./DevelopmentFund.sol");
var NameRegistry = artifacts.require("./NameRegistry.sol");

module.exports = function(deployer,network,accounts) {
  var data = {};

  if(network=='test'){
    return;
  }

  var deployContract = function(_deployer,_cntrct,params,keyStr){
    console.log('deploy '+_cntrct.contractName+' with params '+JSON.stringify(params));
    var allParams = [].concat.apply(_cntrct,params);
    return new Promise(function(res,rej){
      _deployer.deploy.apply(_deployer,allParams).then(function(){
        return _cntrct.deployed();
      }).then(function(inst){
        data[keyStr] = inst;
        if(keyStr==='reg'){
          data[keyStr] = inst;
          res(true);
        }else{
          console.log('set addr '+keyStr+' '+inst.address);
          return data['reg'].setAddress(keyStr,inst.address).then(()=>{res(true);});
        }
      }).catch(function(error){
        rej(error);
      });
    }
  );
  }
  return deployContract(deployer,NameRegistry, [],'reg')
  .then(function(){return deployContract(deployer,Token, [],'tok');})
  .then(function(){return deployContract(deployer,TokenLocker, [data['tok'].address],'lkr');})
  .then(function(){return data['tok'].init();})
  .then(function(){
      return data['tok'].balanceOf(accounts[0])
            .then(function(balance){
              return data['tok'].transfer(data['lkr'].address,balance);})
          })
  .then(function(){return deployContract(deployer,DevelopmentFund, [data['tok'].address],'devFund');})
  .then(function(){return deployContract(deployer,VotingContract, [data['lkr'].address],'vote');})
  .then(function(){ console.log("vote.init()"); return data['vote'].init();})
  .then(function(){ console.log("vote.registerProxy('tok')"); return data['vote'].registerProxy(data['tok'].address);})
  .then(function(){ console.log("vote.registerProxy('lkr')"); return data['vote'].registerProxy(data['lkr'].address);})
  .then(function(){ console.log("vote.registerProxy('devFund')"); return data['vote'].registerProxy(data['devFund'].address);})
  .then(function(){ console.log("tok.transferOwnership('vote')"); return data['tok'].transferOwnership(data['vote'].address) ;})
  .then(function(){ console.log("lkr.transferOwnership('vote')"); return data['lkr'].transferOwnership(data['vote'].address) ;})
  .then(function(){ console.log("vote.transferOwnership('vote')"); return data['vote'].transferOwnership(data['vote'].address) ;})
};
