import latestTime from 'zeppelin-solidity/test/helpers/latestTime';
import { advanceBlock } from 'zeppelin-solidity/test/helpers/advanceToBlock';
import { increaseTimeTo, duration } from 'zeppelin-solidity/test/helpers/increaseTime';
const Token = artifacts.require('FellowChainToken');
const DevelopmentFund = artifacts.require('DevelopmentFund');
const NameRegistry = artifacts.require('NameRegistry');

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
              data.registry = await NameRegistry.new();
              data.token = await Token.new();
              data.devFund = await DevelopmentFund.new(data.token.address);
              await data.token.init();
              var amount = (await data.token.balanceOf(ownerAddr)).toString();
              await data.token.transfer(data.devFund.address,amount);

          });

          describe('exit', function () {

            beforeEach(async function () {
                var sum = web3.toWei(2, "ether");
                await data.devFund.sendTransaction({value:sum,from:otherAddr1});
                await data.devFund.sendTransaction({value:sum*2,from:otherAddr2});
            });

            it('should return funds to a caller',async function(){
                var balanceBefore = await web3.eth.getBalance(otherAddr1);
                await data.devFund.exit({from:otherAddr1});
                var balanceAfter = await web3.eth.getBalance(otherAddr1);
                assert.isTrue(balanceBefore<balanceAfter);
            });
            it('should burn tokens of a caller',async function(){
                var balanceBefore = await data.token.balanceOf(otherAddr1);
                await data.devFund.exit({from:otherAddr1});
                var balanceAfter = await data.token.balanceOf(otherAddr1);
                assert.isTrue(balanceBefore>balanceAfter);
                assert.isTrue(0==balanceAfter);
            });
            it('should decrease devFund balance proportionally to callers token share (excluding devFund tokens)',async function(){
                var balanceBefore = await web3.eth.getBalance(data.devFund.address);
                await data.devFund.exit({from:otherAddr1});
                var balanceAfter = await web3.eth.getBalance(data.devFund.address);
                assert.isTrue(balanceAfter/balanceBefore<0.667);
                assert.isTrue(balanceAfter/balanceBefore>0.666);
            });
          });

          describe('pay for work in eth', function () {

            beforeEach(async function () {
                var sum = web3.toWei(2, "ether");
                await data.devFund.sendTransaction({value:sum,from:otherAddr1});

            });

            it('owner should be able to transfer tokens',async function(){
              await data.devFund.payForWorkInEth(otherAddr2,"1000","0x0");
            });

            it('transfer should emit DonationPayed',async function(){
              var promise = data.devFund.payForWorkInEth(otherAddr2,"1000","0x0");
              var {logs} = await promise;
              assert(logs[0].event==="DonationPayedEth",'incorrect event name');
            });

            it('not owner should fail to transfer tokens',async function(){
              var promise = data.devFund.payForWorkInEth(otherAddr2,"1000","0x0",{from:otherAddr1});
              assertRevert(promise);
            });
          });

          describe('pay for work in tokens', function () {
            it('owner should be able to transfer tokens',async function(){
              await data.devFund.payForWorkInToken(otherAddr2,"1000","0x0");
            });

            it('transfer should emit DonationPayed',async function(){
              var promise = data.devFund.payForWorkInToken(otherAddr2,"1000","0x0");
              var {logs} = await promise;
				      assert(logs[0].event==="DonationPayed",'incorrect event name');
            });

            it('not owner should fail to transfer tokens',async function(){
              var promise = data.devFund.payForWorkInToken(otherAddr2,"1000","0x0",{from:otherAddr1});
              assertRevert(promise);
            });
          });

          describe('buy tokens', function () {
            it('should not fail during transfer', async function () {
                await data.devFund.sendTransaction({value:web3.toWei(2, "ether"),from:otherAddr1});

            });

            it('should increase devFund balance by sended amount', async function () {
              var sum = web3.toWei(2, "ether");
                var balanceBefore = await web3.eth.getBalance(data.devFund.address);
                  await data.devFund.sendTransaction({value:sum,from:otherAddr1});
                var balanceAfter = await web3.eth.getBalance(data.devFund.address);
                assert.equal(balanceAfter - balanceBefore,sum);
              });

           it('should increase sender token balance by correct amount', async function () {
                var sum = web3.toWei(2, "ether");
                var price = await data.devFund.price();
                var coinMultiplayer = (new web3.BigNumber(10)).pow(await data.token.decimals());
                var balanceBefore = await data.token.balanceOf(otherAddr1);
                await data.devFund.sendTransaction({value:sum,from:otherAddr1});
                var balanceAfter = await data.token.balanceOf(otherAddr1);
                assert.equal(balanceAfter - balanceBefore,sum*coinMultiplayer/price);
            });
          });

  });
