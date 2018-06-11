var Token = artifacts.require("./FellowChainToken.sol");
var TokenLocker = artifacts.require("./TokenLocker.sol");
var VotingContract = artifacts.require("./VotingContract.sol");
var DevelopmentFund = artifacts.require("./DevelopmentFund.sol");
var NameRegistry = artifacts.require("./NameRegistry.sol");

module.exports = function(deployer,network,accounts) {
  var data = {};
  deployer.deploy(Token).then(
    function(){

    }
  );

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
  deployContract(deployer,NameRegistry, [],'reg')
  .then(function(){return deployContract(deployer,Token, [],'tok');})
  .then(function(){return deployContract(deployer,TokenLocker, [data['tok'].address],'lkr');})
  .then(function(){
      return data['tok'].balanceOf(accounts[0])
            .then(function(balance){ return data['tok'].transfer(data['lkr'].address,balance);})
          })
  .then(function(){return deployContract(deployer,DevelopmentFund, [data['tok'].address],'devFund');})
  .then(function(){return deployContract(deployer,VotingContract, [data['lkr'].address],'vote');})
  .then(function(){return data['vote'].init();})
};
