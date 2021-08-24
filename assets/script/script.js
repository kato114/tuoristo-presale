window.addEventListener('load', async function () {
	const presaleContract = '0xb4bBb340015094e2b41B1935fCB0eA04918efd3B'
	let target = 2000
	let tokenRate = 0.002

	let connected = null
	let chainID = null
	let accounts = null
	let contract = null

	let presaleABI = [{"inputs":[{"internalType":"contract Token","name":"_token","type":"address"},{"internalType":"address","name":"_mainWallet","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Deposited","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"token","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Recovered","type":"event"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"deposit","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"depositedAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"deposits","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"mainWallet","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"tokenAddress","type":"address"},{"internalType":"uint256","name":"tokenAmount","type":"uint256"}],"name":"recoverBEP20","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"releaseFunds","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"rewardTokenCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_count","type":"uint256"}],"name":"setRewardTokenCount","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_target","type":"uint256"}],"name":"setTargetAmount","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address payable","name":"_address","type":"address"}],"name":"setWithdrawAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"targetAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"token","outputs":[{"internalType":"contract Token","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}]

	const init = async () => {
		showLoader()

		chainID = await window.ethereum.request({ method: 'eth_chainId' })
		accounts = await window.ethereum.request({ method: 'eth_accounts' })

		if (chainID == 97 && accounts.length > 0) {
			connected = true

			window.web3 = new Web3(window.ethereum)
			contract = new window.web3.eth.Contract(presaleABI, presaleContract)

			contract.methods
				.rewardTokenCount()
				.call()
				.then(function (_tokenRate) {
					tokenRate = _tokenRate / 1e18
				})
				
			contract.methods
				.targetAmount()
				.call()
				.then(function (_target) {
					target = _target / 1e18
					document.getElementById('target_amount').innerText = format(target)
				})
			
			contract.methods
				.balanceOf(accounts[0])
				.call()
				.then(function (balance) {
					document.getElementById('wallet_balance').innerText = format(balance / 1e9)
				})

			contract.methods
				.depositedAmount()
				.call()
				.then(function (collected) {
					let percent = (collected / 1e18 / target) * 100
					if (percent > 0 && percent < 4) percent = 4

					document.getElementById('contract_balance').innerText = format(collected / 1e18)
					document.querySelector('.percent').style.width = percent + '%'
				})

			document.getElementById('btn_connect').innerHTML = 'Connected'
			document.getElementById('btn_connect').classList.add('connected')
			document.getElementById('inp_bnb').value = ''
			document.getElementById('inp_climb').value = ''
		} else {
			connected = false
		}

		hideLoader()
	}

	const connect = async () => {
		let chainID = await window.ethereum.request({ method: 'eth_chainId' })
		if (chainID != 97) {
			toastr('Please change network as Binance Smart Chain.')
			return
		}

		if (window.ethereum && window.ethereum.isMetaMask && window.ethereum.isConnected()) {
			window.web3 = new Web3(window.ethereum)
			window.ethereum.enable()
			return true
		}
		return false
	}

	const swap = async () => {
		if (connected) {
			let balance_bnb = document.getElementById('inp_bnb').value * 1e18
			let balance_climb = document.getElementById('inp_climb').value * 1e9

			if (balance_bnb >= 0.0001 * 1e18) {
				contract.methods
					.depositedAmount()
					.call()
					.then(function (collected) {
						if (+balance_bnb <= target * 1e18 - collected) {
							contract.methods
								.deposit()
								.send({ from: accounts[0], value: balance_bnb }, function (res) {
									if (res != null) hideLoader()
								})
								.then(async function (res) {
									init()
								})

							showLoader()
						} else {
							toastr('Please check let bnb limit')
						}
					})
			} else {
				toastr('Please input correct value')
			}
		} else {
			toastr('Please connect MetaMask')
		}
	}

	const sync = (from, to, rate) => {
		document.getElementById(to).value = document.getElementById(from).value * rate
	}

	const format = (balance) => {
		balance = balance.toLocaleString(0, { minimumFractionDigits: 0 })
		return balance
	}

	const toastr = (msg) => {
		let alert_lsit = document.querySelector('.alert_list')
		let alert = document.createElement('div')

		alert.innerHTML = msg
		alert_lsit.appendChild(alert)

		setTimeout(() => {
			alert.remove()
		}, 2500)
	}

	const showLoader = () => {
		document.querySelector('.loader').classList.add('active')
	}

	const hideLoader = () => {
		document.querySelector('.loader').classList.remove('active')
	}

	window.ethereum.on('accountsChanged', (accounts) => {
		init()
	})

	window.ethereum.on('chainChanged', (chainId) => {
		window.location.reload()
	})

	document.getElementById('btn_connect').addEventListener('click', connect)
	document.getElementById('btn_swap').addEventListener('click', swap)
	document.getElementById('inp_bnb').addEventListener('keyup', () => {
		sync('inp_bnb', 'inp_climb', 1 / tokenRate)
	})
	document.getElementById('inp_climb').addEventListener('keyup', () => {
		sync('inp_climb', 'inp_bnb', tokenRate)
	})

	init()
})
