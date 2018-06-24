var FellowChainToken = artifacts.require("./FellowChainToken.sol");
var TokenLocker = artifacts.require("./TokenLocker.sol");
var VotingContract = artifacts.require("./VotingContract.sol");
var DevelopmentFund = artifacts.require("./DevelopmentFund.sol");



module.exports = function(deployer,network,accounts) {
  var NameRegistry = artifacts.require("./NameRegistry.sol");

  var pendingTransactions = {};
  web3.eth.filter("pending", function(error, result){
    if (!error)
    {
      web3.eth.getTransaction(result,function(e,v){
        if(v.from===accounts[0]){
          console.log("new Trans "+result+ " nonce "+v.nonce);
          pendingTransactions[result] = true;
        }
      })
    }
  });

  var data = {};

  if(network=='test'){
    return;
  }
  /*
var waitForFactory= function(){


  var parent = {
    w3:web3
  }

  var getPendingTransactionList= function(){
    return Object.getOwnPropertyNames(pendingTransactions);
  }
  var waitFor = function(txHash){
    var that = this;

    return new Promise ((res,rej)=>{
      if(txHash==undefined){
        res(true);
      }
      console.log("waiting......."+txHash);
      var int = setInterval(function(){
        that.w3.eth.getTransactionReceipt(txHash,function(e,r){
          if(r!=null){
              clearInterval(int);
              res(true);
              console.log("Res Executed "+txHash);
          }
          else{
              console.log("waiting......."+txHash);
          }
        })
      },1000);
    });
  }

    var waitingTransactions = [];
  var txHashes = getPendingTransactionList();
  for(var i=0;i<txHashes.length;i++){
    delete pendingTransactions[txHashes[i]]  ;
    waitingTransactions.push(waitFor.bind(parent,txHashes[i])());
  }

  return Promise.all(waitingTransactions);
}

*/
  var deployContract = function(_deployer,_cntrct,params,keyStr){
    var allParams = [].concat.apply(_cntrct,params);
    return new Promise(function(res,rej){
        console.log('deploy '+_cntrct.contractName+' with params '+JSON.stringify(params));
        _deployer.deploy.apply(_deployer,allParams)
    //    .then(waitForFactory)
        .then(function(){
          console.log("deployment done");
          return _cntrct.deployed();
        }).then(function(inst){
          console.log("instance fetched");
          data[keyStr] = inst;
          if(keyStr==='reg'){
            data[keyStr] = inst;
            console.log("reg deployed");
            res(true);
          }else{
            console.log('set addr '+keyStr+' '+inst.address);
            return data['reg'].setAddress(keyStr,inst.address)
      //      .then(waitForFactory)
            .then(()=>{
              console.log(keyStr+" deployed");
              res(true);

            });
          }
        }).catch(function(error){
          rej(error);
        });
      }
    );
  }
  return deployContract(deployer,NameRegistry, [],'reg')
  .then(function(){return deployContract(deployer,FellowChainToken, [],'tok');})
  .then(function(){return deployContract(deployer,TokenLocker, [data['tok'].address],'lkr');})
  .then(function(){return data['tok'].init();})
//  .then(waitForFactory)
  .then(function(){return deployContract(deployer,DevelopmentFund, [data['tok'].address],'devFund');})
  .then(function(){return deployContract(deployer,VotingContract, [data['lkr'].address],'vote');})
  .then(function(){
      return data['tok'].balanceOf(accounts[0])
            .then(function(balance){
              return data['tok'].transfer(data['devFund'].address,balance);})
  //            .then(waitForFactory)
          })
  .then(function(){ console.log("vote.init()"); return data['vote'].init();})
//  .then(waitForFactory)
  .then(function(){ console.log("vote.registerProxy('tok')"); return data['vote'].registerProxy(data['tok'].address);})
//  .then(waitForFactory)
  .then(function(){ console.log("vote.registerProxy('lkr')"); return data['vote'].registerProxy(data['lkr'].address);})
//  .then(waitForFactory)
  .then(function(){ console.log("vote.registerProxy('devFund')"); return data['vote'].registerProxy(data['devFund'].address);})
//  .then(waitForFactory)
  .then(function(){ console.log("tok.transferOwnership('vote')"); return data['tok'].transferOwnership(data['vote'].address) ;})
//  .then(waitForFactory)
  .then(function(){ console.log("lkr.transferOwnership('vote')"); return data['lkr'].transferOwnership(data['vote'].address) ;})
//  .then(waitForFactory)
  .then(function(){ console.log("vote.transferOwnership('vote')"); return data['vote'].transferOwnership(data['vote'].address) ;})
//  .then(waitForFactory)
};
