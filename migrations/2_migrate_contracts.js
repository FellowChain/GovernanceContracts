var FellowChainToken = artifacts.require("./FellowChainToken.sol");
var TokenLocker = artifacts.require("./TokenLocker.sol");
var VotingContract = artifacts.require("./VotingContract.sol");
var NameRegistry = artifacts.require("./NameRegistry.sol");
var Vault = artifacts.require("./Vault.sol");
var TargetFund = artifacts.require("./TargetFund.sol");
var InvestorSale = artifacts.require("./InvestorSale.sol");

var _operator="0xf17f52151ebef6c7334fad080c5704d77216b732";
var _authorAddress="0xf17f52151ebef6c7334fad080c5704d77216b732";

function pause(timeoutVal){
  return function(){
//    console.log('Pause executed');
    return new Promise((res,rej)=>{
  //      console.log("Stert timer "+timeoutVal);
        setTimeout(function(){
          res(true);
          console.log("End timer "+timeoutVal);
        },timeoutVal);
      })
    };
}

module.exports = function(deployer,network,accounts) {
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
  .then(pause(30000))
  .then(function(retVal){
    console.log("after "+retVal);
    return deployer.deploy(Vault)
    .then(function(){
      return Vault.deployed()
    })
    .then(function(instance){
        data['vault'] = instance;
      })
  })
  .then(pause(30000))
  .then(function(retVal){
    console.log("after "+retVal);
    return deployer.deploy(InvestorSale
      ,data['tok'].address
      ,_operator
      ,data['vault'].address)
    .then(function(){
      return InvestorSale.deployed()
    })
    .then(function(instance){
        data['invSale'] = instance;
      })
  })
  .then(function(){
    return data['reg'].setAddress('tok',data['tok'].address) ;
  })
  .then(function(){
    return data['reg'].setAddress('vault',data['vault'].address) ;
  })
  .then(function(){
    return data['reg'].setAddress('invSale',data['invSale'].address) ;
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
      return deployer.deploy(TargetFund,data['tok'].address,data['vault'].address,'Development Fund').then(function(){
          return TargetFund.deployed()
        })
        .then(function(instance){
          data['devFund'] = instance;
        })
  })
  .then(function(){
    return data['reg'].setAddress('devFund',data['devFund'].address) ;
  })
  .then(function(){
      return deployer.deploy(TargetFund,data['tok'].address,data['vault'].address,'Stability Fund').then(function(){
          return TargetFund.deployed()
        })
        .then(function(instance){
          data['stabilityFund'] = instance;
        })
  })
  .then(function(){
    return data['reg'].setAddress('stabilityFund',data['stabilityFund'].address) ;
  })
  .then(function(){
      return deployer.deploy(TargetFund,data['tok'].address,data['vault'].address,'Reserves Fund').then(function(){
          return TargetFund.deployed()
        })
        .then(function(instance){
          data['reservesFund'] = instance;
        })
  })
  .then(function(){
    return data['reg'].setAddress('reservesFund',data['reservesFund'].address) ;
  })
  .then(function(){
      return new Promise((res,rej)=>{

          data['tok'].balanceOf(accounts[0])
          .then(function(balance){
            console.log("transfer tokens to "+data['devFund'].address+" "+(balance*39/100).toString());
            data['tok'].transfer(data['devFund'].address,balance*39/100)
            .then(pause(30000))
            .then(function(){
              console.log("transfer tokens to "+_authorAddress+" "+(balance*1/100).toString());
              data['tok'].transfer(_authorAddress,balance*1/100)})
            .then(pause(30000))
            .then(function(){
              console.log("transfer tokens to "+data['reservesFund'].address+" "+(balance*10/100).toString());
              data['tok'].transfer(data['reservesFund'].address,balance*10/100)})
            .then(pause(30000))
            .then(function(){
              console.log("transfer tokens to "+data['invSale'].address+" "+(balance*20/100).toString());
              data['tok'].transfer(data['invSale'].address,balance*20/100)})
            .then(pause(30000))
            .then(function(){
              console.log("transfer tokens to "+data['stabilityFund'].address+" "+(balance*30/100).toString());
              data['tok'].transfer(data['stabilityFund'].address,balance*30/100)})
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
  .then(function(){
    console.log("devFund.transferOwnership"); return data['invSale'].transferOwnership(data['vote'].address) ;
  })
  .then(pause(30000))
  .then(function(){
    console.log("devFund.transferOwnership"); return data['reservesFund'].transferOwnership(data['vote'].address) ;
  })
  .then(pause(30000))
  .then(function(){
    console.log("devFund.transferOwnership"); return data['stabilityFund'].transferOwnership(data['vote'].address) ;
  })
  .then(pause(30000))
  .then(function(){ console.log("vote.registerProxy('lkr')"); return data['vote'].registerProxy(data['lkr'].address);})
  .then(pause(30000))
  .then(function(){ console.log("vote.registerProxy('devFund')"); return data['vote'].registerProxy(data['devFund'].address);})
  .then(pause(30000))
  .then(function(){ console.log("vote.registerProxy('reservesFund')"); return data['vote'].registerProxy(data['reservesFund'].address);})
  .then(pause(30000))
  .then(function(){ console.log("vote.registerProxy('stabilityFund')"); return data['vote'].registerProxy(data['stabilityFund'].address);})
  .then(pause(30000))
  .then(function(){ console.log("vote.registerProxy('invSale')"); return data['vote'].registerProxy(data['invSale'].address);})
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
