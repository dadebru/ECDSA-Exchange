const express = require('express');
const app = express();
const cors = require('cors');
const port = 3042;
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const SHA256 = require('crypto-js/sha256');

const balances = {
	1: 100,
	2: 50,
	3: 75,
};

for (let i = 0; i < 3; i++) {
	const newKey = ec.genKeyPair();
	let key = {
		private: newKey.getPrivate().toString(16),
		public: newKey.getPublic().encode('hex').toString(),
	};
	balances[key.public] = balances[(i + 1).toString()];
	delete balances[(i + 1).toString()];
	console.log(key);
}

console.log(balances);

// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());

app.get('/balance/:address', (req, res) => {
	const { address } = req.params;
	const balance = balances[address] || 0;
	res.send({ balance });
});

app.post('/send', (req, res) => {
	const { sender, recipient, amount, privateKey } = req.body;
	if (privateKey && recipient && amount && sender) {
		let enteredKey = ec.keyFromPrivate(privateKey, 'hex');
		let msgHash = SHA256(sender + recipient + amount);
		let signature = enteredKey.sign(msgHash.toString());
		if (
			ec
				.keyFromPublic(sender, 'hex')
				.verify(msgHash.toString(), signature) &&
			privateKey
		) {
			balances[sender] -= amount;
			balances[recipient] = (balances[recipient] || 0) + +amount;
			res.send({ balance: balances[sender] });
			console.log('Key Verified');
		} else {
			console.log('Invalid Key');
		}
	} else {
		console.log('Please complete all fields');
	}
});

app.listen(port, () => {
	console.log(`Listening on port ${port}!`);
});
