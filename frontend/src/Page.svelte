<script>
  import {ethStore, web3, selectedAccount, connected, chainName, nativeCurrency} from 'svelte-web3';
  import {Circle3} from 'svelte-loading-spinners';
  import Select from 'svelte-select';
  import Modal from './Modal.svelte';
  import {onMount} from 'svelte';
  import Debt from './Debt.svelte';
  import Credit from 'compiledContracts/Credit.json';


  const provider = 'http://localhost:7545';

  let myAddress, coins, input, instance;
  let accounts = [];
  let showAddress;
  let debts = [];

  async function getDebts(address) {
    let list = [];
    let length = await instance.methods.getLength(address).call();
    for (let i = 0; i < length; i++) {
      list.push(instance.methods.getDebts(address, i).call());
    }
    return await Promise.all(list);
  }

  async function getCoins(address) {
    let coins = await instance.methods.tokenBalance(address).call();
    return coins;
  }

  async function getContract(address) {
    const networkId = await $web3.eth.net.getId();
    const deployedNetwork = Credit.networks[networkId];
    return new $web3.eth.Contract(
      Credit.abi,
      deployedNetwork && deployedNetwork.address, {
        from: address,
        gas: 2000000
      }
    );
  }

  async function update() {
    instance = await getContract(myAddress);
    coins = await getCoins(myAddress);
    debts = [...debts, ...await getDebts(showAddress)];
  }

  async function createDebt(amount = 1, bonus = 2, period = 1000) {
    await instance.methods.createDebt(amount, bonus, period).send();
    await update();
  }

  async function takeDebt(address, index) {
    await instance.methods.useDebt(address, index).send();
    await update();
  }

  async function returnDebt(address, index) {
    // let debt = await instance.methods.getDebts(address, index).call();
    // let value = parseInt(debt[2]) + parseInt(debt[3]);
    // console.log(value);
    await instance.methods.returnDebt(index).send().catch(err => console.log(err));
    await update()
  }


  onMount(async () => {
    await ethStore.setProvider(provider);
    accounts = await $web3.eth.getAccounts();
    other = {value: accounts[0], label: accounts[0]}
  })
  let other;
  $: showAddress =(other && other.value);
  $: if (window.ethereum) {
    getAccount()
  }
  $: console.log(debts)

  async function getAccount() {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    if (accounts.length !== 0) {
      myAddress = accounts[0]
      await update()
    }
  }

  const statuses = {0: 'Expired', 1: 'Open', 2: 'Taken', 3: 'Finished'}

  function unpackDebt(debt) {
    let [debtorAddress, borrowerAddress, sum, plus, untilDate, creationDate, status] = Object.values(debt);
    plus = +Number(plus);
    status = statuses[status];
    untilDate = new Date(Number(untilDate) * 1000);
    creationDate = new Date(Number(creationDate) * 1000);
    console.log(status)
    return {debtorAddress, borrowerAddress, sum, plus, untilDate, creationDate, status};
  }

  let open = false;

</script>


<main>
  {#if myAddress}
    <h1 class="text-gray-600">Open Credits</h1>
    {#if $connected}
      <Modal bind:open {coins} clickCallback={createDebt}/>
      {#if other}
        <div class="header-wrapper">
        <h2>My coins: {coins} BigFlexTokens</h2>
        <!--          <button class="button" on:click={createDebt}>New Debt</button>-->

        </div>
        <div class="debts">
          {#each debts as debt, i}
            <!--TODO Update component-->
            <Debt myAddress={myAddress} {...unpackDebt(debt)}
                  ExpirationCall={_ => expired(showAddress, i)}
                  TakeCall={_ => takeDebt(showAddress, i)}
                  ReturnCall={(value) => returnDebt(showAddress, i, value)}
            />
          {/each}
        </div>
      {/if}
    {:else}
      <div class="spinner-wrapper">
        <Circle3 size="100" unit="px" duration="2s"/>
      </div>
    {/if}
  {:else}
    <h2 style="margin: auto; font-size: 20px; border: 2px solid gray; border-radius: 15px; padding: 10px">Подключите кошелек через Metamask!</h2>
  {/if}

</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 1440px;
    width: 100%;
    min-height: calc(100% - 152px);
    margin: 0 auto;
  }

  .debts {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .selects {
    width: 70%;
    max-width: 300px;
    height: 100px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .header-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  .spinner-wrapper {
    /*width: 100%;*/
    height: 60vh;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .button {
    margin-top: 10px;
    margin-left: 10px;
    width: 120px;
    padding: 12px;
    border-radius: 20px;
    color: white;
    background: #7699d4;
    border: none;
    cursor: pointer;
  }

  h1 {
    font-family: var(--main-font);
    font-size: 70px;
    color: #7699d4;
  }

  h2 {
    font-family: var(--main-font);
    margin: 10px 0;
    color: #392f5a;
    font-size: 30px;
    text-overflow: ellipsis;
    overflow: hidden;
    max-width: 500px;
    white-space: nowrap;
  }


</style>