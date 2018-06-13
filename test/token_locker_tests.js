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
              await Promise.all([data.token.init(),
                TokenLocker.new(data.token.address)]).then(function(a,b){
                  data.locker = b;
                  return true;
                }).then(function(){
                  return Promise.all([
                    data.token.transfer(otherAddr1,1000),
                    data.token.transfer(otherAddr2,1000),
                    data.token.transfer(otherAddr3,1000)
                  ]);
                });

          });

          describe('lockAllForVoting', function () {

            beforeEach(async function () {
                /*
                  set allowence
                */
            });

            it('should transfer amount equal to allowence',async function(){
            });
            it('should not change sum of allowence and amount',async function(){
            });
            it('should increase total locked',async function(){
            });
          });

  });
