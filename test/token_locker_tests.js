import latestTime from 'zeppelin-solidity/test/helpers/latestTime';
import { advanceBlock } from 'zeppelin-solidity/test/helpers/advanceToBlock';
import { increaseTimeTo, duration } from 'zeppelin-solidity/test/helpers/increaseTime';
const Token = artifacts.require('FellowChainToken');
const TokenLocker = artifacts.require('TokenLocker');

  var assertRevert= async function(promise){

      try {
        await promise;
        assert.fail('Expected revert not received');
      } catch (error) {
        const revertFound = error.message.search('revert') >= 0;
        assert(revertFound, `Expected "revert", got ${error} instead`);
      }
  }

  contract('TokenLocker', function ([ownerAddr, otherAddr1, otherAddr2, otherAddr3]) {
       var data = {};

          const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
          beforeEach(async function () {
              data.token = await Token.new();
              return Promise.all([data.token.init(),
                TokenLocker.new(data.token.address)]).then(function(args){
                  data.locker = args[1];
                  return true;
                }).then(function(){
                  return Promise.all([
                    data.token.transfer(otherAddr1,1000),
                    data.token.transfer(otherAddr2,1000),
                    data.token.transfer(otherAddr3,1000)
                  ]).then(function(){
                  });
                });

          });

          describe('lockAllForVoting', function () {

            beforeEach(async function () {
                await data.token.approve(data.locker.address,
                  "10000000000000000000000000000",
                  {from:otherAddr1});

            });

            it('should transfer allTokens to locker',async function(){
              var balanceBefore = (await data.token.balanceOf(otherAddr1));
              await data.locker.lockAllForVoting({from:otherAddr1});
              var amount = await data.locker.amount(otherAddr1);
              var balanceAfter = (await data.token.balanceOf(otherAddr1));
              console.log(balanceBefore.toString(),balanceAfter.toString(),amount.toString());
              assert.isTrue(0==balanceAfter);
              assert.isTrue(balanceBefore.toString()==amount.toString());
            });

            it('should not change sum of allowence and amount',async function(){

            });
          });

  });
